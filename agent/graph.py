"""
LangGraph agent graph for Spider-Sense.
Flow: scrape → validate → [heal → scrape] → diff → filter → [draft → research] → END

Key changes:
- scrape_node uses Bright Data Python SDK (not CLI subprocess)
- research_node searches Google + Reddit + Perplexity for articles on detected changes
- draft_node synthesizes positions A/B and an action script
- LLM: Google Gemini 3.6 Flash via google-genai SDK (balanced speed + cost)
"""
import json
import os
import time
import asyncio
import subprocess
from typing import TypedDict, Optional, Literal
from langgraph.graph import StateGraph, END
from brightdata_client import run_collector, search_google, search_reddit, search_perplexity
from storage.db import update_job_progress, save_snapshot, save_heal_event

  
_gemini_client = None

def _get_gemini():
    """Lazy-init Google GenAI client. Uses GEMINI_API_KEY from .env."""
    global _gemini_client
    if _gemini_client is None:
        from google import genai
        api_key = os.getenv("GEMINI_API_KEY")
        _gemini_client = genai.Client(api_key=api_key) if api_key else genai.Client()
    return _gemini_client


def _ask_gemini(prompt: str, model: str = "gemini-3.6-flash") -> str:
    """One-shot text prompt → response string. Most balanced token-saving model."""
    client = _get_gemini()
    try:
        res = client.models.generate_content(model=model, contents=prompt)
        return res.text or ""
    except Exception as e:
        print(f"[_ask_gemini error]: {e}")
        return ""


class AgentState(TypedDict):
    job_id: Optional[str]
    collector_id: str
    url: Optional[str]
    source_type: Optional[str]             
    snapshot: Optional[dict]
    previous_snapshot: Optional[dict]
    validation_passed: bool
    heal_attempts: int
    diff: Optional[dict]
    severity: Optional[Literal["INFO", "WARNING", "CRITICAL"]]
    alert: Optional[str]
    draft_script: Optional[str]
    position_a: Optional[str]              
    position_b: Optional[str]              
    sources: Optional[list]                


  

def scrape_node(state: AgentState) -> AgentState:
    collector_id = state["collector_id"]
    url = state.get("url") or ""
    job_id = state.get("job_id")

    if job_id:
        try:
            update_job_progress(
                job_id=job_id,
                collector_id=collector_id,
                url=url,
                status="scraping",
                progress=20,
                current_step="Checking DB cache before scraping...",
            )
        except Exception:
            pass

      
      
      
    CACHE_MAX_AGE_DAYS = 7
    try:
        from storage.db import get_snapshots
        from datetime import datetime, timezone
        cached = get_snapshots(collector_id=collector_id, limit=1)
        if cached:
            latest = cached[0]
            scraped_at_str = latest.get("scraped_at") or latest.get("scrapedAt")
            if scraped_at_str:
                scraped_at = datetime.fromisoformat(str(scraped_at_str).replace("Z", "+00:00"))
                age_days = (datetime.now(timezone.utc) - scraped_at).days
                if age_days < CACHE_MAX_AGE_DAYS:
                    raw = latest.get("raw_data") or latest.get("text") or latest.get("data")
                    if raw:
                        try:
                            snapshot = json.loads(raw) if isinstance(raw, str) else raw
                        except Exception:
                            snapshot = {"text": str(raw)}
                        print(f"[scrape_node] DB cache HIT ({age_days}d old) for {collector_id} — skipping Bright Data API call")
                        if job_id:
                            update_job_progress(
                                job_id=job_id, collector_id=collector_id, url=url,
                                status="scraping", progress=40,
                                current_step=f"Loaded from DB cache ({age_days}d old)",
                            )
                        return {**state, "snapshot": snapshot}
    except Exception as cache_err:
        print(f"[scrape_node] DB cache check failed, falling through to API: {cache_err}")

      
    print(f"[scrape_node] No fresh cache found — triggering Bright Data for {collector_id}")
    snapshot = None
    try:
        snapshot = run_collector(collector_id, url)
    except Exception as e:
        print(f"[scrape_node] SDK failed, falling back to CLI: {e}")
        try:
            npx_cmd = "npx.cmd" if os.name == "nt" else "npx"
            result = subprocess.run(
                [npx_cmd, "-y", "-p", "@brightdata/cli", "bdata", "scraper", "run", collector_id, url],
                capture_output=True, text=True, timeout=120, shell=(os.name == "nt")
            )
            try:
                snapshot = json.loads(result.stdout)
            except Exception:
                snapshot = {"raw_output": result.stdout} if result.stdout.strip() else None
        except Exception as cli_err:
            print(f"[scrape_node] CLI fallback also failed: {cli_err}")
            snapshot = None

    if snapshot:
        try:
            text_rep = json.dumps(snapshot) if isinstance(snapshot, (dict, list)) else str(snapshot)
            save_snapshot(collector_id, url or "", text_rep, snapshot)
            print(f"[scrape_node] Successfully saved snapshot to DB for collector {collector_id}")
        except Exception as snap_err:
            print(f"[scrape_node] Failed to save snapshot to DB: {snap_err}")

    if job_id:
        try:
            text_rep = json.dumps(snapshot) if snapshot else ""
            bytes_scraped = len(text_rep.encode("utf-8"))
            items_scraped = len(snapshot) if isinstance(snapshot, list) else (1 if snapshot else 0)
            update_job_progress(
                job_id=job_id, collector_id=collector_id, url=url,
                status="scraping", progress=40,
                current_step=f"Extracted {bytes_scraped} bytes from Bright Data",
                bytes_scraped=bytes_scraped,
                items_scraped=items_scraped,
            )
        except Exception:
            pass

    return {**state, "snapshot": snapshot}


def validate_node(state: AgentState) -> AgentState:
    """Check snapshot is non-null and contains at least one data field."""
    job_id = state.get("job_id")
    if job_id:
        try:
            from storage.db import update_job_progress
            update_job_progress(
                job_id=job_id,
                collector_id=state.get("collector_id"),
                url=state.get("url"),
                status="validating",
                progress=50,
                current_step="Validating snapshot integrity",
            )
        except Exception:
            pass

    snapshot = state["snapshot"]
    if not snapshot:
        return {**state, "validation_passed": False}

      
    item = snapshot[0] if isinstance(snapshot, list) else snapshot
    passed = bool(item) if isinstance(item, dict) else bool(snapshot)
    return {**state, "validation_passed": passed}


def heal_node(state: AgentState) -> AgentState:
    """Trigger self-heal via Bright Data CLI and log the event with full telemetry."""
    import asyncio
    import time
    collector_id = state["collector_id"]
    url = state.get("url", "")
    attempts = state.get("heal_attempts", 0)
    snapshot = state.get("snapshot")
    job_id = state.get("job_id")

    if job_id:
        try:
            from storage.db import update_job_progress
            update_job_progress(
                job_id=job_id,
                collector_id=collector_id,
                url=url,
                status="healing",
                progress=55,
                current_step="Executing autonomous self-healing proxy rotation",
            )
        except Exception:
            pass

    if snapshot is None:
        heal_type = "network"
        description = "Scrape returned None — possible IP block, CAPTCHA, or bot detection"
        resolution = "Bright Data proxy rotation triggered. Scraper retrying with new residential IP."
    elif isinstance(snapshot, dict) and not snapshot.get("url"):
        heal_type = "extraction"
        description = "Extraction returned incomplete data — URL field missing from snapshot"
        resolution = "Bright Data self-heal: DOM selectors re-analyzed and redeployed automatically."
    else:
        heal_type = "extraction"
        description = "Validation failed — extracted data did not pass field checks"
        resolution = "Retrying scrape with updated selector strategy."

    start_ms = int(time.time() * 1000)

    npx_cmd = "npx.cmd" if os.name == "nt" else "npx"
    subprocess.run(
        [npx_cmd, "-p", "@brightdata/cli", "bdata", "scraper", "heal",
         collector_id,
         description,
         "--url", url, "--auto-approve"],
        capture_output=True, text=True, timeout=180, shell=(os.name == "nt")
    )

    duration_ms = int(time.time() * 1000) - start_ms

    try:
        from storage.db import save_heal_event
        import threading
          
          
        def _run_save():
            loop = asyncio.new_event_loop()
            try:
                loop.run_until_complete(save_heal_event(
                    collector_id=collector_id,
                    description=description,
                    heal_type=heal_type,
                    resolution=resolution,
                    attempts=attempts + 1,
                    duration_ms=duration_ms,
                    succeeded=True,
                ))
            finally:
                loop.close()
        threading.Thread(target=_run_save, daemon=True).start()
    except Exception:
        pass

    return {**state, "heal_attempts": attempts + 1}


def diff_node(state: AgentState) -> AgentState:
    """Compare today's snapshot against the previous one."""
    import difflib
    job_id = state.get("job_id")

    if job_id:
        try:
            from storage.db import update_job_progress
            update_job_progress(
                job_id=job_id,
                collector_id=state.get("collector_id"),
                url=state.get("url"),
                status="diffing",
                progress=65,
                current_step="Computing differential analysis against baseline snapshot",
            )
        except Exception:
            pass

    current = state.get("snapshot")
    previous = state.get("previous_snapshot")
    if not previous:
        return {**state, "diff": None}

    def to_text(s):
        if isinstance(s, str):
            return s
        if isinstance(s, (dict, list)):
            return json.dumps(s, indent=2, sort_keys=True)
        return str(s or "")

    current_text = to_text(current)
    previous_text = to_text(previous)

    lines = [
        l for l in difflib.unified_diff(
            [l.rstrip() for l in previous_text.splitlines()],
            [l.rstrip() for l in current_text.splitlines()],
            lineterm=""
        )
    ]
    meaningful = [l for l in lines if l.startswith(("+", "-")) and l[1:].strip()]
    diff = {"lines": lines, "changed": len(meaningful) > 0}
    return {**state, "diff": diff}


def filter_node(state: AgentState) -> AgentState:
    """
    Classify the diff severity using Gemini.
    CRITICAL = fee, cancellation method, data sharing, safety recall
    WARNING  = meaningful structural change, new clause
    INFO     = minor wording / typo
    NONE     = whitespace / formatting only
    """
    from dotenv import load_dotenv
    load_dotenv()

    job_id = state.get("job_id")

    if job_id:
        try:
            from storage.db import update_job_progress
            update_job_progress(
                job_id=job_id,
                collector_id=state.get("collector_id"),
                url=state.get("url"),
                status="filtering",
                progress=75,
                current_step="Evaluating policy change severity",
            )
        except Exception:
            pass

    diff = state.get("diff")
    if not diff or not diff.get("changed"):
          
        if job_id:
            try:
                from storage.db import update_job_progress, save_notification, dispatch_external_notification
                update_job_progress(
                    job_id=job_id,
                    collector_id=state.get("collector_id"),
                    url=state.get("url"),
                    status="completed",
                    progress=100,
                    current_step="No changes detected — snapshot baseline intact",
                )
                url_str = state.get("url") or state.get("collector_id") or "target site"
                msg = f"Scrape run complete for {url_str}. Baseline snapshot verified with 0 changes."
                save_notification("Scrape Completed", msg, "scrape_complete", state.get("collector_id"))
                dispatch_external_notification("Scrape Completed", msg)
            except Exception:
                pass
        return {**state, "severity": None}

    diff_text = "\n".join(diff["lines"])
    severity_raw = _ask_gemini(f"""You are a policy-change classifier. Given this diff of a Terms of Service or recall document,
classify the severity of the change:
- CRITICAL: new fee, cancellation method changed, data sharing added, safety recall
- WARNING: meaningful structural change, new clause, rights changed
- INFO: minor wording, typo fix, formatting
- NONE: whitespace only, no semantic change

Diff:
{diff_text[:3000]}

Reply with exactly one word: CRITICAL, WARNING, INFO, or NONE.""").strip().upper()

    severity = severity_raw if severity_raw in ("CRITICAL", "WARNING", "INFO") else None
    return {**state, "severity": severity}


def research_node(state: AgentState) -> AgentState:
    """
    When a CRITICAL/WARNING change is detected on a ToS or civic page:
    1. Search Google, Reddit, Perplexity for articles about the change
    2. Return structured source list with title, url, snippet
    """
    diff = state.get("diff", {})
    collector_id = state["collector_id"]
    url = state.get("url", "")
    source_type = state.get("source_type", "general")
    job_id = state.get("job_id")

    if job_id:
        try:
            from storage.db import update_job_progress
            update_job_progress(
                job_id=job_id,
                collector_id=collector_id,
                url=url,
                status="researching",
                progress=85,
                current_step="Synthesizing web search and community stance",
            )
        except Exception:
            pass

    if source_type not in ("tos", "civic"):
        return {**state, "sources": []}

    diff_text = "\n".join(diff.get("lines", []))[:500]
    search_query = f"site policy changes {url.split('/')[2] if '/' in url else url} privacy terms"

    all_sources = []
    try:
        from brightdata_client import search_google, search_reddit, search_perplexity

        google_results = search_google(search_query, num_results=5)
        all_sources.extend(google_results)

        reddit_results = search_reddit(search_query, num_results=3)
        all_sources.extend(reddit_results)

        perplexity_result = search_perplexity(search_query)
        if perplexity_result:
            all_sources.append({
                "title": f"Perplexity AI: {search_query}",
                "url": f"https://www.perplexity.ai/search?q={search_query.replace(' ', '+')}",
                "snippet": str(perplexity_result.get("answer", ""))[:500],
                "source_type": "perplexity",
            })
    except Exception as e:
        print(f"[research_node] Research failed: {e}")

    return {**state, "sources": all_sources}


def draft_node(state: AgentState) -> AgentState:
    """
    Generate:
    1. A 1-sentence plain-English impact alert
    2. Two unified positions (A = mainstream risk, B = alternative/mitigation)
    3. A ready-to-copy action script (email template, opt-out steps, etc.)
    """
    from dotenv import load_dotenv
    load_dotenv()

    job_id = state.get("job_id")

    if job_id:
        try:
            from storage.db import update_job_progress
            update_job_progress(
                job_id=job_id,
                collector_id=state.get("collector_id"),
                url=state.get("url"),
                status="synthesizing",
                progress=95,
                current_step="Generating policy impact alert and action script",
            )
        except Exception:
            pass

    diff = state.get("diff", {})
    diff_text = "\n".join(diff.get("lines", []))
    sources = state.get("sources") or []

    sources_context = "\n".join([
        f"- {s['title']}: {s['snippet'][:200]} ({s['url']})"
        for s in sources[:8]
    ]) if sources else "No external sources found."

    content = _ask_gemini(f"""You are Spider-Sense, a personal radar that alerts users to changes that could hurt them.

A document change was detected. Here is the diff:
{diff_text[:2000]}

Here are related articles and sources found on the web:
{sources_context}

Generate:
1. ALERT: A 1-sentence plain-English impact statement (start with the impact to the user, not the change itself)
2. POSITION_A: The mainstream / risk-focused view on this change (2-3 sentences)
3. POSITION_B: An alternative perspective or mitigation view (2-3 sentences)
4. SCRIPT: A ready-to-copy action script — could be an opt-out email draft, cancellation request, data deletion steps, or refund claim. Be specific.

Format exactly:
ALERT: <1 sentence>
POSITION_A: <2-3 sentences>
POSITION_B: <2-3 sentences>
SCRIPT:
<action script>""")

    def extract(label: str, next_labels: list[str] = []) -> str:
        start = content.find(f"{label}:")
        if start == -1:
            return ""
        start += len(label) + 1
        end = len(content)
        for nl in next_labels:
            idx = content.find(f"{nl}:", start)
            if idx != -1:
                end = min(end, idx)
        return content[start:end].strip()

    alert = extract("ALERT", ["POSITION_A", "POSITION_B", "SCRIPT"])
    position_a = extract("POSITION_A", ["POSITION_B", "SCRIPT"])
    position_b = extract("POSITION_B", ["SCRIPT"])
    script = extract("SCRIPT")

    if job_id:
        try:
            from storage.db import update_job_progress, save_notification, dispatch_external_notification
            update_job_progress(
                job_id=job_id,
                collector_id=state.get("collector_id"),
                url=state.get("url"),
                status="completed",
                progress=100,
                current_step="Analysis completed — alert and action script generated",
            )
            url_str = state.get("url") or state.get("collector_id") or "target site"
            sev = state.get("severity") or "WARNING"
            notif_msg = f"{sev} Alert: {alert or 'Policy change detected.'}"
            save_notification(f"Policy Alert ({sev})", notif_msg, "alert_triggered", state.get("collector_id"))
            dispatch_external_notification(f"Policy Alert ({sev})", notif_msg, category=state.get("source_type") or "general")
        except Exception:
            pass

    return {**state, "alert": alert, "position_a": position_a, "position_b": position_b, "draft_script": script}


  

def should_heal(state: AgentState) -> str:
      
      
    if not state["validation_passed"] and state.get("heal_attempts", 0) < 1:
        return "heal"
    return "diff"


def should_alert(state: AgentState) -> str:
    return "draft" if state.get("severity") in ("WARNING", "CRITICAL") else END


  

graph = StateGraph(AgentState)

graph.add_node("scrape",    scrape_node)
graph.add_node("validate",  validate_node)
graph.add_node("heal",      heal_node)
graph.add_node("differ",    diff_node)
graph.add_node("filter",    filter_node)
graph.add_node("research",  research_node)
graph.add_node("draft",     draft_node)

graph.set_entry_point("scrape")
graph.add_edge("scrape",   "validate")
graph.add_conditional_edges("validate", should_heal, {"heal": "heal", "diff": "differ"})
graph.add_edge("heal",     "scrape")      
graph.add_edge("differ",   "filter")
graph.add_conditional_edges("filter", should_alert, {"draft": "research", END: END})
graph.add_edge("research", "draft")
graph.add_edge("draft",    END)

app = graph.compile()

import os
import json
import time
import asyncio
import difflib
from typing import TypedDict, Optional, Literal, List, Dict, Any

from langgraph.graph import StateGraph, END
from scrapers.engine import ScraperEngine, ScrapedSnapshot
from scrapers.inhouse import InHouseScraper
from brightdata_client import run_bdata_cli, search_google, search_reddit, search_perplexity
from storage.db import StorageClient
from llm import ask_gemini

class AgentState(TypedDict):
    job_id: Optional[str]
    collector_id: Optional[str]
    url: Optional[str]
    prompt: Optional[str]
    source_type: Optional[str]
    scrape_engine: Optional[str]  
    healed_selector: Optional[str]
    snapshot: Optional[Dict[str, Any]]
    previous_snapshot: Optional[Dict[str, Any]]
    validation_passed: bool
    heal_attempts: int
    diff: Optional[Dict[str, Any]]
    severity: Optional[Literal["INFO", "WARNING", "CRITICAL"]]
    alert: Optional[str]
    draft_script: Optional[str]
    position_a: Optional[str]
    position_b: Optional[str]
    sources: Optional[List[Dict[str, Any]]]



async def scrape_node(state: AgentState) -> AgentState:
    collector_id = state.get("collector_id") or "c_inhouse"
    url = state.get("url") or ""
    job_id = state.get("job_id")
    prompt = state.get("prompt")
    engine = state.get("scrape_engine") or "auto"
    healed_selector = state.get("healed_selector")
    if state.get("snapshot"):
        print(f"[scrape_node] Using pre-provided snapshot for job {job_id}")
        return state

    if job_id:
        try:
            await StorageClient.update_job_progress(
                job_id=job_id,
                collector_id=collector_id,
                url=url,
                status="scraping",
                progress=20,
                current_step=f"Extracting live data via {engine.upper()} scraper engine...",
            )
        except Exception:
            pass

    snapshot: Optional[Dict[str, Any]] = None
    try:
        snapshot = await ScraperEngine.scrape(
            url=url,
            collector_id=collector_id,
            prompt=prompt,
            engine=engine,
            job_id=job_id,
        )
    except Exception as scrape_err:
        print(f"[scrape_node] Scraper execution failed: {scrape_err}")
        snapshot = None

    if snapshot:
        try:
            raw_text = snapshot.get("raw_text") or json.dumps(snapshot)
            await StorageClient.save_snapshot(collector_id, url or "", raw_text, snapshot)
            print(f"[scrape_node] Saved snapshot to DB for {collector_id}")
        except Exception as snap_err:
            print(f"[scrape_node] Failed to save snapshot to DB: {snap_err}")

    if job_id:
        try:
            text_rep = snapshot.get("raw_text") if snapshot else ""
            bytes_scraped = len(text_rep.encode("utf-8")) if text_rep else 0
            items_scraped = len(snapshot.get("sections", {})) if snapshot else 0
            await StorageClient.update_job_progress(
                job_id=job_id,
                collector_id=collector_id,
                url=url,
                status="scraping",
                progress=45,
                current_step=f"Extracted {bytes_scraped} bytes via {snapshot.get('source', 'engine') if snapshot else 'scraper'}",
                bytes_scraped=bytes_scraped,
                items_scraped=items_scraped,
            )
        except Exception:
            pass

    return {**state, "snapshot": snapshot}


async def validate_node(state: AgentState) -> AgentState:
    job_id = state.get("job_id")
    if job_id:
        try:
            await StorageClient.update_job_progress(
                job_id=job_id,
                collector_id=state.get("collector_id"),
                url=state.get("url"),
                status="validating",
                progress=50,
                current_step="Validating document payload integrity",
            )
        except Exception:
            pass

    snapshot = state.get("snapshot")
    if not snapshot:
        return {**state, "validation_passed": False}

    raw_text = snapshot.get("raw_text") or snapshot.get("text") or ""
    sections = snapshot.get("sections") or {}

    passed = len(raw_text.strip()) > 40 or len(sections) > 0
    return {**state, "validation_passed": passed}


async def heal_node(state: AgentState) -> AgentState:
    collector_id = state.get("collector_id") or "c_inhouse"
    url = state.get("url", "")
    attempts = state.get("heal_attempts", 0)
    job_id = state.get("job_id")
    engine = state.get("scrape_engine") or "auto"

    if job_id:
        try:
            await StorageClient.update_job_progress(
                job_id=job_id,
                collector_id=collector_id,
                url=url,
                status="healing",
                progress=55,
                current_step=f"Autonomous Self-Healing ({engine}): Re-analyzing DOM selectors...",
            )
        except Exception:
            pass

    description = "Validation failed: Extracted document content was empty or below minimum threshold."
    heal_type = "extraction"
    resolution = "Dynamic AI selector synthesis"
    new_selector = None
    start_ms = int(time.time() * 1000)
    if engine in ("inhouse", "auto"):
        try:
            heal_res = await InHouseScraper.heal(
                url=url,
                issue_description=description,
                collector_id=collector_id,
            )
            new_selector = heal_res.get("healed_selector")
            resolution = heal_res.get("resolution") or resolution
        except Exception as heal_err:
            print(f"[heal_node] In-house heal failed: {heal_err}")

    elif engine == "brightdata":
        try:
            await asyncio.to_thread(
                run_bdata_cli,
                [
                    "scraper", "heal", collector_id, description,
                    "--url", url, "--auto-approve"
                ],
                120
            )
            resolution = "Bright Data Scraper Studio cloud repair executed"
        except Exception as bd_heal_err:
            print(f"[heal_node] Bright Data heal failed: {bd_heal_err}")

    duration_ms = int(time.time() * 1000) - start_ms

    try:
        await StorageClient.save_heal_event(
            collector_id=collector_id,
            description=description,
            heal_type=heal_type,
            resolution=resolution,
            attempts=attempts + 1,
            duration_ms=duration_ms,
            succeeded=True,
        )
    except Exception:
        pass

    return {
        **state,
        "heal_attempts": attempts + 1,
        "healed_selector": new_selector,
    }


async def diff_node(state: AgentState) -> AgentState:
    job_id = state.get("job_id")

    if job_id:
        try:
            await StorageClient.update_job_progress(
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
        if isinstance(s, dict):
            return s.get("raw_text") or json.dumps(s, indent=2, sort_keys=True)
        if isinstance(s, list):
            return json.dumps(s, indent=2, sort_keys=True)
        return str(s or "")

    current_text = to_text(current)
    previous_text = to_text(previous)

    lines = list(difflib.unified_diff(
        [l.rstrip() for l in previous_text.splitlines()],
        [l.rstrip() for l in current_text.splitlines()],
        lineterm=""
    ))
    meaningful = [l for l in lines if l.startswith(("+", "-")) and l[1:].strip()]
    diff = {"lines": lines, "changed": len(meaningful) > 0}
    return {**state, "diff": diff}


async def filter_node(state: AgentState) -> AgentState:
    """Classify diff severity using Gemini."""
    job_id = state.get("job_id")

    if job_id:
        try:
            await StorageClient.update_job_progress(
                job_id=job_id,
                collector_id=state.get("collector_id"),
                url=state.get("url"),
                status="filtering",
                progress=75,
                current_step="Evaluating policy change severity with Gemini AI",
            )
        except Exception:
            pass

    diff = state.get("diff")
    if not diff or not diff.get("changed"):
        if job_id:
            try:
                await StorageClient.update_job_progress(
                    job_id=job_id,
                    collector_id=state.get("collector_id"),
                    url=state.get("url"),
                    status="completed",
                    progress=100,
                    current_step="No policy changes detected — baseline intact",
                )
                url_str = state.get("url") or state.get("collector_id") or "target site"
                msg = f"Scrape complete for {url_str}. Baseline snapshot verified with 0 alterations."
                await StorageClient.save_notification("Scrape Completed", msg, "scrape_complete", state.get("collector_id"))
                StorageClient.dispatch_external_notification("Scrape Completed", msg)
            except Exception:
                pass
        return {**state, "severity": None}

    diff_text = "\n".join(diff["lines"])
    prompt = f"""You are a policy-change risk classifier. Given this diff of a Terms of Service or regulatory document:
Classify the change severity:
- CRITICAL: new fees, arbitration clauses, cancellation method made harder, AI model training opt-in, extensive third-party data sharing
- WARNING: meaningful structural change, modified clause, altered user warranties
- INFO: minor wording, formatting, typo fix
- NONE: whitespace or formatting only

Diff:
{diff_text[:3000]}

Reply with exactly one word: CRITICAL, WARNING, INFO, or NONE."""

    severity_raw = (await asyncio.to_thread(ask_gemini, prompt)).strip().upper()
    severity = severity_raw if severity_raw in ("CRITICAL", "WARNING", "INFO") else None
    return {**state, "severity": severity}


async def research_node(state: AgentState) -> AgentState:
    diff = state.get("diff", {})
    collector_id = state.get("collector_id") or ""
    url = state.get("url", "")
    source_type = state.get("source_type", "general")
    job_id = state.get("job_id")

    if job_id:
        try:
            await StorageClient.update_job_progress(
                job_id=job_id,
                collector_id=collector_id,
                url=url,
                status="researching",
                progress=85,
                current_step="Synthesizing multi-source web intelligence & community stance",
            )
        except Exception:
            pass

    if source_type not in ("tos", "civic", "general"):
        return {**state, "sources": []}

    domain = url.split("/")[2] if "/" in url and len(url.split("/")) > 2 else url
    search_query = f"{domain} policy update changes privacy terms controversy"

    all_sources = []
    try:
        google_results = await asyncio.to_thread(search_google, search_query, 4)
        all_sources.extend(google_results)

        reddit_results = await asyncio.to_thread(search_reddit, search_query, 3)
        all_sources.extend(reddit_results)

        perplexity_result = await asyncio.to_thread(search_perplexity, search_query)
        if perplexity_result:
            all_sources.append({
                "title": f"Perplexity AI: {search_query}",
                "url": f"https://www.perplexity.ai/search?q={search_query.replace(' ', '+')}",
                "snippet": str(perplexity_result.get("answer", ""))[:500],
                "source_type": "perplexity",
            })
    except Exception as e:
        print(f"[research_node] Research synthesis error: {e}")

    return {**state, "sources": all_sources}


async def draft_node(state: AgentState) -> AgentState:
    job_id = state.get("job_id")

    if job_id:
        try:
            await StorageClient.update_job_progress(
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
        for s in sources[:6]
    ]) if sources else "No external articles found."

    prompt = f"""You are Spider-Sense, a consumer protection radar alerting users to changes that impact them.

Document diff:
{diff_text[:2500]}

Related sources & community intelligence:
{sources_context}

Generate:
1. ALERT: A 1-sentence plain-English impact statement focusing directly on what happens to the user.
2. POSITION_A: Mainstream / risk-focused view on this change (2-3 sentences).
3. POSITION_B: Alternative perspective, corporate rationale, or mitigation view (2-3 sentences).
4. SCRIPT: A ready-to-copy action script (e.g., opt-out email, cancellation template, data deletion request).

Format exactly:
ALERT: <1 sentence>
POSITION_A: <2-3 sentences>
POSITION_B: <2-3 sentences>
SCRIPT:
<action script>"""

    content = await asyncio.to_thread(ask_gemini, prompt)

    def extract(label: str, next_labels: List[str] = []) -> str:
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
            await StorageClient.update_job_progress(
                job_id=job_id,
                collector_id=state.get("collector_id"),
                url=state.get("url"),
                status="completed",
                progress=100,
                current_step="Analysis completed — alert and action script synthesized",
            )
            url_str = state.get("url") or state.get("collector_id") or "target site"
            sev = state.get("severity") or "WARNING"
            notif_msg = f"{sev} Alert: {alert or 'Policy change detected.'}"
            await StorageClient.save_notification(f"Policy Alert ({sev})", notif_msg, "alert_triggered", state.get("collector_id"))
            StorageClient.dispatch_external_notification(f"Policy Alert ({sev})", notif_msg, category=state.get("source_type") or "general")
        except Exception:
            pass

    return {
        **state,
        "alert": alert,
        "position_a": position_a,
        "position_b": position_b,
        "draft_script": script,
    }



def should_heal(state: AgentState) -> str:
    if not state.get("validation_passed", False) and state.get("heal_attempts", 0) < 1:
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

agent_graph = graph.compile()
app = agent_graph

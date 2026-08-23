from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import json
import os
import asyncio
import re
import uuid
import gzip
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

if "BRIGHTDATA_API_TOKEN" in os.environ and "BRIGHTDATA_API_KEY" not in os.environ:
    os.environ["BRIGHTDATA_API_KEY"] = os.environ["BRIGHTDATA_API_TOKEN"]

from graph import app as agent_graph
from brightdata_client import check_dataset_marketplace, run_collector, trigger_collector_async, search_google, search_reddit
from storage.db import (
    get_collector_by_url,
    save_collector,
    save_snapshot,
    get_from_nextjs,
    update_job_progress,
    save_notification,
    dispatch_external_notification,
    save_alert,
    save_sources,
    save_heal_event,
    save_civic_notice,
    get_snapshots,
)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(title="Spider-Sense Agent API", version="0.3.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

  

class ScraperCreateRequest(BaseModel):
    url: str
    prompt: str
    name: str = ""
    source_type: str = "general"

class ScraperRunRequest(BaseModel):
    collector_id: str
    url: str
    source_type: str = "general"

class ScraperHealRequest(BaseModel):
    collector_id: str
    url: str
    issue_description: str
    auto_approve: bool = True

class KeywordSearchRequest(BaseModel):
    keyword: str

class WatchRequest(BaseModel):
    url: str
    name: str = ""
    source_type: str = "tos"
    prompt: str = "Extract the main content into clean, structured JSON key-value section chunks (e.g. title, summary, data_collection, ai_training, user_rights). Do NOT output raw HTML tags."
    force_fresh: bool = False

  

def run_bdata_cli(cmd_args: list[str], timeout: int = 180) -> str:
    """Execute Bright Data CLI commands via npx."""
    npx_cmd = "npx.cmd" if os.name == "nt" else "npx"
    full_cmd = [npx_cmd, "-y", "-p", "@brightdata/cli", "bdata"] + cmd_args
    env = os.environ.copy()
    process = subprocess.run(
        full_cmd,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
        env=env,
        shell=(os.name == "nt"),
    )
    if process.returncode != 0 and process.stderr:
        print(f"[BrightData CLI]: {process.stderr}")
    return (process.stdout or "").strip()

  

@app.get("/health")
async def health():
    return {"status": "ok", "agent": "spider-sense", "version": "0.3.0"}


@app.post("/watch")
async def watch_url(req: WatchRequest):
    url = req.url.strip()
    CACHE_MAX_AGE_DAYS = 7

      
    if not req.force_fresh:
        snapshots_resp = get_from_nextjs(f"snapshots?url={url}")
        snap_list = snapshots_resp.get("data") or []
        if snap_list:
            latest = snap_list[0]
            scraped_at_str = latest.get("scrapedAt") or latest.get("scraped_at")
            if scraped_at_str:
                scraped_at = datetime.fromisoformat(scraped_at_str.replace("Z", "+00:00"))
                age_days = (datetime.now(timezone.utc) - scraped_at).days
                if age_days < CACHE_MAX_AGE_DAYS:
                    return {
                        "success": True,
                        "source": "database_cache",
                        "age_days": age_days,
                        "data": latest,
                        "message": f"Served from DB cache ({age_days}d old). No API call made.",
                    }

      
    if not req.force_fresh:
        marketplace_data = await asyncio.to_thread(check_dataset_marketplace, url)
        if marketplace_data:
            text = marketplace_data.get("text") or json.dumps(marketplace_data)
            collector_id = get_collector_by_url(url)
            if collector_id:
                save_snapshot(collector_id, url, text, marketplace_data)
            return {
                "success": True,
                "source": "brightdata_marketplace",
                "data": marketplace_data,
                "message": "Served from Bright Data pre-scraped dataset. No collector triggered.",
            }

      
    clean_name = req.name.strip() if req.name and req.name.strip() else ""
    if not clean_name:
        domain = url.split("/")[2] if "/" in url and len(url.split("/")) > 2 else url
        clean_name = domain.replace("www.", "").split(".")[0].capitalize() + " Monitor"

      
    job_id = f"job_{uuid.uuid4().hex[:10]}"
    collector_id = get_collector_by_url(url)
    if collector_id:
          
        save_collector(collector_id, clean_name, url, req.source_type)
        webhook_base = os.getenv("WEBHOOK_BASE_URL")
        if webhook_base:
            webhook_url = f"{webhook_base.rstrip('/')}/webhooks/brightdata?job_id={job_id}&collector_id={collector_id}"
            async_res = trigger_collector_async(collector_id, url, webhook_url)
            if async_res and async_res.get("success"):
                update_job_progress(
                    job_id=job_id,
                    collector_id=collector_id,
                    url=url,
                    status="scraping",
                    progress=25,
                    current_step="Scrape triggered asynchronously — delivery via Webhook",
                )
                return {
                    "success": True,
                    "source": "async_webhook",
                    "job_id": job_id,
                    "collector_id": collector_id,
                    "message": "Scrape triggered asynchronously — data will be delivered via Webhook",
                }

          
        result = await agent_graph.ainvoke({
            "job_id": job_id,
            "collector_id": collector_id,
            "url": url,
            "source_type": req.source_type,
            "snapshot": None,
            "previous_snapshot": None,
            "validation_passed": False,
            "heal_attempts": 0,
            "diff": None,
            "severity": None,
            "alert": None,
            "draft_script": None,
            "position_a": None,
            "position_b": None,
            "sources": None,
        })
        await _persist_alert(result, collector_id, req.source_type)
        return {
            "success": True,
            "source": "existing_collector",
            "job_id": job_id,
            "collector_id": collector_id,
            "data": result,
        }

      
    try:
          
        collector_id = os.getenv("DEFAULT_COLLECTOR_ID", "c_mt4gjw4y2gom7o80b7")
        print(f"[/watch] Allocated active collector '{collector_id}' for URL: {url}")

        save_collector(collector_id, clean_name, url, req.source_type)
        print(f"[/watch] Successfully registered new watcher '{clean_name}' ({url}) to DB.")

          
        async def _run_pipeline_bg():
            try:
                result = await agent_graph.ainvoke({
                    "job_id": job_id,
                    "collector_id": collector_id,
                    "url": url,
                    "source_type": req.source_type,
                    "snapshot": None,
                    "previous_snapshot": None,
                    "validation_passed": False,
                    "heal_attempts": 0,
                    "diff": None,
                    "severity": None,
                    "alert": None,
                    "draft_script": None,
                    "position_a": None,
                    "position_b": None,
                    "sources": None,
                })
                await _persist_alert(result, collector_id, req.source_type)
            except Exception as bg_err:
                print(f"[/watch background error]: {bg_err}")

        asyncio.create_task(_run_pipeline_bg())

        return {
            "success": True,
            "source": "new_collector",
            "job_id": job_id,
            "collector_id": collector_id,
            "message": "Scraper initialized and saved to DB. Analysis running in background.",
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[/watch ERROR]: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Watch failed: {str(e)}")


@app.post("/scraper/create")
async def create_scraper(req: ScraperCreateRequest):
    """Creates a Scraper Studio collector for a URL."""
    cached_id = get_collector_by_url(req.url)
    if cached_id:
        return {
            "success": True,
            "collector_id": cached_id,
            "cached": True,
            "message": "Returned existing collector — no rebuild needed."
        }

    try:
        output = await asyncio.to_thread(
            run_bdata_cli,
            ["scraper", "create", req.url, req.prompt],
            900
        )
        match = re.search(r"c_[a-z0-9]+", output)
        collector_id = match.group(0) if match else None

        if collector_id:
            name = req.name or req.url.split("/")[2]
            save_collector(collector_id, name, req.url, req.source_type)

        return {
            "success": True,
            "collector_id": collector_id,
            "cached": False,
            "output": output
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create scraper: {str(e)}")


@app.post("/run")
async def run_agent(req: ScraperRunRequest):
    """Triggers the full autonomous LangGraph pipeline for a collector (checks DB cache first)."""
    url = req.url.strip()
    job_id = f"job_{uuid.uuid4().hex[:10]}"
    CACHE_MAX_AGE_DAYS = 7

      
    snapshots_resp = get_from_nextjs(f"snapshots?url={url}")
    snap_list = snapshots_resp.get("data") or []
    if snap_list:
        latest = snap_list[0]
        scraped_at_str = latest.get("scrapedAt") or latest.get("scraped_at")
        if scraped_at_str:
            scraped_at = datetime.fromisoformat(scraped_at_str.replace("Z", "+00:00"))
            age_days = (datetime.now(timezone.utc) - scraped_at).days
            if age_days < CACHE_MAX_AGE_DAYS:
                update_job_progress(
                    job_id=job_id,
                    collector_id=req.collector_id,
                    url=url,
                    status="completed",
                    progress=100,
                    current_step=f"Served from DB cache ({age_days}d old). No API call needed.",
                )
                print(f"[/run] Served from DB cache ({age_days}d old) for {req.collector_id}")
                return {
                    "success": True,
                    "source": "database_cache",
                    "job_id": job_id,
                    "age_days": age_days,
                    "data": {"snapshot": latest},
                    "message": f"Served from DB cache ({age_days}d old). No API call made.",
                }

    try:
        result = await agent_graph.ainvoke({
            "job_id": job_id,
            "collector_id": req.collector_id,
            "url": req.url,
            "source_type": req.source_type,
            "snapshot": None,
            "previous_snapshot": None,
            "validation_passed": False,
            "heal_attempts": 0,
            "diff": None,
            "severity": None,
            "alert": None,
            "draft_script": None,
            "position_a": None,
            "position_b": None,
            "sources": None,
        })

        snapshot = result.get("snapshot")
        if snapshot:
            text_rep = json.dumps(snapshot) if isinstance(snapshot, (dict, list)) else str(snapshot)
            save_snapshot(req.collector_id, req.url, text_rep, snapshot)
            print(f"[/run] Persisted snapshot to DB for {req.collector_id}")

        await _persist_alert(result, req.collector_id, req.source_type)
        return {"success": True, "job_id": job_id, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent execution failed: {str(e)}")


@app.post("/scraper/heal")
async def heal_scraper(req: ScraperHealRequest):
    """Fix a broken collector using Bright Data CLI self-healing."""
    try:
        args = ["scraper", "heal", req.collector_id, req.issue_description, "--url", req.url]
        if req.auto_approve:
            args.append("--auto-approve")

        output = await asyncio.to_thread(run_bdata_cli, args, 300)

        if not req.auto_approve:
            approve_out = await asyncio.to_thread(
                run_bdata_cli, ["scraper", "approve", req.collector_id, "--url", req.url], 60
            )
            output += f"\n{approve_out}"

        await save_heal_event(
            collector_id=req.collector_id,
            description=req.issue_description,
            attempts=1
        )
        return {"success": True, "output": output}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Self-heal failed: {str(e)}")


@app.post("/search/unified-position")
async def search_unified_position(req: KeywordSearchRequest):
    """Keyword -> Bright Data search -> Gemini synthesizes unified positions."""
    from graph import _ask_gemini

    results = await asyncio.to_thread(search_google, req.keyword, 5)
    reddit_results = await asyncio.to_thread(search_reddit, req.keyword, 5)
    all_sources = results + reddit_results

    sources_context = "\n".join(
        [f"- [{s.get('source_type', 'web').upper()}] {s.get('title', 'Link')}: {s.get('snippet', '')} ({s.get('url', '')})" for s in all_sources[:6]]
    )

    content = await asyncio.to_thread(
        _ask_gemini,
        f"""You are Spider-Sense Research Synthesizer.
Keyword: "{req.keyword}"

Sources found:
{sources_context}

Generate:
1. POSITION_A: Mainstream consensus or primary risk view (2-3 sentences)
2. POSITION_B: Alternative perspective, counter-arguments, or mitigation view (2-3 sentences)
3. SUMMARY: A single unified summary (1 sentence)

Format exactly:
POSITION_A: <text>
POSITION_B: <text>
SUMMARY: <text>"""
    )

    def extract(label: str, next_labels: list[str] = []) -> str:
        start = content.find(f"{label}:")
        if start == -1: return ""
        start += len(label) + 1
        end = len(content)
        for nl in next_labels:
            idx = content.find(f"{nl}:", start)
            if idx != -1: end = min(end, idx)
        return content[start:end].strip()

    position_a = extract("POSITION_A", ["POSITION_B", "SUMMARY"])
    position_b = extract("POSITION_B", ["SUMMARY"])
    summary = extract("SUMMARY")

    await save_civic_notice(
        title=f"Research: {req.keyword}",
        category="Research Stance",
        summary=summary,
        scheme_name=req.keyword,
    )

    return {
        "success": True,
        "keyword": req.keyword,
        "position_a": position_a,
        "position_b": position_b,
        "summary": summary,
        "sources": all_sources,
    }


@app.get("/snapshots/{collector_id}")
async def get_snapshots_endpoint(collector_id: str):
    """Return snapshot history for a collector."""
    return get_snapshots(collector_id)


  

async def _process_webhook_payload(raw_bytes: bytes, query_params: dict):
    """Background task: Parse webhook body, save snapshot, update telemetry, run graph."""
    try:
        if raw_bytes.startswith(b'\x1f\x8b'):
            try:
                raw_bytes = gzip.decompress(raw_bytes)
            except Exception as gz_err:
                print(f"[BrightData Webhook] Gzip decompress error: {gz_err}")

        body = json.loads(raw_bytes.decode("utf-8", errors="replace"))
        print(f"[BrightData Webhook Received]: {json.dumps(body)[:300]}")

        first_item = body[0] if isinstance(body, list) and len(body) > 0 else (body if isinstance(body, dict) else {})
        meta_dict = body if isinstance(body, dict) else {}

        collector_id = (
            query_params.get("collector_id")
            or meta_dict.get("collector_id")
            or meta_dict.get("collector")
            or meta_dict.get("id")
            or first_item.get("collector_id")
            or first_item.get("collector")
            or "c_webhook"
        )

        input_obj = first_item.get("input") if isinstance(first_item, dict) and isinstance(first_item.get("input"), dict) else {}
        url = (
            query_params.get("url")
            or meta_dict.get("url")
            or meta_dict.get("target_url")
            or first_item.get("url")
            or first_item.get("target_url")
            or input_obj.get("url")
            or ""
        )

        if (not collector_id or collector_id == "c_webhook") and url:
            try:
                coll_resp = get_from_nextjs("collectors")
                for c in (coll_resp.get("data") or []):
                    if c.get("url") == url:
                        collector_id = c.get("collectorId") or c.get("collector_id")
                        break
            except Exception:
                pass

        if not url and collector_id and collector_id != "c_webhook":
            try:
                coll_resp = get_from_nextjs("collectors")
                for c in (coll_resp.get("data") or []):
                    if c.get("collectorId") == collector_id or c.get("collector_id") == collector_id:
                        url = c.get("url")
                        break
            except Exception:
                pass

        job_id = query_params.get("job_id") or meta_dict.get("job_id") or f"job_{collector_id}"
        snapshot_data = meta_dict.get("data") or meta_dict.get("snapshot") or meta_dict.get("dataset") or body

        if meta_dict.get("error") or meta_dict.get("status") == "failed" or not snapshot_data:
            err_msg = str(meta_dict.get("error") or "Scrape returned empty or error payload")
            print(f"[BrightData Webhook] Delivery failed for {collector_id}: {err_msg}")
            update_job_progress(
                job_id=job_id,
                collector_id=collector_id,
                url=url,
                status="healing",
                progress=55,
                current_step=f"Auto-healing triggered: {err_msg[:60]}",
            )
              
            print(f"[Webhook] Failed delivery for {collector_id}. Logged for manual review.")
            return

        text_rep = json.dumps(snapshot_data) if isinstance(snapshot_data, (dict, list)) else str(snapshot_data)
        bytes_scraped = len(text_rep.encode("utf-8"))
        items_scraped = len(snapshot_data) if isinstance(snapshot_data, list) else 1

        url_label = url or collector_id or "Target Site"
        print(f"\n=======================================================")
        print(f"[SCRAPED DATA DELIVERED FOR {url_label} ({bytes_scraped} bytes)]:")
        print(f"{text_rep[:600]}...")
        print(f"=======================================================\n")

        if snapshot_data:
            save_snapshot(collector_id, url or "Target Site", text_rep, snapshot_data)
            print(f"[BrightData Webhook] Successfully saved snapshot to DB for {collector_id} ({bytes_scraped} bytes)")

        update_job_progress(
            job_id=job_id,
            collector_id=collector_id,
            url=url,
            status="completed",
            progress=100,
            current_step="Scrape data received via Webhook & saved to DB",
            bytes_scraped=bytes_scraped,
            items_scraped=items_scraped,
        )

        url_label = url or collector_id or "Target Site"
        save_notification(
            title="Scrape Data Delivered",
            message=f"Received {bytes_scraped} bytes telemetry for {url_label}.",
            type="scrape_complete",
            collector_id=collector_id,
        )
        dispatch_external_notification("Scrape Data Delivered", f"Received data for {url_label}.")

          
          
          
          
          
    except Exception as e:
        print(f"[BrightData Webhook Background Error]: {e}")


@app.post("/webhooks/brightdata")
async def brightdata_webhook(request: Request):
    """
    Returns HTTP 200 OK immediately (< 50ms) to Bright Data to prevent infinite webhook retries,
    then processes snapshot storage, telemetry, and graph execution in background task.
    """
    raw_bytes = await request.body()
    query_params = dict(request.query_params)
    asyncio.create_task(_process_webhook_payload(raw_bytes, query_params))
    return {"success": True, "message": "Webhook payload received and queued for processing"}


async def _persist_alert(result: dict, collector_id: str, source_type: str):
    """Fire-and-forget: persist alert + sources if a WARNING/CRITICAL was detected."""
    if result.get("alert") and result.get("severity") in ("WARNING", "CRITICAL"):
        alert_id = await save_alert(
            collector_id=collector_id,
            severity=result.get("severity"),
            message=result.get("alert"),
            draft_script=result.get("draft_script"),
            category=source_type,
            position_a=result.get("position_a"),
            position_b=result.get("position_b"),
        )
        if alert_id and result.get("sources"):
            await save_sources(alert_id, result["sources"])

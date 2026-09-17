from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
import asyncio
import re
import uuid
import gzip
import traceback
from typing import Optional
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

if "BRIGHTDATA_API_TOKEN" in os.environ and "BRIGHTDATA_API_KEY" not in os.environ:
    os.environ["BRIGHTDATA_API_KEY"] = os.environ["BRIGHTDATA_API_TOKEN"]

from graph import app as agent_graph
from scrapers.engine import ScraperEngine
from scrapers.inhouse import InHouseScraper
from scrapers.probe import ChangeProber
from brightdata_client import (
    run_bdata_cli,
    check_dataset_marketplace,
    search_google,
    search_reddit,
)
from storage.db import StorageClient
from llm import ask_gemini

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(title="Spider-Sense Agent API", version="0.4.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScraperCreateRequest(BaseModel):
    url: str
    prompt: str = "Extract the main content into clean, structured JSON key-value section chunks."
    name: str = ""
    source_type: str = "general"
    engine: str = "inhouse" 

class ScraperRunRequest(BaseModel):
    collector_id: str
    url: str
    source_type: str = "general"
    prompt: Optional[str] = None
    engine: str = "inhouse"

class ScraperHealRequest(BaseModel):
    collector_id: str
    url: str
    issue_description: str
    auto_approve: bool = True
    engine: str = "inhouse"

class KeywordSearchRequest(BaseModel):
    keyword: str

class ProbeRequest(BaseModel):
    url: str
    collector_id: Optional[str] = None
    last_etag: Optional[str] = None
    last_modified: Optional[str] = None
    last_content_hash: Optional[str] = None
    target_selector: Optional[str] = None

class WatchRequest(BaseModel):
    url: str
    name: str = ""
    source_type: str = "tos"
    prompt: str = "Extract the main content into clean, structured JSON key-value section chunks (e.g. title, summary, data_collection, ai_training, user_rights). Do NOT output raw HTML tags."
    force_fresh: bool = False
    engine: str = "inhouse"

async def run_unified_pipeline(
    job_id: str,
    collector_id: str,
    url: str,
    source_type: str = "general",
    prompt: Optional[str] = None,
    engine: str = "auto",
    preloaded_snapshot: Optional[dict] = None,
):
    try:
        print(f"[Pipeline] Starting execution for job={job_id} | url={url} | engine={engine}")
        await StorageClient.update_job_progress(
            job_id=job_id,
            collector_id=collector_id,
            url=url,
            status="scraping",
            progress=15,
            current_step="Pipeline initialized: Triggering autonomous analysis",
        )

        result = await agent_graph.ainvoke({
            "job_id": job_id,
            "collector_id": collector_id,
            "url": url,
            "prompt": prompt,
            "source_type": source_type,
            "scrape_engine": engine,
            "healed_selector": None,
            "snapshot": preloaded_snapshot,
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

        await _persist_alert(result, collector_id, source_type)
        print(f"[Pipeline] Job {job_id} finished successfully.")
    except Exception as bg_err:
        print(f"[Pipeline ERROR for job {job_id}]: {bg_err}")
        traceback.print_exc()
        try:
            await StorageClient.update_job_progress(
                job_id=job_id,
                collector_id=collector_id,
                url=url,
                status="failed",
                progress=0,
                current_step=f"Analysis failed: {str(bg_err)[:80]}",
            )
        except Exception:
            pass


async def _persist_alert(result: dict, collector_id: str, source_type: str):
    """Persist alert + sources if a WARNING/CRITICAL policy change was detected."""
    if result.get("alert") and result.get("severity") in ("WARNING", "CRITICAL"):
        alert_id = await StorageClient.save_alert(
            collector_id=collector_id,
            severity=result.get("severity"),
            message=result.get("alert"),
            draft_script=result.get("draft_script"),
            category=source_type,
            position_a=result.get("position_a"),
            position_b=result.get("position_b"),
        )
        if alert_id and result.get("sources"):
            await StorageClient.save_sources(alert_id, result["sources"])


# ── Core Endpoints ──────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "agent": "spider-sense",
        "version": "0.4.0",
        "engines": ["inhouse_playwright", "brightdata_cloud"],
    }


@app.post("/watch")
async def watch_url(req: WatchRequest):
    """
    Uniform entrypoint for monitoring/scraping a target URL.
    - Checks cache tiers (DB & Marketplace).
    - Always returns an immediate response with a unique job_id.
    - Dispatches execution to the unified async pipeline.
    """
    url = req.url.strip()
    CACHE_MAX_AGE_DAYS = 7

    # Tier 1: Local DB Cache
    if not req.force_fresh:
        snapshots_resp = await StorageClient.get_from_nextjs(f"snapshots?url={url}")
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
                        "message": f"Served from DB cache ({age_days}d old). No scrape needed.",
                    }

    # Tier 2: Bright Data Marketplace Cache (if not forcing fresh)
    if not req.force_fresh:
        marketplace_data = await asyncio.to_thread(check_dataset_marketplace, url)
        if marketplace_data:
            text = marketplace_data.get("text") or json.dumps(marketplace_data)
            collector_id = (await StorageClient.get_collector_by_url(url)) or f"c_mkt_{uuid.uuid4().hex[:8]}"
            await StorageClient.save_snapshot(collector_id, url, text, marketplace_data)
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
    collector_id = await StorageClient.get_collector_by_url(url)
    if not collector_id:
        collector_id = f"c_{uuid.uuid4().hex[:12]}"
        await StorageClient.save_collector(collector_id, clean_name, url, req.source_type, engine=req.engine)
    else:
        await StorageClient.save_collector(collector_id, clean_name, url, req.source_type, engine=req.engine)

    # Launch uniform background execution task
    asyncio.create_task(run_unified_pipeline(
        job_id=job_id,
        collector_id=collector_id,
        url=url,
        source_type=req.source_type,
        prompt=req.prompt,
        engine=req.engine,
    ))

    return {
        "success": True,
        "job_id": job_id,
        "collector_id": collector_id,
        "status": "processing",
        "message": f"Watcher '{clean_name}' active. Analysis running asynchronously.",
    }


@app.post("/scraper/create")
async def create_scraper(req: ScraperCreateRequest):
    """
    Registers a new scraper collector.
    - If engine is 'inhouse' or 'auto': creates immediately without CLI overhead.
    - If engine is 'brightdata': provisions via Bright Data CLI.
    """
    cached_id = await StorageClient.get_collector_by_url(req.url)
    if cached_id:
        return {
            "success": True,
            "collector_id": cached_id,
            "cached": True,
            "message": "Returned existing collector — no rebuild needed.",
        }

    clean_name = req.name or (req.url.split("/")[2] if "/" in req.url else req.url)

    # In-House Scraper provision (Primary)
    if req.engine != "brightdata":
        collector_id = f"c_inhouse_{uuid.uuid4().hex[:10]}"
        await StorageClient.save_collector(collector_id, clean_name, req.url, req.source_type, engine="inhouse")
        return {
            "success": True,
            "collector_id": collector_id,
            "cached": False,
            "engine": "inhouse",
            "message": f"In-House AI collector initialized for {req.url}.",
        }

    # Bright Data Cloud Scraper provision (Only if explicitly requested)
    try:
        output = await asyncio.to_thread(
            run_bdata_cli,
            ["scraper", "create", req.url, req.prompt],
            900,
        )
        match = re.search(r"c_[a-z0-9]+", output)
        collector_id = match.group(0) if match else None

        if not collector_id:
            collector_id = os.getenv("DEFAULT_COLLECTOR_ID", f"c_bd_{uuid.uuid4().hex[:8]}")

        await StorageClient.save_collector(collector_id, clean_name, req.url, req.source_type, engine="brightdata")

        return {
            "success": True,
            "collector_id": collector_id,
            "cached": False,
            "engine": "brightdata",
            "output": output,
        }
    except Exception as e:
        print(f"[/scraper/create CLI error, fallback to inhouse]: {e}")
        collector_id = f"c_inhouse_{uuid.uuid4().hex[:10]}"
        await StorageClient.save_collector(collector_id, clean_name, req.url, req.source_type, engine="inhouse")
        return {
            "success": True,
            "collector_id": collector_id,
            "cached": False,
            "engine": "inhouse",
            "message": "Provisioned in-house collector after cloud builder fallback.",
        }


@app.post("/run")
async def run_agent(req: ScraperRunRequest):
    """Triggers the full autonomous LangGraph pipeline asynchronously."""
    url = req.url.strip()
    job_id = f"job_{uuid.uuid4().hex[:10]}"

    # Launch background task
    asyncio.create_task(run_unified_pipeline(
        job_id=job_id,
        collector_id=req.collector_id,
        url=url,
        source_type=req.source_type,
        prompt=req.prompt,
        engine=req.engine,
    ))

    return {
        "success": True,
        "job_id": job_id,
        "collector_id": req.collector_id,
        "status": "processing",
        "message": "Pipeline started asynchronously.",
    }


@app.post("/scraper/heal")
async def heal_scraper(req: ScraperHealRequest):
    """Fix a broken collector using In-House AI self-healing or Bright Data CLI repair."""
    try:
        if req.engine in ("inhouse", "auto") or req.collector_id.startswith("c_inhouse"):
            heal_res = await InHouseScraper.heal(
                url=req.url,
                issue_description=req.issue_description,
            )
            await StorageClient.save_heal_event(
                collector_id=req.collector_id,
                description=req.issue_description,
                heal_type="extraction",
                resolution=heal_res.get("resolution") or "Synthesized new AI CSS selector",
                attempts=1,
            )
            return {"success": True, "engine": "inhouse", "output": heal_res}
        else:
            args = ["scraper", "heal", req.collector_id, req.issue_description, "--url", req.url]
            if req.auto_approve:
                args.append("--auto-approve")

            output = await asyncio.to_thread(run_bdata_cli, args, 300)
            if not req.auto_approve:
                approve_out = await asyncio.to_thread(
                    run_bdata_cli, ["scraper", "approve", req.collector_id, "--url", req.url], 60
                )
                output += f"\n{approve_out}"

            await StorageClient.save_heal_event(
                collector_id=req.collector_id,
                description=req.issue_description,
                attempts=1,
            )
            return {"success": True, "engine": "brightdata", "output": output}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Self-heal failed: {str(e)}")


@app.post("/scraper/probe")
async def probe_endpoint(req: ProbeRequest):
    """
    Lightweight 2-tier change-detection probe:
    - Tier 1: ETag/Last-Modified HTTP header inspection (<5ms)
    - Tier 2: Static DOM SHA-256 hash comparison (<50ms)
    Determines if target page has mutated before launching headless browser.
    """
    # If collector_id was passed and metadata not explicitly given, populate from DB
    last_etag = req.last_etag
    last_hash = req.last_content_hash
    selector = req.target_selector

    if req.collector_id and (not last_etag or not last_hash or not selector):
        try:
            coll = await StorageClient.get_collector(req.collector_id)
            if coll:
                last_etag = last_etag or coll.get("lastEtag")
                last_hash = last_hash or coll.get("lastContentHash")
                selector = selector or coll.get("targetSelector")
        except Exception:
            pass

    probe_res = await ChangeProber.probe(
        url=req.url,
        last_etag=last_etag,
        last_modified=req.last_modified,
        last_content_hash=last_hash,
        target_selector=selector,
    )

    # If new hash or etag discovered, optionally update DB for that collector
    if req.collector_id and probe_res.get("content_hash"):
        try:
            await StorageClient.update_collector_metadata(
                collector_id=req.collector_id,
                last_etag=probe_res.get("etag"),
                last_content_hash=probe_res.get("content_hash"),
            )
        except Exception:
            pass

    return {
        "success": True,
        "data": probe_res,
    }


@app.post("/search/unified-position")
async def search_unified_position(req: KeywordSearchRequest):
    """Keyword -> Multi-source search -> Gemini synthesizes unified positions."""
    results = await asyncio.to_thread(search_google, req.keyword, 5)
    reddit_results = await asyncio.to_thread(search_reddit, req.keyword, 5)
    all_sources = results + reddit_results

    sources_context = "\n".join(
        [f"- [{s.get('source_type', 'web').upper()}] {s.get('title', 'Link')}: {s.get('snippet', '')} ({s.get('url', '')})" for s in all_sources[:6]]
    )

    prompt = f"""You are Spider-Sense Research Synthesizer.
Keyword: "{req.keyword}"

Sources found:
{sources_context}

Generate:
1. POSITION_A: Mainstream consensus or primary risk view (2-3 sentences).
2. POSITION_B: Alternative perspective, counter-arguments, or mitigation view (2-3 sentences).
3. SUMMARY: A single unified summary (1 sentence).

Format exactly:
POSITION_A: <text>
POSITION_B: <text>
SUMMARY: <text>"""

    content = await asyncio.to_thread(ask_gemini, prompt)

    def extract(label: str, next_labels: list = []) -> str:
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

    position_a = extract("POSITION_A", ["POSITION_B", "SUMMARY"])
    position_b = extract("POSITION_B", ["SUMMARY"])
    summary = extract("SUMMARY")

    await StorageClient.save_civic_notice(
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
    return await StorageClient.get_snapshots(collector_id)


# ── Webhook Handler ─────────────────────────────────────────────────────

async def _process_webhook_payload(raw_bytes: bytes, query_params: dict):
    """Background task: Parse Bright Data webhook body and dispatch into unified pipeline."""
    try:
        if raw_bytes.startswith(b'\x1f\x8b'):
            try:
                raw_bytes = gzip.decompress(raw_bytes)
            except Exception as gz_err:
                print(f"[BrightData Webhook] Gzip decompress error: {gz_err}")

        body = json.loads(raw_bytes.decode("utf-8", errors="replace"))
        first_item = body[0] if isinstance(body, list) and len(body) > 0 else (body if isinstance(body, dict) else {})
        meta_dict = body if isinstance(body, dict) else {}

        collector_id = (
            query_params.get("collector_id")
            or meta_dict.get("collector_id")
            or meta_dict.get("collector")
            or meta_dict.get("id")
            or first_item.get("collector_id")
            or "c_webhook"
        )
        url = (
            query_params.get("url")
            or meta_dict.get("url")
            or first_item.get("url")
            or ""
        )
        job_id = query_params.get("job_id") or meta_dict.get("job_id") or f"job_{uuid.uuid4().hex[:10]}"
        snapshot_data = meta_dict.get("data") or meta_dict.get("snapshot") or body

        # Trigger analysis pipeline with delivered snapshot
        await run_unified_pipeline(
            job_id=job_id,
            collector_id=collector_id,
            url=url,
            engine="brightdata",
            preloaded_snapshot=snapshot_data if isinstance(snapshot_data, dict) else {"raw": snapshot_data},
        )
    except Exception as e:
        print(f"[BrightData Webhook Background Error]: {e}")


@app.post("/webhooks/brightdata")
async def brightdata_webhook(request: Request):
    """
    Returns HTTP 200 OK immediately (< 50ms) to Bright Data,
    then processes snapshot storage, telemetry, and graph execution in background.
    """
    raw_bytes = await request.body()
    query_params = dict(request.query_params)
    asyncio.create_task(_process_webhook_payload(raw_bytes, query_params))
    return {"success": True, "message": "Webhook payload received and queued for processing"}

import os
import httpx
from dotenv import load_dotenv

load_dotenv()

NEXT_API_BASE = os.getenv("NEXT_API_URL", "http://localhost:3000/api")


def post_to_nextjs(endpoint: str, payload: dict) -> dict:
    """POST payload to a Next.js API endpoint and return the response JSON."""
    try:
        url = f"{NEXT_API_BASE}/{endpoint.lstrip('/')}"
        res = httpx.post(url, json=payload, timeout=10.0)
        return res.json()
    except Exception as e:
        print(f"[Storage Error] Failed to post to {endpoint}: {e}")
        return {"success": False, "error": str(e)}


def get_from_nextjs(endpoint: str, params: dict = {}) -> dict:
    """GET from a Next.js API endpoint and return the response JSON."""
    try:
        url = f"{NEXT_API_BASE}/{endpoint.lstrip('/')}"
        res = httpx.get(url, params=params, timeout=10.0)
        return res.json()
    except Exception as e:
        print(f"[Storage Error] Failed to get from {endpoint}: {e}")
        return {"success": False, "error": str(e)}



def get_collector_by_url(url: str) -> str | None:
    result = get_from_nextjs("collectors", {"url": url})
    if result.get("success") and result.get("found"):
        return result["data"]["collector_id"]
    return None


def save_collector(collector_id: str, name: str, url: str, source_type: str) -> bool:
    """Persist collector ID to the PostgreSQL registry AND sync display name to Bright Data dashboard."""
    try:
        from brightdata_client import update_brightdata_collector_name
        update_brightdata_collector_name(collector_id, name)
    except Exception:
        pass

    result = post_to_nextjs("collectors", {
        "collector_id": collector_id,
        "name": name,
        "url": url,
        "source_type": source_type,
    })
    return result.get("success", False)


  

def save_snapshot(collector_id: str, url: str, text: str, raw: dict) -> bool:
    """Clean raw HTML to structured JSON sections, deduplicate, and persist to PostgreSQL."""
    try:
        from brightdata_client import clean_and_chunk_snapshot
        structured = clean_and_chunk_snapshot(raw or text)
        clean_text = structured.get("clean_text") or text
        sections_data = structured.get("sections") or {}

          
        existing = get_from_nextjs(f"snapshots?collector_id={collector_id}")
        existing_list = existing.get("data") or []
        if existing_list:
            latest_text = existing_list[0].get("text") or ""
            if latest_text.strip() == clean_text.strip():
                print(f"[save_snapshot] Deduplication hit for {collector_id}: text identical to latest snapshot, skipping duplicate DB insert.")
                return True

          
        result = post_to_nextjs("snapshots", {
            "collector_id": collector_id,
            "url": url,
            "text": clean_text,
            "raw": {"sections": sections_data, "title": structured.get("title")},
        })
        return result.get("success", False)
    except Exception as e:
        print(f"[save_snapshot] Exception: {e}")
        return False


def get_snapshots(collector_id: str, limit: int = 1) -> list:
    """Fetch the most recent snapshots for a collector. Returns a list of snapshot dicts."""
    result = get_from_nextjs(f"snapshots", {"collector_id": collector_id, "limit": limit})
    return result.get("data") or []


  

async def save_alert(
    collector_id: str,
    severity: str,
    message: str,
    draft_script: str = None,
    category: str = "general",
    position_a: str = None,
    position_b: str = None,
) -> int | None:
    """Save alert and return the new alert_id for linking sources."""
    result = post_to_nextjs("alerts", {
        "collector_id": collector_id,
        "severity": severity,
        "message": message,
        "draft_script": draft_script,
        "category": category,
        "position_a": position_a,
        "position_b": position_b,
    })
    if result.get("success") and result.get("data"):
        return result["data"].get("id")
    return None


  

async def save_sources(alert_id: int, sources_list: list[dict]) -> bool:
    """Save a batch of research articles / Reddit posts linked to an alert."""
    result = post_to_nextjs("sources", {
        "alert_id": alert_id,
        "sources": sources_list,
    })
    return result.get("success", False)


  

async def save_heal_event(
    collector_id: str,
    description: str,
    heal_type: str = "extraction",     
    resolution: str = None,            
    attempts: int = 1,
    duration_ms: int = None,           
    succeeded: bool = True,
) -> bool:
    result = post_to_nextjs("heals", {
        "collector_id": collector_id,
        "description": description,
        "heal_type": heal_type,
        "resolution": resolution,
        "attempts": attempts,
        "duration_ms": duration_ms,
        "succeeded": succeeded,
    })
    return result.get("success", False)


  

async def save_civic_notice(
    title: str,
    category: str,
    summary: str,
    scheme_name: str = None,
    source_url: str = None,
    effective_date: str = None,
) -> bool:
    result = post_to_nextjs("civic-notices", {
        "title": title,
        "scheme_name": scheme_name,
        "category": category,
        "summary": summary,
        "source_url": source_url,
        "effective_date": effective_date,
    })
    return result.get("success", False)


  

def update_job_progress(
    job_id: str,
    status: str,
    progress: int,
    current_step: str,
    bytes_scraped: int = 0,
    items_scraped: int = 0,
    collector_id: str = None,
    url: str = None,
) -> bool:
    """Post real-time telemetry update for an active scraper job."""
    result = post_to_nextjs("jobs", {
        "jobId": job_id,
        "collectorId": collector_id,
        "url": url,
        "status": status,
        "progress": progress,
        "currentStep": current_step,
        "bytesScraped": bytes_scraped,
        "itemsScraped": items_scraped,
    })
    return result.get("success", False)


  

def save_notification(
    title: str,
    message: str,
    type: str = "info",
    collector_id: str = None,
    user_id: int = None,
) -> bool:
    """Persist notification to DB so user sees it in app upon login/return."""
    result = post_to_nextjs("notifications", {
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": type,
        "collector_id": collector_id,
    })
    return result.get("success", False)


def dispatch_external_notification(
    title: str,
    message: str,
    category: str = "general",
    channel_type: str = "all",
) -> dict:
    """
    Modular stub for multi-channel dispatch (Telegram, Discord, WhatsApp).
    Will be populated when webhook credentials / API keys are added.
    """
    print(f"[Channel Dispatch Stub] [{channel_type.upper()}] {title}: {message}")
      
    return {"dispatched": True, "channels": ["in_app"], "stub": True}


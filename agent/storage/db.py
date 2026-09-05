import os
import httpx
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv
from brightdata_client import update_brightdata_collector_name, clean_and_chunk_snapshot

load_dotenv()


class StorageClient:
    NEXT_API_BASE = os.getenv("NEXT_API_URL", "http://localhost:3000/api")

    @classmethod
    async def post_to_nextjs(cls, endpoint: str, payload: dict) -> dict:
        try:
            url = f"{cls.NEXT_API_BASE}/{endpoint.lstrip('/')}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload)
                return res.json()
        except Exception as e:
            print(f"[Storage Error] Failed to post to {endpoint}: {e}")
            return {"success": False, "error": str(e)}

    @classmethod
    async def get_from_nextjs(cls, endpoint: str, params: dict = {}) -> dict:
        try:
            url = f"{cls.NEXT_API_BASE}/{endpoint.lstrip('/')}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, params=params)
                return res.json()
        except Exception as e:
            print(f"[Storage Error] Failed to get from {endpoint}: {e}")
            return {"success": False, "error": str(e)}

    @classmethod
    async def patch_to_nextjs(cls, endpoint: str, payload: dict) -> dict:
        try:
            url = f"{cls.NEXT_API_BASE}/{endpoint.lstrip('/')}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.patch(url, json=payload)
                return res.json()
        except Exception as e:
            print(f"[Storage Error] Failed to patch {endpoint}: {e}")
            return {"success": False, "error": str(e)}

    @classmethod
    async def get_collector_by_url(cls, url: str) -> Optional[str]:
        result = await cls.get_from_nextjs("collectors", {"url": url})
        if result.get("success") and result.get("found"):
            return result["data"]["collector_id"]
        return None

    @classmethod
    async def get_collector(cls, collector_id: str) -> Optional[dict]:
        result = await cls.get_from_nextjs(f"collectors/{collector_id}")
        if result.get("success") and result.get("data"):
            return result["data"]
        return None

    @classmethod
    async def save_collector(
        cls,
        collector_id: str,
        name: str,
        url: str,
        source_type: str,
        engine: str = "inhouse",
        target_selector: Optional[str] = None,
        last_etag: Optional[str] = None,
        last_content_hash: Optional[str] = None,
    ) -> bool:
        try:
            update_brightdata_collector_name(collector_id, name)
        except Exception:
            pass

        payload = {
            "collector_id": collector_id,
            "name": name,
            "url": url,
            "source_type": source_type,
            "engine": engine,
        }
        if target_selector is not None:
            payload["target_selector"] = target_selector
        if last_etag is not None:
            payload["last_etag"] = last_etag
        if last_content_hash is not None:
            payload["last_content_hash"] = last_content_hash

        result = await cls.post_to_nextjs("collectors", payload)
        return result.get("success", False)

    @classmethod
    async def update_collector_metadata(
        cls,
        collector_id: str,
        target_selector: Optional[str] = None,
        last_etag: Optional[str] = None,
        last_content_hash: Optional[str] = None,
    ) -> bool:
        payload = {}
        if target_selector is not None:
            payload["target_selector"] = target_selector
        if last_etag is not None:
            payload["last_etag"] = last_etag
        if last_content_hash is not None:
            payload["last_content_hash"] = last_content_hash

        result = await cls.patch_to_nextjs(f"collectors/{collector_id}", payload)
        return result.get("success", False)

    @classmethod
    async def save_snapshot(cls, collector_id: str, url: str, text: str, raw: dict) -> bool:
        try:
            structured = clean_and_chunk_snapshot(raw or text)
            clean_text = structured.get("clean_text") or text
            sections_data = structured.get("sections") or {}

            existing = await cls.get_from_nextjs(f"snapshots?collector_id={collector_id}")
            existing_list = existing.get("data") or []
            if existing_list:
                latest_text = existing_list[0].get("text") or ""
                if latest_text.strip() == clean_text.strip():
                    print(f"[save_snapshot] Deduplication hit for {collector_id}: text identical to latest snapshot.")
                    return True

            result = await cls.post_to_nextjs("snapshots", {
                "collector_id": collector_id,
                "url": url,
                "text": clean_text,
                "raw": {"sections": sections_data, "title": structured.get("title")},
            })
            return result.get("success", False)
        except Exception as e:
            print(f"[save_snapshot] Exception: {e}")
            return False

    @classmethod
    async def get_snapshots(cls, collector_id: str, limit: int = 1) -> list:
        result = await cls.get_from_nextjs("snapshots", {"collector_id": collector_id, "limit": limit})
        return result.get("data") or []

    @classmethod
    async def save_alert(
        cls,
        collector_id: str,
        severity: str,
        message: str,
        draft_script: Optional[str] = None,
        category: str = "general",
        position_a: Optional[str] = None,
        position_b: Optional[str] = None,
    ) -> Optional[int]:
        result = await cls.post_to_nextjs("alerts", {
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

    @classmethod
    async def save_sources(cls, alert_id: int, sources_list: list[dict]) -> bool:
        result = await cls.post_to_nextjs("sources", {
            "alert_id": alert_id,
            "sources": sources_list,
        })
        return result.get("success", False)

    @classmethod
    async def save_heal_event(
        cls,
        collector_id: str,
        description: str,
        heal_type: str = "extraction",
        resolution: Optional[str] = None,
        attempts: int = 1,
        duration_ms: Optional[int] = None,
        succeeded: bool = True,
    ) -> bool:
        result = await cls.post_to_nextjs("heals", {
            "collector_id": collector_id,
            "description": description,
            "heal_type": heal_type,
            "resolution": resolution,
            "attempts": attempts,
            "duration_ms": duration_ms,
            "succeeded": succeeded,
        })
        return result.get("success", False)

    @classmethod
    async def save_civic_notice(
        cls,
        title: str,
        category: str,
        summary: str,
        scheme_name: Optional[str] = None,
        source_url: Optional[str] = None,
        effective_date: Optional[str] = None,
    ) -> bool:
        result = await cls.post_to_nextjs("civic-notices", {
            "title": title,
            "scheme_name": scheme_name,
            "category": category,
            "summary": summary,
            "source_url": source_url,
            "effective_date": effective_date,
        })
        return result.get("success", False)

    @classmethod
    async def update_job_progress(
        cls,
        job_id: str,
        status: str,
        progress: int,
        current_step: str,
        bytes_scraped: int = 0,
        items_scraped: int = 0,
        collector_id: Optional[str] = None,
        url: Optional[str] = None,
    ) -> bool:
        result = await cls.post_to_nextjs("jobs", {
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

    @classmethod
    async def save_notification(
        cls,
        title: str,
        message: str,
        type: str = "info",
        collector_id: Optional[str] = None,
        user_id: Optional[int] = None,
    ) -> bool:
        result = await cls.post_to_nextjs("notifications", {
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": type,
            "collector_id": collector_id,
        })
        return result.get("success", False)

    @classmethod
    def dispatch_external_notification(
        cls,
        title: str,
        message: str,
        category: str = "general",
        channel_type: str = "all",
    ) -> dict:
        print(f"[Channel Dispatch Stub] [{channel_type.upper()}] {title}: {message}")
        return {"dispatched": True, "channels": ["in_app"], "stub": True}

"""
Bright Data Cloud Scraper Adapter for Spider-Sense.
Wraps Bright Data Python SDK & DCA REST API into standard ScrapedSnapshot format.
"""
import os
import json
import asyncio
from typing import Optional, Dict, Any

from .engine import ScrapedSnapshot
from brightdata_client import run_collector, clean_and_chunk_snapshot, check_dataset_marketplace
from storage.db import StorageClient

class BrightDataScraper:
    @classmethod
    async def scrape(
        cls,
        url: str,
        collector_id: Optional[str] = None,
        prompt: Optional[str] = None,
        job_id: Optional[str] = None,
    ) -> ScrapedSnapshot:
        """
        Execute scrape via Bright Data cloud collector / DCA API.
        """
        

        if not collector_id:
            collector_id = os.getenv("DEFAULT_COLLECTOR_ID", "c_mt4gjw4y2gom7o80b7")

        if job_id:
            try:
                StorageClient.update_job_progress(
                    job_id=job_id,
                    collector_id=collector_id,
                    url=url,
                    status="scraping",
                    progress=25,
                    current_step=f"Bright Data Scraper: Triggering collector '{collector_id}'",
                )
            except Exception:
                pass
        marketplace_data = await asyncio.to_thread(check_dataset_marketplace, url)
        if marketplace_data:
            text = marketplace_data.get("text") or json.dumps(marketplace_data)
            structured = clean_and_chunk_snapshot(marketplace_data)
            bytes_scraped = len(text.encode("utf-8"))
            return {
                "url": url,
                "title": structured.get("title") or "Bright Data Marketplace Dataset",
                "raw_text": text,
                "sections": structured.get("sections") or {"Data": text[:3000]},
                "linked_docs": [],
                "source": "brightdata_marketplace",
                "bytes_scraped": bytes_scraped,
                "pages_visited": 1,
                "metadata": {"collector_id": collector_id, "marketplace": True},
            }

        print(f"[BrightDataScraper] Running collector '{collector_id}' for URL: {url}")
        raw_result = await asyncio.to_thread(run_collector, collector_id, url)
        if not raw_result:
            raise RuntimeError(f"Bright Data scrape returned empty for collector '{collector_id}'")

        text_rep = json.dumps(raw_result) if isinstance(raw_result, (dict, list)) else str(raw_result)
        structured = clean_and_chunk_snapshot(raw_result)
        clean_text = structured.get("clean_text") or text_rep
        sections = structured.get("sections") or {"Main Content": clean_text[:4000]}
        bytes_scraped = len(text_rep.encode("utf-8"))

        return {
            "url": url,
            "title": structured.get("title") or "Bright Data Snapshot",
            "raw_text": clean_text,
            "sections": sections,
            "linked_docs": [],
            "source": "brightdata_collector",
            "bytes_scraped": bytes_scraped,
            "pages_visited": 1,
            "metadata": {
                "collector_id": collector_id,
                "raw_items_count": len(raw_result) if isinstance(raw_result, list) else 1,
            },
        }

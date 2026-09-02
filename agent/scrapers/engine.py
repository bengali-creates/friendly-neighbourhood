from typing import TypedDict, Optional, List, Dict, Any
import os
import json
from .inhouse import InHouseScraper
from .brightdata import BrightDataScraper

class ScrapedSnapshot(TypedDict, total=False):
    url: str
    title: str
    raw_text: str
    sections: Dict[str, str]
    linked_docs: List[Dict[str, Any]]
    source: str
    bytes_scraped: int
    pages_visited: int
    metadata: Dict[str, Any]


class ScraperEngine:
    @staticmethod
    async def scrape(
        url: str,
        collector_id: Optional[str] = None,
        prompt: Optional[str] = None,
        engine: str = "auto",
        job_id: Optional[str] = None,
        max_link_depth: int = 2,
    ) -> ScrapedSnapshot:

        configured_default = os.getenv("DEFAULT_SCRAPER_ENGINE", "inhouse").lower()
        active_engine = engine.lower() if engine and engine != "auto" else configured_default

        print(f"[ScraperEngine] Starting scrape for '{url}' with target engine='{active_engine}' (job_id={job_id})")

        if active_engine == "inhouse":
            try:
                result = await InHouseScraper.scrape(
                    url=url,
                    prompt=prompt,
                    job_id=job_id,
                    collector_id=collector_id,
                    max_link_depth=max_link_depth,
                )
                if result and result.get("raw_text"):
                    return result
                print("[ScraperEngine] In-house returned empty/invalid data. Attempting Bright Data fallback...")
            except Exception as inhouse_err:
                print(f"[ScraperEngine] In-house scraper error: {inhouse_err}. Falling back to Bright Data...")
            if collector_id or os.getenv("BRIGHTDATA_API_TOKEN"):
                return await BrightDataScraper.scrape(
                    url=url,
                    collector_id=collector_id,
                    prompt=prompt,
                    job_id=job_id,
                )
        elif active_engine == "brightdata":
            try:
                result = await BrightDataScraper.scrape(
                    url=url,
                    collector_id=collector_id,
                    prompt=prompt,
                    job_id=job_id,
                )
                if result and result.get("raw_text"):
                    return result
                print("[ScraperEngine] Bright Data returned empty. Attempting In-house fallback...")
            except Exception as bd_err:
                print(f"[ScraperEngine] Bright Data error: {bd_err}. Falling back to In-house...")

            return await InHouseScraper.scrape(
                url=url,
                prompt=prompt,
                job_id=job_id,
                collector_id=collector_id,
                max_link_depth=max_link_depth,
            )

        return await InHouseScraper.scrape(
            url=url,
            prompt=prompt,
            job_id=job_id,
            collector_id=collector_id,
            max_link_depth=max_link_depth,
        )

import os
import json
from typing import Optional
from .types import ScrapedSnapshot
from .inhouse import InHouseScraper
from .brightdata import BrightDataScraper


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

        # Default to inhouse scraper as the primary engine
        configured_default = os.getenv("DEFAULT_SCRAPER_ENGINE", "inhouse").lower()
        active_engine = engine.lower() if engine and engine != "auto" else configured_default

        print(f"[ScraperEngine] Starting scrape for '{url}' with primary engine='{active_engine}' (job_id={job_id})")

        # Primary Engine Execution: In-House Playwright + AI semantic parsing
        if active_engine != "brightdata":
            try:
                result = await InHouseScraper.scrape(
                    url=url,
                    prompt=prompt,
                    job_id=job_id,
                    collector_id=collector_id,
                    max_link_depth=max_link_depth,
                )
                if result and result.get("raw_text") and len(result.get("raw_text", "").strip()) > 50:
                    return result
                print("[ScraperEngine] In-house returned low-content data.")
            except Exception as inhouse_err:
                print(f"[ScraperEngine] In-house scraper error: {inhouse_err}")

            # Optional fallback to Bright Data only if configured and token is present
            if os.getenv("ENABLE_BRIGHTDATA_FALLBACK", "false").lower() == "true" and (collector_id or os.getenv("BRIGHTDATA_API_TOKEN")):
                try:
                    print("[ScraperEngine] Attempting secondary fallback via Bright Data cloud...")
                    return await BrightDataScraper.scrape(
                        url=url,
                        collector_id=collector_id,
                        prompt=prompt,
                        job_id=job_id,
                    )
                except Exception as bd_fallback_err:
                    print(f"[ScraperEngine] Bright Data fallback error: {bd_fallback_err}")

        # Explicit Bright Data Engine requested by caller
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

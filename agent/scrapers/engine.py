import os
import json
import random
import asyncio
from typing import Optional, Dict, Any, Tuple
from .types import ScrapedSnapshot
from .inhouse import InHouseScraper
from .brightdata import BrightDataScraper
from .quality import ScrapeQualityScorer, ScrapeQualityResult
from storage.db import StorageClient


class ScraperEngine:
    @classmethod
    async def scrape(
        cls,
        url: str,
        collector_id: Optional[str] = None,
        prompt: Optional[str] = None,
        engine: str = "auto",
        job_id: Optional[str] = None,
        max_link_depth: int = 2,
        max_retries: int = 3,
        base_delay: float = 1.0,
    ) -> ScrapedSnapshot:
        """
        Executes web scraping with exponential backoff retry, content quality verification,
        and automatic engine escalation (InHouse <-> Bright Data).
        """
        configured_default = os.getenv("DEFAULT_SCRAPER_ENGINE", "inhouse").lower()
        active_engine = engine.lower() if engine and engine != "auto" else configured_default

        print(f"[ScraperEngine] Starting scrape for '{url}' with engine='{active_engine}' (job_id={job_id})")

        primary_result: Optional[ScrapedSnapshot] = None
        primary_quality: Optional[ScrapeQualityResult] = None

        # 1. Primary Engine Execution with Exponential Backoff
        if active_engine != "brightdata":
            primary_result, primary_quality = await cls._execute_with_retry(
                scrape_coro_fn=lambda: InHouseScraper.scrape(
                    url=url,
                    prompt=prompt,
                    job_id=job_id,
                    collector_id=collector_id,
                    max_link_depth=max_link_depth,
                ),
                engine_name="In-House",
                url=url,
                collector_id=collector_id,
                job_id=job_id,
                max_retries=max_retries,
                base_delay=base_delay,
            )

            if primary_result and primary_quality and primary_quality.passed:
                return primary_result

            # 2. Engine Escalation to Bright Data if In-House failed
            fallback_enabled = os.getenv("ENABLE_BRIGHTDATA_FALLBACK", "false").lower() == "true"
            has_bd_auth = bool(collector_id or os.getenv("BRIGHTDATA_API_TOKEN"))

            if fallback_enabled and has_bd_auth:
                print(f"[ScraperEngine] In-House scrape failed or blocked ({primary_quality.reason if primary_quality else 'Error'}). Escalating to Bright Data...")
                if job_id:
                    try:
                        await StorageClient.update_job_progress(
                            job_id=job_id,
                            collector_id=collector_id,
                            url=url,
                            status="scraping",
                            progress=35,
                            current_step="Escalating engine: In-House encountered block/empty content. Switching to Bright Data Cloud...",
                        )
                    except Exception:
                        pass

                bd_result, bd_quality = await cls._execute_with_retry(
                    scrape_coro_fn=lambda: BrightDataScraper.scrape(
                        url=url,
                        collector_id=collector_id,
                        prompt=prompt,
                        job_id=job_id,
                    ),
                    engine_name="Bright Data",
                    url=url,
                    collector_id=collector_id,
                    job_id=job_id,
                    max_retries=2,
                    base_delay=1.5,
                )

                if bd_result and (not bd_quality or bd_quality.passed):
                    bd_result.setdefault("metadata", {})["escalated_from"] = "inhouse"
                    return bd_result

        # Explicit Bright Data Engine requested by caller
        elif active_engine == "brightdata":
            primary_result, primary_quality = await cls._execute_with_retry(
                scrape_coro_fn=lambda: BrightDataScraper.scrape(
                    url=url,
                    collector_id=collector_id,
                    prompt=prompt,
                    job_id=job_id,
                ),
                engine_name="Bright Data",
                url=url,
                collector_id=collector_id,
                job_id=job_id,
                max_retries=max_retries,
                base_delay=base_delay,
            )

            if primary_result and primary_quality and primary_quality.passed:
                return primary_result

            # Fallback to In-House if Bright Data fails
            print(f"[ScraperEngine] Bright Data scrape failed. Falling back to In-House engine...")
            if job_id:
                try:
                    await StorageClient.update_job_progress(
                        job_id=job_id,
                        collector_id=collector_id,
                        url=url,
                        status="scraping",
                        progress=35,
                        current_step="Escalating engine: Bright Data failed. Falling back to In-House browser...",
                    )
                except Exception:
                    pass

            ih_result, ih_quality = await cls._execute_with_retry(
                scrape_coro_fn=lambda: InHouseScraper.scrape(
                    url=url,
                    prompt=prompt,
                    job_id=job_id,
                    collector_id=collector_id,
                    max_link_depth=max_link_depth,
                ),
                engine_name="In-House",
                url=url,
                collector_id=collector_id,
                job_id=job_id,
                max_retries=2,
                base_delay=1.0,
            )

            if ih_result:
                ih_result.setdefault("metadata", {})["escalated_from"] = "brightdata"
                return ih_result

        # Return best-effort result even if below threshold, so validation & healing can handle it
        if primary_result:
            return primary_result

        # Final fallback snapshot if nothing could be extracted
        return {
            "url": url,
            "title": "Extraction Failed",
            "raw_text": "",
            "sections": {},
            "linked_docs": [],
            "source": active_engine,
            "bytes_scraped": 0,
            "pages_visited": 0,
            "metadata": {
                "error": primary_quality.reason if primary_quality else "All scrape retries exhausted",
                "quality_score": primary_quality.score if primary_quality else 0.0,
            },
        }

    @classmethod
    async def _execute_with_retry(
        cls,
        scrape_coro_fn,
        engine_name: str,
        url: str,
        collector_id: Optional[str] = None,
        job_id: Optional[str] = None,
        max_retries: int = 3,
        base_delay: float = 1.0,
    ) -> Tuple[Optional[ScrapedSnapshot], Optional[ScrapeQualityResult]]:
        """
        Executes a scrape coroutine with exponential backoff and jitter.
        """
        last_result: Optional[ScrapedSnapshot] = None
        last_quality: Optional[ScrapeQualityResult] = None

        for attempt in range(1, max_retries + 1):
            try:
                result = await scrape_coro_fn()
                quality = ScrapeQualityScorer.evaluate(result)
                last_result = result
                last_quality = quality

                if quality.passed:
                    if attempt > 1:
                        print(f"[ScraperEngine] {engine_name} succeeded on attempt {attempt}/{max_retries} (Quality Score: {quality.score}/100)")
                    return result, quality

                print(f"[ScraperEngine] {engine_name} attempt {attempt}/{max_retries} low quality ({quality.score}/100): {quality.reason}")

            except Exception as exc:
                print(f"[ScraperEngine] {engine_name} attempt {attempt}/{max_retries} exception: {exc}")
                last_quality = ScrapeQualityResult(
                    score=0.0,
                    passed=False,
                    is_bot_blocked=False,
                    is_error_page=False,
                    reason=f"Scrape exception: {str(exc)}",
                    issues=[str(exc)],
                )

            if attempt < max_retries:
                # Exponential backoff with random jitter (e.g. 1.0s, 2.3s, 4.5s)
                delay = base_delay * (2 ** (attempt - 1)) + random.uniform(0.1, 0.7)
                if job_id:
                    try:
                        await StorageClient.update_job_progress(
                            job_id=job_id,
                            collector_id=collector_id,
                            url=url,
                            status="scraping",
                            progress=20 + (attempt * 5),
                            current_step=f"{engine_name} attempt {attempt}/{max_retries} failed ({last_quality.reason[:40] if last_quality else 'error'}). Retrying in {delay:.1f}s...",
                        )
                    except Exception:
                        pass

                await asyncio.sleep(delay)

        return last_result, last_quality

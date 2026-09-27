import os
import json
import random
import asyncio
from typing import Optional, Dict, Any, Tuple, List
from .types import ScrapedSnapshot
from .inhouse import InHouseScraper
from .brightdata import BrightDataScraper
from .crawl4ai_engine import Crawl4AIScraper
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
        and automatic engine escalation (InHouse <-> Crawl4AI <-> Bright Data).

        Supported engine modes:
        - "auto": Lightweight In-House first, escalates to Crawl4AI on block/low-quality, then Bright Data.
        - "tournament": Runs In-House and Crawl4AI in parallel; the higher quality score wins.
        - "crawl4ai": Prioritizes Crawl4AI stealth engine with fallback to In-House.
        - "inhouse": Prioritizes In-House Playwright + Trafilatura.
        - "brightdata": Prioritizes Bright Data Cloud Collector.
        """
        configured_default = os.getenv("DEFAULT_SCRAPER_ENGINE", "auto").lower()
        active_engine = engine.lower() if engine and engine != "auto" else configured_default

        print(f"[ScraperEngine] Starting scrape for '{url}' with engine='{active_engine}' (job_id={job_id})")

        # 0. Tournament Mode: Parallel competitive execution
        if active_engine == "tournament":
            return await cls._run_tournament(
                url=url,
                collector_id=collector_id,
                prompt=prompt,
                job_id=job_id,
                max_link_depth=max_link_depth,
            )

        primary_result: Optional[ScrapedSnapshot] = None
        primary_quality: Optional[ScrapeQualityResult] = None

        # 1. Primary Engine: Crawl4AI requested explicitly
        if active_engine == "crawl4ai":
            primary_result, primary_quality = await cls._execute_with_retry(
                scrape_coro_fn=lambda: Crawl4AIScraper.scrape(
                    url=url,
                    prompt=prompt,
                    job_id=job_id,
                    collector_id=collector_id,
                    max_link_depth=max_link_depth,
                ),
                engine_name="Crawl4AI",
                url=url,
                collector_id=collector_id,
                job_id=job_id,
                max_retries=max_retries,
                base_delay=base_delay,
            )

            if primary_result and primary_quality and primary_quality.passed:
                return primary_result

            # Escalation from Crawl4AI -> In-House
            print("[ScraperEngine] Crawl4AI returned low quality. Escalating to In-House engine...")
            return await InHouseScraper.scrape(
                url=url,
                prompt=prompt,
                job_id=job_id,
                collector_id=collector_id,
                max_link_depth=max_link_depth,
            )

        # 2. Primary Engine: In-House (or "auto" default)
        if active_engine not in ("brightdata", "crawl4ai"):
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

            # Tier 1 Escalation: In-House failed/blocked -> Try Crawl4AI Stealth
            print(f"[ScraperEngine] In-House scrape low quality ({primary_quality.reason if primary_quality else 'Error'}). Escalating to Crawl4AI...")
            if job_id:
                try:
                    await StorageClient.update_job_progress(
                        job_id=job_id,
                        collector_id=collector_id,
                        url=url,
                        status="scraping",
                        progress=35,
                        current_step="Escalating: In-House encountered block/empty content. Switching to Crawl4AI Stealth...",
                    )
                except Exception:
                    pass

            c4_result, c4_quality = await cls._execute_with_retry(
                scrape_coro_fn=lambda: Crawl4AIScraper.scrape(
                    url=url,
                    prompt=prompt,
                    job_id=job_id,
                    collector_id=collector_id,
                    max_link_depth=max_link_depth,
                ),
                engine_name="Crawl4AI",
                url=url,
                collector_id=collector_id,
                job_id=job_id,
                max_retries=2,
                base_delay=1.0,
            )

            if c4_result and c4_quality and c4_quality.passed:
                c4_result.setdefault("metadata", {})["escalated_from"] = "inhouse"
                return c4_result

            # Tier 2 Escalation: Crawl4AI also blocked -> Try Bright Data Cloud
            fallback_enabled = os.getenv("ENABLE_BRIGHTDATA_FALLBACK", "false").lower() == "true"
            has_bd_auth = bool(collector_id or os.getenv("BRIGHTDATA_API_TOKEN"))

            if fallback_enabled and has_bd_auth:
                print(f"[ScraperEngine] Crawl4AI also low quality. Final escalation to Bright Data...")
                if job_id:
                    try:
                        await StorageClient.update_job_progress(
                            job_id=job_id,
                            collector_id=collector_id,
                            url=url,
                            status="scraping",
                            progress=40,
                            current_step="Escalating engine: Local scrapers blocked. Routing through Bright Data Cloud...",
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
                    bd_result.setdefault("metadata", {})["escalated_from"] = "inhouse+crawl4ai"
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
    async def _run_tournament(
        cls,
        url: str,
        collector_id: Optional[str] = None,
        prompt: Optional[str] = None,
        job_id: Optional[str] = None,
        max_link_depth: int = 2,
    ) -> ScrapedSnapshot:
        """
        Runs In-House and Crawl4AI concurrently. Evaluates both with ScrapeQualityScorer
        and returns the winner with the highest quality score.
        """
        print(f"[ScraperEngine.tournament] Launching parallel duel: In-House vs Crawl4AI for '{url}'")
        if job_id:
            try:
                await StorageClient.update_job_progress(
                    job_id=job_id,
                    collector_id=collector_id,
                    url=url,
                    status="scraping",
                    progress=25,
                    current_step="Tournament Mode: Running In-House & Crawl4AI in parallel...",
                )
            except Exception:
                pass

        ih_task = asyncio.create_task(
            InHouseScraper.scrape(
                url=url,
                prompt=prompt,
                job_id=None,  # Suppress internal duplicate progress updates
                collector_id=collector_id,
                max_link_depth=max_link_depth,
            )
        )
        c4_task = asyncio.create_task(
            Crawl4AIScraper.scrape(
                url=url,
                prompt=prompt,
                job_id=None,
                collector_id=collector_id,
                max_link_depth=max_link_depth,
            )
        )

        results = await asyncio.gather(ih_task, c4_task, return_exceptions=True)
        ih_snap: Optional[ScrapedSnapshot] = results[0] if isinstance(results[0], dict) else None
        c4_snap: Optional[ScrapedSnapshot] = results[1] if isinstance(results[1], dict) else None

        ih_quality = ScrapeQualityScorer.evaluate(ih_snap) if ih_snap else None
        c4_quality = ScrapeQualityScorer.evaluate(c4_snap) if c4_snap else None

        ih_score = ih_quality.score if ih_quality else 0.0
        c4_score = c4_quality.score if c4_quality else 0.0

        print(f"[ScraperEngine.tournament] Results -> In-House: {ih_score:.1f}/100, Crawl4AI: {c4_score:.1f}/100")

        # Pick the winner
        if c4_score > ih_score and c4_snap:
            winner_snap = c4_snap
            winner_name = "crawl4ai"
        elif ih_snap:
            winner_snap = ih_snap
            winner_name = "inhouse"
        else:
            winner_snap = c4_snap or ih_snap

        if winner_snap:
            winner_snap.setdefault("metadata", {})["tournament"] = {
                "inhouse_score": ih_score,
                "crawl4ai_score": c4_score,
                "winner": winner_name,
            }
            if job_id:
                try:
                    await StorageClient.update_job_progress(
                        job_id=job_id,
                        collector_id=collector_id,
                        url=url,
                        status="scraping",
                        progress=45,
                        current_step=f"Tournament Winner: {winner_name.upper()} ({max(ih_score, c4_score):.0f}/100)",
                    )
                except Exception:
                    pass
            return winner_snap

        # If both completely failed, return minimal fallback
        return {
            "url": url,
            "title": "Tournament Failed",
            "raw_text": "",
            "sections": {},
            "linked_docs": [],
            "source": "tournament_failed",
            "bytes_scraped": 0,
            "pages_visited": 0,
            "metadata": {"error": "Both tournament engines failed"},
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

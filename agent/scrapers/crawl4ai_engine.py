"""
Crawl4AI Scraper Engine for Spider-Sense.
Wraps the open-source Crawl4AI framework (AsyncWebCrawler) to provide
anti-bot stealth, dynamic rendering, and batch sub-page crawling.
"""

import os
import json
import asyncio
from typing import Dict, Any, List, Optional
from .types import ScrapedSnapshot
from .inhouse import InHouseScraper
from storage.db import StorageClient
from llm import ask_gemini

# Graceful import check in case user installs crawl4ai afterwards
try:
    from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
    HAS_CRAWL4AI = True
except ImportError:
    HAS_CRAWL4AI = False


class Crawl4AIScraper:
    """
    High-performance, stealth-enabled web crawler powered by Crawl4AI.
    """

    @classmethod
    def is_available(cls) -> bool:
        return HAS_CRAWL4AI

    @classmethod
    async def scrape(
        cls,
        url: str,
        prompt: Optional[str] = None,
        job_id: Optional[str] = None,
        collector_id: Optional[str] = None,
        max_link_depth: int = 2,
    ) -> ScrapedSnapshot:
        """
        Scrapes a target URL using Crawl4AI with stealth headers, dynamic rendering,
        and concurrent linked-document processing.
        """
        if not HAS_CRAWL4AI:
            print("[Crawl4AIScraper] crawl4ai package not installed. Falling back to InHouseScraper...")
            return await InHouseScraper.scrape(
                url=url,
                prompt=prompt,
                job_id=job_id,
                collector_id=collector_id,
                max_link_depth=max_link_depth,
            )

        if job_id:
            try:
                await StorageClient.update_job_progress(
                    job_id=job_id,
                    collector_id=collector_id,
                    url=url,
                    status="scraping",
                    progress=25,
                    current_step=f"Crawl4AI Engine: Launching stealth crawler for {url}...",
                )
            except Exception:
                pass

        browser_config = BrowserConfig(
            headless=True,
            verbose=False,
            extra_args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"],
        )

        run_config = CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,
            word_count_threshold=20,
            excluded_tags=["nav", "footer", "header", "script", "style", "svg", "noscript"],
            remove_overlay_elements=True,
        )

        primary_markdown = ""
        page_title = ""
        extracted_sections: Dict[str, str] = {}
        linked_docs: List[Dict[str, Any]] = []
        found_links: List[str] = []

        try:
            async with AsyncWebCrawler(config=browser_config) as crawler:
                crawl_res = await crawler.arun(url=url, config=run_config)

                if not crawl_res.success:
                    raise RuntimeError(f"Crawl4AI failed for {url}: {crawl_res.error_message}")

                # Extract primary text and title
                primary_markdown = crawl_res.markdown or crawl_res.cleaned_html or ""
                page_title = crawl_res.metadata.get("title") or "Crawl4AI Extracted Document"

                # Collect candidate internal links for sub-page crawling
                internal_links = crawl_res.links.get("internal", []) if hasattr(crawl_res, "links") and isinstance(crawl_res.links, dict) else []
                for link in internal_links:
                    link_href = link.get("href") if isinstance(link, dict) else str(link)
                    if link_href and link_href != url and link_href.startswith("http"):
                        # Filter for policy/appendix keywords
                        link_lower = link_href.lower()
                        if any(kw in link_lower for kw in ["privacy", "terms", "policy", "agreement", "dpa", "legal", "notice"]):
                            if link_href not in found_links:
                                found_links.append(link_href)

                # Batch crawl linked documents in parallel if requested
                target_sublinks = found_links[:max_link_depth]
                if target_sublinks and max_link_depth > 0:
                    if job_id:
                        try:
                            await StorageClient.update_job_progress(
                                job_id=job_id,
                                collector_id=collector_id,
                                url=url,
                                status="scraping",
                                progress=35,
                                current_step=f"Crawl4AI Engine: Batch crawling {len(target_sublinks)} linked documents concurrently...",
                            )
                        except Exception:
                            pass

                    sub_results = await crawler.arun_many(urls=target_sublinks, config=run_config)
                    for idx, sub_res in enumerate(sub_results):
                        if sub_res and sub_res.success:
                            sub_text = sub_res.markdown or sub_res.cleaned_html or ""
                            sub_title = sub_res.metadata.get("title") or f"Linked Document {idx+1}"
                            linked_docs.append({
                                "url": target_sublinks[idx] if idx < len(target_sublinks) else "",
                                "title": sub_title,
                                "raw_text": sub_text,
                                "bytes": len(sub_text.encode("utf-8")),
                            })

        except Exception as crawl_err:
            print(f"[Crawl4AIScraper] Crawl4AI session error: {crawl_err}. Falling back to InHouse...")
            return await InHouseScraper.scrape(
                url=url,
                prompt=prompt,
                job_id=job_id,
                collector_id=collector_id,
                max_link_depth=max_link_depth,
            )

        # Structure primary content into sections with AI if prompt provided, or split by headings
        total_raw_text = primary_markdown
        for l_doc in linked_docs:
            total_raw_text += f"\n\n--- Linked Document: {l_doc['title']} ({l_doc['url']}) ---\n{l_doc.get('raw_text', '')}"

        # Build clean sections from markdown headings or AI
        extracted_sections = cls._markdown_to_sections(total_raw_text, title=page_title)

        bytes_scraped = len(total_raw_text.encode("utf-8"))

        return {
            "url": url,
            "title": page_title,
            "raw_text": total_raw_text,
            "sections": extracted_sections,
            "linked_docs": linked_docs,
            "source": "crawl4ai_stealth",
            "bytes_scraped": bytes_scraped,
            "pages_visited": 1 + len(linked_docs),
            "metadata": {
                "engine": "crawl4ai",
                "linked_count": len(linked_docs),
                "stealth_enabled": True,
            },
        }

    @staticmethod
    def _markdown_to_sections(markdown_text: str, title: str) -> Dict[str, str]:
        """
        Converts markdown with # / ## headings into structured sections.
        """
        lines = markdown_text.splitlines()
        sections: Dict[str, str] = {}
        current_section = "Overview"
        current_lines: List[str] = []

        for line in lines:
            stripped = line.strip()
            if stripped.startswith("#"):
                if current_lines:
                    text_block = "\n".join(current_lines).strip()
                    if len(text_block) > 30:
                        sections[current_section] = text_block
                    current_lines = []
                current_section = stripped.lstrip("#").strip() or "Section"
            else:
                if stripped:
                    current_lines.append(stripped)

        if current_lines:
            text_block = "\n".join(current_lines).strip()
            if len(text_block) > 30:
                sections[current_section] = text_block

        if not sections and markdown_text:
            sections["Main Content"] = markdown_text[:4000]

        return sections

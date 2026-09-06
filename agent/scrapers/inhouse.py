import os
import re
import json
import asyncio
from typing import Dict, Any, List, Optional, Tuple
from urllib.parse import urljoin, urlparse
import httpx
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from storage.db import StorageClient
from llm import ask_gemini
from .types import ScrapedSnapshot


class InHouseScraper:
    @classmethod
    async def scrape(
        cls,
        url: str,
        prompt: Optional[str] = None,
        job_id: Optional[str] = None,
        collector_id: Optional[str] = None,
        max_link_depth: int = 2,
        healed_selector: Optional[str] = None,
    ) -> ScrapedSnapshot:
        if job_id:
            try:
                await StorageClient.update_job_progress(
                    job_id=job_id,
                    collector_id=collector_id,
                    url=url,
                    status="scraping",
                    progress=20,
                    current_step=f"In-House Scraper: Fetching DOM from {url}",
                )
            except Exception:
                pass

        active_selector = healed_selector
        if not active_selector and collector_id:
            try:
                collector_info = await StorageClient.get_collector(collector_id)
                if collector_info and collector_info.get("targetSelector"):
                    active_selector = collector_info["targetSelector"]
                    print(f"[InHouseScraper] Reusing persisted selector '{active_selector}' for {collector_id}")
            except Exception as e:
                print(f"[InHouseScraper] Failed to fetch persisted selector: {e}")

        html_content, page_title = await cls._fetch_html(url)
        if not html_content:
            raise RuntimeError(f"Failed to fetch content from {url}")
        clean_text, raw_extracted = cls._extract_text_and_dom(html_content, selector=active_selector)
        structured = await cls._structure_with_ai(clean_text, prompt=prompt, title=page_title)
        primary_sections = structured.get("sections") or {"Main Content": clean_text[:4000]}
        doc_title = structured.get("title") or page_title or "Extracted Document"
        linked_docs: List[Dict[str, Any]] = []

        if max_link_depth > 0:
            if job_id:
                try:
                    await StorageClient.update_job_progress(
                        job_id=job_id,
                        collector_id=collector_id,
                        url=url,
                        status="scraping",
                        progress=35,
                        current_step="In-House Scraper: Analyzing supplemental linked policy documents...",
                    )
                except Exception:
                    pass

            relevant_links = await cls._find_relevant_links(html_content, base_url=url, prompt=prompt)
            for link_info in relevant_links[:max_link_depth]:
                target_link = link_info.get("url")
                if not target_link or target_link == url:
                    continue
                try:
                    print(f"[InHouseScraper] Following linked document: {target_link} ({link_info.get('title')})")
                    sub_html, sub_title = await cls._fetch_html(target_link)
                    if sub_html:
                        sub_text, _ = cls._extract_text_and_dom(sub_html)
                        sub_struct = await cls._structure_with_ai(sub_text, prompt=prompt, title=sub_title)
                        sub_sections = sub_struct.get("sections") or {"Content": sub_text[:2000]}
                        for sec_name, sec_val in sub_sections.items():
                            prefixed_key = f"[{link_info.get('title') or 'Appendix'}] {sec_name}"
                            primary_sections[prefixed_key] = sec_val

                        linked_docs.append({
                            "url": target_link,
                            "title": sub_title or link_info.get("title"),
                            "sections": sub_sections,
                            "bytes": len(sub_text.encode("utf-8")),
                        })
                except Exception as link_err:
                    print(f"[InHouseScraper] Failed crawling linked document {target_link}: {link_err}")

        total_raw_text = clean_text
        for doc in linked_docs:
            total_raw_text += f"\n\n--- Linked Document: {doc['title']} ({doc['url']}) ---\n"
            for s_name, s_val in doc.get("sections", {}).items():
                total_raw_text += f"\n### {s_name}\n{s_val}\n"

        bytes_scraped = len(total_raw_text.encode("utf-8"))

        return {
            "url": url,
            "title": doc_title,
            "raw_text": total_raw_text,
            "sections": primary_sections,
            "linked_docs": linked_docs,
            "source": "inhouse_playwright",
            "bytes_scraped": bytes_scraped,
            "pages_visited": 1 + len(linked_docs),
            "metadata": {
                "engine": "inhouse",
                "linked_count": len(linked_docs),
                "healed_selector_used": bool(healed_selector),
            }
        }

    @classmethod
    async def heal(
        cls,
        url: str,
        failed_selector: Optional[str] = None,
        issue_description: Optional[str] = None,
        collector_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        AI Self-Healing Engine:
        Fetches current DOM, asks Gemini to diagnose structural changes,
        derives new robust CSS selectors, and automatically updates the DB.
        """
        print(f"[InHouseScraper.heal] Triggering self-heal for {url}...")
        html_content, _ = await cls._fetch_html(url)
        if not html_content:
            return {"success": False, "error": "Could not fetch DOM for healing"}

        soup = BeautifulSoup(html_content, "html.parser")
        # Strip script/style for compact prompt
        for tag in soup(["script", "style", "svg", "noscript"]):
            tag.decompose()

        dom_sample = str(soup)[:6000]

        prompt = f"""You are an autonomous web scraper healing assistant.
The scraper failed on target URL: {url}
Failed Selector: {failed_selector or 'None'}
Issue: {issue_description or 'Validation failed or empty content extracted.'}

Here is the current page DOM structure snippet:
```html
{dom_sample}
```

Task:
1. Identify why the previous extraction failed.
2. Find the optimal CSS selector that captures the main legal/policy/article text container.
3. Return ONLY a valid JSON object formatted as follows:
{{
  "healed_selector": "article.main-content, div.policy-body, or best CSS selector",
  "explanation": "Brief reason for selection",
  "resolution": "Updated CSS selector dynamically"
}}
"""
        discovered_selector = "main, article, div[class*='content'], div[class*='policy']"
        resolution = "Applied generalized fallback multi-selector container"
        explanation = None

        try:
            response_text = await asyncio.to_thread(ask_gemini, prompt)
            start = response_text.find("{")
            end = response_text.rfind("}")
            if start != -1 and end != -1:
                parsed = json.loads(response_text[start:end+1])
                if parsed.get("healed_selector"):
                    discovered_selector = parsed["healed_selector"]
                if parsed.get("resolution"):
                    resolution = parsed["resolution"]
                explanation = parsed.get("explanation")
        except Exception as parse_err:
            print(f"[InHouseScraper.heal] Failed to parse AI healing response: {parse_err}")

        # Automatically persist the healed selector to the collector record
        if collector_id and discovered_selector:
            try:
                await StorageClient.update_collector_metadata(
                    collector_id=collector_id,
                    target_selector=discovered_selector,
                )
                print(f"[InHouseScraper.heal] Successfully saved healed selector '{discovered_selector}' for {collector_id}")
            except Exception as save_err:
                print(f"[InHouseScraper.heal] Failed saving selector to DB: {save_err}")

        return {
            "success": True,
            "healed_selector": discovered_selector,
            "resolution": resolution,
            "explanation": explanation,
        }

    @classmethod
    async def _fetch_html(cls, url: str) -> Tuple[str, str]:
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
                    viewport={"width": 1280, "height": 800},
                )
                page = await context.new_page()
                try:
                    await page.goto(url, wait_until="domcontentloaded", timeout=25000)
                    await page.wait_for_timeout(1000)
                except Exception:
                    pass

                content = await page.content()
                title = await page.title()
                await browser.close()
                if content and len(content) > 100:
                    return content, title
        except Exception as pw_err:
            print(f"[InHouseScraper] Playwright browser fetch failed ({pw_err}), falling back to httpx...")

        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            }
            async with httpx.AsyncClient(follow_redirects=True, timeout=20.0) as client:
                res = await client.get(url, headers=headers)
                if res.is_success:
                    soup = BeautifulSoup(res.text, "html.parser")
                    title = soup.title.string if soup.title else ""
                    return res.text, str(title or "")
        except Exception as http_err:
            print(f"[InHouseScraper] Static HTTP fallback failed: {http_err}")

        return "", ""

    @classmethod
    def _extract_text_and_dom(cls, html: str, selector: Optional[str] = None) -> Tuple[str, str]:
        soup = BeautifulSoup(html, "html.parser")

        target = None
        if selector:
            try:
                target = soup.select_one(selector)
            except Exception:
                target = None

        if not target:
            for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "svg", "iframe"]):
                tag.decompose()
            target = soup.body or soup

        clean_text = target.get_text(separator=" ", strip=True)
        clean_text = re.sub(r"\s+", " ", clean_text).strip()
        return clean_text, str(target)

    @classmethod
    async def _find_relevant_links(
        cls,
        html: str,
        base_url: str,
        prompt: Optional[str] = None,
        source_type: str = "tos",
    ) -> List[Dict[str, str]]:
        soup = BeautifulSoup(html, "html.parser")
        base_domain = urlparse(base_url).netloc
        all_links: List[Dict[str, str]] = []
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            text = a.get_text(strip=True)
            if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
                continue
            full_url = urljoin(base_url, href)
            link_domain = urlparse(full_url).netloc

            if (base_domain in link_domain or not link_domain) and full_url != base_url:
                if full_url not in [c["url"] for c in all_links]:
                    all_links.append({
                        "title": text or "Related Page",
                        "url": full_url,
                    })

        if not all_links:
            return []
        dynamic_keywords = set()
        if prompt:
            words = [w.lower() for w in re.findall(r"\b[a-zA-Z]{4,}\b", prompt)]
            stop_words = {"extract", "content", "clean", "structured", "chunks", "page", "data", "from", "into", "main", "json", "key-value"}
            dynamic_keywords.update([w for w in words if w not in stop_words])
        CATEGORY_KEYWORDS = {
            "tos": ["privacy", "terms", "policy", "dpa", "agreement", "supplemental", "appendix", "guidelines", "cookies", "data protection", "datenschutz", "legal"],
            "news": ["article", "news", "blog", "post", "press", "announcement", "releases", "update", "stories"],
            "civic": ["scheme", "notice", "circular", "guideline", "order", "portal", "eligibility", "gazette", "notification"],
            "ecommerce": ["specs", "pricing", "features", "details", "specifications", "comparison", "reviews", "plans"],
        }
        dynamic_keywords.update(CATEGORY_KEYWORDS.get(source_type.lower(), CATEGORY_KEYWORDS["tos"]))
        candidates = []
        for item in all_links:
            text_lower = item["title"].lower()
            url_lower = item["url"].lower()
            if any(kw in text_lower or kw in url_lower for kw in dynamic_keywords):
                candidates.append(item)

        if candidates:
            return candidates[:4]
        if prompt or source_type != "tos":
            ai_selected = await cls._ai_select_links(all_links[:30], prompt=prompt or f"Find pages relevant to {source_type}")
            if ai_selected:
                return ai_selected[:4]
        return [l for l in all_links if l["title"] != "Related Page"][:4]

    @classmethod
    async def _ai_select_links(cls, links: List[Dict[str, str]], prompt: str) -> List[Dict[str, str]]:
        try:
            links_formatted = "\n".join([f"- {idx}: [{l['title']}] ({l['url']})" for idx, l in enumerate(links)])
            ai_prompt = f"""You are an autonomous web scraper assistant.
Goal: {prompt}

Available page links:
{links_formatted}

Identify up to 3 link numbers that are most relevant to this goal.
Return ONLY a JSON list of the matching integer indices, like: [0, 4, 8].
If none are relevant, return []."""

            res = await asyncio.to_thread(ask_gemini, ai_prompt)
            start = res.find("[")
            end = res.rfind("]")
            if start != -1 and end != -1:
                indices = json.loads(res[start:end+1])
                return [links[i] for i in indices if isinstance(i, int) and 0 <= i < len(links)]
        except Exception as e:
            print(f"[InHouseScraper] AI link selector fallback error: {e}")
        return []

    @classmethod
    async def _structure_with_ai(cls, clean_text: str, prompt: Optional[str] = None, title: str = "") -> Dict[str, Any]:
        if not clean_text or len(clean_text) < 50:
            return {"title": title, "sections": {"Content": clean_text}}

        sample_text = clean_text[:7000]
        instruction = prompt or "Extract the main policy/document content into structured key-value sections."

        ai_prompt = f"""You are a document structuring AI.
Instruction: {instruction}
Document Title: {title}

Document Text:
{sample_text}

Task:
Extract the key sections into a valid JSON object.
Keys should be descriptive section titles (e.g., "Data Collection & Tracking", "AI Training & Model Usage", "User Termination & Rights", "Third-Party Sharing").
Values must be complete text content for that section.
Return ONLY the valid JSON object.

Format:
{{
  "title": "{title or 'Document Summary'}",
  "sections": {{
    "Section Name": "Paragraph content..."
  }}
}}
"""
        try:
            output = await asyncio.to_thread(ask_gemini, ai_prompt)
            start = output.find("{")
            end = output.rfind("}")
            if start != -1 and end != -1:
                parsed = json.loads(output[start:end+1])
                return parsed
        except Exception as e:
            print(f"[InHouseScraper] AI structuring fallback: {e}")

        paragraphs = [p.strip() for p in clean_text.split(". ") if len(p.strip()) > 30]
        sections = {}
        for i, p in enumerate(paragraphs[:8]):
            sections[f"Section {i+1}"] = p + "."
        return {"title": title or "Document Snapshot", "sections": sections}

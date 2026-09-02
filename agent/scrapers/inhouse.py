import os
import re
import json
import asyncio
from typing import Dict, Any, List, Optional, Tuple
from urllib.parse import urljoin, urlparse
from storage.db import StorageClient
from bs4 import BeautifulSoup
from .engine import ScrapedSnapshot
from playwright.async_api import async_playwright
import httpx
from graph import _ask_gemini


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
                StorageClient.update_job_progress(
                    job_id=job_id,
                    collector_id=collector_id,
                    url=url,
                    status="scraping",
                    progress=20,
                    current_step=f"In-House Scraper: Fetching DOM from {url}",
                )
            except Exception:
                pass

        html_content, page_title = await cls._fetch_html(url)
        if not html_content:
            raise RuntimeError(f"Failed to fetch content from {url}")
        clean_text, raw_extracted = cls._extract_text_and_dom(html_content, selector=healed_selector)
        structured = await cls._structure_with_ai(clean_text, prompt=prompt, title=page_title)
        primary_sections = structured.get("sections") or {"Main Content": clean_text[:4000]}
        doc_title = structured.get("title") or page_title or "Extracted Document"
        linked_docs: List[Dict[str, Any]] = []
        if max_link_depth > 0:
            if job_id:
                try:
                    StorageClient.update_job_progress(
                        job_id=job_id,
                        collector_id=collector_id,
                        url=url,
                        status="scraping",
                        progress=35,
                        current_step="In-House Scraper: Analyzing supplemental linked policy documents...",
                    )
                except Exception:
                    pass

            relevant_links = await cls._find_relevant_links(html_content, base_url=url)
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

                        # Prefix linked sections so they are clearly demarcated
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

        # 5. Build Standardized Snapshot
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
    ) -> Dict[str, Any]:
        """
        AI Self-Healing Engine:
        Fetches current DOM, asks Gemini to diagnose structural changes,
        and derives new robust CSS selectors.
        """
        from graph import _ask_gemini

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
        response_text = await asyncio.to_thread(_ask_gemini, prompt)
        try:
            start = response_text.find("{")
            end = response_text.rfind("}")
            if start != -1 and end != -1:
                parsed = json.loads(response_text[start:end+1])
                return {
                    "success": True,
                    "healed_selector": parsed.get("healed_selector"),
                    "resolution": parsed.get("resolution") or "Generated new AI CSS selector",
                    "explanation": parsed.get("explanation"),
                }
        except Exception as parse_err:
            print(f"[InHouseScraper.heal] Failed to parse AI healing response: {parse_err}")

        return {
            "success": True,
            "healed_selector": "main, article, div[class*='content'], div[class*='policy']",
            "resolution": "Applied generalized fallback multi-selector container",
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
        """Extract clean text and container HTML."""
        soup = BeautifulSoup(html, "html.parser",)

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
    async def _find_relevant_links(cls, html: str, base_url: str) -> List[Dict[str, str]]:
        """Identify sub-policy and appendix links."""
        soup = BeautifulSoup(html, "html.parser")
        candidates = []
        base_domain = urlparse(base_url).netloc

        keywords = ["privacy", "terms", "policy", "dpa", "agreement", "supplemental", "appendix", "guidelines", "cookies", "data protection"]

        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            text = a.get_text(strip=True).lower()
            full_url = urljoin(base_url, href)
            link_domain = urlparse(full_url).netloc

            # Only follow same-domain or trusted subdomains
            if base_domain in link_domain or not link_domain:
                if any(kw in text or kw in href.lower() for kw in keywords):
                    if full_url != base_url and full_url not in [c["url"] for c in candidates]:
                        candidates.append({
                            "title": a.get_text(strip=True) or "Related Document",
                            "url": full_url,
                        })

        return candidates[:4]

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
            output = await asyncio.to_thread(_ask_gemini, ai_prompt)
            start = output.find("{")
            end = output.rfind("}")
            if start != -1 and end != -1:
                parsed = json.loads(output[start:end+1])
                return parsed
        except Exception as e:
            print(f"[InHouseScraper] AI structuring fallback: {e}")

        # Regex paragraph chunking fallback
        paragraphs = [p.strip() for p in clean_text.split(". ") if len(p.strip()) > 30]
        sections = {}
        for i, p in enumerate(paragraphs[:8]):
            sections[f"Section {i+1}"] = p + "."
        return {"title": title or "Document Snapshot", "sections": sections}

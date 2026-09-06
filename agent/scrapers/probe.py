import hashlib
from typing import TypedDict, Optional, Dict, Any
import httpx
from bs4 import BeautifulSoup


class ProbeResult(TypedDict):
    url: str
    changed: bool
    status_code: int
    etag: Optional[str]
    last_modified: Optional[str]
    content_hash: Optional[str]
    extracted_sample: Optional[str]
    needs_browser: bool
    reason: str


class ChangeProber:
    DEFAULT_HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    @classmethod
    async def probe(
        cls,
        url: str,
        last_etag: Optional[str] = None,
        last_modified: Optional[str] = None,
        last_content_hash: Optional[str] = None,
        target_selector: Optional[str] = None,
        timeout: float = 12.0,
    ) -> ProbeResult:
        """
        Executes a 2-tier lightweight probe against target URL:
        1. Tier 1: Checks HTTP headers (If-None-Match / If-Modified-Since).
           If 304 Not Modified, returns changed=False with 0 bandwidth.
        2. Tier 2: Fetches static HTML via httpx, extracts target selector, computes SHA-256 hash.
           If hash == last_content_hash, returns changed=False.
        """
        headers = dict(cls.DEFAULT_HEADERS)
        if last_etag:
            headers["If-None-Match"] = last_etag
        if last_modified:
            headers["If-Modified-Since"] = last_modified

        async with httpx.AsyncClient(follow_redirects=True, timeout=timeout) as client:
            try:
                res = await client.get(url, headers=headers)
                status_code = res.status_code

                if status_code == 304:
                    return {
                        "url": url,
                        "changed": False,
                        "status_code": 304,
                        "etag": last_etag,
                        "last_modified": last_modified,
                        "content_hash": last_content_hash,
                        "extracted_sample": None,
                        "needs_browser": False,
                        "reason": "HTTP 304 Not Modified (Header validation match)",
                    }

                if not res.is_success:
                    return {
                        "url": url,
                        "changed": True,
                        "status_code": status_code,
                        "etag": None,
                        "last_modified": None,
                        "content_hash": None,
                        "extracted_sample": None,
                        "needs_browser": True,
                        "reason": f"HTTP status {status_code}, full browser check recommended",
                    }

                new_etag = res.headers.get("ETag") or res.headers.get("etag")
                new_last_modified = res.headers.get("Last-Modified") or res.headers.get("last-modified")

                html_text = res.text
                if not html_text:
                    return {
                        "url": url,
                        "changed": True,
                        "status_code": status_code,
                        "etag": new_etag,
                        "last_modified": new_last_modified,
                        "content_hash": None,
                        "extracted_sample": None,
                        "needs_browser": True,
                        "reason": "Empty static response, requires headless browser for SPA rendering",
                    }
                soup = BeautifulSoup(html_text, "html.parser")
                target = None
                if target_selector:
                    try:
                        target = soup.select_one(target_selector)
                    except Exception:
                        target = None

                if not target:
                    for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "svg", "iframe"]):
                        tag.decompose()
                    target = soup.body or soup

                clean_text = " ".join(target.get_text(separator=" ", strip=True).split())

                if len(clean_text) < 50:
                    return {
                        "url": url,
                        "changed": True,
                        "status_code": status_code,
                        "etag": new_etag,
                        "last_modified": new_last_modified,
                        "content_hash": None,
                        "extracted_sample": clean_text,
                        "needs_browser": True,
                        "reason": "Static extraction below threshold; headless browser required for JS execution",
                    }

                new_hash = hashlib.sha256(clean_text.encode("utf-8")).hexdigest()

                if last_content_hash and new_hash == last_content_hash:
                    return {
                        "url": url,
                        "changed": False,
                        "status_code": status_code,
                        "etag": new_etag,
                        "last_modified": new_last_modified,
                        "content_hash": new_hash,
                        "extracted_sample": clean_text[:200],
                        "needs_browser": False,
                        "reason": "SHA-256 content hash matches previous baseline; no change detected",
                    }

                return {
                    "url": url,
                    "changed": True,
                    "status_code": status_code,
                    "etag": new_etag,
                    "last_modified": new_last_modified,
                    "content_hash": new_hash,
                    "extracted_sample": clean_text[:200],
                    "needs_browser": False,
                    "reason": "Content hash altered; meaningful document change detected",
                }

            except Exception as e:
                return {
                    "url": url,
                    "changed": True,
                    "status_code": 0,
                    "etag": None,
                    "last_modified": None,
                    "content_hash": None,
                    "extracted_sample": None,
                    "needs_browser": True,
                    "reason": f"Probe error: {str(e)}; fallback to full browser",
                }

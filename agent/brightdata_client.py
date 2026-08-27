"""
Bright Data Python SDK wrapper.
Replaces npx CLI calls for runtime scraping with direct API calls.

Authentication: Set BRIGHTDATA_API_TOKEN in agent/.env
Get your token: https://brightdata.com/cp/api_keys
"""
import os
import json
import requests
from dotenv import load_dotenv
from brightdata import SyncBrightDataClient

load_dotenv()

_client = None


import re
from html.parser import HTMLParser

class MLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.reset()
        self.convert_charrefs = True
        self.text = []

    def handle_data(self, d):
        self.text.append(d)

    def get_data(self):
        return " ".join(" ".join(self.text).split())


def strip_html(html_content: str) -> str:
    """Strip all HTML tags, script, and style tags to extract clean plain text."""
    if not html_content or not isinstance(html_content, str):
        return ""
    cleaned = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html_content, flags=re.DOTALL | re.IGNORECASE)
    s = MLStripper()
    s.feed(cleaned)
    return s.get_data()


def clean_and_chunk_snapshot(raw_snapshot: dict | list | str) -> dict:
    """
    Extracts clean text from raw Bright Data DOM/HTML snapshot and chunks it
    into a structured JSON object with key-value sections (e.g., Data Collection, AI Training, User Rights).
    """
    if not raw_snapshot:
        return {"clean_text": "", "sections": {}}

    raw_str = ""
    if isinstance(raw_snapshot, list):
        for item in raw_snapshot:
            if isinstance(item, dict):
                content = (
                    item.get("policy_content")
                    or item.get("content")
                    or item.get("text")
                    or item.get("html")
                    or json.dumps(item)
                )
                raw_str += " " + content
            else:
                raw_str += " " + str(item)
    elif isinstance(raw_snapshot, dict):
        raw_str = (
            raw_snapshot.get("policy_content")
            or raw_snapshot.get("content")
            or raw_snapshot.get("text")
            or raw_snapshot.get("html")
            or json.dumps(raw_snapshot)
        )
    else:
        raw_str = str(raw_snapshot)

    clean_text = strip_html(raw_str)
    if not clean_text or len(clean_text) < 10:
        clean_text = raw_str

    try:
        from graph import _ask_gemini
        prompt = f"""You are a document structuring assistant.
Clean text document:
{clean_text[:6000]}

Extract the key topics/sections of this document into a valid JSON object.
Keys should be clear section titles (e.g., "Data Collection", "AI Processing & Training", "User Rights", "Third-Party Sharing").
Values should be the complete text paragraph for that section.
Return ONLY a valid JSON object.

Format:
{{
  "title": "Document Title",
  "sections": {{
    "Section Name": "Paragraph content..."
  }}
}}"""
        llm_out = _ask_gemini(prompt)
        json_start = llm_out.find("{")
        json_end = llm_out.rfind("}")
        if json_start != -1 and json_end != -1:
            parsed = json.loads(llm_out[json_start:json_end+1])
            return {
                "clean_text": clean_text[:4000],
                "title": parsed.get("title") or "Document Snapshot",
                "sections": parsed.get("sections") or {"Main Content": clean_text[:2000]}
            }
    except Exception as e:
        print(f"[clean_and_chunk_snapshot] Gemini chunking fallback: {e}")

    paragraphs = [p.strip() for p in clean_text.split(". ") if p.strip()]
    sections = {}
    for i, p in enumerate(paragraphs[:10]):
        key = f"Section {i+1}"
        sections[key] = p + "."

    return {
        "clean_text": clean_text[:4000],
        "title": "Document Snapshot",
        "sections": sections or {"Main Content": clean_text[:2000]}
    }


def get_client():
    """Lazy singleton — only imports brightdata when first called."""
    global _client
    if _client is None:
        token = os.getenv("BRIGHTDATA_API_TOKEN")
        if not token:
            raise RuntimeError("BRIGHTDATA_API_TOKEN not set in agent/.env")
        _client = SyncBrightDataClient(token=token)
    return _client


def update_brightdata_collector_name(collector_id: str, name: str) -> bool:
    """Update collector display name on Bright Data cloud dashboard."""
    token = os.getenv("BRIGHTDATA_API_TOKEN")
    if not token or not collector_id or not name:
        return False
    try:
        url = f"https://api.brightdata.com/dca/collector/{collector_id}"
        res = requests.post(
            url,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={"name": name, "title": name},
            timeout=10,
        )
        if res.ok:
            print(f"[BrightData] Updated collector '{collector_id}' name to '{name}' on Bright Data dashboard.")
            return True
    except Exception as e:
        print(f"[BrightData] Failed to update collector name on cloud dashboard: {e}")
    return False


def check_dataset_marketplace(url: str) -> dict | None:
   
    token = os.getenv("BRIGHTDATA_API_TOKEN")
    if not token:
        return None
    try:
       
        response = requests.get(
            "https://api.brightdata.com/datasets/v3/snapshots",
            params={"url": url, "limit": 1, "status": "ready"},
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        if response.ok:
            data = response.json()
            items = data.get("data") or data.get("snapshots") or []
            if items:
                return items[0]  
    except Exception as e:
        print(f"[BrightData] Dataset marketplace check failed: {e}")
    return None


def trigger_collector_async(collector_id: str, url: str, webhook_url: str) -> dict | None:
    """
    Trigger Bright Data Scraper Studio collector asynchronously with a Webhook delivery URL.
    Uses exact query params & payload format from Bright Data API docs:
    POST https://api.brightdata.com/dca/trigger?collector={collector_id}&endpoint={webhook_url}&queue_next=1
    Payload: [{"url": url}]
    """
    token = os.getenv("BRIGHTDATA_API_TOKEN")
    if not token:
        print("[BrightData Async Trigger] Error: BRIGHTDATA_API_TOKEN is missing")
        return None

    try:
        endpoint = "https://api.brightdata.com/dca/trigger"
        params = {
            "collector": collector_id,
            "endpoint": webhook_url,
            "queue_next": "1",
        }
        prompt_text = (
            "Extract complete document text into structured JSON. Do NOT truncate or abbreviate text. "
            "Preserve all paragraphs, sub-clauses, bullet points, and hyperlinked URLs in markdown format [text](url). "
            "Output ONLY a valid JSON object formatted as follows:\n"
            "{\n"
            '  "title": "Document Title",\n'
            '  "last_updated": "Date or N/A",\n'
            '  "sections": {\n'
            '    "Overview & Scope": "Full text content with [links](url)...",\n'
            '    "Data Collection & Protection": "Full text content...",\n'
            '    "AI Processing & Model Training": "Full text content...",\n'
            '    "Third-Party Data Sharing": "Full text content...",\n'
            '    "User Rights & Cancellation": "Full text content..."\n'
            "  }\n"
            "}"
        )
        payload = [{
            "url": url,
            "prompt": prompt_text
        }]
        print(f"[BrightData Async Trigger] POST {endpoint} | Params: {params} | Payload: {payload}")
        
        res = requests.post(
            endpoint,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            params=params,
            json=payload,
            timeout=15,
        )
        print(f"[BrightData Async Trigger] Response Code: {res.status_code} | Text: {res.text[:200]}")
        
        if res.ok:
            data = res.json()
            response_id = data.get("response_id") or data.get("id") or (data[0].get("response_id") if isinstance(data, list) and data else None)
            return {"success": True, "response_id": response_id, "raw": data}
        else:
            print(f"[BrightData Async Trigger] Failed status {res.status_code}: {res.text}")
    except Exception as e:
        print(f"[BrightData Async Trigger] HTTP Exception: {e}")

    return None


def get_collector_results(response_id: str, timeout_sec: int = 30) -> dict | list | None:
    """
    Fetch scraped dataset results from Bright Data DCA API using response_id.
    Uses long-polling timeout=30s parameter supported by Bright Data API.
    """
    token = os.getenv("BRIGHTDATA_API_TOKEN")
    if not token or not response_id:
        return None

    try:
        endpoint = f"https://api.brightdata.com/dca/get_result?response_id={response_id}&timeout={timeout_sec}s"
        print(f"[BrightData get_result] GET {endpoint}")
        res = requests.get(
            endpoint,
            headers={"Authorization": f"Bearer {token}"},
            timeout=timeout_sec + 10,
        )
        print(f"[BrightData get_result] Status: {res.status_code}")
        
        if res.status_code == 200:
            data = res.json()
            print(f"[BrightData get_result] Success! Received {len(data) if isinstance(data, list) else 1} items.")
            return data
        elif res.status_code == 202:
            print(f"[BrightData get_result] Status 202: Scrape still in progress on Bright Data cloud...")
            return None
        else:
            print(f"[BrightData get_result] Error status {res.status_code}: {res.text[:200]}")
    except Exception as e:
        print(f"[BrightData get_result] Exception: {e}")

    return None


def run_collector(collector_id: str, url: str) -> dict | list | None:
    """
    Run an existing Scraper Studio collector against a URL.
    Tries in order:
      1. Native Python SDK (`client.scraper_studio.run`)
      2. Direct REST DCA API (`POST /dca/trigger_immediate` + `GET /dca/get_result`)
      3. CLI subprocess fallback (`bdata scraper run`)
    """
    token = os.getenv("BRIGHTDATA_API_TOKEN")

    # 1. Native Python SDK execution (brightdata-sdk)
    if token:
        try:
            print(f"[BrightData SDK] Executing scraper_studio.run for '{collector_id}'...")
            client = get_client()
            if hasattr(client, "scraper_studio"):
                res = client.scraper_studio.run(
                    collector=collector_id,
                    input={"url": url}
                )
                if res and hasattr(res, "data") and res.data:
                    print(f"[BrightData SDK] scraper_studio.run succeeded!")
                    return res.data
        except Exception as sdk_err:
            print(f"[BrightData SDK] scraper_studio.run exception (falling to REST API): {sdk_err}")

    # 2. HTTP Direct API Two-Step DCA Flow
    if token:
        try:
            endpoint = f"https://api.brightdata.com/dca/trigger_immediate?collector={collector_id}"
              
            prompt_text = (
                "Extract complete document text into structured JSON. Do NOT truncate or abbreviate text. "
                "Preserve all paragraphs, sub-clauses, bullet points, and hyperlinked URLs in markdown format [text](url). "
                "Output ONLY a valid JSON object formatted as follows:\n"
                "{\n"
                '  "title": "Document Title",\n'
                '  "last_updated": "Date or N/A",\n'
                '  "sections": {\n'
                '    "Overview & Scope": "Full text content with [links](url)...",\n'
                '    "Data Collection & Protection": "Full text content...",\n'
                '    "AI Processing & Model Training": "Full text content...",\n'
                '    "Third-Party Data Sharing": "Full text content...",\n'
                '    "User Rights & Cancellation": "Full text content..."\n'
                "  }\n"
                "}"
            )
            payload = {
                "url": url,
                "prompt": prompt_text
            }
            print(f"[BrightData API trigger_immediate] POST {endpoint} | Payload: {payload}")
            
            res = requests.post(
                endpoint,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json=payload,
                timeout=30,
            )
            print(f"[BrightData API trigger_immediate] Status: {res.status_code} | Text: {res.text[:300]}")
            
              
            if not res.ok and "must be" in res.text:
                payload_arr = [payload]
                print(f"[BrightData API trigger_immediate] Retrying with array payload: {payload_arr}")
                res = requests.post(
                    endpoint,
                    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                    json=payload_arr,
                    timeout=30,
                )
                print(f"[BrightData API trigger_immediate retry] Status: {res.status_code} | Text: {res.text[:300]}")

            if res.ok:
                data = res.json()
                
                  
                if isinstance(data, list) and len(data) > 0 and ("text" in data[0] or "url" in data[0]):
                    print(f"[BrightData API] Direct dataset records returned synchronously! ({len(data)} items)")
                    return data
                
                  
                response_id = None
                if isinstance(data, dict):
                    response_id = data.get("response_id") or data.get("id")
                elif isinstance(data, list) and data and isinstance(data[0], dict):
                    response_id = data[0].get("response_id") or data[0].get("id")

                if response_id:
                    print(f"[BrightData API] Got response_id '{response_id}'. Polling /dca/get_result...")
                    import time
                    start_time = time.time()
                    while time.time() - start_time < 90:    
                        results = get_collector_results(response_id, timeout_sec=25)
                        if results:
                            return results
                        time.sleep(3)
                else:
                    print(f"[BrightData API] No response_id found in trigger output: {data}")
            else:
                print(f"[BrightData API] Trigger status {res.status_code}: {res.text}")
        except Exception as http_err:
            print(f"[BrightData API] Direct HTTP trigger exception: {http_err}")

      
    try:
        print(f"[BrightData CLI fallback] Running CLI for collector {collector_id} on {url}...")
        import subprocess
        npx_cmd = "npx.cmd" if os.name == "nt" else "npx"
        res = subprocess.run(
            [npx_cmd, "-y", "-p", "@brightdata/cli", "bdata", "scraper", "run", collector_id, url],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=120,
            shell=(os.name == "nt")
        )
        print(f"[BrightData CLI fallback] Returncode={res.returncode}")
        if res.returncode == 0 and res.stdout and res.stdout.strip():
            try:
                parsed = json.loads(res.stdout)
                print(f"[BrightData CLI fallback] Successfully parsed JSON output!")
                return parsed
            except Exception:
                return {"raw_output": res.stdout}
        else:
            print(f"[BrightData CLI run] stderr={res.stderr}")
    except Exception as cli_err:
        print(f"[BrightData CLI run] Execution failed: {cli_err}")

    return None


def search_google(query: str, num_results: int = 5) -> list[dict]:
    """
    Search Google via Bright Data SDK.
    Returns list of { title, url, snippet } dicts.
    """
    try:
        client = get_client()
        result = client.search.google(query=query, num_results=num_results)
        if not result or not hasattr(result, "data"):
            return []
        return [
            {
                "title": r.get("title", ""),
                "url": r.get("link") or r.get("url", ""),
                "snippet": r.get("description") or r.get("snippet", ""),
                "source_type": "google",
            }
            for r in (result.data or [])
        ]
    except Exception as e:
        print(f"[BrightData SDK] search_google failed: {e}")
        return []


def search_reddit(keyword: str, num_results: int = 5) -> list[dict]:
    """
    Search Reddit posts by keyword via Bright Data SDK.
    Returns list of { title, url, snippet } dicts.
    """
    try:
        client = get_client()
        result = client.scrape.reddit.posts_by_keyword(
            keyword=keyword, sort_by="Top", date="Past month"
        )
        if not result or not hasattr(result, "data"):
            return []
        return [
            {
                "title": r.get("title", ""),
                "url": r.get("url", ""),
                "snippet": r.get("selftext", "") or r.get("description", ""),
                "source_type": "reddit",
            }
            for r in (result.data or [])[:num_results]
        ]
    except Exception as e:
        print(f"[BrightData SDK] search_reddit failed: {e}")
        return []


def search_perplexity(query: str) -> dict | None:
    """
    Run a Perplexity AI search for synthesized answer + sources.
    Returns { answer, sources } or None.
    """
    try:
        client = get_client()
        url = f"https://www.perplexity.ai/search?q={query.replace(' ', '+')}"
        result = client.scrape.perplexity.search(url=url)
        if result and hasattr(result, "data"):
            return {"answer": result.data, "source_type": "perplexity"}
        return None
    except Exception as e:
        print(f"[BrightData SDK] search_perplexity failed: {e}")
        return None

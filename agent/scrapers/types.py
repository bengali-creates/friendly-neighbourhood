from typing import TypedDict, Optional, List, Dict, Any

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

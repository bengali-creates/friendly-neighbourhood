"""
Tests for In-House Scraper, Unified ScraperEngine, and /watch endpoint uniformity.
"""
import pytest
import asyncio
from unittest.mock import patch, AsyncMock
from scrapers.engine import ScraperEngine
from scrapers.inhouse import InHouseScraper


SAMPLE_HTML = """
<!DOCTYPE html>
<html>
<head><title>Terms of Service - Test Corp</title></head>
<body>
    <header><nav><a href="/home">Home</a></nav></header>
    <main class="policy-container">
        <h1>Terms of Service</h1>
        <p>Welcome to Test Corp. You agree not to misuse our services.</p>
        <h2>Data Processing</h2>
        <p>We process your data strictly to provide the service. For details, see our <a href="/privacy-policy">Privacy Policy</a>.</p>
        <h2>Cancellation</h2>
        <p>You can cancel your subscription at any time without fees.</p>
    </main>
    <footer>Copyright 2026</footer>
</body>
</html>
"""


def test_inhouse_text_extraction():
    """Verify that InHouseScraper removes noise and extracts text cleanly."""
    clean_text, dom_str = InHouseScraper._extract_text_and_dom(SAMPLE_HTML)
    assert "Terms of Service" in clean_text
    assert "You agree not to misuse our services" in clean_text
    assert "Copyright 2026" not in clean_text  # footer decomposed
    assert "Home" not in clean_text  # nav decomposed


def test_inhouse_relevant_link_discovery():
    """Verify that links matching policy keywords are identified."""
    links = asyncio.run(InHouseScraper._find_relevant_links(SAMPLE_HTML, base_url="https://testcorp.com/terms"))
    assert len(links) > 0
    assert any("privacy-policy" in l["url"] for l in links)


def test_inhouse_dynamic_prompt_link_discovery():
    """Verify that keywords extracted dynamically from user prompt match links."""
    custom_html = """
    <div>
        <a href="/admissions">Admissions Portal</a>
        <a href="/scholarships">Scholarship Guidelines</a>
        <a href="/random">About Campus</a>
    </div>
    """
    links = asyncio.run(InHouseScraper._find_relevant_links(
        custom_html,
        base_url="https://university.edu",
        prompt="Extract information regarding scholarship eligibility and fees",
        source_type="civic",
    ))
    assert len(links) > 0
    assert any("scholarships" in l["url"] for l in links)


@pytest.mark.asyncio
async def test_inhouse_ai_link_fallback():
    """Verify AI fallback is invoked when no keywords match foreign or abstract links."""
    foreign_html = """
    <div>
        <a href="/doc/94821">Dokumentenübersicht</a>
        <a href="/portal/sub3">Auskunftsrecht Verzeichnis</a>
    </div>
    """
    with patch.object(InHouseScraper, "_ai_select_links", new_callable=AsyncMock) as mock_ai:
        mock_ai.return_value = [{"title": "Auskunftsrecht Verzeichnis", "url": "https://company.de/portal/sub3"}]
        links = await InHouseScraper._find_relevant_links(
            foreign_html,
            base_url="https://company.de",
            prompt="Find user data access rights",
            source_type="tos",
        )
        assert len(links) == 1
        assert "sub3" in links[0]["url"]
        mock_ai.assert_called_once()


@pytest.mark.asyncio
async def test_scraper_engine_inhouse_flow():
    """Verify ScraperEngine returns standard ScrapedSnapshot structure."""
    with patch.object(InHouseScraper, "_fetch_html", return_value=(SAMPLE_HTML, "Terms of Service")):
        with patch.object(InHouseScraper, "_structure_with_ai", return_value={
            "title": "Terms of Service",
            "sections": {
                "Data Processing": "We process your data strictly...",
                "Cancellation": "You can cancel anytime...",
            }
        }):
            snapshot = await ScraperEngine.scrape(
                url="https://testcorp.com/terms",
                engine="inhouse",
                max_link_depth=0,
            )

            assert snapshot["url"] == "https://testcorp.com/terms"
            assert "Data Processing" in snapshot["sections"]
            assert snapshot["source"] == "inhouse_playwright"
            assert snapshot["bytes_scraped"] > 0

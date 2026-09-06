"""
Tests for ChangeProber (Tier 1 ETag, Tier 2 Static Hash) and /scraper/probe endpoint.
"""
import pytest
import hashlib
from unittest.mock import patch, AsyncMock, MagicMock
from scrapers.probe import ChangeProber
from fastapi.testclient import TestClient
from main import app


SAMPLE_HTML_V1 = """
<!DOCTYPE html>
<html>
<head><title>Terms of Service - Acme Corp</title></head>
<body>
    <article class="terms-container">
        <h1>Terms of Service</h1>
        <p>Acme Corp respects your privacy. Subscriptions can be cancelled anytime.</p>
    </article>
</body>
</html>
"""

SAMPLE_HTML_V2_CHANGED = """
<!DOCTYPE html>
<html>
<head><title>Terms of Service - Acme Corp</title></head>
<body>
    <article class="terms-container">
        <h1>Terms of Service</h1>
        <p>Acme Corp now collects telemetric tracking. Cancellation requires phone call.</p>
    </article>
</body>
</html>
"""


@pytest.mark.asyncio
async def test_prober_etag_304():
    """Verify Tier 1 exits immediately on HTTP 304 Not Modified."""
    mock_res = MagicMock()
    mock_res.status_code = 304

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock, return_value=mock_res):
        result = await ChangeProber.probe(
            url="https://acme.com/terms",
            last_etag='"etag-12345"',
        )

        assert result["changed"] is False
        assert result["status_code"] == 304
        assert result["needs_browser"] is False
        assert "304 Not Modified" in result["reason"]


@pytest.mark.asyncio
async def test_prober_hash_match():
    """Verify Tier 2 exits when container content hash is identical."""
    clean_v1 = "Terms of Service Acme Corp respects your privacy. Subscriptions can be cancelled anytime."
    h1 = hashlib.sha256(clean_v1.encode("utf-8")).hexdigest()

    mock_res = MagicMock()
    mock_res.status_code = 200
    mock_res.is_success = True
    mock_res.text = SAMPLE_HTML_V1
    mock_res.headers = {"ETag": '"etag-new"'}

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock, return_value=mock_res):
        result = await ChangeProber.probe(
            url="https://acme.com/terms",
            last_content_hash=h1,
            target_selector="article.terms-container",
        )

        assert result["changed"] is False
        assert result["content_hash"] == h1
        assert result["needs_browser"] is False


@pytest.mark.asyncio
async def test_prober_hash_detects_mutation():
    """Verify Tier 2 flags changed=True when container content differs."""
    clean_v1 = "Terms of Service Acme Corp respects your privacy. Subscriptions can be cancelled anytime."
    h1 = hashlib.sha256(clean_v1.encode("utf-8")).hexdigest()

    mock_res = MagicMock()
    mock_res.status_code = 200
    mock_res.is_success = True
    mock_res.text = SAMPLE_HTML_V2_CHANGED
    mock_res.headers = {"ETag": '"etag-v2"'}

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock, return_value=mock_res):
        result = await ChangeProber.probe(
            url="https://acme.com/terms",
            last_content_hash=h1,
            target_selector="article.terms-container",
        )

        assert result["changed"] is True
        assert result["content_hash"] != h1
        assert "altered" in result["reason"]


def test_probe_endpoint():
    """Test the POST /scraper/probe endpoint integration."""
    client = TestClient(app)
    mock_probe_result = {
        "url": "https://acme.com/terms",
        "changed": False,
        "status_code": 200,
        "etag": '"etag-123"',
        "last_modified": None,
        "content_hash": "abcdef123456",
        "extracted_sample": "Terms of Service...",
        "needs_browser": False,
        "reason": "SHA-256 content hash matches",
    }

    with patch("scrapers.probe.ChangeProber.probe", new_callable=AsyncMock, return_value=mock_probe_result):
        res = client.post("/scraper/probe", json={
            "url": "https://acme.com/terms",
            "last_etag": '"etag-123"',
            "last_content_hash": "abcdef123456",
        })

        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["data"]["changed"] is False

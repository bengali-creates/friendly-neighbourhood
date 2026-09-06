"""
API Endpoint uniformity and contract tests for Spider-Sense Agent API.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_health_endpoint(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "inhouse_playwright" in data["engines"]


def test_watch_endpoint_uniformity(client):
    """Verify /watch returns instant non-blocking JSON with job_id."""
    with patch("main.StorageClient.get_from_nextjs", new_callable=AsyncMock, return_value={"data": []}):
        with patch("main.check_dataset_marketplace", return_value=None):
            with patch("main.StorageClient.get_collector_by_url", new_callable=AsyncMock, return_value=None):
                with patch("main.StorageClient.save_collector", new_callable=AsyncMock, return_value=True):
                    with patch("main._run_unified_pipeline", new_callable=AsyncMock):
                        res = client.post("/watch", json={
                            "url": "https://example.com/terms",
                            "name": "Example Monitor",
                            "source_type": "tos",
                            "force_fresh": True,
                            "engine": "inhouse"
                        })
                        assert res.status_code == 200
                        data = res.json()
                        assert data["success"] is True
                        assert "job_id" in data
                        assert data["status"] == "processing"


def test_create_scraper_inhouse(client):
    """Verify /scraper/create returns immediately for inhouse without slow CLI calls."""
    with patch("main.StorageClient.get_collector_by_url", new_callable=AsyncMock, return_value=None):
        with patch("main.StorageClient.save_collector", new_callable=AsyncMock, return_value=True):
            res = client.post("/scraper/create", json={
                "url": "https://example.com/privacy",
                "name": "Privacy Monitor",
                "engine": "inhouse",
            })
            assert res.status_code == 200
            data = res.json()
            assert data["success"] is True
            assert data["engine"] == "inhouse"
            assert data["collector_id"].startswith("c_inhouse_")

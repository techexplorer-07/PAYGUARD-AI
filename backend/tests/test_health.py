"""Unit tests for health check endpoints using FastAPI TestClient and HTTPX."""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check() -> None:
    """Test GET /health returns status ok and service identifier."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "payguard-api",
    }


def test_versioned_health_check() -> None:
    """Test GET /api/v1/health returns status ok and service identifier."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "payguard-api",
    }

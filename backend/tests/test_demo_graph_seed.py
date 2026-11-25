"""Tests for the optional synthetic demo SPEG graph used by demo deployments."""

from fastapi.testclient import TestClient

from app.main import app
from app.services.demo_graph_seed import DEMO_GRAPH_ID, seed_demo_graph
from app.services.speg_graph_builder import clear_active_graphs


def test_seed_demo_graph_supports_recipient_endpoints():
    try:
        graph_id, nodes, edges = seed_demo_graph()
        assert graph_id == DEMO_GRAPH_ID
        assert nodes == 19 and edges == 15

        client = TestClient(app)
        evidence = client.get("/api/v1/recipient-intelligence/recipients/sample-refund-desk@ybl/evidence")
        assert evidence.status_code == 200
        body = evidence.json()
        assert body["verified_edge_count"] == 1
        assert body["reported_edge_count"] == 1
        assert body["inferred_edge_count"] == 1

        risk = client.get("/api/v1/recipient-intelligence/recipients/sample-refund-desk@ybl/risk-assessment")
        assert risk.status_code == 200
        assert risk.json()["risk_level"] == "HIGH"

        # Verified evidence is only created internally; the sample authority is clearly labelled.
        verified = [e for e in body["evidence_edges"] if e["evidence_status"] == "VERIFIED"]
        assert all("SAMPLE_DEMO_AUTHORITY" in e["description"] for e in verified)
    finally:
        clear_active_graphs()


def test_demo_graph_is_not_seeded_by_default():
    from app.core.config import settings

    assert settings.SEED_DEMO_GRAPH is False

import pytest
from unittest.mock import patch
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_search_papers(client: AsyncClient):
    await client.post("/api/auth/register", json={"username": "research_user", "email": "research@example.com", "password": "pass"})
    login = await client.post("/api/auth/login", data={"username": "research@example.com", "password": "pass"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    mock_papers = [{"title": "Test Paper", "authors": ["A"], "abstract": "abc", "citation_count": 5, "source": "arxiv"}]
    mock_ai = {"summaries": [{"paper_index": 0, "summary": "Summ"}], "workflow": {"phases": []}, "tech_stack": {}}
    
    with patch("app.routers.research.fetch_aggregated_papers", return_value=mock_papers):
        with patch("app.routers.research.generate_all", return_value=mock_ai):
            resp = await client.post("/api/research/search", json={"query": "test query", "max_results": 1}, headers=headers)
            assert resp.status_code == 200
            data = resp.json()
            assert data["query"] == "test query"
            assert len(data["papers"]) == 1
            assert data["papers"][0]["title"] == "Test Paper"
            
            resp_hist = await client.get("/api/research/history", headers=headers)
            assert resp_hist.status_code == 200
            assert len(resp_hist.json()) == 1
            
            query_id = data["query_id"]
            resp_get = await client.get(f"/api/research/{query_id}", headers=headers)
            assert resp_get.status_code == 200
            assert resp_get.json()["query_id"] == query_id
            
            resp_del = await client.delete(f"/api/research/{query_id}", headers=headers)
            assert resp_del.status_code == 200
            
            resp_get_after = await client.get(f"/api/research/{query_id}", headers=headers)
            assert resp_get_after.status_code == 404

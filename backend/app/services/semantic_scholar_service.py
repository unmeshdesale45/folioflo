import httpx
from app.config import settings

async def search_semantic_scholar(query: str, max_results: int = 15) -> list[dict]:
    url = "https://api.semanticscholar.org/graph/v1/paper/search"
    params = {
        "query": query,
        "fields": "title,authors,abstract,citationCount,year,openAccessPdf,url,externalIds",
        "limit": 5
    }
    headers = {}
    if settings.SEMANTIC_SCHOLAR_API_KEY:
        headers["x-api-key"] = settings.SEMANTIC_SCHOLAR_API_KEY
        
    papers = []
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, params=params, headers=headers, timeout=10.0)
            resp.raise_for_status()
            data = resp.json().get("data", [])
            for item in data:
                authors = [a.get("name") for a in item.get("authors", []) if a.get("name")]
                pdf_url = item.get("openAccessPdf", {}).get("url") if item.get("openAccessPdf") else ""
                external_ids = item.get("externalIds", {})
                doi = external_ids.get("DOI", "")
                arxiv_id = external_ids.get("ArXiv", "")
                
                paper = {
                    "title": item.get("title", ""),
                    "authors": authors,
                    "abstract": item.get("abstract", "") or "",
                    "published_date": str(item.get("year", "")),
                    "citation_count": item.get("citationCount", 0) or 0,
                    "pdf_url": pdf_url,
                    "doi": doi,
                    "arxiv_id": arxiv_id,
                    "source": "semantic_scholar",
                    "url": item.get("url", "")
                }
                papers.append(paper)
    except Exception as e:
        print(f"Semantic Scholar API error: {e}")
    return papers

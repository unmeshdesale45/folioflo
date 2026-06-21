import httpx

async def search_crossref(query: str, max_results: int = 15) -> list[dict]:
    url = f"https://api.crossref.org/works?query={query}&rows=4"
    headers = {"User-Agent": "ResearchHub/1.0 (mailto:your@email.com)"}
    papers = []
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=headers, timeout=10.0)
            resp.raise_for_status()
            data = resp.json().get("message", {}).get("items", [])
            for item in data:
                authors = []
                for a in item.get("author", []):
                    authors.append(f"{a.get('given', '')} {a.get('family', '')}".strip())
                
                published_date = ""
                pub_parts = item.get("published", {}).get("date-parts", [[]])[0]
                if pub_parts:
                    published_date = "-".join([str(p) for p in pub_parts])
                
                pdf_url = ""
                for link in item.get("link", []):
                    if link.get("content-type") == "application/pdf":
                        pdf_url = link.get("URL")
                        break
                
                abstract = item.get("abstract", "") or item.get("description", "") or ""
                
                paper = {
                    "title": item.get("title", [""])[0],
                    "authors": authors,
                    "abstract": abstract.strip(),
                    "published_date": published_date,
                    "citation_count": item.get("is-referenced-by-count", 0) or 0,
                    "pdf_url": pdf_url,
                    "doi": item.get("DOI", item.get("doi", "")),
                    "arxiv_id": "",
                    "source": "crossref",
                    "url": item.get("URL", "")
                }
                papers.append(paper)
    except Exception as e:
        print(f"CrossRef API error: {e}")
    return papers

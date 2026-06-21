import httpx
import xml.etree.ElementTree as ET

async def search_arxiv(query: str, max_results: int = 15) -> list[dict]:
    url = f"http://export.arxiv.org/api/query?search_query=all:{query}&max_results=6&sortBy=relevance"
    papers = []
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            resp = await client.get(url, timeout=10.0)
            resp.raise_for_status()
            
            root = ET.fromstring(resp.text)
            ns = {"ns": "http://www.w3.org/2005/Atom"}
            for entry in root.findall("ns:entry", ns):
                title_node = entry.find("ns:title", ns)
                title = title_node.text.replace("\n", " ") if title_node is not None else ""
                
                summary_node = entry.find("ns:summary", ns)
                abstract = summary_node.text.replace("\n", " ") if summary_node is not None else ""
                
                authors = [a.find("ns:name", ns).text for a in entry.findall("ns:author", ns) if a.find("ns:name", ns) is not None]
                
                pub_node = entry.find("ns:published", ns)
                published_date = pub_node.text.split("T")[0] if pub_node is not None else ""
                
                pdf_url = ""
                for link in entry.findall("ns:link", ns):
                    if link.get("title") == "pdf":
                        pdf_url = link.get("href")
                        
                id_node = entry.find("ns:id", ns)
                arxiv_id = id_node.text.split("/abs/")[-1] if id_node is not None else ""
                doi = ""
                
                paper = {
                    "title": title.strip(),
                    "authors": authors,
                    "abstract": abstract.strip(),
                    "published_date": published_date,
                    "citation_count": 0,
                    "pdf_url": pdf_url,
                    "doi": doi,
                    "arxiv_id": arxiv_id,
                    "source": "arxiv",
                    "url": id_node.text if id_node is not None else ""
                }
                papers.append(paper)
    except Exception as e:
        print(f"arXiv API error: {e}")
    return papers

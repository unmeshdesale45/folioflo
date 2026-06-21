import asyncio
from typing import List, Dict

from app.services.arxiv_service import search_arxiv
from app.services.semantic_scholar_service import search_semantic_scholar
from app.services.crossref_service import search_crossref

async def fetch_aggregated_papers(query: str, max_results: int = 10) -> List[Dict]:
    results = await asyncio.gather(
        search_arxiv(query, 6),
        search_semantic_scholar(query, 5),
        search_crossref(query, 4),
        return_exceptions=True
    )
    
    all_papers = []
    for result in results:
        if isinstance(result, list):
            all_papers.extend(result)
        else:
            print(f"Aggregator error: {result}")
    
    unique_papers = {}
    for paper in all_papers:
        key = None
        if paper.get("doi"):
            key = f"doi:{paper['doi']}"
        elif paper.get("arxiv_id"):
            key = f"arxiv:{paper['arxiv_id']}"
        else:
            key = f"title:{paper.get('title', '').lower()}"
            
        if key not in unique_papers:
            unique_papers[key] = paper
        else:
            if paper.get("citation_count", 0) > unique_papers[key].get("citation_count", 0):
                paper_copy = unique_papers[key].copy()
                paper_copy["citation_count"] = paper["citation_count"]
                unique_papers[key] = paper_copy
                
    deduped = list(unique_papers.values())
    
    arxiv_papers = [p for p in deduped if p.get("source") == "arxiv"]
    ss_papers = [p for p in deduped if p.get("source") == "semantic_scholar"]
    other_papers = [p for p in deduped if p.get("source") not in ("arxiv", "semantic_scholar")]
    
    ss_papers.sort(key=lambda x: x.get("citation_count", 0), reverse=True)
    other_papers.sort(key=lambda x: x.get("citation_count", 0), reverse=True)
    
    final_list = []
    a_idx, s_idx, o_idx = 0, 0, 0
    while len(final_list) < max_results and (a_idx < len(arxiv_papers) or s_idx < len(ss_papers) or o_idx < len(other_papers)):
        if o_idx < len(other_papers) and len(final_list) < max_results:
            final_list.append(other_papers[o_idx])
            o_idx += 1
        if a_idx < len(arxiv_papers) and len(final_list) < max_results:
            final_list.append(arxiv_papers[a_idx])
            a_idx += 1
        if s_idx < len(ss_papers) and len(final_list) < max_results:
            final_list.append(ss_papers[s_idx])
            s_idx += 1
            
    return final_list

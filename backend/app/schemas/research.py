from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime

class SearchRequest(BaseModel):
    query: str
    max_results: int = 15

class ResearchPaperSchema(BaseModel):
    id: int
    title: str
    authors: List[str]
    abstract: str
    ai_summary: str
    arxiv_id: str | None = None
    doi: str | None = None
    published_date: str | None = None
    citation_count: int
    pdf_url: str | None = None
    source: str
    url: str | None = None

class ResearchQueryResponse(BaseModel):
    query_id: int
    query: str
    papers: List[ResearchPaperSchema]
    workflow: Dict[str, Any]
    tech_stack: Dict[str, Any]
    created_at: datetime

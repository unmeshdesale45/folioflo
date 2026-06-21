from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import json

from app.database import get_db
from app.models.user import User
from app.models.query import ResearchQuery
from app.models.paper import ResearchPaper
from app.schemas.research import SearchRequest, ResearchQueryResponse, ResearchPaperSchema
from app.core.dependencies import get_current_user
from app.services.aggregator_service import fetch_aggregated_papers
from app.services.ai_service import generate_all
from app import cache

router = APIRouter(prefix="/api/research", tags=["research"])

@router.post("/search", response_model=ResearchQueryResponse)
async def search_papers(request: SearchRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    if len(request.query) > 500:
        raise HTTPException(status_code=400, detail="Query too long")
        
    cache_key = f"search:{current_user.id}:{request.query}:{request.max_results}"
    cached_result = cache.get(cache_key)
    if cached_result:
        return cached_result
        
    papers = await fetch_aggregated_papers(request.query, request.max_results)
    ai_result = await generate_all(request.query, papers)
    
    summaries_list = ai_result.get("summaries", [])
    if summaries_list and isinstance(summaries_list, list):
        if all(s.get("paper_index") is None for s in summaries_list):
            for i, s in enumerate(summaries_list):
                s["paper_index"] = i
                
    summaries_dict = {
        int(s.get("paper_index", -1)) if s.get("paper_index") is not None else -1: s.get("summary", "") 
        for s in summaries_list
    }
    
    for i, p in enumerate(papers):
        p["ai_summary"] = summaries_dict.get(i, "")
        
    workflow = ai_result.get("workflow", {})
    tech_stack = ai_result.get("tech_stack", {})
    
    new_query = ResearchQuery(
        user_id=current_user.id,
        query_text=request.query,
        workflow=json.dumps(workflow),
        tech_stack=json.dumps(tech_stack)
    )
    db.add(new_query)
    await db.commit()
    await db.refresh(new_query)
    
    db_papers = []
    for p in papers:
        summary_text = p.get("ai_summary", "") or ""
        if not summary_text.strip():
            print(f"⚠️ [WARNING] Saving paper with EMPTY ai_summary! Title: {p.get('title', 'Unknown Title')}")
            
        db_paper = ResearchPaper(
            query_id=new_query.id,
            title=p.get("title", ""),
            authors=json.dumps(p.get("authors", [])),
            abstract=p.get("abstract", "") or "",
            ai_summary=summary_text,
            arxiv_id=p.get("arxiv_id", "") or "",
            doi=p.get("doi", "") or "",
            published_date=p.get("published_date", "") or "",
            citation_count=p.get("citation_count", 0) or 0,
            pdf_url=p.get("pdf_url", "") or "",
            source=p.get("source", "")
        )
        db_papers.append(db_paper)
    
    db.add_all(db_papers)
    await db.commit()
    
    for db_paper in db_papers:
        await db.refresh(db_paper)
    
    paper_schemas = []
    for dp, p in zip(db_papers, papers):
        paper_schemas.append(ResearchPaperSchema(
            id=dp.id,
            title=dp.title,
            authors=json.loads(dp.authors) if dp.authors else [],
            abstract=dp.abstract,
            ai_summary=dp.ai_summary,
            arxiv_id=dp.arxiv_id,
            doi=dp.doi,
            published_date=dp.published_date,
            citation_count=dp.citation_count,
            pdf_url=dp.pdf_url,
            source=dp.source,
            url=p.get("url")
        ))
        
    response_data = ResearchQueryResponse(
        query_id=new_query.id,
        query=new_query.query_text,
        papers=paper_schemas,
        workflow=workflow,
        tech_stack=tech_stack,
        created_at=new_query.created_at
    )
    
    cache.set(cache_key, response_data)
    return response_data

@router.get("/history")
async def get_history(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(ResearchQuery)
        .where(ResearchQuery.user_id == current_user.id)
        .order_by(ResearchQuery.created_at.desc())
    )
    queries = result.scalars().all()
    history = []
    for q in queries:
        history.append({
            "id": q.id,
            "query_text": q.query_text,
            "created_at": q.created_at,
            "workflow": json.loads(q.workflow) if q.workflow else {},
            "tech_stack": json.loads(q.tech_stack) if q.tech_stack else {}
        })
    return history

@router.get("/{id}")
async def get_query(id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(ResearchQuery).where(ResearchQuery.id == id, ResearchQuery.user_id == current_user.id))
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Query not found")
        
    p_result = await db.execute(select(ResearchPaper).where(ResearchPaper.query_id == id))
    papers = p_result.scalars().all()
    
    paper_schemas = []
    for dp in papers:
        paper_schemas.append({
            "id": dp.id,
            "title": dp.title,
            "authors": json.loads(dp.authors) if dp.authors else [],
            "abstract": dp.abstract,
            "ai_summary": dp.ai_summary,
            "arxiv_id": dp.arxiv_id,
            "doi": dp.doi,
            "published_date": dp.published_date,
            "citation_count": dp.citation_count,
            "pdf_url": dp.pdf_url,
            "source": dp.source,
            "url": None
        })
        
    return {
        "query_id": q.id,
        "query": q.query_text,
        "papers": paper_schemas,
        "workflow": json.loads(q.workflow) if q.workflow else {},
        "tech_stack": json.loads(q.tech_stack) if q.tech_stack else {},
        "created_at": q.created_at
    }

@router.delete("/{id}")
async def delete_query(id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(ResearchQuery).where(ResearchQuery.id == id, ResearchQuery.user_id == current_user.id))
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Query not found")
        
    await db.delete(q)
    await db.commit()
    return {"status": "success"}

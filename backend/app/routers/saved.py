from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models.user import User
from app.models.saved import SavedResult
from app.models.query import ResearchQuery
from app.schemas.saved import SavedResultCreate, SavedResultOut
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/saved", tags=["saved"])

@router.post("/", response_model=SavedResultOut)
async def save_result(saved: SavedResultCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.paper import ResearchPaper
    res = await db.execute(select(ResearchPaper).where(ResearchPaper.id == saved.paper_id, ResearchPaper.query_id == saved.query_id))
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    db_saved = SavedResult(
        user_id=current_user.id,
        query_id=saved.query_id,
        paper_id=saved.paper_id,
        notes=saved.notes
    )
    db.add(db_saved)
    await db.commit()
    await db.refresh(db_saved)
    return {
        "id": db_saved.id,
        "user_id": db_saved.user_id,
        "query_id": db_saved.query_id,
        "paper_id": db_saved.paper_id,
        "notes": db_saved.notes,
        "saved_at": db_saved.saved_at,
        "paper": None
    }

@router.get("/", response_model=list[SavedResultOut])
async def get_saved(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.paper import ResearchPaper
    import json
    
    query = select(SavedResult, ResearchPaper).join(ResearchPaper, SavedResult.paper_id == ResearchPaper.id).where(SavedResult.user_id == current_user.id).order_by(SavedResult.saved_at.desc())
    res = await db.execute(query)
    
    results = []
    for saved_row, paper_row in res.all():
        results.append({
            "id": saved_row.id,
            "user_id": saved_row.user_id,
            "query_id": saved_row.query_id,
            "paper_id": saved_row.paper_id,
            "notes": saved_row.notes,
            "saved_at": saved_row.saved_at,
            "paper": {
                "id": paper_row.id,
                "title": paper_row.title,
                "authors": json.loads(paper_row.authors) if paper_row.authors else [],
                "abstract": paper_row.abstract,
                "ai_summary": paper_row.ai_summary,
                "arxiv_id": paper_row.arxiv_id,
                "doi": paper_row.doi,
                "published_date": paper_row.published_date,
                "citation_count": paper_row.citation_count,
                "pdf_url": paper_row.pdf_url,
                "source": paper_row.source,
                "url": None
            }
        })
    return results

@router.delete("/{id}")
async def delete_saved(id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    res = await db.execute(select(SavedResult).where(SavedResult.id == id, SavedResult.user_id == current_user.id))
    saved = res.scalar_one_or_none()
    if not saved:
        raise HTTPException(status_code=404, detail="Saved result not found")
        
    await db.delete(saved)
    await db.commit()
    return {"status": "success"}

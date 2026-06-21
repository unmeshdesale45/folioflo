from pydantic import BaseModel
from datetime import datetime
from app.schemas.research import ResearchPaperSchema

class SavedResultCreate(BaseModel):
    query_id: int
    paper_id: int
    notes: str | None = None

class SavedResultOut(BaseModel):
    id: int
    user_id: int
    query_id: int
    paper_id: int | None = None
    notes: str | None = None
    saved_at: datetime
    paper: ResearchPaperSchema | None = None
    saved_at: datetime

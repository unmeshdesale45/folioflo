from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.schemas.research import ResearchPaperSchema

class ActivityLogOut(BaseModel):
    id: int
    action: str
    entity_type: Optional[str]
    username: str
    created_at: datetime


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class ProjectOut(ProjectBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    paper_count: int = 0
    document_count: int = 0
    role: str = "owner"
    owner_username: Optional[str] = None
    member_count: int = 1

class ProjectMemberOut(BaseModel):
    id: int
    user_id: int
    email: str
    username: str
    role: str
    joined_at: datetime

class ProjectMemberCreate(BaseModel):
    email: str
    role: str = "collaborator"

class ProjectAddPaper(BaseModel):
    paper_id: int

class ProjectNoteUpdate(BaseModel):
    content: str

class ProjectNoteOut(BaseModel):
    id: int
    project_id: int
    content: Optional[str]
    updated_at: datetime

class ProjectDocumentBase(BaseModel):
    title: str
    content: Optional[str] = None

class ProjectDocumentCreate(ProjectDocumentBase):
    pass

class ProjectDocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class ProjectDocumentOut(ProjectDocumentBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime

class ProjectWithDetailsOut(ProjectOut):
    papers: List[ResearchPaperSchema] = []
    note: Optional[ProjectNoteOut] = None
    documents: List[ProjectDocumentOut] = []

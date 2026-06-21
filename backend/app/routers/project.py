from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, delete
import json

from app.utils.pdf_generator import generate_project_pdf

from app.database import get_db
from app.models.user import User
from app.models.project import Project, ProjectPaper, ProjectNote, ProjectDocument, ProjectMember
from app.models.paper import ResearchPaper
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectOut, ProjectWithDetailsOut,
    ProjectNoteUpdate, ProjectNoteOut,
    ProjectDocumentCreate, ProjectDocumentUpdate, ProjectDocumentOut,
    ProjectAddPaper, ProjectMemberOut, ProjectMemberCreate
)
from app.core.dependencies import get_current_user
from app.models.project import ActivityLog
from app.models.notification import Notification
from app.services.email_service import send_invite_email

async def log_activity(db: AsyncSession, project_id: int, user_id: int, action: str, entity_type: str = None, entity_name: str = None):
    log = ActivityLog(project_id=project_id, user_id=user_id, action=action, entity_type=entity_type, entity_name=entity_name)
    db.add(log)

async def notify_members_except(db: AsyncSession, project_id: int, exclude_user_id: int, message: str):
    m_res = await db.execute(select(ProjectMember.user_id).where(ProjectMember.project_id == project_id, ProjectMember.user_id != exclude_user_id))
    members = m_res.scalars().all()
    for m_id in members:
        notif = Notification(user_id=m_id, project_id=project_id, message=message)
        db.add(notif)

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.get("/", response_model=list[ProjectOut])
async def list_projects(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        m_res = await db.execute(
            select(ProjectMember).where(ProjectMember.user_id == current_user.id)
        )
        members = m_res.scalars().all()
        project_ids = [m.project_id for m in members]
        
        if not project_ids:
            return []
            
        res = await db.execute(
            select(Project).where(Project.id.in_(project_ids)).order_by(Project.created_at.desc())
        )
        projects = res.scalars().all()
        
        out = []
        for p in projects:
            papers_res = await db.execute(select(func.count(ProjectPaper.id)).where(ProjectPaper.project_id == p.id))
            docs_res = await db.execute(select(func.count(ProjectDocument.id)).where(ProjectDocument.project_id == p.id))
            role_res = await db.execute(select(ProjectMember.role).where(ProjectMember.project_id == p.id, ProjectMember.user_id == current_user.id))
            role = role_res.scalars().first() or "collaborator"
            
            owner_res = await db.execute(select(User.username).join(ProjectMember, ProjectMember.user_id == User.id).where(ProjectMember.project_id == p.id, ProjectMember.role == 'owner'))
            owner_username = owner_res.scalars().first()
            
            members_count_res = await db.execute(select(func.count(ProjectMember.id)).where(ProjectMember.project_id == p.id))
            member_count = members_count_res.scalar() or 1
            
            out.append({
                "id": p.id,
                "user_id": p.user_id,
                "name": p.name,
                "description": p.description,
                "created_at": p.created_at,
                "updated_at": p.updated_at,
                "paper_count": papers_res.scalar() or 0,
                "document_count": docs_res.scalar() or 0,
                "role": role,
                "owner_username": owner_username,
                "member_count": member_count
            })
        return out
        
    except Exception as e:
        print(f"=== GET PROJECTS ERROR: {e} ===")
        import traceback
        traceback.print_exc()
        raise

@router.post("/", response_model=ProjectOut)
async def create_project(project: ProjectCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_proj = Project(user_id=current_user.id, name=project.name, description=project.description)
    db.add(db_proj)
    await db.commit()          # ← THIS MUST EXIST
    await db.refresh(db_proj)
    
    existing_owner = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == db_proj.id,
            ProjectMember.user_id == current_user.id
        )
    )
    if not existing_owner.scalars().first():
        owner_member = ProjectMember(
            project_id=db_proj.id,
            user_id=current_user.id,
            role="owner",
            invited_by=current_user.id
        )
        db.add(owner_member)
        await db.commit()
    
    return {
        "id": db_proj.id,
        "name": db_proj.name,
        "description": db_proj.description,
        "created_at": db_proj.created_at,
        "updated_at": db_proj.updated_at,
        "user_id": db_proj.user_id,
        "paper_count": 0,
        "document_count": 0,
        "role": "owner",
        "owner_username": current_user.username,
        "member_count": 1
    }

@router.get("/{id}", response_model=ProjectWithDetailsOut)
async def get_project(id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        p_res = await db.execute(select(Project).join(ProjectMember, ProjectMember.project_id == Project.id).where(Project.id == id, ProjectMember.user_id == current_user.id))
        p = p_res.scalars().first()
        if not p:
            raise HTTPException(status_code=404, detail="Project not found")

        papers_res = await db.execute(select(ResearchPaper).join(ProjectPaper, ProjectPaper.paper_id == ResearchPaper.id).where(ProjectPaper.project_id == id))
        papers_db = papers_res.scalars().all()

        papers = []
        for paper_row in papers_db:
            papers.append({
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
            })

        note_res = await db.execute(select(ProjectNote).where(ProjectNote.project_id == id))
        note = note_res.scalars().first()

        docs_res = await db.execute(select(ProjectDocument).where(ProjectDocument.project_id == id))
        docs = docs_res.scalars().all()

        role_res = await db.execute(select(ProjectMember.role).where(ProjectMember.project_id == id, ProjectMember.user_id == current_user.id))
        role = role_res.scalars().first() or "collaborator"
        
        owner_res = await db.execute(select(User.username).join(ProjectMember, ProjectMember.user_id == User.id).where(ProjectMember.project_id == id, ProjectMember.role == 'owner'))
        owner_username = owner_res.scalars().first() or "Owner"
        
        members_count_res = await db.execute(select(func.count(ProjectMember.id)).where(ProjectMember.project_id == id))
        member_count = members_count_res.scalar() or 1

        return {
            "id": p.id,
            "user_id": p.user_id,
            "name": p.name,
            "description": p.description,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
            "paper_count": len(papers),
            "document_count": len(docs),
            "role": role,
            "owner_username": owner_username,
            "member_count": member_count,
            "papers": papers,
            "note": note,
            "documents": docs
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"=== GET PROJECT DETAIL ERROR: {e} ===")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{id}", response_model=ProjectOut)
async def update_project(id: int, project: ProjectUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    p_res = await db.execute(select(Project).join(ProjectMember, ProjectMember.project_id == Project.id).where(Project.id == id, ProjectMember.user_id == current_user.id))
    p = p_res.scalars().first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.name is not None:
        p.name = project.name
    if project.description is not None:
        p.description = project.description
    await db.commit()
    await db.refresh(p)
    
    papers_res = await db.execute(select(func.count(ProjectPaper.id)).where(ProjectPaper.project_id == p.id))
    docs_res = await db.execute(select(func.count(ProjectDocument.id)).where(ProjectDocument.project_id == p.id))
        
    role_res = await db.execute(select(ProjectMember.role).where(ProjectMember.project_id == id, ProjectMember.user_id == current_user.id))
    role = role_res.scalar() or "collaborator"
    
    owner_res = await db.execute(select(User.username).join(ProjectMember, ProjectMember.user_id == User.id).where(ProjectMember.project_id == id, ProjectMember.role == 'owner'))
    owner_username = owner_res.scalars().first()
    
    members_count_res = await db.execute(select(func.count(ProjectMember.id)).where(ProjectMember.project_id == id))
    member_count = members_count_res.scalar() or 1

    return {
        "id": p.id,
        "user_id": p.user_id,
        "name": p.name,
        "description": p.description,
        "created_at": p.created_at,
        "updated_at": p.updated_at,
        "paper_count": papers_res.scalar() or 0,
        "document_count": docs_res.scalar() or 0,
        "role": role,
        "owner_username": owner_username,
        "member_count": member_count
    }

@router.delete("/{id}")
async def delete_project(id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    p_res = await db.execute(select(Project).join(ProjectMember, ProjectMember.project_id == Project.id).where(Project.id == id, ProjectMember.user_id == current_user.id, ProjectMember.role == 'owner'))
    p = p_res.scalars().first()
    if not p:
        raise HTTPException(status_code=403, detail="Not authorized to delete this project")
    
    await db.execute(delete(ActivityLog).where(ActivityLog.project_id == id))
    await db.execute(delete(Notification).where(Notification.project_id == id))
    await db.execute(delete(ProjectMember).where(ProjectMember.project_id == id))
    await db.execute(delete(ProjectPaper).where(ProjectPaper.project_id == id))
    await db.execute(delete(ProjectNote).where(ProjectNote.project_id == id))
    await db.execute(delete(ProjectDocument).where(ProjectDocument.project_id == id))
    await db.execute(delete(Project).where(Project.id == id))
    
    await db.commit()
    return {"status": "success"}

@router.post("/{id}/papers/")
async def add_paper_to_project(id: int, body: ProjectAddPaper, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    p_res = await db.execute(select(Project).join(ProjectMember, ProjectMember.project_id == Project.id).where(Project.id == id, ProjectMember.user_id == current_user.id))
    p = p_res.scalars().first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    pp = ProjectPaper(project_id=id, paper_id=body.paper_id)
    db.add(pp)
    
    paper_res = await db.execute(select(ResearchPaper.title).where(ResearchPaper.id == body.paper_id))
    paper_title = paper_res.scalars().first() or "Unknown Paper"
    
    await log_activity(db, id, current_user.id, f"Added paper \"{paper_title}\" to the project", "paper", paper_title)
    await notify_members_except(db, id, current_user.id, f"{current_user.username} added a paper to '{p.name}'")
    
    await db.commit()
    return {"status": "success"}

@router.delete("/{id}/papers/{paper_id}")
async def remove_paper_from_project(id: int, paper_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    p_res = await db.execute(select(Project).join(ProjectMember, ProjectMember.project_id == Project.id).where(Project.id == id, ProjectMember.user_id == current_user.id))
    if not p_res.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")
    
    pp_res = await db.execute(select(ProjectPaper).where(ProjectPaper.project_id == id, ProjectPaper.paper_id == paper_id))
    pp = pp_res.scalars().first()
    if pp:
        paper_res = await db.execute(select(ResearchPaper.title).where(ResearchPaper.id == paper_id))
        paper_title = paper_res.scalars().first() or "Unknown Paper"
        
        await log_activity(db, id, current_user.id, f"Removed paper \"{paper_title}\" from the project", "paper", paper_title)
        
        await db.delete(pp)
        await db.commit()
    return {"status": "success"}

@router.get("/{id}/notes/")
async def get_project_note(id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    p_res = await db.execute(select(Project).join(ProjectMember, ProjectMember.project_id == Project.id).where(Project.id == id, ProjectMember.user_id == current_user.id))
    if not p_res.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")
    
    note_res = await db.execute(select(ProjectNote).where(ProjectNote.project_id == id))
    note = note_res.scalars().first()
    
    return {"content": note.content if note else ""}

@router.put("/{id}/notes/", response_model=ProjectNoteOut)
async def upsert_project_note(id: int, body: ProjectNoteUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    p_res = await db.execute(select(Project).join(ProjectMember, ProjectMember.project_id == Project.id).where(Project.id == id, ProjectMember.user_id == current_user.id))
    p = p_res.scalars().first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    
    note_res = await db.execute(select(ProjectNote).where(ProjectNote.project_id == id))
    note = note_res.scalars().first()
    
    print(f"=== SAVE NOTE CALLED ===")
    print(f"project_id: {id}")
    print(f"content: {body.content}")

    if note:
        note.content = body.content
    else:
        note = ProjectNote(project_id=id, content=body.content)
        db.add(note)
    
    await log_activity(db, id, current_user.id, "Updated project notes", "note", "Project Notes")
    await notify_members_except(db, id, current_user.id, f"{current_user.username} updated notes in '{p.name}'")
    
    await db.commit()
    await db.refresh(note)
    return note

@router.get("/{id}/documents/", response_model=list[ProjectDocumentOut])
async def list_documents(id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    p_res = await db.execute(select(Project).join(ProjectMember, ProjectMember.project_id == Project.id).where(Project.id == id, ProjectMember.user_id == current_user.id))
    if not p_res.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")
    
    docs_res = await db.execute(select(ProjectDocument).where(ProjectDocument.project_id == id))
    return docs_res.scalars().all()

@router.post("/{id}/documents/", response_model=ProjectDocumentOut)
async def create_document(id: int, body: ProjectDocumentCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    p_res = await db.execute(select(Project).join(ProjectMember, ProjectMember.project_id == Project.id).where(Project.id == id, ProjectMember.user_id == current_user.id))
    p = p_res.scalars().first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    
    doc = ProjectDocument(project_id=id, title=body.title, content=body.content)
    db.add(doc)
    
    await log_activity(db, id, current_user.id, f"Created document \"{body.title}\"", "document", body.title)
    await notify_members_except(db, id, current_user.id, f"{current_user.username} created a document in '{p.name}'")
    
    await db.commit()
    await db.refresh(doc)
    return doc

@router.put("/{id}/documents/{doc_id}", response_model=ProjectDocumentOut)
async def update_document(id: int, doc_id: int, body: ProjectDocumentUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    p_res = await db.execute(select(Project).join(ProjectMember, ProjectMember.project_id == Project.id).where(Project.id == id, ProjectMember.user_id == current_user.id))
    p = p_res.scalars().first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
        
    doc_res = await db.execute(select(ProjectDocument).where(ProjectDocument.id == doc_id, ProjectDocument.project_id == id))
    doc = doc_res.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if body.title is not None:
        doc.title = body.title
    if body.content is not None:
        doc.content = body.content
        
    await log_activity(db, id, current_user.id, f"Updated document \"{doc.title}\"", "document", doc.title)
        
    await db.commit()
    await db.refresh(doc)
    return doc

@router.delete("/{id}/documents/{doc_id}")
async def delete_document(id: int, doc_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    p_res = await db.execute(select(Project).join(ProjectMember, ProjectMember.project_id == Project.id).where(Project.id == id, ProjectMember.user_id == current_user.id))
    if not p_res.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")
        
    doc_res = await db.execute(select(ProjectDocument).where(ProjectDocument.id == doc_id, ProjectDocument.project_id == id))
    doc = doc_res.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    await log_activity(db, id, current_user.id, f"Deleted document \"{doc.title}\"", "document", doc.title)
        
    await db.delete(doc)
    await db.commit()
    return {"status": "success"}

@router.get("/{id}/export-pdf/")
async def export_project_pdf(id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    p_res = await db.execute(select(Project).join(ProjectMember, ProjectMember.project_id == Project.id).where(Project.id == id, ProjectMember.user_id == current_user.id))
    p = p_res.scalars().first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    papers_res = await db.execute(select(ResearchPaper).join(ProjectPaper, ProjectPaper.paper_id == ResearchPaper.id).where(ProjectPaper.project_id == id))
    papers_db = papers_res.scalars().all()
    papers = []
    for paper_row in papers_db:
        papers.append({
            "title": paper_row.title,
            "authors": json.loads(paper_row.authors) if paper_row.authors else [],
            "abstract": paper_row.abstract,
            "ai_summary": paper_row.ai_summary,
            "source": paper_row.source,
            "published_date": paper_row.published_date
        })

    note_res = await db.execute(select(ProjectNote).where(ProjectNote.project_id == id))
    note = note_res.scalars().first()

    docs_res = await db.execute(select(ProjectDocument).where(ProjectDocument.project_id == id))
    docs = docs_res.scalars().all()

    pdf_buffer = generate_project_pdf(project=p, papers=papers, note=note, documents=docs)

    filename = f"{p.name.replace(' ', '_')}_report.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

@router.get("/{id}/members/", response_model=list[ProjectMemberOut])
async def get_project_members(id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    p_res = await db.execute(select(Project).join(ProjectMember, ProjectMember.project_id == Project.id).where(Project.id == id, ProjectMember.user_id == current_user.id))
    if not p_res.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")
        
    m_res = await db.execute(
        select(ProjectMember, User.email, User.username)
        .join(User, User.id == ProjectMember.user_id)
        .where(ProjectMember.project_id == id)
    )
    members = m_res.all()
    out = []
    for m, email, username in members:
        out.append({
            "id": m.id,
            "user_id": m.user_id,
            "email": email,
            "username": username,
            "role": m.role,
            "joined_at": m.joined_at
        })
    return out

@router.post("/{id}/members/", response_model=ProjectMemberOut)
async def add_project_member(id: int, body: ProjectMemberCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    p_res = await db.execute(select(Project).join(ProjectMember, ProjectMember.project_id == Project.id).where(Project.id == id, ProjectMember.user_id == current_user.id, ProjectMember.role == 'owner'))
    p = p_res.scalars().first()
    if not p:
        raise HTTPException(status_code=403, detail="Not authorized. Only owners can manage members.")

    u_res = await db.execute(select(User).where(User.email == body.email))
    user_to_add = u_res.scalars().first()
    if not user_to_add:
        raise HTTPException(status_code=404, detail="No user found with this email. They must have a ResearchHub account first.")

    # Check if already a member
    m_res = await db.execute(select(ProjectMember).where(ProjectMember.project_id == id, ProjectMember.user_id == user_to_add.id))
    existing_member = m_res.scalars().first()
    if existing_member:
        raise HTTPException(status_code=400, detail="This user is already a collaborator on this project.")

    m_new = ProjectMember(project_id=id, user_id=user_to_add.id, role=body.role, invited_by=current_user.id)
    db.add(m_new)
    
    await log_activity(db, id, current_user.id, f"Invited {user_to_add.username} as collaborator", "member", user_to_add.username)
    notif = Notification(user_id=user_to_add.id, project_id=id, message=f"{current_user.username} invited you to collaborate on '{p.name}'")
    db.add(notif)
    
    await db.commit()
    await db.refresh(m_new)
    
    try:
        send_invite_email(
            to_email=user_to_add.email,
            project_name=p.name,
            inviter_username=current_user.username
        )
    except Exception as e:
        print(f"Error calling send_invite_email: {e}")

    
    return {
        "id": m_new.id,
        "user_id": m_new.user_id,
        "email": user_to_add.email,
        "username": user_to_add.username,
        "role": m_new.role,
        "joined_at": m_new.joined_at
    }

@router.delete("/{id}/members/{user_id}")
async def remove_project_member(id: int, user_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    p_res = await db.execute(select(Project).join(ProjectMember, ProjectMember.project_id == Project.id).where(Project.id == id, ProjectMember.user_id == current_user.id, ProjectMember.role == 'owner'))
    if not p_res.scalars().first():
        raise HTTPException(status_code=403, detail="Not authorized. Only owners can remove members.")

    m_res = await db.execute(select(ProjectMember).where(ProjectMember.project_id == id, ProjectMember.user_id == user_id))
    m = m_res.scalars().first()
    if not m:
        raise HTTPException(status_code=404, detail="Member not found.")
        
    if m.role == 'owner':
        raise HTTPException(status_code=400, detail="Owner cannot be removed.")

    user_res = await db.execute(select(User.username).where(User.id == user_id))
    member_username = user_res.scalars().first() or "User"
    
    await log_activity(db, id, current_user.id, f"Removed collaborator {member_username}", "member", member_username)

    await db.delete(m)
    await db.commit()
    return {"status": "success"}

@router.get("/{id}/activity/", response_model=list[dict])
async def get_project_activity(id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    p_res = await db.execute(select(Project).join(ProjectMember, ProjectMember.project_id == Project.id).where(Project.id == id, ProjectMember.user_id == current_user.id))
    if not p_res.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")

    act_res = await db.execute(
        select(ActivityLog, User.username)
        .join(User, User.id == ActivityLog.user_id)
        .where(ActivityLog.project_id == id)
        .order_by(ActivityLog.created_at.desc())
        .limit(50)
    )
    activities = act_res.all()
    
    out = []
    for log, username in activities:
        out.append({
            "id": log.id,
            "action": log.action,
            "entity_type": log.entity_type,
            "username": username,
            "created_at": log.created_at
        })
    return out

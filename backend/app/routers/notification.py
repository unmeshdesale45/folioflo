from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.notification import Notification
from app.schemas.notification import NotificationListOut, NotificationOut
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@router.get("/", response_model=NotificationListOut)
async def list_notifications(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    res = await db.execute(
        select(Notification, Project.name)
        .join(Project, Project.id == Notification.project_id)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
    )
    items = res.all()
    
    out_list = []
    unread_count = 0
    for notif, p_name in items:
        if not notif.is_read:
            unread_count += 1
            
        out_list.append({
            "id": notif.id,
            "user_id": notif.user_id,
            "project_id": notif.project_id,
            "message": notif.message,
            "is_read": notif.is_read,
            "created_at": notif.created_at,
            "project_name": p_name
        })
        
    return {
        "notifications": out_list,
        "unread_count": unread_count
    }

@router.put("/{id}/read/")
async def mark_notification_read(id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    res = await db.execute(select(Notification).where(Notification.id == id, Notification.user_id == current_user.id))
    notif = res.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.is_read = True
    await db.commit()
    return {"status": "success"}

@router.put("/read-all/")
async def mark_all_notifications_read(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    res = await db.execute(select(Notification).where(Notification.user_id == current_user.id, Notification.is_read == False))
    notifs = res.scalars().all()
    
    for notif in notifs:
        notif.is_read = True
        
    await db.commit()
    return {"status": "success"}

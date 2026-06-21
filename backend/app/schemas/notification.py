from pydantic import BaseModel
from typing import List
from datetime import datetime

class NotificationOut(BaseModel):
    id: int
    user_id: int
    project_id: int
    message: str
    is_read: bool
    created_at: datetime
    project_name: str

class NotificationListOut(BaseModel):
    notifications: List[NotificationOut]
    unread_count: int

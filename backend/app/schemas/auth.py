from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str | None = None

class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: str | None = None
    is_active: bool

class Token(BaseModel):
    access_token: str
    token_type: str

class UsernameUpdate(BaseModel):
    new_username: str
    password: str

class ProfileOut(BaseModel):
    username: str
    email: EmailStr
    created_at: datetime

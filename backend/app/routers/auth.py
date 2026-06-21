from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserCreate, UserOut, Token, UsernameUpdate, ProfileOut
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserOut)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    if not re.match(r"^[a-zA-Z0-9_]{3,20}$", user.username):
        raise HTTPException(status_code=400, detail="Username must be 3-20 characters long and contain only letters, numbers, and underscores.")

    result_username = await db.execute(select(User).where(User.username == user.username))
    if result_username.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="This username is already taken. Please choose another.")

    result = await db.execute(select(User).where(User.email == user.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/profile", response_model=ProfileOut)
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile/update-username")
async def update_username(
    update_data: UsernameUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(update_data.password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password")

    if not re.match(r"^[a-zA-Z0-9_]{3,20}$", update_data.new_username):
        raise HTTPException(status_code=400, detail="Username must be 3-20 characters long and contain only letters, numbers, and underscores.")

    if update_data.new_username == current_user.username:
        return {"message": "Username updated successfully", "username": current_user.username}

    result_username = await db.execute(select(User).where(User.username == update_data.new_username))
    if result_username.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="This username is already taken")

    current_user.username = update_data.new_username
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    
    return {"message": "Username updated successfully", "username": current_user.username}

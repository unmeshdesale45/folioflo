from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.auth import router as auth_router
from app.routers.research import router as research_router
from app.routers.saved import router as saved_router
from app.routers.chat import router as chat_router
from app.routers.ai import router as ai_router
from app.routers.project import router as project_router
from app.routers.notification import router as notification_router

app = FastAPI(title="ResearchHub API")

from app.database import engine, Base
from app.models import User, ResearchQuery, ResearchPaper, SavedResult, Project, Notification

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("=== Database tables created ===")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://folioflo-sandy.vercel.app",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(research_router)
app.include_router(saved_router)
app.include_router(chat_router)
app.include_router(ai_router)
app.include_router(project_router)
app.include_router(notification_router)

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

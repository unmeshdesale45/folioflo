from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class SavedResult(Base):
    __tablename__ = "saved_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    query_id = Column(Integer, ForeignKey("research_queries.id"))
    paper_id = Column(Integer, ForeignKey("research_papers.id"), nullable=True)
    saved_at = Column(DateTime, server_default=func.now())
    notes = Column(Text)

from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class ResearchQuery(Base):
    __tablename__ = "research_queries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    query_text = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    workflow = Column(Text) # JSON string
    tech_stack = Column(Text) # JSON string

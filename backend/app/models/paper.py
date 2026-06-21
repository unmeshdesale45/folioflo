from sqlalchemy import Column, Integer, String, Text, ForeignKey
from app.database import Base

class ResearchPaper(Base):
    __tablename__ = "research_papers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    query_id = Column(Integer, ForeignKey("research_queries.id", ondelete="CASCADE"))
    title = Column(Text, nullable=False)
    authors = Column(Text) # JSON array string
    abstract = Column(Text)
    ai_summary = Column(Text)
    arxiv_id = Column(String(30))
    doi = Column(String(120))
    published_date = Column(String(20))
    citation_count = Column(Integer, default=0)
    pdf_url = Column(Text)
    source = Column(String(30)) # arxiv | semantic_scholar | crossref

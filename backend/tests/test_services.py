import pytest
import xml.etree.ElementTree as ET
import re
from app.services.arxiv_service import search_arxiv
from app.services.semantic_scholar_service import search_semantic_scholar
from app.services.crossref_service import search_crossref
from app.services.aggregator_service import fetch_aggregated_papers

@pytest.mark.asyncio
async def test_arxiv_service(httpx_mock):
    xml_data = """<?xml version="1.0" encoding="UTF-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
        <entry>
            <id>http://arxiv.org/abs/1234.5678</id>
            <title>Test Paper Arxiv</title>
            <summary>Test summary</summary>
            <author><name>Author One</name></author>
            <published>2023-01-01T00:00:00Z</published>
            <link title="pdf" href="http://arxiv.org/pdf/1234.5678"/>
        </entry>
    </feed>
    """
    httpx_mock.add_response(url="http://export.arxiv.org/api/query?search_query=all:test&max_results=1&sortBy=relevance", text=xml_data)
    
    papers = await search_arxiv("test", 1)
    assert len(papers) == 1
    assert papers[0]["title"] == "Test Paper Arxiv"
    assert papers[0]["arxiv_id"] == "1234.5678"
    assert papers[0]["source"] == "arxiv"

@pytest.mark.asyncio
async def test_semantic_scholar_service(httpx_mock):
    json_data = {
        "data": [{
            "title": "Test Paper SS",
            "authors": [{"name": "Author Two"}],
            "year": 2023,
            "abstract": "Test abstract",
            "citationCount": 5,
            "externalIds": {"DOI": "10.123/ss"},
            "openAccessPdf": {"url": "http://ss.com/pdf"}
        }]
    }
    httpx_mock.add_response(url=re.compile(r".*api.semanticscholar.org.*"), json=json_data)
    
    papers = await search_semantic_scholar("test", 1)
    assert len(papers) == 1
    assert papers[0]["title"] == "Test Paper SS"
    assert papers[0]["citation_count"] == 5

@pytest.mark.asyncio
async def test_crossref_service(httpx_mock):
    json_data = {
        "message": {
            "items": [{
                "title": ["Test Paper CR"],
                "author": [{"given": "Author", "family": "Three"}],
                "abstract": "Test crossref",
                "is-referenced-by-count": 10,
                "DOI": "10.123/cr",
                "published": {"date-parts": [[2023, 1, 1]]}
            }]
        }
    }
    httpx_mock.add_response(url=re.compile(r".*api.crossref.org.*"), json=json_data)
    
    papers = await search_crossref("test", 1)
    assert len(papers) == 1
    assert papers[0]["title"] == "Test Paper CR"

@pytest.mark.asyncio
async def test_aggregator_service(httpx_mock):
    httpx_mock.add_response(url=re.compile(r".*arxiv.org.*"), text="<feed xmlns='http://www.w3.org/2005/Atom'></feed>")
    httpx_mock.add_response(url=re.compile(r".*api.semanticscholar.org.*"), json={"data": []})
    httpx_mock.add_response(url=re.compile(r".*api.crossref.org.*"), json={"message": {"items": []}})
    
    papers = await fetch_aggregated_papers("test", 10)
    assert isinstance(papers, list)
    assert len(papers) == 0

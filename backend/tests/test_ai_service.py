import pytest
from unittest.mock import MagicMock, patch
from app.services.ai_service import generate_all, _parse

@pytest.mark.asyncio
async def test_generate_all():
    mock_resp = MagicMock()
    mock_resp.choices[0].message.content = '{"summaries": [{"paper_index": 0, "summary": "Test."}], "workflow": {}, "tech_stack": {}}'
    
    with patch("app.services.ai_service.client.chat.completions.create", return_value=mock_resp):
        papers = [{"title": "P1", "abstract": "A1"}]
        result = await generate_all("Test query", papers)
        
        assert "summaries" in result
        assert len(result["summaries"]) == 1
        assert result["summaries"][0]["summary"] == "Test."

def test_parse_valid_json():
    raw = '```json\n{"summaries": [], "workflow": {}, "tech_stack": {"languages": ["Python"]}}\n```'
    parsed = _parse(raw)
    assert parsed["tech_stack"]["languages"] == ["Python"]

def test_parse_invalid_json():
    raw = 'Not a JSON'
    parsed = _parse(raw)
    assert parsed == {'summaries': [], 'workflow': {}, 'tech_stack': {}}

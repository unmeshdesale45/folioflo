import os
from dotenv import load_dotenv
from groq import Groq
import json
from app.config import settings

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
print(f"Groq key loaded: {os.getenv('GROQ_API_KEY', 'NOT FOUND')[:10]}")

MODEL = 'llama-3.1-8b-instant'
SYSTEM_PROMPT = '''
You are an expert research assistant and software architect helping students.
Given a project idea and related papers, return a single valid JSON with three keys:
summaries: list of {paper_index: int, summary: str}
-- summary = 3 sentences: (1) problem, (2) method, (3) result
workflow: {phases: [{phase:int, name:str, description:str,
tasks:[str], estimated_duration:str}]}
-- specific to this exact project idea, not generic
tech_stack: {languages:[str], frameworks:[str], libraries:[str],
datasets:[str], tools:[str]}
-- specific to this exact project idea
Return ONLY the JSON. No explanation, no markdown, no backticks.
'''

async def generate_all(query: str, papers: list[dict]) -> dict:
    import asyncio
    
    paper_info = [
        {'index': i, 'title': p.get('title', ''),
         'abstract': (p.get('abstract') or '')[:400]}
        for i, p in enumerate(papers)
    ]
    
    print(f"Generating tech stack for topic: {query}")
    tech_stack_prompt = f"""Generate a specific tech stack for a student building a '{query}' project. Return ONLY valid JSON, no markdown fences:
{{
  "languages": ["lang1", "lang2"],
  "frameworks": ["fw1", "fw2"],
  "libraries": ["lib1", "lib2"],
  "datasets": ["dataset1", "dataset2"],
  "tools": ["tool1", "tool2"]
}}
Every item must be specifically relevant to {query}. 
No generic tools unless they are standard for {query}."""

    try:
        ts_resp = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": tech_stack_prompt}],
            max_tokens=1000, temperature=0.4,
            response_format={"type": "json_object"}
        )
        tech_stack = _parse(ts_resp.choices[0].message.content)
    except Exception as e:
        print(f"Tech stack AI generation failed: {e}")
        tech_stack = {}

    print(f"Generating workflow for topic: {query}")
    workflow_prompt = f"""Generate a step by step project workflow for a student building a '{query}' project. Return ONLY valid JSON, no markdown fences:
{{
  "phases": [
    {{"phase": 1, "name": "phase name specific to {query}"}},
    {{"phase": 2, "name": "phase name specific to {query}"}},
    {{"phase": 3, "name": "phase name specific to {query}"}},
    {{"phase": 4, "name": "phase name specific to {query}"}}
  ]
}}
Every phase name must be specific to {query}, not generic. 
For example for 'pothole detection' use phases like 'Dataset Collection', 'Image Preprocessing', 'CNN Model Training', 'Real-time Detection Testing' instead of generic 'Planning', 'Development', 'Testing'."""

    try:
        wf_resp = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": workflow_prompt}],
            max_tokens=1000, temperature=0.4,
            response_format={"type": "json_object"}
        )
        workflow = _parse(wf_resp.choices[0].message.content)
    except Exception as e:
        print(f"Workflow AI generation failed: {e}")
        workflow = {}
    
    summaries = []
    
    for i, p in enumerate(papers):
        title = p.get('title', '')
        abstract = p.get('abstract', '')
        authors_raw = p.get('authors', [])
        authors = ", ".join(authors_raw) if isinstance(authors_raw, list) else str(authors_raw)
        year = p.get('published_date', '')
        
        await asyncio.sleep(0.3)
        
        if not abstract.strip() and not title.strip():
            summaries.append({"paper_index": i, "summary": "Summary not available for this paper."})
            continue

        if abstract.strip():
            prompt = f"""Summarise this research paper in 2-3 clear sentences for a student. Focus on what problem it solves, what method it uses, and what result it achieves.
Title: {title}
Abstract: {abstract}
Write the summary directly, no preamble."""
        elif title.strip():
            prompt = f"""Based only on this paper title, write a brief 2-3 sentence academic summary of what this paper is likely about, what problem it addresses, and what contribution it makes.
Title: {title}
Authors: {authors}
Year: {year}
Write the summary directly, no preamble."""
        else:
            summaries.append({"paper_index": i, "summary": "Summary not available for this paper."})
            continue

        try:
            resp = client.chat.completions.create(
                model=MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=250,
                temperature=0.3
            )
            summary_text = resp.choices[0].message.content.strip()
            summaries.append({"paper_index": i, "summary": summary_text})
        except Exception as e:
            print(f"Groq error: {e}")
            summaries.append({"paper_index": i, "summary": "Summary generation failed for this paper."})
            
    return {
        "summaries": summaries,
        "workflow": workflow,
        "tech_stack": tech_stack
    }

def _parse(raw: str) -> dict:
    import re
    print(f"RAW GROQ RESPONSE: {raw}")
    try:
        match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', raw)
        if match:
            clean = match.group(1)
        else:
            start = raw.find('{')
            end = raw.rfind('}')
            if start != -1 and end != -1:
                clean = raw[start:end+1]
            else:
                clean = raw
                
        return json.loads(clean)
    except Exception as e:
        print(f"Failed to parse Groq API response: {e}")
        return {}

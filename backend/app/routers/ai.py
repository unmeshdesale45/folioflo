from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.ai_service import client, MODEL
from app.services.ai_service import _parse  # Re-use the robust JSON regex parser

router = APIRouter(prefix="/api/ai", tags=["ai"])

class TechStackDetailRequest(BaseModel):
    item: str
    item_type: str
    topic: str

class WorkflowDetailRequest(BaseModel):
    step_name: str
    step_number: int
    topic: str

class FullWorkflowRequest(BaseModel):
    topic: str
    workflow_steps: List[Any]
    tech_stack: Dict[str, Any]

class PaperDetailRequest(BaseModel):
    title: str
    authors: str
    abstract: str
    topic: str
    existing_summary: str

class ResearchGapRequest(BaseModel):
    topic: str
    papers: List[Dict[str, Any]]


@router.post("/techstack-detail/")
async def techstack_detail(request: TechStackDetailRequest):
    topic = request.topic
    item = request.item
    item_type = request.item_type

    print(f"=== TECHSTACK DETAIL CALLED ===")
    print(f"item: {item}")
    print(f"item_type: {item_type}") 
    print(f"topic: {topic}")

    if not topic or topic.strip() == "":
        return {"error": "topic is required"}

    messages=[
      {
        "role": "system",
        "content": (
          "You are a technical advisor for student research projects. "
          "You MUST answer every question specifically in the context of "
          "the student's project topic. NEVER give generic technology "
          "descriptions. Every sentence must directly reference the "
          "project topic provided by the user."
        )
      },
      {
        "role": "user", 
        "content": (
          f'Student project topic: "{topic}"\n'
          f'Technology: "{item}" (category: {item_type})\n\n'
          f'Analyse why "{item}" is or is not suitable specifically for '
          f'building a "{topic}" project.\n\n'
          f'Return ONLY valid JSON, no markdown, no code fences, '
          f'no extra text. Use this exact structure:\n'
          f'{{\n'
          f'  "explanation": "How {item} is specifically used in {topic} '
          f'projects — mention specific algorithms, components or use '
          f'cases from {topic}",\n'
          f'  "pros": [\n'
          f'    "Why {item} is good FOR {topic} — must mention {topic}",\n'
          f'    "Second reason specific to {topic}",\n'
          f'    "Third reason specific to {topic}",\n'
          f'    "Fourth reason specific to {topic}"\n'
          f'  ],\n'
          f'  "cons": [\n'
          f'    "Why {item} is NOT ideal FOR {topic} — must mention {topic}",\n'
          f'    "Second limitation specific to {topic}",\n'
          f'    "Third limitation specific to {topic}"\n'
          f'  ],\n'
          f'  "used_in_research": "How {item} appears in {topic} research '
          f'papers — name specific algorithms or techniques",\n'
          f'  "best_for": "Which specific part of a {topic} project '
          f'{item} suits best",\n'
          f'  "alternatives": [\n'
          f'    {{"name": "Alt1", "description": "Why better/worse than '
          f'{item} for {topic}"}},\n'
          f'    {{"name": "Alt2", "description": "Why better/worse than '
          f'{item} for {topic}"}}\n'
          f'  ]\n'
          f'}}'
        )
      }
    ]

    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            max_tokens=1000,
            temperature=0.4,
            response_format={"type": "json_object"}
        )
        return _parse(resp.choices[0].message.content)
    except Exception as e:
        print(f"TechStack Detail Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get tech stack details")


@router.post("/workflow-detail/")
async def workflow_detail(request: WorkflowDetailRequest):
    prompt = f"""You are a project mentor for student researchers. 
Given a workflow phase name and research topic, provide a detailed breakdown of that phase. 
Format response as JSON with keys: overview (str), detailed_tasks (list of str), tools_needed (list of str), expected_output (str), common_mistakes (list of str), estimated_time (str), resources (list of dict with keys "title" and "description").

Topic: {request.topic}
Phase Number: {request.step_number}
Phase Name: {request.step_name}
"""
    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1500,
            temperature=0.4,
            response_format={"type": "json_object"}
        )
        return _parse(resp.choices[0].message.content)
    except Exception as e:
        print(f"Workflow Detail Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get workflow details")


@router.post("/full-workflow/")
async def full_workflow(request: FullWorkflowRequest):
    import json
    prompt = f"""You are a senior project supervisor. 
Given a research topic, its workflow phases, and recommended tech stack, generate a complete project implementation guide from day 1 to final submission. 
Include: project setup, phase-by-phase instructions with specific tasks, integration points between phases, testing strategy, documentation tips, and final checklist. 
Format as JSON with key 'full_guide' containing an array of phases, each with: phase_number (int), phase_name (str), duration (str), tasks (list of str), tips (str), and milestone (str).

Topic: {request.topic}
Recommended Tech Stack: {json.dumps(request.tech_stack)}
Workflow Phases: {json.dumps(request.workflow_steps)}
"""
    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=3000,
            temperature=0.4,
            response_format={"type": "json_object"}
        )
        return _parse(resp.choices[0].message.content)
    except Exception as e:
        print(f"Full Workflow Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get full workflow guide")

@router.post("/paper-detail/")
async def paper_detail(request: PaperDetailRequest):
    print(f"\n--- PAPER DETAIL REQUEST ---")
    print(f"Title: {request.title}")
    print(f"Topic: {request.topic}")
    print(f"Abstract Length: {len(request.abstract)}")
    
    prompt = f"""You are an academic research analyst helping students understand research papers deeply. Given a paper's title, authors, and abstract, provide a structured deep analysis. Format your response strictly as JSON with these exact keys:
- full_summary (detailed paragraph)
- problem_statement (1-2 sentences)
- methodology (paragraph)
- key_technologies (list of strings)
- key_findings (list of 3-5 bullet points)
- limitations (list of 2-3 points)
- relevance_to_topic (1-2 sentences connecting paper to the topic)
- suggested_next_steps (list of 2-3 actionable suggestions for a student)
Be precise, academic but student-friendly, and base everything strictly on the provided abstract.
If the abstract is insufficient to determine a field, return a brief note saying 'Insufficient information in abstract' for that field. Always return all keys in the JSON, never omit any key.

Topic: {request.topic}
Title: {request.title}
Authors: {request.authors}
Existing Summary: {request.existing_summary}
Abstract: {request.abstract[:3000]}
"""
    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000,
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        raw_content = resp.choices[0].message.content
        print(f"Raw Groq Response: {raw_content[:500]}...\n----------------------------\n")
        return _parse(raw_content)
    except Exception as e:
        print(f"Paper Detail Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze paper")


@router.post("/research-gaps/")
async def research_gaps(request: ResearchGapRequest):
    print(f"\n--- RESEARCH GAPS REQUEST ---")
    print(f"Topic: {request.topic}")
    
    formatted_papers = ""
    for idx, p in enumerate(request.papers):
        formatted_papers += f"Paper {idx+1}:\nTitle: {p.get('title')}\nAbstract: {p.get('abstract')}\n\n"
        
    prompt = f"""You are an academic research advisor helping students identify research opportunities.

Topic: {request.topic}

Here are the abstracts of {len(request.papers)} research papers on this topic:
{formatted_papers}

Analyse these papers collectively and identify:
1. What problems or aspects are NOT covered by any of these papers
2. What methodologies are missing or underexplored
3. What datasets or domains are not represented
4. What would be a novel research contribution a student could make in this area

Return ONLY valid JSON with this structure:
{{
  "gaps": [
    {{
      "title": "Short gap title",
      "description": "One sentence explaining what is missing",
      "opportunity": "What a student could do to address this gap",
      "difficulty": "Easy/Medium/Hard"
    }}
  ],
  "summary": "One paragraph overview of the research landscape and main opportunities",
  "recommended_contribution": "The single best research contribution a student could make based on these gaps"
}}"""

    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000,
            temperature=0.3
        )
        text = resp.choices[0].message.content
        import re
        clean = re.sub(r'```json|```', '', text).strip()
        import json
        return json.loads(clean)
    except Exception as e:
        print(f"Research Gaps Error: {e}")
        return {"gaps": [], "summary": "Analysis unavailable", "recommended_contribution": ""}



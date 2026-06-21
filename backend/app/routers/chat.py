from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any
from app.services.ai_service import client, MODEL
from app.services.aggregator_service import fetch_aggregated_papers

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str | None = None
    context: str | None = None
    image_base64: str | None = None
    image_media_type: str | None = None

class ChatResponse(BaseModel):
    reply: str
    suggested_query: str | None = None
    papers: list[Any] | None = None

SYSTEM_PROMPT = """You are ResearchHub Assistant, an expert academic research helper. You help students understand research papers, suggest project ideas, explain technical concepts, recommend methodologies, and guide them through academic workflows. Be concise, helpful, and student-friendly."""

VISION_PROMPT = """Analyse this image and identify:
1. What hardware, components, or technology is shown
2. What project or application this could be used for
3. What programming languages or frameworks are typically used with this
4. What domain this belongs to (IoT, robotics, AI, web, etc.)
5. Suggest a one-line search query to find relevant research papers on this topic

Be specific and concise. Your suggested search query MUST be on the last line prefixed exactly with 'Search query:'."""

# Exact model requested by user
VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

@router.post("/", response_model=ChatResponse)
async def process_chat(request: ChatRequest):
    if request.image_base64:
        prompt_text = VISION_PROMPT
        if request.message:
            prompt_text += f"\n\nUser Notes: {request.message}"
            
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt_text},
                    {"type": "image_url", "image_url": {"url": f"data:{request.image_media_type or 'image/jpeg'};base64,{request.image_base64}"}}
                ]
            }
        ]
        
        try:
            resp = client.chat.completions.create(
                model=VISION_MODEL,
                messages=messages,
                max_tokens=1000,
                temperature=0.3,
            )
            reply = resp.choices[0].message.content
            
            suggested_query = ""
            for line in reversed(reply.split('\n')):
                lower_line = line.lower()
                if "search query:" in lower_line or "search query" in lower_line:
                    suggested_query = line.split(":", 1)[-1].strip() if ":" in line else line.strip()
                    suggested_query = suggested_query.strip("*\"'")
                    break
            
            papers = None
            if suggested_query:
                # Reuse internal search API logic
                papers = await fetch_aggregated_papers(suggested_query, 5)
                
            return ChatResponse(reply=reply, suggested_query=suggested_query, papers=papers)
            
        except Exception as e:
            print(f"Vision API Error: {e}")
            raise HTTPException(status_code=500, detail="Failed to get Vision AI response")
            
    # Standard text-only chat
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    if request.context:
        messages.append({"role": "system", "content": f"Context from current page:\n{request.context}"})
        
    messages.append({"role": "user", "content": request.message or ""})
    
    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            max_tokens=1000,
            temperature=0.7,
        )
        reply = resp.choices[0].message.content
        return ChatResponse(reply=reply)
    except Exception as e:
        print(f"Chat API Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get AI response")

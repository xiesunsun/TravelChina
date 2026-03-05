from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.services.ai_service import AIService, QuestionContext

router = APIRouter()

class ChatRequest(BaseModel):
    step: str
    region: Optional[str] = None
    city: Optional[str] = None
    spot_name: Optional[str] = None
    date: Optional[str] = None
    weather: Optional[str] = None

class ChatResponse(BaseModel):
    message: str

class ResolveLocationRequest(BaseModel):
    location_input: str
    region_context: str

class ResolveLocationResponse(BaseModel):
    city: str
    spot_name: str

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    context = QuestionContext(
        step=request.step,
        region=request.region,
        city=request.city,
        spot_name=request.spot_name,
        date=request.date,
        weather=request.weather
    )
    message = AIService.generate_guidance(context)
    return ChatResponse(message=message)

@router.post("/resolve_location", response_model=ResolveLocationResponse)
async def resolve_location(request: ResolveLocationRequest):
    data = AIService.resolve_location(request.location_input, request.region_context)
    if isinstance(data, list):
        if data and isinstance(data[0], dict):
            data = data[0]
        else:
            data = {"city": "云深不知处", "spot_name": request.location_input}
    return ResolveLocationResponse(**data)

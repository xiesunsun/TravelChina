import os
import json
from typing import List, Optional, Dict, Any
from google import genai
from google.genai import types
from pydantic import BaseModel
from app.core.config import settings

# Initialize Gemini Client
# Ensure GEMINI_API_KEY is set in your environment variables
api_key = settings.GEMINI_API_KEY
client = genai.Client(api_key=api_key) if api_key else None

class QuestionContext(BaseModel):
    region: Optional[str] = None
    city: Optional[str] = None
    spot_name: Optional[str] = None
    date: Optional[str] = None
    weather: Optional[str] = None
    step: str  # 'location', 'date', 'weather', 'photo', 'description'

class AIService:
    SYSTEM_INSTRUCTION = """
    你是一位温婉、知性且充满生活情趣的女性旅行博主，也是用户最好的旅行搭子。
    你的语气要自然、亲切、像一位老朋友聊天，不要使用翻译腔，也不要过于古板（不要满口“吾”、“汝”、“甚好”）。
    你可以适当使用一点点诗意的表达，但主体要是现代汉语，让人感觉舒服、放松。
    你的任务是引导用户回忆并记录旅行细节。
    每次只问一个简短的问题，字数控制在30字以内。
    """

    @staticmethod
    def generate_guidance(context: QuestionContext) -> str:
        if not client:
            return "AI 服务未配置，请检查 API Key。"

        model = "gemini-2.5-flash-lite"
        prompt = ""
        
        # Use spot_name if available, otherwise city, otherwise region
        location_name = context.spot_name or context.city or context.region or "那里"

        if context.step == 'location':
            prompt = f"用户点击了地图上的\"{context.region or '某个地方'}\"。作为朋友，请自然地询问用户具体去了哪个城市或景点。不要太书面。"
        elif context.step == 'date':
            prompt = f"用户去了\"{location_name}\"。请像朋友一样随口问问是哪天去的。"
        elif context.step == 'weather':
            date_str = "那段时间" if context.date == '1000-01-01' else f"在\"{context.date}\""
            prompt = f"用户{date_str}去了\"{location_name}\"。请温柔地询问那天天气如何。"
        elif context.step == 'photo':
            prompt = f"请用期待的语气询问用户是否有关于\"{location_name}\"的照片愿意分享。"
        elif context.step == 'description':
            prompt = f"用户分享了照片（或没分享）。请引导用户写下一段简短的随笔，语气要感性一点。"
        else:
            prompt = "请随便聊聊旅行的话题。"

        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=AIService.SYSTEM_INSTRUCTION,
                    temperature=1.1,
                )
            )
            return response.text
        except Exception as e:
            print(f"Error generating guidance: {e}")
            return "抱歉，我走神了，刚刚说到哪了？"

    @staticmethod
    def resolve_location(location_input: str, region_context: str) -> Dict[str, str]:
        if not client:
            return {"city": "云深不知处", "spot_name": location_input}

        model = "gemini-2.0-flash-lite-preview-02-05"
        
        prompt = f"""
        你是一个地理位置解析助手。
        用户在"{region_context}"区域，输入了"{location_input}"。
        
        请推断并返回标准的城市名称和景点名称。
        如果用户输入的是景点（如"黄果树"），请推断其所在的城市（如"安顺市"）。
        如果用户输入的是城市（如"成都"），则景点名称和城市名称相同。
        如果完全无法识别或推断，城市名称请填"云深不知处"，景点名称保留用户输入。
        
        请以 JSON 格式返回：
        {{
            "city": "城市名称",
            "spot_name": "景点名称"
        }}
        """

        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            
            try:
                data = json.loads(response.text)
                return data
            except json.JSONDecodeError:
                return {"city": "云深不知处", "spot_name": location_input}
                
        except Exception as e:
            print(f"Error resolving location: {e}")
            return {"city": "云深不知处", "spot_name": location_input}

from typing import TypedDict, Optional, List, Any
from langchain_core.messages import BaseMessage


class BirthDetails(TypedDict, total=False):
    date: str           # YYYY-MM-DD
    time: str           # HH:MM (24h)
    place: str          # human-readable place name
    lat: float
    lon: float
    timezone: str       # e.g. "Asia/Kolkata"


class AstroState(TypedDict, total=False):
    messages: List[BaseMessage]
    birth_details: BirthDetails
    chart_data: dict
    tool_outputs: List[dict]
    intent: str
    step_count: int
    error: Optional[str]
    streaming_tokens: List[str]

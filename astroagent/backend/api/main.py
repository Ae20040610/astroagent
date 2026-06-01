"""
AstroAgent FastAPI Server
Exposes the LangGraph agent over HTTP with Server-Sent Events streaming.
"""

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import json
import asyncio
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage

from agent.graph import astro_graph
from agent.state import AstroState, BirthDetails

app = FastAPI(title="AstroAgent API", version="1.0.0")

# Allow local React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store (use Redis/DB for production)
sessions: dict[str, dict] = {}


# ── Request/Response Models ────────────────────────────────────────────────────

class BirthDetailsRequest(BaseModel):
    date: str                   # YYYY-MM-DD
    time: Optional[str] = None  # HH:MM (optional)
    place: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    timezone: Optional[str] = None


class ChatRequest(BaseModel):
    session_id: str
    message: str
    birth_details: Optional[BirthDetailsRequest] = None


class SessionResponse(BaseModel):
    session_id: str
    message: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def serialize_message(m: BaseMessage) -> dict:
    tool_calls = []
    if hasattr(m, "tool_calls") and m.tool_calls:
        tool_calls = [{"name": tc["name"], "args": tc["args"]} for tc in m.tool_calls]
    return {
        "role": "assistant" if isinstance(m, AIMessage) else "user",
        "content": m.content if isinstance(m.content, str) else "",
        "tool_calls": tool_calls,
    }


def messages_to_lc(raw_messages: list) -> List[BaseMessage]:
    result = []
    for m in raw_messages:
        if m["role"] == "user":
            result.append(HumanMessage(content=m["content"]))
        elif m["role"] == "assistant":
            result.append(AIMessage(content=m["content"]))
    return result


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "AstroAgent"}


@app.post("/session/new")
def new_session():
    import uuid
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "messages": [],
        "birth_details": {},
        "chart_data": {},
        "tool_outputs": [],
    }
    return {"session_id": session_id}


@app.get("/session/{session_id}")
def get_session(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    session = sessions[session_id]
    return {
        "session_id": session_id,
        "messages": session["messages"],
        "birth_details": session.get("birth_details", {}),
        "has_chart": bool(session.get("chart_data")),
    }


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """Stream agent response via Server-Sent Events."""

    # Get or create session
    if request.session_id not in sessions:
        sessions[request.session_id] = {
            "messages": [],
            "birth_details": {},
            "chart_data": {},
            "tool_outputs": [],
        }
    session = sessions[request.session_id]

    # Update birth details if provided
    if request.birth_details:
        bd = request.birth_details.dict(exclude_none=True)
        session["birth_details"].update(bd)

    # Add user message
    session["messages"].append({"role": "user", "content": request.message})

    async def event_generator():
        try:
            # Build LangGraph state
            state: AstroState = {
                "messages": messages_to_lc(session["messages"]),
                "birth_details": session.get("birth_details", {}),
                "chart_data": session.get("chart_data", {}),
                "tool_outputs": [],
                "intent": "",
                "step_count": 0,
                "error": None,
            }

            final_content = ""
            tool_calls_seen = []

            # Stream graph execution
            async for event in astro_graph.astream_events(state, version="v2"):
                kind = event.get("event")
                name = event.get("name", "")

                # Tool call started
                if kind == "on_tool_start":
                    tool_data = {
                        "type": "tool_start",
                        "tool": name,
                        "input": event.get("data", {}).get("input", {}),
                    }
                    yield f"data: {json.dumps(tool_data)}\n\n"
                    await asyncio.sleep(0)

                # Tool call finished
                elif kind == "on_tool_end":
                    tool_data = {
                        "type": "tool_end",
                        "tool": name,
                        "output": str(event.get("data", {}).get("output", ""))[:500],
                    }
                    yield f"data: {json.dumps(tool_data)}\n\n"
                    await asyncio.sleep(0)

                # LLM streaming tokens
                elif kind == "on_chat_model_stream":
                    chunk = event.get("data", {}).get("chunk")
                    if chunk and hasattr(chunk, "content") and chunk.content:
                        token = chunk.content
                        if isinstance(token, str):
                            final_content += token
                            yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
                            await asyncio.sleep(0)

            # Save assistant message
            if final_content:
                session["messages"].append({"role": "assistant", "content": final_content})

            # Update chart data if computed
            # (chart_data updated via tool executor in the graph; we re-read state)
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.delete("/session/{session_id}")
def clear_session(session_id: str):
    if session_id in sessions:
        del sessions[session_id]
    return {"cleared": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)

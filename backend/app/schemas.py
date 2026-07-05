from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(system|user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    provider: str = Field(pattern="^(openai|gemini|ollama)$")
    messages: list[ChatMessage]
    model: str | None = None
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)


class ChatResponse(BaseModel):
    provider: str
    model: str
    content: str


class TtsRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


class HealthResponse(BaseModel):
    status: str

from openai import AsyncOpenAI

from app.config import settings
from app.providers.base import LlmProvider
from app.providers.persona import inject_persona
from app.schemas import ChatMessage


class OpenAiProvider(LlmProvider):
    def __init__(self) -> None:
        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is not configured")
        self._client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def generate(
        self,
        messages: list[ChatMessage],
        model: str | None,
        temperature: float,
    ) -> tuple[str, str]:
        resolved_model = model or settings.openai_default_model
        prompt_messages = inject_persona(messages)
        response = await self._client.responses.create(
            model=resolved_model,
            temperature=temperature,
            input=[{"role": m.role, "content": m.content} for m in prompt_messages],
        )
        return response.output_text, resolved_model

from google import genai

from app.config import settings
from app.providers.base import LlmProvider
from app.providers.persona import inject_persona
from app.schemas import ChatMessage


class GeminiProvider(LlmProvider):
    def __init__(self) -> None:
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is not configured")
        self._client = genai.Client(api_key=settings.gemini_api_key)

    async def generate(
        self,
        messages: list[ChatMessage],
        model: str | None,
        temperature: float,
    ) -> tuple[str, str]:
        resolved_model = model or settings.gemini_default_model
        prompt_messages = inject_persona(messages)
        prompt = "\n".join([f"{m.role}: {m.content}" for m in prompt_messages])
        response = await self._client.aio.models.generate_content(
            model=resolved_model,
            contents=prompt,
            config={
                "temperature": temperature,
                "system_instruction": settings.assistant_persona_prompt,
            },
        )
        text = response.text or ""
        return text, resolved_model

import httpx

from app.config import settings
from app.providers.base import LlmProvider
from app.providers.persona import inject_persona
from app.schemas import ChatMessage


class OllamaProvider(LlmProvider):
    async def generate(
        self,
        messages: list[ChatMessage],
        model: str | None,
        temperature: float,
    ) -> tuple[str, str]:
        resolved_model = model or settings.ollama_default_model
        # Ollama /api/chat follows system instructions most reliably when
        # provided as a system-role message in the chat history.
        prompt_messages = inject_persona(messages)
        payload = {
            "model": resolved_model,
            "messages": [
                {"role": m.role, "content": m.content} for m in prompt_messages
            ],
            "stream": False,
            "options": {
                "temperature": temperature,
            },
        }

        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f"{settings.ollama_base_url}/api/chat",
                json=payload,
            )
            if response.status_code == 404:
                error_message = ""
                try:
                    error_message = response.json().get("error", "")
                except Exception:
                    error_message = response.text

                if "not found" in error_message:
                    raise ValueError(
                        "Ollama model is missing. "
                        f"Run: docker compose exec ollama ollama pull {resolved_model}"
                    )

                raise ValueError(
                    "Ollama endpoint returned 404. Check OLLAMA_BASE_URL and Ollama version."
                )

            response.raise_for_status()
            data = response.json()
            content = data.get("message", {}).get("content", "")
            return content, resolved_model

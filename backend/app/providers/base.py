from abc import ABC, abstractmethod

from app.schemas import ChatMessage


class LlmProvider(ABC):
    @abstractmethod
    async def generate(
        self,
        messages: list[ChatMessage],
        model: str | None,
        temperature: float,
    ) -> tuple[str, str]:
        """Returns (generated_content, resolved_model_name)."""

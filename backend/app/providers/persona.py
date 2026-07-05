from app.config import settings
from app.schemas import ChatMessage


def inject_persona(messages: list[ChatMessage]) -> list[ChatMessage]:
    # Enforce a single trusted system instruction for stable tone across providers.
    non_system_messages = [m for m in messages if m.role in ("user", "assistant")]
    system_message = ChatMessage(
        role="system",
        content=settings.assistant_persona_prompt,
    )
    return [system_message, *non_system_messages]

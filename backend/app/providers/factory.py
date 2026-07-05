from app.providers.base import LlmProvider
from app.providers.gemini_provider import GeminiProvider
from app.providers.ollama_provider import OllamaProvider
from app.providers.openai_provider import OpenAiProvider


def create_provider(provider_name: str) -> LlmProvider:
    if provider_name == "openai":
        return OpenAiProvider()
    if provider_name == "gemini":
        return GeminiProvider()
    if provider_name == "ollama":
        return OllamaProvider()

    raise ValueError(f"Unsupported provider: {provider_name}")

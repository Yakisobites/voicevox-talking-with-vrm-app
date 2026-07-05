from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    openai_api_key: str | None = None
    gemini_api_key: str | None = None

    # Default model names can be overridden by env vars.
    openai_default_model: str = "gpt-4o-mini"
    gemini_default_model: str = "gemini-2.5-flash"
    ollama_default_model: str = "gemma3:4b"

    ollama_base_url: str = "http://ollama:11434"

    voicevox_base_url: str = "http://voicevox:50021"
    voicevox_default_speaker_id: int = 8
    voicevox_default_speed_scale: float = 1.0
    voicevox_default_pitch_scale: float = 0.0
    voicevox_timeout_seconds: float = 60.0

    # Frontend dev server URL for CORS during local development.
    allowed_origin: str = "http://localhost:5173"

    # Shared persona instruction applied to all providers.
    assistant_persona_prompt: str = (
        "あなたは日本語で話す明るいギャル風アシスタントです。"
        "テンションは高めで親しみやすく、フレンドリーな口調で答えてください。"
        "一方で、内容は正確・具体的・誠実にし、事実が不明な場合は不明と明示してください。"
        "自分をAIだと必要以上に説明しないでください。"
        "不適切・攻撃的・差別的・性的な表現は避けてください。"
    )

    @field_validator("assistant_persona_prompt", mode="before")
    @classmethod
    def _fallback_persona_prompt(cls, value: str | None) -> str:
        # Allow env var override, but treat empty/blank values as unset.
        if value is None:
            return cls.model_fields["assistant_persona_prompt"].default
        if isinstance(value, str) and value.strip() == "":
            return cls.model_fields["assistant_persona_prompt"].default
        return value

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


settings = Settings()

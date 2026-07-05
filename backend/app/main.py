from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.providers.factory import create_provider
from app.providers.voicevox_provider import VoicevoxProvider
from app.schemas import ChatRequest, ChatResponse, HealthResponse, TtsRequest

app = FastAPI(title="voicevox-vrm-app API", version="0.1.0")
voicevox_provider = VoicevoxProvider()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.allowed_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    try:
        provider = create_provider(req.provider)
        content, resolved_model = await provider.generate(
            messages=req.messages,
            model=req.model,
            temperature=req.temperature,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Chat generation failed: {exc}"
        ) from exc

    return ChatResponse(
        provider=req.provider,
        model=resolved_model,
        content=content,
    )


@app.post("/tts")
async def tts(req: TtsRequest) -> Response:
    try:
        wav_bytes = await voicevox_provider.synthesize(req.text)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"TTS generation failed: {exc}"
        ) from exc

    return Response(content=wav_bytes, media_type="audio/wav")

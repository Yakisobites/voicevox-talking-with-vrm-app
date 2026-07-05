import httpx
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class VoicevoxProvider:
    def _extract_error_detail(self, response: httpx.Response) -> str:
        try:
            data = response.json()
            if isinstance(data, dict):
                if isinstance(data.get("detail"), str):
                    return data["detail"]
                if isinstance(data.get("error"), str):
                    return data["error"]
                if isinstance(data.get("detail"), list) and len(data["detail"]) > 0:
                    detail_list = data["detail"]
                    if isinstance(detail_list[0], dict):
                        msg = detail_list[0].get("msg", "Unknown error")
                        return f"{msg}"
        except Exception:
            pass

        text = response.text.strip()
        return text or f"status={response.status_code}"

    async def synthesize(self, text: str) -> bytes:
        cleaned_text = text.strip()
        if not cleaned_text:
            raise ValueError("Text for TTS is empty")

        speaker_id = settings.voicevox_default_speaker_id

        try:
            async with httpx.AsyncClient(
                timeout=settings.voicevox_timeout_seconds
            ) as client:
                logger.info(
                    f"VOICEVOX: Calling /audio_query with text='{cleaned_text[:50]}...' speaker={speaker_id}"
                )
                query_res = await client.post(
                    f"{settings.voicevox_base_url}/audio_query",
                    params={"text": cleaned_text, "speaker": speaker_id},
                )
                logger.info(
                    f"VOICEVOX: /audio_query response status={query_res.status_code}"
                )
                if query_res.status_code >= 400:
                    detail = self._extract_error_detail(query_res)
                    logger.error(f"VOICEVOX: /audio_query error: {detail}")
                    raise ValueError(f"VOICEVOX audio_query failed: {detail}")

                query = query_res.json()
                query["speedScale"] = settings.voicevox_default_speed_scale
                query["pitchScale"] = settings.voicevox_default_pitch_scale

                logger.info(f"VOICEVOX: Calling /synthesis with speaker={speaker_id}")
                synthesis_res = await client.post(
                    f"{settings.voicevox_base_url}/synthesis",
                    params={"speaker": speaker_id},
                    json=query,
                )
                logger.info(
                    f"VOICEVOX: /synthesis response status={synthesis_res.status_code}, "
                    f"size={len(synthesis_res.content)} bytes"
                )
                if synthesis_res.status_code >= 400:
                    detail = self._extract_error_detail(synthesis_res)
                    logger.error(f"VOICEVOX: /synthesis error: {detail}")
                    raise ValueError(f"VOICEVOX synthesis failed: {detail}")

                return synthesis_res.content
        except httpx.ConnectError as exc:
            logger.error(f"VOICEVOX: Connection error: {exc}")
            raise ValueError(
                f"Cannot connect to VOICEVOX at {settings.voicevox_base_url}. "
                f"Ensure VOICEVOX service is running."
            ) from exc
        except httpx.TimeoutException as exc:
            logger.error(f"VOICEVOX: Timeout: {exc}")
            raise ValueError(
                f"VOICEVOX request timed out after {settings.voicevox_timeout_seconds}s"
            ) from exc

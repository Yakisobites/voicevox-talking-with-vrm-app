import { useCallback, useEffect, useRef } from "react";

type UseAudioPlaybackResult = {
  playWavBlob: (blob: Blob) => Promise<number>;
  stop: () => void;
};

export const useAudioPlayback = (): UseAudioPlaybackResult => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const cleanupObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    }
    cleanupObjectUrl();
  }, [cleanupObjectUrl]);

  const playWavBlob = useCallback(
    async (blob: Blob): Promise<number> => {
      stop();

      const objectUrl = URL.createObjectURL(blob);
      objectUrlRef.current = objectUrl;

      const audio = new Audio(objectUrl);
      audio.preload = "auto";
      audioRef.current = audio;

      const durationMs = await new Promise<number>((resolve) => {
        const handleLoadedMetadata = () => {
          const sec = Number.isFinite(audio.duration) ? audio.duration : 0;
          const ms = Math.max(600, Math.round(sec * 1000));
          resolve(ms);
        };

        const handleError = () => {
          resolve(600);
        };

        audio.addEventListener("loadedmetadata", handleLoadedMetadata, {
          once: true,
        });
        audio.addEventListener("error", handleError, { once: true });
      });

      audio.addEventListener(
        "ended",
        () => {
          if (audioRef.current === audio) {
            audioRef.current = null;
            cleanupObjectUrl();
          }
        },
        { once: true },
      );

      await audio.play();
      return durationMs;
    },
    [cleanupObjectUrl, stop],
  );

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    playWavBlob,
    stop,
  };
};

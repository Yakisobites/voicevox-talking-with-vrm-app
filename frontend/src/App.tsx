import { useCallback, useRef, useState } from "react";
import { ChatPanel } from "./components/ChatPanel";
import { SceneCanvas } from "./components/SceneCanvas";
import { TsukushiModel } from "./components/TsukushiModel";
import { useAudioPlayback } from "./hooks/useAudioPlayback";
import type { ChatMessage, LlmProvider } from "./types/chat";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:8000";
const BOOTSTRAP_PROMPT =
  import.meta.env.VITE_CHAT_BOOTSTRAP_PROMPT?.trim() || "";

export default function App() {
  const lipSyncTriggerRef = useRef(0);
  const lipSyncDurationMsRef = useRef(600);
  const isAudioPlayingRef = useRef(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [provider, setProvider] = useState<LlmProvider>("ollama");
  const [isWaitingReply, setIsWaitingReply] = useState(false);
  const { playWavBlob } = useAudioPlayback();

  const triggerLipSync = () => {
    lipSyncTriggerRef.current += 1;
  };

  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || isWaitingReply) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: Date.now(),
    };

    const nextMessages = [...messages, userMessage];
    const requestMessages = BOOTSTRAP_PROMPT
      ? [{ role: "user" as const, content: BOOTSTRAP_PROMPT }, ...nextMessages]
      : nextMessages;

    setMessages((prev) => {
      const next = [...prev, userMessage];
      if (next.length > 100) {
        return next.slice(next.length - 100);
      }
      return next;
    });

    setInputValue("");
    setIsWaitingReply(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          messages: requestMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      const data = (await response.json()) as { content?: string };
      const assistantContent = data.content?.trim() || "(空の応答)";

      setMessages((prev) => {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: assistantContent,
          createdAt: Date.now(),
        };
        const next = [...prev, assistantMessage];
        if (next.length > 100) {
          return next.slice(next.length - 100);
        }
        return next;
      });

      try {
        const ttsResponse = await fetch(`${API_BASE_URL}/tts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: assistantContent,
          }),
        });

        if (!ttsResponse.ok) {
          const ttsErrorText = await ttsResponse.text();
          throw new Error(ttsErrorText || `HTTP ${ttsResponse.status}`);
        }

        const audioBlob = await ttsResponse.blob();
        isAudioPlayingRef.current = true;
        const durationMs = await playWavBlob(audioBlob);
        lipSyncDurationMsRef.current = durationMs;
        triggerLipSync();
        window.setTimeout(() => {
          isAudioPlayingRef.current = false;
        }, durationMs + 300);
      } catch (ttsError) {
        isAudioPlayingRef.current = false;
        const message =
          ttsError instanceof Error ? ttsError.message : "不明なエラー";
        setMessages((prev) => {
          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `音声再生に失敗しました: ${message}`,
            createdAt: Date.now(),
          };
          const next = [...prev, assistantMessage];
          if (next.length > 100) {
            return next.slice(next.length - 100);
          }
          return next;
        });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? `APIエラー: ${error.message}`
          : "APIエラー: 不明なエラー";

      setMessages((prev) => {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: message,
          createdAt: Date.now(),
        };
        const next = [...prev, assistantMessage];
        if (next.length > 100) {
          return next.slice(next.length - 100);
        }
        return next;
      });
    } finally {
      setIsWaitingReply(false);
    }
  }, [inputValue, isWaitingReply, messages, provider]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundImage: "url('/kyousitu.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
      }}
    >
      <SceneCanvas>
        <TsukushiModel
          lipSyncTriggerRef={lipSyncTriggerRef}
          lipSyncDurationMsRef={lipSyncDurationMsRef}
          isAudioPlayingRef={isAudioPlayingRef}
        />
      </SceneCanvas>
      <ChatPanel
        messages={messages}
        inputValue={inputValue}
        provider={provider}
        isWaitingReply={isWaitingReply}
        onInputChange={setInputValue}
        onProviderChange={setProvider}
        onSend={handleSend}
      />
    </div>
  );
}

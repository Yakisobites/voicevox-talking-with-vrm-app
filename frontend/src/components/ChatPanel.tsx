import { useEffect, useRef } from "react";
import type { ChatMessage, LlmProvider } from "../types/chat";

type ChatPanelProps = {
  messages: ChatMessage[];
  inputValue: string;
  provider: LlmProvider;
  isWaitingReply: boolean;
  onInputChange: (value: string) => void;
  onProviderChange: (value: LlmProvider) => void;
  onSend: () => void;
};

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  inputValue,
  provider,
  isWaitingReply,
  onInputChange,
  onProviderChange,
  onSend,
}) => {
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (
    event,
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <section className="chat-panel" aria-label="Chat Panel">
      <header className="chat-panel__header">Chat</header>

      <div className="chat-panel__controls">
        <label className="chat-panel__provider-label" htmlFor="provider-select">
          Provider
        </label>
        <select
          id="provider-select"
          className="chat-panel__provider"
          value={provider}
          onChange={(event) =>
            onProviderChange(event.target.value as LlmProvider)
          }
          disabled={isWaitingReply}
        >
          <option value="ollama">Ollama</option>
          <option value="openai">OpenAI</option>
          <option value="gemini">Gemini</option>
        </select>
      </div>

      <div className="chat-panel__messages" role="log" aria-live="polite">
        {messages.length === 0 && !isWaitingReply ? (
          <p className="chat-panel__empty">
            メッセージを送って会話を始めましょう。
          </p>
        ) : null}

        {messages.map((message) => (
          <article
            key={message.id}
            className={`chat-message chat-message--${message.role}`}
          >
            <p className="chat-message__content">{message.content}</p>
            <time className="chat-message__time">
              {new Date(message.createdAt).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </article>
        ))}

        {isWaitingReply ? (
          <article className="chat-message chat-message--assistant">
            <span className="chat-typing" aria-label="返答を準備中">
              <span className="chat-typing__dot" />
              <span className="chat-typing__dot" />
              <span className="chat-typing__dot" />
            </span>
          </article>
        ) : null}

        <div ref={messageEndRef} />
      </div>

      <div className="chat-panel__composer">
        <textarea
          className="chat-panel__input"
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力（Enterで送信、Shift+Enterで改行）"
          rows={2}
          disabled={isWaitingReply}
        />
        <button
          type="button"
          className="chat-panel__send"
          onClick={onSend}
          aria-label="Send message"
          disabled={isWaitingReply}
        >
          {isWaitingReply ? "待機中..." : "送信"}
        </button>
      </div>

      <footer className="chat-panel__credit" aria-label="Credit">
        <span className="chat-panel__credit-label">VOICEVOX:春日部つむぎ</span>
        <a
          className="chat-panel__credit-link"
          href="https://voicevox.hiroshiba.jp/product/kasukabe_tsumugi/"
          target="_blank"
          rel="noreferrer"
        >
          クレジット情報
        </a>
      </footer>
    </section>
  );
};

"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import ChatMessageContent from "./ChatMessageContent";
import McpBadge from "./McpBadge";
import { useChatContext } from "@/contexts/ChatContext";
import { useLocale } from "@/contexts/LocaleContext";
import type { Category, ChatMode } from "@/lib/types";

function humanizeSlug(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getContextSuggestions(
  pathname: string,
  getCategoryMeta: ReturnType<typeof useLocale>["getCategoryMeta"],
) {
  const parts = pathname.split("/").filter(Boolean);

  if (parts[0] === "category" && parts[1]) {
    const meta = getCategoryMeta(parts[1] as Category);
    return [
      `What should I learn first in ${meta.label}?`,
      `Give me a mental model for ${meta.label}.`,
      `Which glossary terms matter most in ${meta.label}?`,
    ];
  }

  if (parts[0] === "term" && parts[1]) {
    const label = humanizeSlug(parts[1]);
    return [
      `Explain ${label} in simple terms.`,
      `How does ${label} connect to nearby Solana concepts?`,
      `Compare ${label} with the closest related concept.`,
    ];
  }

  if (parts[0] === "explore") {
    return [
      "What are the most connected concepts in this graph?",
      "Help me find the best concepts to learn from the network view.",
      "Which clusters should a new Solana builder explore first?",
    ];
  }

  return [
    "What should I learn first on Solana?",
    "Explain Proof of History with a simple analogy.",
    "Which glossary terms matter most for DeFi builders?",
  ];
}

const modeOptions: Array<{
  value: ChatMode;
  labelKey: keyof ReturnType<typeof useLocale>["copy"]["chat"]["modes"];
}> = [
  { value: "normal", labelKey: "normal" },
  { value: "learn", labelKey: "learn" },
  { value: "bro", labelKey: "bro" },
];

export default function ChatPanel({ variant }: { variant: "page" | "widget" }) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { copy, getCategoryMeta } = useLocale();
  const {
    messages,
    input,
    setInput,
    isLoading,
    error,
    mode,
    setMode,
    setIsOpen,
    submitMessage,
    clearMessages,
  } = useChatContext();

  const suggestions = useMemo(
    () => getContextSuggestions(pathname, getCategoryMeta),
    [getCategoryMeta, pathname],
  );

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  const isPage = variant === "page";

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0d0d0f]/95 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl ${
        isPage ? "min-h-[calc(100vh-7rem)]" : "min-h-[500px]"
      }`}
    >
      <div className="border-b border-white/8 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-lg font-semibold text-white">
                {copy.chat.title}
              </h1>
              <McpBadge />
            </div>
            <p className="max-w-xl text-sm text-muted">{copy.chat.subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor={`chat-mode-${variant}`}>
              Mode
            </label>
            <select
              id={`chat-mode-${variant}`}
              value={mode}
              onChange={(event) => setMode(event.target.value as ChatMode)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white outline-none transition-colors hover:bg-white/10"
            >
              {modeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {copy.chat.modes[option.labelKey]}
                </option>
              ))}
            </select>

            {messages.length > 0 ? (
              <button
                type="button"
                onClick={clearMessages}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                title="Clear conversation"
              >
                ✕
              </button>
            ) : null}

            {!isPage ? (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10"
              >
                {copy.chat.minimize}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col justify-center">
            <div className="mx-auto max-w-lg text-center">
              <p className="text-sm text-muted">{copy.chat.emptyPrompt}</p>
              <div className="mt-6 space-y-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/45">
                  {copy.chat.suggestionsTitle}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => submitMessage(suggestion)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 transition-colors hover:border-solana-purple/40 hover:bg-white/10 hover:text-white"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-[linear-gradient(135deg,rgba(153,69,255,0.24),rgba(20,241,149,0.16))] text-white"
                      : "border border-white/8 bg-white/[0.045]"
                  }`}
                >
                  <ChatMessageContent content={message.content} />
                </div>
              </div>
            ))}

            {isLoading ? (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-white/8 bg-white/[0.045] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-solana-purple" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-solana-purple [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-solana-green [animation-delay:300ms]" />
                    </div>
                    <span className="text-xs text-muted">
                      {copy.chat.thinking}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submitMessage();
        }}
        className="border-t border-white/8 px-5 py-4"
      >
        <div className="rounded-[24px] border border-white/10 bg-white/[0.045] p-2">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submitMessage();
                }
              }}
              placeholder={copy.chat.inputPlaceholder}
              className="max-h-36 min-h-[52px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-muted/55"
              disabled={isLoading}
              rows={2}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="rounded-2xl bg-[linear-gradient(135deg,#9945FF,#14F195)] px-4 py-3 text-sm font-semibold text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copy.chat.send}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

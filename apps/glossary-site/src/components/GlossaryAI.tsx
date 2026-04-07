"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "ai";
  text: string;
}

const SUGGESTIONS: Record<string, string[]> = {
  pt: [
    "Me dê um exemplo de código",
    "Qual é o erro mais comum?",
    "Como isso se relaciona com Anchor?",
    "Explique de forma simples",
  ],
  es: [
    "Dame un ejemplo de código",
    "¿Cuál es el error más común?",
    "¿Cómo se relaciona con Anchor?",
    "Explícalo de forma simple",
  ],
  en: [
    "Give me a code example",
    "What's the most common mistake?",
    "How does this relate to Anchor?",
    "Explain it simply",
  ],
};

export default function GlossaryAI({
  termId,
  termName,
  locale = "pt",
}: {
  termId: string;
  termName: string;
  locale?: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const lang = ["pt", "es", "en"].includes(locale) ? locale : "pt";
  const suggestions = SUGGESTIONS[lang];

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termId, question }),
      });

      if (res.status === 503) {
        setUnavailable(true);
        setMessages((m) => m.slice(0, -1));
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setMessages((m) => [
          ...m,
          {
            role: "ai",
            text: "Erro na API. Verifique se GEMINI_API_KEY está configurado no Vercel.",
          },
        ]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "ai", text: data.answer ?? "Erro ao gerar resposta." },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "ai", text: "Erro de conexão. Tente novamente." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (unavailable) return null;

  return (
    <div className="rounded-xl border border-white/8 overflow-hidden">
      {/* Header / toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-[#1A1A24] hover:bg-[#1E1E2E] transition-colors group"
      >
        <div className="flex items-center gap-3">
          {/* Sparkle icon */}
          <span className="text-lg">✦</span>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">
              Perguntar à IA sobre{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #9945FF, #14F195)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {termName}
              </span>
            </p>
            <p className="text-xs text-[#A0A0B0]">
              Respostas grounded no glossário Solana
            </p>
          </div>
        </div>
        <svg
          className={`h-4 w-4 text-[#A0A0B0] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div className="border-t border-white/8 bg-[#13131A]">
          {/* Messages */}
          {messages.length > 0 && (
            <div className="px-5 py-4 space-y-4 max-h-80 overflow-y-auto">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "ai" && (
                    <div
                      className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs mt-0.5"
                      style={{
                        background: "linear-gradient(135deg, #9945FF, #14F195)",
                      }}
                    >
                      ✦
                    </div>
                  )}
                  <div
                    className={`rounded-xl px-4 py-3 text-sm leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-[#9945FF]/20 text-white border border-[#9945FF]/30"
                        : "bg-[#1A1A24] text-[#E0E0E8] border border-white/8"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 justify-start">
                  <div
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    style={{
                      background: "linear-gradient(135deg, #9945FF, #14F195)",
                    }}
                  >
                    ✦
                  </div>
                  <div className="rounded-xl px-4 py-3 bg-[#1A1A24] border border-white/8 flex gap-1.5 items-center">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-[#9945FF] animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Quick suggestions */}
          {messages.length === 0 && (
            <div className="px-5 pt-4 pb-2">
              <p className="text-xs text-[#A0A0B0] mb-3">Perguntas rápidas:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    disabled={loading}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#A0A0B0] hover:text-white hover:border-[#9945FF]/50 hover:bg-[#9945FF]/10 transition-all disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-5 pb-5 pt-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  lang === "pt"
                    ? `Pergunte sobre ${termName}…`
                    : lang === "es"
                      ? `Pregunta sobre ${termName}…`
                      : `Ask about ${termName}…`
                }
                disabled={loading}
                className="flex-1 rounded-xl bg-[#1A1A24] border border-white/8 px-4 py-2.5 text-sm text-white placeholder-[#A0A0B0] focus:outline-none focus:border-[#9945FF]/60 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, #9945FF, #14F195)",
                  color: "#000",
                }}
              >
                {loading ? "…" : "→"}
              </button>
            </form>

            {messages.length > 0 && (
              <div className="flex justify-between items-center mt-3">
                <button
                  onClick={() => setMessages([])}
                  className="text-xs text-[#A0A0B0] hover:text-white transition-colors"
                >
                  ← Nova conversa
                </button>
                <p className="text-xs text-[#606070]">
                  Powered by Gemini · grounded no glossário
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

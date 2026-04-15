"use client";

interface ChatBubbleProps {
  hasMessages: boolean;
  onClick: () => void;
}

export default function ChatBubble({ hasMessages, onClick }: ChatBubbleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-[#111111]/95 text-white shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-transform hover:-translate-y-1"
      aria-label="Open AI assistant"
    >
      <span className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_25%_25%,rgba(153,69,255,0.45),transparent_55%),radial-gradient(circle_at_75%_75%,rgba(20,241,149,0.28),transparent_45%)] opacity-80 transition-opacity group-hover:opacity-100" />
      <span className="absolute -inset-1 rounded-[20px] border border-solana-purple/20 opacity-70 blur-sm" />
      <span className="relative flex items-center gap-1 font-mono text-sm font-semibold uppercase tracking-[0.24em]">
        AI
      </span>
      <span className="absolute right-2 top-2 flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-solana-green/70" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-solana-green" />
      </span>
      {!hasMessages ? (
        <span className="absolute -left-1 -top-1 rounded-full bg-solana-purple px-1.5 py-0.5 text-[10px] font-bold text-white">
          MCP
        </span>
      ) : null}
    </button>
  );
}

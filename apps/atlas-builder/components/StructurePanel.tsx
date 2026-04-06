"use client";

interface Props {
  structure: string;
  onCopy: () => void;
}

export default function StructurePanel({ structure, onCopy }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest text-white/30">
          Structure
        </span>
        <button
          onClick={onCopy}
          className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
        >
          Copy
        </button>
      </div>
      {!structure ? (
        <p className="text-sm text-white/20 italic">No structure generated.</p>
      ) : (
        <pre className="rounded-lg border border-white/5 bg-white/3 p-3 font-mono text-xs text-white/70 leading-relaxed overflow-x-auto whitespace-pre">
          {structure}
        </pre>
      )}
    </div>
  );
}

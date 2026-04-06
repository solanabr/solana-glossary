"use client";

interface Architecture {
  components: string[];
  flows: string[];
  notes: string[];
}

interface Props {
  architecture: Architecture;
  onCopy: () => void;
}

export default function ArchitecturePanel({ architecture, onCopy }: Props) {
  const isEmpty =
    architecture.components.length === 0 &&
    architecture.flows.length === 0 &&
    architecture.notes.length === 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest text-white/30">
          Architecture
        </span>
        <button
          onClick={onCopy}
          className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
        >
          Copy
        </button>
      </div>
      {isEmpty ? (
        <p className="text-sm text-white/20 italic">No architecture generated.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {architecture.components.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] uppercase tracking-widest text-white/20">Components</p>
              <ul className="flex flex-col gap-1">
                {architecture.components.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm text-white/70">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#9945FF]" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {architecture.flows.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] uppercase tracking-widest text-white/20">Flows</p>
              <ul className="flex flex-col gap-1.5">
                {architecture.flows.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/60 leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#14F195]" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {architecture.notes.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] uppercase tracking-widest text-white/20">Notes</p>
              <ul className="flex flex-col gap-1.5">
                {architecture.notes.map((n) => (
                  <li key={n} className="flex items-start gap-2 text-sm text-white/50 leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#F5A623]" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

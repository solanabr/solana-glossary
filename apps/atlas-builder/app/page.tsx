"use client";

import { useState, useCallback } from "react";
import { buildProject } from "@/lib/builder";
import type { BuildResult } from "@/lib/builder";
import ConceptsPanel from "@/components/ConceptsPanel";
import ArchitecturePanel from "@/components/ArchitecturePanel";
import StructurePanel from "@/components/StructurePanel";

const EMPTY_RESULT: BuildResult = {
  concepts: [],
  architecture: { components: [], flows: [], notes: [] },
  structure: "",
};

function serializeConcepts(result: BuildResult): string {
  return result.concepts.map((c) => `${c.term} [${c.category}]`).join("\n");
}

function serializeArchitecture(result: BuildResult): string {
  const a = result.architecture;
  const lines: string[] = [];
  if (a.components.length) lines.push("Components:\n" + a.components.map((c) => `  - ${c}`).join("\n"));
  if (a.flows.length) lines.push("Flows:\n" + a.flows.map((f) => `  - ${f}`).join("\n"));
  if (a.notes.length) lines.push("Notes:\n" + a.notes.map((n) => `  - ${n}`).join("\n"));
  return lines.join("\n\n");
}

function copy(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

export default function BuilderPage() {
  const [input, setInput] = useState("");
  const [expand, setExpand] = useState(false);
  const [showDefs, setShowDefs] = useState(false);
  const [result, setResult] = useState<BuildResult>(EMPTY_RESULT);
  const [hasRun, setHasRun] = useState(false);

  const run = useCallback((currentInput: string, currentExpand: boolean) => {
    if (!currentInput.trim()) return;
    setResult(buildProject(currentInput, { expand: currentExpand }));
    setHasRun(true);
  }, []);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    if (val.trim()) run(val, expand);
    else { setResult(EMPTY_RESULT); setHasRun(false); }
  }, [expand, run]);

  const handleExpandToggle = useCallback(() => {
    setExpand((prev) => {
      const next = !prev;
      if (input.trim()) run(input, next);
      return next;
    });
  }, [input, run]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0f] text-white">
      <header className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="2" width="7" height="7" rx="1.5" fill="#9945FF" fillOpacity="0.8" />
          <rect x="11" y="2" width="7" height="7" rx="1.5" fill="#14F195" fillOpacity="0.8" />
          <rect x="2" y="11" width="7" height="7" rx="1.5" fill="#F5A623" fillOpacity="0.8" />
          <rect x="11" y="11" width="7" height="7" rx="1.5" fill="#00C2FF" fillOpacity="0.6" />
        </svg>
        <h1 className="text-sm font-semibold text-white/90">Atlas Builder</h1>
        <p className="text-xs text-white/25 ml-1">Glossary-driven Solana project scaffolder</p>
      </header>

      <main className="flex flex-col gap-5 p-5 max-w-5xl w-full mx-auto">
        <div className="flex flex-col gap-2">
          <textarea
            value={input}
            onChange={handleInput}
            rows={3}
            placeholder="Describe what you're building (e.g. escrow program, staking contract, NFT marketplace)"
            className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-[#9945FF]/60 focus:ring-1 focus:ring-[#9945FF]/20 transition-all leading-relaxed"
          />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <button
                role="switch"
                aria-checked={expand}
                onClick={handleExpandToggle}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border transition-colors ${
                  expand ? "bg-[#9945FF] border-[#9945FF]" : "bg-white/10 border-white/10"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    expand ? "translate-x-4" : "translate-x-0.5"
                  }`}
                  style={{ marginTop: "2px" }}
                />
              </button>
              <span className="text-xs text-white/40">Expand concepts</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <button
                role="switch"
                aria-checked={showDefs}
                onClick={() => setShowDefs((p) => !p)}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border transition-colors ${
                  showDefs ? "bg-[#14F195] border-[#14F195]" : "bg-white/10 border-white/10"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    showDefs ? "translate-x-4" : "translate-x-0.5"
                  }`}
                  style={{ marginTop: "2px" }}
                />
              </button>
              <span className="text-xs text-white/40">Show definitions</span>
            </label>
            <div className="flex-1" />
            <button
              onClick={() => run(input, expand)}
              disabled={!input.trim()}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50 hover:text-white/80 hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Regenerate
            </button>
          </div>
        </div>

        {hasRun && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
              <ConceptsPanel
                concepts={result.concepts}
                showDefinitions={showDefs}
                onCopy={() => copy(serializeConcepts(result))}
              />
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
              <ArchitecturePanel
                architecture={result.architecture}
                onCopy={() => copy(serializeArchitecture(result))}
              />
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
              <StructurePanel
                structure={result.structure}
                onCopy={() => copy(result.structure)}
              />
            </div>
          </div>
        )}

        {!hasRun && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
            <p className="text-sm text-white/20">Start typing to generate a project scaffold</p>
            <p className="text-xs text-white/10">Try: "build escrow program" or "nft marketplace with royalties"</p>
          </div>
        )}
      </main>
    </div>
  );
}


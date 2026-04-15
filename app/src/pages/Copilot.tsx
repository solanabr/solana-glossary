import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChatUI } from "@/components/ChatUI";
import { ExplainFilePanel } from "@/components/ExplainFilePanel";
import { TermDetailPanel } from "@/components/TermDetailPanel";
import type { GlossaryTerm } from "@stbr/solana-glossary";
import { AnimatePresence } from "framer-motion";
import { MessageSquare, Code2, FileCode2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const TAB_IDS = ["chat", "explain-code", "explain-file"] as const;
type TabId = (typeof TAB_IDS)[number];

const TAB_ICONS = {
  chat: MessageSquare,
  "explain-code": Code2,
  "explain-file": FileCode2,
} as const;

const TAB_KEYS = {
  chat: "tab.copilot" as const,
  "explain-code": "tab.explain_code" as const,
  "explain-file": "tab.explain_file" as const,
};

const Copilot = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const modeParam = (searchParams.get("mode") as TabId) || "chat";
  const activeTab: TabId = TAB_IDS.includes(modeParam as any)
    ? modeParam
    : "chat";
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);
  const { t } = useI18n();

  const handleTabChange = (tab: TabId) => {
    if (tab === "chat") {
      setSearchParams({});
    } else {
      setSearchParams({ mode: tab });
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col max-w-6xl mx-auto">
      {/* Tab bar */}
      <div className="border-b border-border px-4 flex gap-1 pt-2">
        {TAB_IDS.map((tabId) => {
          const Icon = TAB_ICONS[tabId];
          return (
            <button
              key={tabId}
              onClick={() => handleTabChange(tabId)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md transition-colors ${
                activeTab === tabId
                  ? "bg-card text-foreground border border-border border-b-transparent -mb-px"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t(TAB_KEYS[tabId])}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 min-w-0">
          {activeTab === "explain-file" ? (
            <ExplainFilePanel onTermClick={setSelectedTerm} />
          ) : (
            <ChatUI
              key={activeTab}
              mode={activeTab === "explain-code" ? "explain-code" : "chat"}
              onTermClick={setSelectedTerm}
            />
          )}
        </div>
        <AnimatePresence>
          {selectedTerm && (
            <div className="hidden md:block w-80 shrink-0 border-l border-border p-4 overflow-y-auto overflow-x-hidden">
              <TermDetailPanel
                term={selectedTerm}
                onClose={() => setSelectedTerm(null)}
                onNavigate={setSelectedTerm}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Copilot;

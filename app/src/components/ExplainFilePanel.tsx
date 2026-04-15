import { useState, useCallback, useRef } from "react";
import type { GlossaryTerm } from "@stbr/solana-glossary";
import { useGlossary } from "@/hooks/useGlossary";
import { streamChat, buildGlossaryContext } from "@/lib/ai-chat";
import {
  FileCode2,
  Loader2,
  Send,
  Trash2,
  Upload,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TermHighlightedMarkdown } from "@/components/TermHighlightedMarkdown";
import { useI18n } from "@/lib/i18n";

interface ExplainFilePanelProps {
  onTermClick?: (term: GlossaryTerm) => void;
}

const EXAMPLE_CODE = `// Anchor program: Initialize a vault PDA
#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Vault::INIT_SPACE,
        seeds = [b"vault", authority.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}`;

const CODE_EXTENSIONS = [
  ".rs",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".sol",
  ".toml",
  ".json",
  ".yaml",
  ".yml",
  ".md",
  ".txt",
  ".cfg",
  ".ini",
  ".sh",
  ".bash",
];

export function ExplainFilePanel({ onTermClick }: ExplainFilePanelProps) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, locale } = useI18n();
  const glossary = useGlossary();

  const handleFileRead = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCode(text);
      setFileName(file.name);
      setResult("");
    };
    reader.readAsText(file);
  }, []);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileRead(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [handleFileRead],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileRead(file);
    },
    [handleFileRead],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleExport = useCallback(() => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName
      ? `${fileName.replace(/\.[^.]+$/, "")}-explanation.md`
      : "explanation.md";
    a.click();
    URL.revokeObjectURL(url);
  }, [result, fileName]);

  const handleAnalyze = useCallback(
    async (inputCode?: string) => {
      const codeToAnalyze = inputCode || code;
      if (!codeToAnalyze.trim() || isAnalyzing) return;

      setError(null);
      setResult("");
      setIsAnalyzing(true);

      const glossaryContext = buildGlossaryContext(codeToAnalyze, locale);

      let content = "";
      await streamChat({
        messages: [{ role: "user", content: codeToAnalyze }],
        glossaryContext,
        locale,
        mode: "explain-file",
        onDelta: (chunk) => {
          content += chunk;
          setResult(content);
        },
        onDone: () => setIsAnalyzing(false),
        onError: (err) => {
          setError(err);
          setIsAnalyzing(false);
        },
      });
    },
    [code, isAnalyzing, locale],
  );

  const detectedTerms = code.trim()
    ? glossary.searchTerms(code).slice(0, 8)
    : [];

  return (
    <div className="flex flex-col h-full">
      {/* Code input area */}
      <div
        className={`p-4 border-b border-border transition-colors ${isDragging ? "bg-primary/5 border-primary/30" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              {fileName || t("file.paste_title")}
            </span>
          </div>
          <div className="flex gap-1.5">
            {code && (
              <button
                onClick={() => {
                  setCode("");
                  setResult("");
                  setFileName(null);
                }}
                className="text-[10px] px-2 py-1 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[10px] px-2 py-1 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Upload className="h-3 w-3" />
              {t("file.upload_btn")}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={CODE_EXTENSIONS.join(",")}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => {
                setCode(EXAMPLE_CODE);
                setFileName(null);
              }}
              className="text-[10px] px-2 py-1 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("file.try_example")}
            </button>
          </div>
        </div>

        {isDragging ? (
          <div className="w-full h-32 flex items-center justify-center border-2 border-dashed border-primary/40 rounded-lg bg-primary/5">
            <p className="text-xs text-primary font-medium">
              {t("file.drop_hint")}
            </p>
          </div>
        ) : (
          <textarea
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setFileName(null);
            }}
            placeholder={t("file.paste_placeholder")}
            className="w-full h-32 bg-secondary border border-border rounded-lg p-3 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none scrollbar-thin"
          />
        )}

        {/* Detected terms chips */}
        <AnimatePresence>
          {detectedTerms.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-1 mt-2"
            >
              {detectedTerms.map((dt) => (
                <button
                  key={dt.id}
                  onClick={() => onTermClick?.(dt)}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {dt.term}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => handleAnalyze()}
          disabled={!code.trim() || isAnalyzing}
          className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t("file.analyzing")}
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              {t("file.explain_btn")}
            </>
          )}
        </button>
      </div>

      {/* Result area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 mb-4">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        {result ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-end mb-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download className="h-3 w-3" />
                {t("file.export_btn")}
              </button>
            </div>
            <TermHighlightedMarkdown
              content={result}
              onTermClick={onTermClick}
            />
          </motion.div>
        ) : !isAnalyzing ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 opacity-60">
            <FileCode2 className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-xs text-muted-foreground">
              {t("file.empty_hint")}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import type { GlossaryTerm } from "@stbr/solana-glossary";
import { streamChat, buildGlossaryContext } from "@/lib/ai-chat";
import { isAIAvailable } from "@/lib/ai-config";
import { Sparkles, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TermHighlightedMarkdown } from "@/components/TermHighlightedMarkdown";
import { useI18n } from "@/lib/i18n";

// In-memory cache for usage examples
const exampleCache = new Map<string, string>();

interface UsageExampleProps {
  term: GlossaryTerm;
  onTermClick?: (term: GlossaryTerm) => void;
}

export function UsageExample({ term, onTermClick }: UsageExampleProps) {
  const [example, setExample] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const abortRef = useRef(false);
  const { t, locale } = useI18n();

  useEffect(() => {
    abortRef.current = false;

    if (!isAIAvailable()) {
      setIsLoading(false);
      return;
    }

    // Check cache first
    const cached = exampleCache.get(term.id);
    if (cached) {
      setExample(cached);
      setIsLoading(false);
      setError(false);
      return;
    }

    setExample("");
    setIsLoading(true);
    setError(false);

    const glossaryContext = buildGlossaryContext(
      term.term,
      locale as "en" | "pt" | "es",
    );
    let content = "";

    streamChat({
      messages: [
        {
          role: "user",
          content: `Term: ${term.term}\nDefinition: ${term.definition}\n\nProvide a practical real-world usage example of this Solana concept.`,
        },
      ],
      glossaryContext,
      locale: locale as "en" | "pt" | "es",
      mode: "usage-example",
      onDelta: (chunk) => {
        if (abortRef.current) return;
        content += chunk;
        setExample(content);
      },
      onDone: () => {
        if (!abortRef.current && content) {
          exampleCache.set(term.id, content);
        }
        setIsLoading(false);
      },
      onError: () => {
        if (!abortRef.current) setError(true);
        setIsLoading(false);
      },
    });

    return () => {
      abortRef.current = true;
    };
  }, [term.id, term.term, term.definition, locale]);

  if (error) return null;

  return (
    <div className="mt-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Sparkles className="h-3 w-3 text-primary" />
        {t("term.usage")}
      </h3>
      {isLoading && !example ? (
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      ) : example ? (
        <div className="bg-secondary/50 rounded-md p-3 border border-border">
          <TermHighlightedMarkdown
            content={example}
            onTermClick={onTermClick}
          />
          {isLoading && (
            <Loader2 className="h-3 w-3 text-primary animate-spin mt-1" />
          )}
        </div>
      ) : null}
    </div>
  );
}

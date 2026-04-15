import type { GlossaryTerm } from "@stbr/solana-glossary";
import { getLocalizedTerms } from "@stbr/solana-glossary/i18n";
import { useI18n } from "@/lib/i18n";
import ReactMarkdown from "react-markdown";

interface TermHighlightedMarkdownProps {
  content: string;
  onTermClick?: (term: GlossaryTerm) => void;
}

function findLocalizedTermByText(
  text: string,
  locale: "en" | "pt" | "es",
): GlossaryTerm | undefined {
  const terms = getLocalizedTerms(locale);
  const lower = text.toLowerCase();
  return terms.find(
    (t) =>
      t.term.toLowerCase() === lower ||
      t.aliases?.some((a) => a.toLowerCase() === lower),
  );
}

export function TermHighlightedMarkdown({
  content,
  onTermClick,
}: TermHighlightedMarkdownProps) {
  const { locale } = useI18n();

  return (
    <div className="prose prose-sm prose-invert max-w-none break-words overflow-hidden [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-0 [&_h2]:mb-2 [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-foreground [&_p]:text-xs [&_p]:text-foreground/80 [&_li]:text-xs [&_li]:text-foreground/80 [&_code]:text-primary [&_code]:bg-primary/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px] [&_code]:break-all [&_blockquote]:border-primary/30 [&_blockquote]:text-muted-foreground [&_blockquote]:text-[11px] [&_strong]:text-foreground [&_hr]:border-border [&_pre]:bg-secondary [&_pre]:border [&_pre]:border-border [&_pre]:overflow-x-auto [&_pre]:max-w-full">
      <ReactMarkdown
        components={{
          strong: ({ children }) => {
            const text = String(children);
            const foundTerm = findLocalizedTermByText(
              text,
              locale as "en" | "pt" | "es",
            );

            if (foundTerm && onTermClick) {
              return (
                <strong
                  className="text-primary cursor-pointer underline decoration-primary/30 underline-offset-2 hover:decoration-primary transition-colors"
                  onClick={() => onTermClick(foundTerm)}
                  title={foundTerm.definition.slice(0, 100)}
                >
                  {children}
                </strong>
              );
            }

            return <strong>{children}</strong>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

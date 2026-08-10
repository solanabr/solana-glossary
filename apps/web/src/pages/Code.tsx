import { Package, Bot, ExternalLink, BookOpen } from "lucide-react";

const SDK_SNIPPET = `import { getTerm, searchTerms, allTerms } from "@stbr/solana-glossary";
import { getLocalizedTerms } from "@stbr/solana-glossary/i18n";

getTerm("pda");          // definition, category, depth 1-5, related, aliases
searchTerms("stake");    // search term names, definitions and aliases
getLocalizedTerms("pt"); // the full corpus in Portuguese or Spanish
allTerms.length;         // 1059 terms across 14 categories`;

const MCP_SNIPPET = `{
  "mcpServers": {
    "solana-glossary": {
      "command": "npx",
      "args": ["-y", "@stbr/solana-glossary"]
    }
  }
}`;

function Snippet({ code }: { code: string }) {
  return (
    <pre className="bg-secondary/60 border border-border rounded-lg p-4 text-xs font-mono text-foreground overflow-x-auto leading-relaxed">
      <code>{code}</code>
    </pre>
  );
}

const Code = () => (
  <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
    <h1 className="text-3xl font-bold text-foreground mb-2">
      Build with <span className="gradient-text">Solana Glossary</span>
    </h1>
    <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
      Everything on this site is powered by the open-source{" "}
      <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">
        @stbr/solana-glossary
      </code>{" "}
      package — 1059 curated terms with categories, depth ratings, aliases,
      related-term graphs and pt/es translations. Use it as a TypeScript SDK or
      plug it into any AI agent as an MCP server.
    </p>

    <section className="bg-card border border-border rounded-xl p-6 mb-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-3">
        <Package className="h-4 w-4 text-primary" />
        TypeScript SDK
      </h2>
      <p className="text-sm text-muted-foreground mb-3">
        Zero-dependency data + helpers, tree-shakable, fully typed:
      </p>
      <Snippet code="npm install @stbr/solana-glossary" />
      <div className="mt-3">
        <Snippet code={SDK_SNIPPET} />
      </div>
    </section>

    <section className="bg-card border border-border rounded-xl p-6 mb-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-3">
        <Bot className="h-4 w-4 text-accent" />
        MCP server
      </h2>
      <p className="text-sm text-muted-foreground mb-3">
        The same package ships a Model Context Protocol server: 10 tools for
        term lookup, search, categories, depth filtering and related-term
        graphs. Works with Claude Code, Claude Desktop, Cursor, and any MCP
        client — add this to your MCP config:
      </p>
      <Snippet code={MCP_SNIPPET} />
    </section>

    <div className="flex flex-wrap gap-3">
      <a
        href="https://www.npmjs.com/package/@stbr/solana-glossary"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 text-sm font-medium hover:bg-primary/20 transition-colors"
      >
        <Package className="h-3.5 w-3.5" /> npm package
        <ExternalLink className="h-3 w-3" />
      </a>
      <a
        href="https://github.com/solanabr/solana-glossary"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-foreground border border-border text-sm font-medium hover:bg-surface-elevated transition-colors"
      >
        <BookOpen className="h-3.5 w-3.5" /> GitHub
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  </div>
);

export default Code;

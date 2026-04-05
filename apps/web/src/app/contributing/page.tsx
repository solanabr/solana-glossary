import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Metadata } from "next";

import ContributingGuideClient from "./ContributingGuideClient";

const FALLBACK = `## Contributing

The guide file was not found in this deployment. Open [CONTRIBUTING.md on GitHub](https://github.com/solanabr/solana-glossary/blob/main/CONTRIBUTING.md).
`;

export const metadata: Metadata = {
  title: "Contribute — Solana Glossary",
  description:
    "How to add new terms and translations: guide from the Solana Glossary repository.",
};

function readContributingMarkdown(): string {
  try {
    return readFileSync(
      join(process.cwd(), "public", "contributing.md"),
      "utf-8",
    );
  } catch {
    return FALLBACK;
  }
}

export default function ContributingPage() {
  return <ContributingGuideClient markdown={readContributingMarkdown()} />;
}

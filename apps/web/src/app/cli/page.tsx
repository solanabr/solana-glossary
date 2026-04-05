import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CLI — Solana Glossary",
  description: "Mock page for CLI section (coming soon).",
};

export default function CliPage() {
  return (
    <div className="min-h-screen app-surface">
      <header className="border-b border-sol-line bg-sol-darker/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <Link
            href="/"
            className="text-[13px] text-sol-subtle hover:text-sol-text font-medium"
          >
            ← Voltar
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-2xl border border-sol-line bg-sol-surface-elevated/80 p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-wider text-sol-muted mb-2">
            Mock
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-sol-text mb-3">
            CLI
          </h1>
          <p className="text-sol-subtle leading-relaxed">
            Esta pagina ainda e um mock. Em breve teremos comandos e exemplos
            reais da CLI.
          </p>
        </div>
      </main>
    </div>
  );
}

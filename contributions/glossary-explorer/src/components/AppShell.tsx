"use client";

import Navigation from "./Navigation";
import ChatWidget from "./ChatWidget";
import { ChatProvider } from "@/contexts/ChatContext";
import { LocaleProvider, useLocale } from "@/contexts/LocaleContext";
import { LearningProvider } from "@/contexts/LearningContext";

function AppFooter() {
  const { copy } = useLocale();

  return (
    <footer className="relative z-10 border-t border-border py-6 text-center text-sm text-muted">
      <p>
        {copy.footer.builtOn}{" "}
        <a
          href="https://github.com/solanabr/solana-glossary"
          target="_blank"
          rel="noopener noreferrer"
          className="text-solana-purple transition-colors hover:text-solana-green"
        >
          @stbr/solexicon
        </a>{" "}
        · {copy.footer.suffix}
      </p>
    </footer>
  );
}

function ShellFrame({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <Navigation />
      <main className="relative z-10 flex-1">{children}</main>
      <AppFooter />
      <ChatWidget />
    </ChatProvider>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <LearningProvider>
        <ShellFrame>{children}</ShellFrame>
      </LearningProvider>
    </LocaleProvider>
  );
}

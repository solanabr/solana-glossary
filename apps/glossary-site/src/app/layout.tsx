import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Glossário Solana | 1001 termos",
  description:
    "O glossário mais completo do ecossistema Solana em português e espanhol. 1001 termos, 14 categorias, da camada de protocolo ao DeFi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <nav
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-14 border-b border-white/8"
          style={{
            background: "rgba(15, 15, 19, 0.75)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Link
            href="/"
            className="gradient-text font-semibold text-base tracking-tight"
          >
            Glossário Solana
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/quiz"
              className="text-sm text-[#A0A0B0] hover:text-white transition-colors hidden sm:block"
            >
              Quiz
            </Link>
            <Link
              href="/grafo"
              className="text-sm text-[#A0A0B0] hover:text-white transition-colors hidden sm:block"
            >
              Grafo
            </Link>
            <LocaleSwitcher />
          </div>
        </nav>
        <div className="pt-14 flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}

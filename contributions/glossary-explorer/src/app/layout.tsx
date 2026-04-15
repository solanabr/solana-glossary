import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "solexicon — 1001 Terms, Infinite Knowledge",
  description:
    "The definitive Solana knowledge base. 1001 terms, 3D knowledge graph, AI tutor, spaced repetition flashcards, and live network data. Learn, explore, master.",
  keywords: [
    "Solana",
    "glossary",
    "blockchain",
    "crypto",
    "web3",
    "definitions",
    "learning",
    "flashcards",
    "knowledge graph",
  ],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="noise-bg orb-bg min-h-full flex flex-col bg-background text-foreground">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

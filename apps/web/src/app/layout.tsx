import type { Metadata } from "next";
import "@/styles/globals.css";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Solana Glossary",
  description:
    "Interactive Solana ecosystem glossary — 1000+ terms in English, Portuguese (BR), and Spanish. Fuzzy search, categories, and flashcards.",
  keywords: [
    "solana",
    "blockchain",
    "web3",
    "crypto",
    "glossary",
    "DeFi",
    "NFT",
    "smart contract",
    "rust",
    "anchor",
  ],
  authors: [{ name: "Superteam Brasil" }],
  openGraph: {
    title: "Solana Glossary",
    description: "Interactive glossary — en, pt-BR, es",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Solana Glossary",
    description: "Interactive Solana ecosystem glossary",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}

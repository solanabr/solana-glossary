import type { Metadata } from "next";
import { Inter, Fira_Code, Orbitron, Rajdhani } from "next/font/google";
import "./globals.css";
import CursorGlow from "@/components/cursor-glow";
import Providers from "@/components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://solana-wtf.vercel.app"),
  title: "Solana WTF — What The Fork?!",
  description:
    "The Solana glossary that doesn't suck. 1001 terms, 4 games, AI decoder. Decode anything, learn with personality, play to remember.",
  openGraph: {
    title: "Solana WTF — What The Fork?!",
    description:
      "1001 Solana terms decoded. 4 games to learn. 3 languages. The glossary that doesn't suck.",
    siteName: "Solana WTF",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Solana WTF — What The Fork?!",
    description:
      "1001 Solana terms decoded. 4 games to learn. 3 languages. The glossary that doesn't suck.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${firaCode.variable} ${orbitron.variable} ${rajdhani.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <CursorGlow />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Solana Glossary — 1001 terms by Superteam Brazil",
  description:
    "The most comprehensive Solana ecosystem glossary. 1001 terms, 14 categories, trilingual (en/pt-BR/es). Built by Superteam Brazil.",
  keywords: ["solana", "glossary", "blockchain", "web3", "defi", "superteam brazil"],
  openGraph: {
    title: "Solana Glossary",
    description: "1001 Solana terms. 14 categories. All of Solana, defined.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-base`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

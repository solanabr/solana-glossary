import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solana Glossary — 1001 Terms",
  description: "The most comprehensive Solana glossary ever built. 1001 terms, 14 categories, full cross-references.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="noise" />
        {children}
      </body>
    </html>
  );
}

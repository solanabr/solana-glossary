import type { ReactNode } from "react";
import type { Metadata } from "next";

import { ThemeScript } from "@/components/theme-script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Glossary OS",
  description: "A premium Solana glossary frontend built on the official Superteam Brazil data.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}

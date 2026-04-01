import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n";
import Nav from "@/components/Nav";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-archivo",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Solana Glossary",
  description:
    "1001 termos, 14 categorias, 3 idiomas. A referência definitiva para devs Solana.",
  openGraph: {
    title: "Solana Glossary",
    description: "A referência definitiva para devs Solana.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${archivo.variable} ${inter.variable}`}>
      <body className="bg-bg text-text min-h-screen">
        <LocaleProvider>
          <Nav />
          <main>{children}</main>
        </LocaleProvider>
      </body>
    </html>
  );
}

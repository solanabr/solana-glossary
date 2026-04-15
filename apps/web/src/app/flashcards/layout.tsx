import type { Metadata } from "next";

import { UI_LABELS } from "@/lib/glossary";

const m = UI_LABELS.en;

export const metadata: Metadata = {
  title: `${m.flash_study_zone} — ${m.brand}`,
  description: m.flash_meta_description,
  openGraph: {
    title: `${m.flash_study_zone} — ${m.brand}`,
    description: m.flash_meta_description,
    type: "website",
    siteName: m.brand,
  },
  twitter: {
    card: "summary_large_image",
    title: `${m.flash_study_zone} — ${m.brand}`,
    description: m.flash_meta_description,
  },
};

export default function FlashcardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

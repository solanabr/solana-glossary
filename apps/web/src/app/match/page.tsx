import type { Metadata } from "next";

import MatchGame from "./MatchGame";
import { UI_LABELS } from "@/lib/glossary";

const m = UI_LABELS.en;

export const metadata: Metadata = {
  title: `${m.match_title} — ${m.brand}`,
  description: m.match_meta_description,
  openGraph: {
    title: `${m.match_title} — ${m.brand}`,
    description: m.match_meta_description,
    type: "website",
    siteName: m.brand,
  },
  twitter: {
    card: "summary_large_image",
    title: `${m.match_title} — ${m.brand}`,
    description: m.match_meta_description,
  },
  robots: { index: true, follow: true },
};

export default function MatchPage() {
  return <MatchGame />;
}

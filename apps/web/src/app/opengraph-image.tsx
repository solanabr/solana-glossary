import { ImageResponse } from "next/og";

import { UI_LABELS } from "@/lib/glossary";
import { OG_IMAGE_SIZE, SolanaBrandOg } from "@/lib/og-solana-shared";

export const runtime = "nodejs";
export const alt = "Solana Glossary";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default function Image() {
  const m = UI_LABELS.en;
  return new ImageResponse(
    <SolanaBrandOg
      eyebrow={m.brand}
      title={m.brand}
      summary="Interactive Solana ecosystem glossary — 1000+ terms in English, Portuguese (BR), and Spanish. Search, learn paths, graph, flashcards, and match mode."
    />,
    { ...OG_IMAGE_SIZE },
  );
}

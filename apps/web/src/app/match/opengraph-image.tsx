import { ImageResponse } from "next/og";

import { UI_LABELS } from "@/lib/glossary";
import { OG_IMAGE_SIZE, SolanaBrandOg } from "@/lib/og-solana-shared";

export const runtime = "nodejs";
export const alt = "Solana Glossary — Match";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default function Image() {
  const m = UI_LABELS.en;
  return new ImageResponse(
    <SolanaBrandOg
      eyebrow={m.brand}
      title={m.match_title}
      summary={m.match_meta_description}
    />,
    { ...OG_IMAGE_SIZE },
  );
}

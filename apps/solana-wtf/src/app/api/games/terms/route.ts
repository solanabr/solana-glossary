import { NextResponse } from "next/server";
import { getAllTerms, getLocalizedTerms } from "@/lib/glossary";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") || "en";
  const count = Math.min(parseInt(searchParams.get("count") || "20"), 100);
  const category = searchParams.get("category");

  let terms = locale === "en" ? getAllTerms() : getLocalizedTerms(locale);

  if (category) {
    terms = terms.filter((t) => t.category === category);
  }

  // Shuffle and pick
  const shuffled = [...terms].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  return NextResponse.json(selected);
}

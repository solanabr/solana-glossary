import { NextRequest, NextResponse } from "next/server";
import { getTerm, getTermsByCategory } from "@stbr/solana-glossary";
import { CATEGORY_LABELS } from "@/lib/categories";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI_NOT_CONFIGURED" }, { status: 503 });
  }

  const { termId, question } = await req.json();
  if (!termId || !question?.trim()) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const term = getTerm(termId);
  if (!term) {
    return NextResponse.json({ error: "TERM_NOT_FOUND" }, { status: 404 });
  }

  const catLabel = CATEGORY_LABELS[term.category] ?? term.category;

  const relatedContext = (term.related ?? [])
    .slice(0, 6)
    .map((id) => getTerm(id))
    .filter(Boolean)
    .map((t) => `• ${t!.term}: ${t!.definition.slice(0, 100)}`)
    .join("\n");

  const categoryContext = getTermsByCategory(term.category)
    .slice(0, 8)
    .map((t) => `• ${t.term}: ${t.definition.slice(0, 80)}`)
    .join("\n");

  const systemPrompt = `You are a Solana expert assistant embedded in the Solana Glossary.
The user is currently reading about "${term.term}" (category: ${catLabel}).

TERM:
${term.term}${term.aliases?.length ? ` (also: ${term.aliases.slice(0, 3).join(", ")})` : ""}

DEFINITION:
${term.definition}

RELATED TERMS:
${relatedContext || "none"}

MORE TERMS IN THIS CATEGORY:
${categoryContext}

RULES:
- Answer concisely: max 120 words
- Use short code snippets (Rust or TypeScript) only when they add real value
- Reference other Solana terms by name when relevant
- Detect the language of the question and answer in the same language (Portuguese, Spanish, or English)
- Be practical and builder-focused — avoid vague theory
- If you don't know, say so; never hallucinate program addresses or API signatures`;

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: question }] }],
    generationConfig: { maxOutputTokens: 350, temperature: 0.6 },
  };

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!geminiRes.ok) {
    return NextResponse.json({ error: "AI_ERROR" }, { status: 500 });
  }

  const data = await geminiRes.json();
  const answer =
    data.candidates?.[0]?.content?.parts?.[0]?.text ??
    "Não foi possível gerar uma resposta.";

  return NextResponse.json({ answer });
}

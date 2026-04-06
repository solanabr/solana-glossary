import { NextResponse } from "next/server";

import { generateCopilotAnswer } from "@/lib/copilot";
import { isSupportedLocale, type Locale } from "@/lib/locales";

export const runtime = "nodejs";

type CopilotRequestBody = {
  locale?: string;
  termSlug?: string;
  question?: string;
  codeSnippet?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CopilotRequestBody;
    const locale = body.locale;
    const termSlug = body.termSlug?.trim();
    const question = body.question?.trim();
    const codeSnippet = body.codeSnippet?.slice(0, 6000);

    if (!locale || !isSupportedLocale(locale)) {
      return NextResponse.json({ error: "Unsupported locale." }, { status: 400 });
    }

    if (!termSlug) {
      return NextResponse.json({ error: "termSlug is required." }, { status: 400 });
    }

    if (!question) {
      return NextResponse.json({ error: "question is required." }, { status: 400 });
    }

    const answer = await generateCopilotAnswer({
      locale: locale as Locale,
      termSlug,
      question: question.slice(0, 800),
      codeSnippet,
    });

    return NextResponse.json({ answer });
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : "Unexpected Copilot error.";
    const status = message.includes("GEMINI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

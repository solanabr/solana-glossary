import { notFound } from "next/navigation";

import { PathQuiz } from "@/components/path-quiz";
import { getCopy } from "@/lib/copy";
import { getBuilderPath } from "@/lib/glossary";
import { getQuizQuestionsForPath } from "@/lib/learning";
import { isSupportedLocale, type Locale } from "@/lib/locales";

export default async function LearnPathQuizPage({
  params,
}: {
  params: Promise<{ locale: string; pathSlug: string }>;
}) {
  const { locale, pathSlug } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const copy = getCopy(currentLocale);
  const path = getBuilderPath(pathSlug, currentLocale);
  if (!path) {
    notFound();
  }

  const questions = getQuizQuestionsForPath(path.slug, currentLocale);

  return (
    <div className="term-layout">
      <PathQuiz
        copy={{
          answerCta: copy.learn.answerCta,
          continueLearning: copy.learn.continueLearning,
          finishBody: copy.learn.finishBody,
          finishHighScore: copy.learn.finishHighScore,
          finishLowScore: copy.learn.finishLowScore,
          finishMidScore: copy.learn.finishMidScore,
          finishTitle: copy.learn.finishTitle,
          nextQuestion: copy.learn.nextQuestion,
          oneCorrect: copy.learn.oneCorrect,
          openTerm: copy.common.openTerm,
          progressLabel: copy.learn.progressLabel,
          questionLabel: copy.learn.questionLabel,
          restartQuiz: copy.learn.restartQuiz,
          reviewPath: copy.learn.reviewPath,
          scoreLabel: copy.learn.scoreLabel,
        }}
        locale={currentLocale}
        pathSlug={path.slug}
        questions={questions}
      />
    </div>
  );
}

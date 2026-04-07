"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { QuizQuestion } from "@/lib/learning";
import type { Locale } from "@/lib/locales";
import { withLocale } from "@/lib/routes";

type QuizCopy = {
  answerCta: string;
  continueLearning: string;
  finishBody: string;
  finishHighScore: string;
  finishLowScore: string;
  finishMidScore: string;
  finishTitle: string;
  nextQuestion: string;
  oneCorrect: string;
  openTerm: string;
  progressLabel: string;
  questionLabel: string;
  restartQuiz: string;
  reviewPath: string;
  scoreLabel: string;
};

export function PathQuiz({
  copy,
  locale,
  pathSlug,
  questions,
}: {
  copy: QuizCopy;
  locale: Locale;
  pathSlug: string;
  questions: QuizQuestion[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const currentQuestion = questions[currentIndex];
  const isFinished = currentIndex >= questions.length;
  const progressValue = isFinished ? questions.length : currentIndex + (submitted ? 1 : 0);
  const scoreRatio = questions.length > 0 ? correctCount / questions.length : 0;
  const finishFeedback =
    scoreRatio >= 0.75
      ? copy.finishHighScore
      : scoreRatio >= 0.4
        ? copy.finishMidScore
        : copy.finishLowScore;

  const progressText = useMemo(
    () => `${progressValue}/${questions.length}`,
    [progressValue, questions.length],
  );

  function resetQuiz() {
    setCurrentIndex(0);
    setSelected(null);
    setSubmitted(false);
    setCorrectCount(0);
  }

  function submitAnswer() {
    if (!currentQuestion || !selected || submitted) return;
    if (selected === currentQuestion.correctAnswer) {
      setCorrectCount((count) => count + 1);
    }
    setSubmitted(true);
  }

  function nextQuestion() {
    setSelected(null);
    setSubmitted(false);
    setCurrentIndex((index) => index + 1);
  }

  if (questions.length === 0) {
    return null;
  }

  if (isFinished) {
    return (
      <section className="detail-panel quiz-panel">
        <div className="quiz-summary">
          <span className="eyebrow">{copy.finishTitle}</span>
          <h1>{copy.finishTitle}</h1>
          <p className="lead">{copy.finishBody}</p>
          <p className="quiz-feedback">{finishFeedback}</p>

          <div className="quiz-score-card">
            <span>{copy.scoreLabel}</span>
            <strong>{correctCount} / {questions.length}</strong>
          </div>

          <div className="hero-actions">
            <button className="secondary-button" onClick={resetQuiz} type="button">
              {copy.restartQuiz}
            </button>
            <Link className="primary-link" href={withLocale(locale, `/paths/${pathSlug}`)}>
              {copy.reviewPath}
            </Link>
            <Link className="secondary-link" href={withLocale(locale, "/learn")}>
              {copy.continueLearning}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="detail-panel quiz-panel">
      <div className="quiz-header">
        <div>
          <span className="eyebrow">{copy.questionLabel}</span>
          <h1>{copy.questionLabel} {currentIndex + 1}</h1>
          <p className="lead">{copy.oneCorrect}</p>
        </div>
        <div className="quiz-meta">
          <span className="pill">
            <strong>{copy.progressLabel}</strong>
            {progressText}
          </span>
          <span className="pill">
            <strong>{copy.scoreLabel}</strong>
            {correctCount}
          </span>
        </div>
      </div>

      <article className="quiz-question-card">
        <p className="quiz-prompt">{currentQuestion.prompt}</p>
        <div className="quiz-options">
          {currentQuestion.options.map((option) => {
            const isCorrect = submitted && option === currentQuestion.correctAnswer;
            const isWrong = submitted && selected === option && option !== currentQuestion.correctAnswer;
            const isSelected = selected === option;

            return (
              <button
                className={[
                  "quiz-option",
                  isSelected ? "quiz-option-selected" : "",
                  isCorrect ? "quiz-option-correct" : "",
                  isWrong ? "quiz-option-wrong" : "",
                ].join(" ").trim()}
                disabled={submitted}
                key={option}
                onClick={() => setSelected(option)}
                type="button"
              >
                {option}
              </button>
            );
          })}
        </div>

        {submitted ? (
          <div className="quiz-explanation">
            <span className="story-label">{currentQuestion.correctAnswer}</span>
            <p>{currentQuestion.explanation}</p>
            <div className="hero-actions">
              <Link className="secondary-link" href={withLocale(locale, `/term/${currentQuestion.termId}`)}>
                {copy.openTerm}
              </Link>
              <button className="primary-link quiz-primary-button" onClick={nextQuestion} type="button">
                {copy.nextQuestion}
              </button>
            </div>
          </div>
        ) : (
          <div className="hero-actions">
            <button
              className="primary-link quiz-primary-button"
              disabled={!selected}
              onClick={submitAnswer}
              type="button"
            >
              {copy.answerCta}
            </button>
          </div>
        )}
      </article>
    </section>
  );
}

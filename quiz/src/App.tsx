import { useState } from "react";
import { Setup } from "./components/Setup";
import { QuizQuestion } from "./components/QuizQuestion";
import { Results } from "./components/Results";
import { Review } from "./components/Review";
import { generateQuestions, type Question, type QuizConfig, type QuizResult } from "./quiz";

type Screen = "setup" | "quiz" | "results" | "review";

export default function App() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);

  function handleStart(config: QuizConfig) {
    const qs = generateQuestions(config);
    setQuestions(qs);
    setResults([]);
    setCurrent(0);
    setScreen("quiz");
  }

  function handleAnswer(selectedIndex: number, timeMs: number) {
    const question = questions[current];
    const result: QuizResult = {
      question,
      selectedIndex,
      correct: selectedIndex === question.correctIndex,
      timeMs,
    };
    const newResults = [...results, result];
    setResults(newResults);

    if (current + 1 < questions.length) {
      setCurrent((c) => c + 1);
    } else {
      setScreen("results");
    }
  }

  function handleRestart() {
    setScreen("setup");
    setQuestions([]);
    setResults([]);
    setCurrent(0);
  }

  if (screen === "setup") {
    return <Setup onStart={handleStart} />;
  }

  if (screen === "quiz") {
    return (
      <QuizQuestion
        question={questions[current]}
        index={current}
        total={questions.length}
        onAnswer={handleAnswer}
      />
    );
  }

  if (screen === "review") {
    return <Review results={results} onBack={() => setScreen("results")} />;
  }

  return (
    <Results
      results={results}
      onRestart={handleRestart}
      onReview={() => setScreen("review")}
    />
  );
}

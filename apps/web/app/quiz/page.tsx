"use client";
import { useState, useCallback } from "react";
import { allTerms, getTermsByCategory, getCategories, type GlossaryTerm } from "@stbr/solana-glossary";
import { getLocalizedTerms } from "@stbr/solana-glossary/i18n";
import { CATEGORY_COLORS } from "../page";
import Link from "next/link";

function generateQuestion(pool: GlossaryTerm[]) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const correct = shuffled[0];
  const wrong = shuffled.slice(1, 4);
  const choices = [...wrong, correct].sort(() => Math.random() - 0.5);
  return { correct, choices };
}

export default function QuizPage() {
  const categories = getCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [question, setQuestion] = useState<ReturnType<typeof generateQuestion> | null>(null);
  const [answered, setAnswered] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lang, setLang] = useState<"en" | "pt" | "es">("en");

  const pool = selectedCategory ? getTermsByCategory(selectedCategory as never) : allTerms;

  const ptTerms = lang === "pt" ? (() => { try { return getLocalizedTerms("pt"); } catch { return []; } })() : [];
  const esTerms = lang === "es" ? (() => { try { return getLocalizedTerms("es"); } catch { return []; } })() : [];
  const locTerms = lang === "pt" ? ptTerms : lang === "es" ? esTerms : [];
  const loc = (t: GlossaryTerm): GlossaryTerm => {
    if (!locTerms.length) return t;
    const l = locTerms.find((x) => x.id === t.id);
    return l ? { ...t, term: l.term, definition: l.definition || t.definition } : t;
  };

  const startQuiz = useCallback(() => {
    setStarted(true);
    setQuestion(generateQuestion(pool));
    setAnswered(null);
    setScore(0);
    setTotal(0);
    setStreak(0);
  }, [pool]);

  const nextQuestion = useCallback(() => {
    setQuestion(generateQuestion(pool));
    setAnswered(null);
  }, [pool]);

  const handleAnswer = useCallback((choiceId: string) => {
    if (answered) return;
    setAnswered(choiceId);
    setTotal(t => t + 1);
    if (choiceId === question?.correct.id) {
      setScore(s => s + 1);
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }
  }, [answered, question]);

  if (!started) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Link href="/" style={{ position: "absolute", top: 24, left: 24, color: "var(--text-muted)", textDecoration: "none", fontSize: 13, fontFamily: "JetBrains Mono" }}>
          ← back
        </Link>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div style={{ color: "var(--green)", fontSize: 13, marginBottom: 12, fontFamily: "JetBrains Mono" }}>$ solana-glossary quiz</div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
            Test your <span style={{ color: "var(--green)" }}>Solana</span> knowledge
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
            Multiple choice quiz from 1001 terms. Pick a category or go random.
          </p>

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 16 }}>
              <button onClick={() => setSelectedCategory(null)} style={{
                background: "none", border: `1px solid ${!selectedCategory ? "var(--green)" : "var(--border)"}`,
                color: !selectedCategory ? "var(--green)" : "var(--text-muted)",
                padding: "6px 14px", borderRadius: 6, cursor: "pointer",
                fontFamily: "JetBrains Mono", fontSize: 12, transition: "all 0.15s",
              }}>all categories</button>
              {categories.map(c => (
                <button key={c} onClick={() => setSelectedCategory(c)} style={{
                  background: "none", border: `1px solid ${selectedCategory === c ? (CATEGORY_COLORS[c] || "var(--green)") : "var(--border)"}`,
                  color: selectedCategory === c ? (CATEGORY_COLORS[c] || "var(--green)") : "var(--text-muted)",
                  padding: "6px 14px", borderRadius: 6, cursor: "pointer",
                  fontFamily: "JetBrains Mono", fontSize: 11, transition: "all 0.15s",
                }}>{c}</button>
              ))}
            </div>
          </div>

          {/* language toggle */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
            {(["en", "pt", "es"] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} style={{
                background: "none", border: `1px solid ${lang === l ? "var(--green)" : "var(--border)"}`,
                color: lang === l ? "var(--green)" : "var(--text-muted)",
                padding: "4px 14px", borderRadius: 4, cursor: "pointer",
                fontFamily: "JetBrains Mono", fontSize: 12, textTransform: "uppercase",
                transition: "all 0.15s",
              }}>{l}</button>
            ))}
          </div>

          <button onClick={startQuiz} style={{
            background: "var(--green)", color: "#000", border: "none",
            padding: "14px 40px", borderRadius: 8, cursor: "pointer",
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16,
            transition: "opacity 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            Start Quiz →
          </button>
        </div>
      </main>
    );
  }

  if (!question) return null;

  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const scoreColor = pct >= 80 ? "var(--green)" : pct >= 50 ? "#f5a623" : "#ef5350";

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Link href="/" style={{ position: "absolute", top: 24, left: 24, color: "var(--text-muted)", textDecoration: "none", fontSize: 13, fontFamily: "JetBrains Mono" }}>
        ← back
      </Link>

      {/* score bar */}
      <div style={{ position: "absolute", top: 24, right: 24, display: "flex", gap: 16, alignItems: "center" }}>
        {streak >= 3 && (
          <span style={{ color: "#f5a623", fontSize: 13, fontFamily: "JetBrains Mono" }}>
            🔥 {streak} streak
          </span>
        )}
        <span style={{ color: scoreColor, fontSize: 13, fontFamily: "JetBrains Mono" }}>
          {score}/{total} {total > 0 && `(${pct}%)`}
        </span>
      </div>

      <div style={{ maxWidth: 600, width: "100%" }}>
        {/* category badge */}
        <div style={{ marginBottom: 16, textAlign: "center" }}>
          <span style={{
            fontSize: 11, fontFamily: "JetBrains Mono", padding: "3px 10px",
            borderRadius: 4, border: `1px solid ${CATEGORY_COLORS[question.correct.category] || "var(--green)"}44`,
            color: CATEGORY_COLORS[question.correct.category] || "var(--green)",
          }}>{question.correct.category}</span>
        </div>

        {/* question */}
        <div style={{
          background: "var(--bg-2)", border: "1px solid var(--border)",
          borderRadius: 12, padding: "28px 32px", marginBottom: 20,
        }}>
          <p style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 12, fontFamily: "JetBrains Mono" }}>
            What term is described below?
          </p>
          <p style={{ color: "var(--text)", fontSize: 16, lineHeight: 1.7 }}>
            {loc(question.correct).definition}
          </p>
        </div>

        {/* choices */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {question.choices.map((choice, idx) => {
            const isCorrect = choice.id === question.correct.id;
            const isSelected = answered === choice.id;
            const showResult = !!answered;

            let borderColor = "var(--border)";
            let bgColor = "var(--bg-2)";
            let textColor = "var(--text)";

            if (showResult) {
              if (isCorrect) { borderColor = "var(--green)"; bgColor = "rgba(20,241,149,0.08)"; textColor = "var(--green)"; }
              else if (isSelected) { borderColor = "#ef5350"; bgColor = "rgba(239,83,80,0.08)"; textColor = "#ef5350"; }
              else { textColor = "var(--text-dim)"; }
            }

            return (
              <button key={choice.id} onClick={() => handleAnswer(choice.id)} style={{
                background: bgColor, border: `1px solid ${borderColor}`,
                borderRadius: 8, padding: "14px 20px", cursor: answered ? "default" : "pointer",
                textAlign: "left", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 12,
              }}
                onMouseEnter={e => { if (!answered) e.currentTarget.style.borderColor = "var(--border-bright)"; }}
                onMouseLeave={e => { if (!answered) e.currentTarget.style.borderColor = "var(--border)"; }}
              >
                <span style={{ color: "var(--text-dim)", fontFamily: "JetBrains Mono", fontSize: 12, minWidth: 20 }}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span style={{ color: textColor, fontSize: 14, fontWeight: isCorrect && showResult ? 600 : 400 }}>
                  {loc(choice).term}
                </span>
                {showResult && isCorrect && <span style={{ marginLeft: "auto", color: "var(--green)" }}>✓</span>}
                {showResult && isSelected && !isCorrect && <span style={{ marginLeft: "auto", color: "#ef5350" }}>✗</span>}
              </button>
            );
          })}
        </div>

        {/* next button */}
        {answered && (
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <button onClick={nextQuestion} style={{
              background: "var(--bg-3)", border: "1px solid var(--border-bright)",
              color: "var(--text)", padding: "10px 32px", borderRadius: 6,
              cursor: "pointer", fontFamily: "JetBrains Mono", fontSize: 13,
              transition: "all 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--green)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-bright)")}
            >
              next question →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

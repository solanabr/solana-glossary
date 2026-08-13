import type { GlossaryTerm, Category } from "./glossary";
import { ALL_TERMS, getTermsByCategory } from "./glossary";

export interface Question {
  term: GlossaryTerm;
  options: string[];       // 4 definition options
  correctIndex: number;    // index in options that is correct
}

export interface QuizConfig {
  categories: Category[];
  questionCount: number;
}

export interface QuizResult {
  question: Question;
  selectedIndex: number;
  correct: boolean;
  timeMs: number;
}

/** Fisher-Yates shuffle (in place) */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  return shuffle([...arr]).slice(0, n);
}

/**
 * Generate quiz questions.
 * Each question: "What is the definition of [term]?"
 * 4 options: 1 correct + 3 distractors from the same or nearby categories.
 */
export function generateQuestions(config: QuizConfig): Question[] {
  const pool =
    config.categories.length === 0
      ? ALL_TERMS
      : config.categories.flatMap((c) => getTermsByCategory(c));

  // Only use terms with definitions long enough to be readable
  const eligible = pool.filter((t) => t.definition.length > 40);

  if (eligible.length < 4) {
    throw new Error("Not enough terms to generate questions");
  }

  const selected = pickRandom(eligible, Math.min(config.questionCount, eligible.length));

  return selected.map((term) => {
    // Distractors: pick 3 other terms from the full pool (not this term)
    const distractors = pickRandom(
      ALL_TERMS.filter((t) => t.id !== term.id),
      3
    );

    const truncate = (def: string) =>
      def.length > 200 ? def.slice(0, 200).trimEnd() + "…" : def;

    const options = shuffle([
      truncate(term.definition),
      ...distractors.map((d) => truncate(d.definition)),
    ]);

    const correctIndex = options.indexOf(truncate(term.definition));

    return { term, options, correctIndex };
  });
}

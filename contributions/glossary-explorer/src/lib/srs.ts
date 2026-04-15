/**
 * Spaced Repetition System (SRS) using the SM-2 algorithm.
 * Persists all state to localStorage for zero-backend operation.
 *
 * SM-2 algorithm summary:
 * - Each card has an ease factor (EF), interval, and repetition count
 * - After each review, quality (0-5) determines next interval
 * - Quality >= 3 = correct response, advances interval
 * - Quality < 3 = reset to beginning
 * - EF adjusts based on difficulty: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
 */

export type CardStatus = "new" | "learning" | "review" | "mastered";

export interface SRSCard {
  termId: string;
  easeFactor: number; // >= 1.3, default 2.5
  interval: number; // days until next review
  repetitions: number; // consecutive correct answers
  nextReview: number; // timestamp ms
  lastReview: number; // timestamp ms
  status: CardStatus;
  totalReviews: number;
  correctReviews: number;
}

export interface SRSStats {
  totalCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  masteredCards: number;
  dueToday: number;
  streak: number;
  longestStreak: number;
  lastStudyDate: string | null; // ISO date string
  totalReviews: number;
}

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

const STORAGE_KEY = "solana-glossary-srs";
const STREAK_KEY = "solana-glossary-streak";
const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;
const MASTERED_THRESHOLD = 5; // repetitions to be considered mastered

function getCards(): Map<string, SRSCard> {
  if (typeof window === "undefined") return new Map();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const arr: SRSCard[] = JSON.parse(raw);
    return new Map(arr.map((c) => [c.termId, c]));
  } catch {
    return new Map();
  }
}

function saveCards(cards: Map<string, SRSCard>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...cards.values()]));
}

function getStreakData(): {
  streak: number;
  longestStreak: number;
  lastStudyDate: string | null;
} {
  if (typeof window === "undefined")
    return { streak: 0, longestStreak: 0, lastStudyDate: null };
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { streak: 0, longestStreak: 0, lastStudyDate: null };
    return JSON.parse(raw);
  } catch {
    return { streak: 0, longestStreak: 0, lastStudyDate: null };
  }
}

function saveStreakData(data: {
  streak: number;
  longestStreak: number;
  lastStudyDate: string | null;
}): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function updateStreak(): void {
  const data = getStreakData();
  const today = todayISO();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (data.lastStudyDate === today) return; // already studied today

  if (data.lastStudyDate === yesterday) {
    data.streak += 1;
  } else if (data.lastStudyDate !== today) {
    data.streak = 1;
  }

  data.longestStreak = Math.max(data.longestStreak, data.streak);
  data.lastStudyDate = today;
  saveStreakData(data);
}

/** Initialize a new SRS card for a term */
export function createCard(termId: string): SRSCard {
  return {
    termId,
    easeFactor: DEFAULT_EASE_FACTOR,
    interval: 0,
    repetitions: 0,
    nextReview: Date.now(),
    lastReview: 0,
    status: "new",
    totalReviews: 0,
    correctReviews: 0,
  };
}

/** Get or create a card for a term */
export function getCard(termId: string): SRSCard {
  const cards = getCards();
  return cards.get(termId) ?? createCard(termId);
}

/** Apply SM-2 algorithm after a review */
export function reviewCard(termId: string, quality: ReviewQuality): SRSCard {
  const cards = getCards();
  const card = cards.get(termId) ?? createCard(termId);
  const now = Date.now();

  card.totalReviews += 1;
  card.lastReview = now;

  if (quality >= 3) {
    // Correct response
    card.correctReviews += 1;

    if (card.repetitions === 0) {
      card.interval = 1;
    } else if (card.repetitions === 1) {
      card.interval = 6;
    } else {
      card.interval = Math.round(card.interval * card.easeFactor);
    }

    card.repetitions += 1;
  } else {
    // Incorrect - reset
    card.repetitions = 0;
    card.interval = 1;
  }

  // Update ease factor: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  const qDiff = 5 - quality;
  card.easeFactor = Math.max(
    MIN_EASE_FACTOR,
    card.easeFactor + (0.1 - qDiff * (0.08 + qDiff * 0.02)),
  );

  card.nextReview = now + card.interval * 86400000; // days to ms

  // Update status
  if (card.repetitions >= MASTERED_THRESHOLD) {
    card.status = "mastered";
  } else if (card.repetitions >= 1) {
    card.status = "review";
  } else {
    card.status = "learning";
  }

  cards.set(termId, card);
  saveCards(cards);
  updateStreak();

  return card;
}

/** Get all cards that are due for review today */
export function getDueCards(allTermIds?: string[]): SRSCard[] {
  const cards = getCards();
  const now = Date.now();

  if (allTermIds) {
    // Include terms that have never been studied as "new"
    for (const id of allTermIds) {
      if (!cards.has(id)) {
        cards.set(id, createCard(id));
      }
    }
  }

  return [...cards.values()].filter((c) => c.nextReview <= now);
}

/** Get cards filtered by status */
export function getCardsByStatus(status: CardStatus): SRSCard[] {
  const cards = getCards();
  return [...cards.values()].filter((c) => c.status === status);
}

/** Get comprehensive SRS statistics */
export function getStats(totalTermCount: number): SRSStats {
  const cards = getCards();
  const streakData = getStreakData();
  const now = Date.now();

  let newCards = 0;
  let learningCards = 0;
  let reviewCards = 0;
  let masteredCards = 0;
  let dueToday = 0;
  let totalReviews = 0;

  for (const card of cards.values()) {
    totalReviews += card.totalReviews;

    switch (card.status) {
      case "new":
        newCards++;
        break;
      case "learning":
        learningCards++;
        break;
      case "review":
        reviewCards++;
        break;
      case "mastered":
        masteredCards++;
        break;
    }

    if (card.nextReview <= now) {
      dueToday++;
    }
  }

  // Terms never studied count as "new"
  const unstudied = totalTermCount - cards.size;
  newCards += unstudied;

  return {
    totalCards: totalTermCount,
    newCards,
    learningCards,
    reviewCards,
    masteredCards,
    dueToday,
    streak: streakData.streak,
    longestStreak: streakData.longestStreak,
    lastStudyDate: streakData.lastStudyDate,
    totalReviews,
  };
}

/** Get a batch of cards for a study session */
export function getStudyBatch(
  allTermIds: string[],
  batchSize: number = 20,
): string[] {
  const cards = getCards();
  const now = Date.now();

  // Priority: due cards first, then new cards
  const due: { id: string; priority: number }[] = [];
  const newTerms: string[] = [];

  for (const id of allTermIds) {
    const card = cards.get(id);
    if (!card) {
      newTerms.push(id);
    } else if (card.nextReview <= now && card.status !== "mastered") {
      due.push({ id, priority: now - card.nextReview }); // most overdue first
    }
  }

  // Sort due cards by how overdue they are
  due.sort((a, b) => b.priority - a.priority);

  const batch: string[] = [];

  // Add due cards first
  for (const d of due) {
    if (batch.length >= batchSize) break;
    batch.push(d.id);
  }

  // Fill remaining with new cards (shuffled)
  const shuffledNew = newTerms.sort(() => Math.random() - 0.5);
  for (const id of shuffledNew) {
    if (batch.length >= batchSize) break;
    batch.push(id);
  }

  return batch;
}

/** Reset all SRS data */
export function resetAllProgress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STREAK_KEY);
}

/** Get accuracy percentage */
export function getAccuracy(): number {
  const cards = getCards();
  let total = 0;
  let correct = 0;

  for (const card of cards.values()) {
    total += card.totalReviews;
    correct += card.correctReviews;
  }

  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

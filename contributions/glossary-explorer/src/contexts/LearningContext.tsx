"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getStats,
  getStudyBatch,
  reviewCard,
  getCard,
  getAccuracy,
  resetAllProgress,
  type SRSStats,
  type ReviewQuality,
  type SRSCard,
} from "@/lib/srs";
import {
  getAllLearningPaths,
  getAllPathProgress,
  getPathProgress,
  markTermCompleteInPath,
  getPathCompletionPercent,
  type LearningPath,
  type PathProgress,
} from "@/lib/learning-paths";
import { allTerms } from "@/lib/glossary";

interface LearningContextValue {
  // SRS
  stats: SRSStats;
  accuracy: number;
  getStudySession: (batchSize?: number) => string[];
  review: (termId: string, quality: ReviewQuality) => SRSCard;
  getCardInfo: (termId: string) => SRSCard;
  refreshStats: () => void;
  resetProgress: () => void;

  // Learning Paths
  paths: LearningPath[];
  getProgress: (slug: string) => PathProgress | null;
  getCompletionPercent: (path: LearningPath) => number;
  completeTermInPath: (slug: string, termId: string) => void;
  allProgress: Record<string, PathProgress>;
}

const LearningContext = createContext<LearningContextValue | null>(null);

const allTermIds = allTerms.map((t) => t.id);

export function LearningProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<SRSStats>(() => getStats(allTerms.length));
  const [accuracy, setAccuracy] = useState(0);
  const [allProgress, setAllProgress] = useState<Record<string, PathProgress>>(
    {},
  );

  // Hydrate from localStorage on mount
  useEffect(() => {
    setStats(getStats(allTerms.length));
    setAccuracy(getAccuracy());
    setAllProgress(getAllPathProgress());
  }, []);

  const refreshStats = useCallback(() => {
    setStats(getStats(allTerms.length));
    setAccuracy(getAccuracy());
    setAllProgress(getAllPathProgress());
  }, []);

  const getStudySession = useCallback(
    (batchSize = 20) => getStudyBatch(allTermIds, batchSize),
    [],
  );

  const review = useCallback(
    (termId: string, quality: ReviewQuality) => {
      const result = reviewCard(termId, quality);
      refreshStats();
      return result;
    },
    [refreshStats],
  );

  const getCardInfo = useCallback((termId: string) => getCard(termId), []);

  const resetProgressFn = useCallback(() => {
    resetAllProgress();
    refreshStats();
  }, [refreshStats]);

  const paths = useMemo(() => getAllLearningPaths(), []);

  const getProgressFn = useCallback(
    (slug: string) => getPathProgress(slug),
    [],
  );

  const getCompletionPercent = useCallback(
    (path: LearningPath) => {
      const progress = allProgress[path.slug] ?? null;
      return getPathCompletionPercent(path, progress);
    },
    [allProgress],
  );

  const completeTermInPath = useCallback(
    (slug: string, termId: string) => {
      markTermCompleteInPath(slug, termId);
      refreshStats();
    },
    [refreshStats],
  );

  const value = useMemo(
    () => ({
      stats,
      accuracy,
      getStudySession,
      review,
      getCardInfo,
      refreshStats,
      resetProgress: resetProgressFn,
      paths,
      getProgress: getProgressFn,
      getCompletionPercent,
      completeTermInPath,
      allProgress,
    }),
    [
      stats,
      accuracy,
      getStudySession,
      review,
      getCardInfo,
      refreshStats,
      resetProgressFn,
      paths,
      getProgressFn,
      getCompletionPercent,
      completeTermInPath,
      allProgress,
    ],
  );

  return (
    <LearningContext.Provider value={value}>
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning() {
  const context = useContext(LearningContext);
  if (!context) {
    throw new Error("useLearning must be used within a LearningProvider");
  }
  return context;
}

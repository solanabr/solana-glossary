import { UI_LABELS, formatUi, type Locale } from "./glossary";
import type { GlossaryTerm } from "./glossary";
import {
  LEARN_PATH_STAGES,
  LEARN_PATH_TERM_IDS,
  type LearnPathStageKey,
} from "./learn-path";

export function stageCopy(
  t: (typeof UI_LABELS)[Locale],
  key: LearnPathStageKey,
): { title: string; desc: string } {
  switch (key) {
    case "consensus":
      return {
        title: t.learn_stage_consensus_title,
        desc: t.learn_stage_consensus_desc,
      };
    case "accounts":
      return {
        title: t.learn_stage_accounts_title,
        desc: t.learn_stage_accounts_desc,
      };
    case "programs":
      return {
        title: t.learn_stage_programs_title,
        desc: t.learn_stage_programs_desc,
      };
    case "network":
      return {
        title: t.learn_stage_network_title,
        desc: t.learn_stage_network_desc,
      };
  }
}

export const LEARN_PATH_TOPIC_COUNT = LEARN_PATH_TERM_IDS.length;
export const LEARN_PATH_MODULE_COUNT = LEARN_PATH_STAGES.length;
export const LEARN_READ_MINUTES = 25;
export const LEARN_FIRST_TERM_ID = LEARN_PATH_TERM_IDS[0]!;

export const LEARN_STEP_BY_TERM_ID = new Map(
  LEARN_PATH_TERM_IDS.map((id, i) => [id, i + 1]),
);

export function learnPathStatsLine(locale: Locale): string {
  const t = UI_LABELS[locale];
  return formatUi(t.learn_stats, {
    topics: LEARN_PATH_TOPIC_COUNT,
    modules: LEARN_PATH_MODULE_COUNT,
    minutes: LEARN_READ_MINUTES,
  });
}

/** Client-safe preview trim (avoid importing server-only glossary-fs). */
export function learnPathTruncatePreview(text: string, max: number): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max - 1)}…`;
}

export function selectPathTerms(allTerms: GlossaryTerm[]): GlossaryTerm[] {
  const byId = new Map(allTerms.map((x) => [x.id, x]));
  return LEARN_PATH_TERM_IDS.map((id) => byId.get(id)).filter(
    (x): x is GlossaryTerm => x != null,
  );
}

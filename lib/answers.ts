import answersJson from "@/data/answers.json";
import { normalize } from "./normalize";
import type { Answer } from "./model";

/**
 * Pre-generated answers, committed to the repo.
 * Keys: `${route}::${normalised question}` for route-specific suggestions,
 * plain `${normalised question}` for canned questions.
 */
const answers = answersJson as Record<string, Answer>;

export const answerKey = (question: string, route?: string) => (route ? `${route}::${normalize(question)}` : normalize(question));

const clean = (a: Answer | undefined): Answer | undefined => {
  if (!a || typeof a.text !== "string" || !a.text.trim()) return undefined;
  return { text: a.text, sources: Array.isArray(a.sources) ? a.sources : [] };
};

/** Route-specific answer first, then the route-agnostic one. */
export const lookupAnswer = (question: string, route?: string): Answer | undefined =>
  (route ? clean(answers[answerKey(question, route)]) : undefined) ?? clean(answers[answerKey(question)]);

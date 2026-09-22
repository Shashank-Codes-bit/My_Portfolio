/**
 * Lowercase, fold accents, strip punctuation, collapse whitespace, keep apostrophes.
 * Used as the key into answers.json and for keyword matching, so "Résumé?" and "resume" agree.
 */
export const normalize = (q: string): string =>
  q
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[’‘‛`´]/g, "'")
    .replace(/[^a-z0-9'%+ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

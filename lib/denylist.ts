import { SITE } from "./site";

/**
 * Refusal rules, checked before any model call. First person, like the rest of the site.
 * Patterns are person-directed ("your salary", "are you married") so corpus vocabulary such as
 * "high-availability", "payout", "joining the schema" or "how old is the tool" never trips them.
 * Order matters: the first matching rule wins.
 */
export type DenyRule = { id: string; pattern: RegExp; response: string };

const HANDOFF = `Not something I can go into here. Email me directly: ${SITE.email}`;
const YOU = "(?:you|he|shashank)";
const YOUR = "(?:your|his)";

export const denyRules: DenyRule[] = [
  {
    id: "compensation",
    pattern: new RegExp(
      [
        `\\b${YOUR} (?:salary|ctc|compensation|pay|package|remuneration|rate|rates|charges|fees?)\\b`,
        `\\bsalary\\b`,
        `\\bctc\\b`,
        `\\blpa\\b`,
        `\\blakhs? per annum\\b`,
        `\\b(?:expected|current|last|previous) (?:salary|package|ctc|pay)\\b`,
        `\\bhow much (?:do|does) ${YOU} (?:charge|cost|earn|make|get paid)\\b`,
        `\\b(?:hourly|daily|day) rate\\b`,
        `\\b(?:are|were|is|was) ${YOU} paid\\b`,
        `\\bpayslip\\b`,
        `\\bstipend\\b`,
      ].join("|"),
      "i",
    ),
    response: HANDOFF,
  },
  {
    id: "availability",
    pattern: new RegExp(
      [
        `\\bnotice period\\b`,
        `\\b${YOUR} (?:availability|notice|joining date|start date|last working day)\\b`,
        `\\bwhen (?:can|could|will) ${YOU} (?:start|join)\\b`,
        `\\bavailable (?:to start|to join|immediately|from)\\b`,
        `\\bearliest (?:start|joining)\\b`,
        `\\bserving notice\\b`,
      ].join("|"),
      "i",
    ),
    response: HANDOFF,
  },
  {
    id: "personal",
    pattern: new RegExp(
      [
        `\\b(?:are|is) ${YOU} (?:married|single|dating|religious)\\b`,
        `\\b${YOUR} (?:wife|husband|girlfriend|boyfriend|partner|family|kids|children|religion|caste|age|birthday|date of birth|home address|marital status)\\b`,
        `\\bhow old (?:are|is) ${YOU}\\b`,
        `\\bwhere (?:do|does) ${YOU} live\\b`,
        `\\bpolitic\\w*\\b`,
      ].join("|"),
      "i",
    ),
    response: "I only talk about my work here. Anything else is best asked over email.",
  },
];

export const checkDenylist = (question: string): DenyRule | undefined => denyRules.find((r) => r.pattern.test(question));

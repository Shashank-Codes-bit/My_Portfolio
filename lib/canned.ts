import { normalize } from "./normalize";
import { allSuggestionStrings } from "./suggestions";

/**
 * ~20 predictable questions, keyword-matched.
 * A hit is served from data/answers.json with no model call.
 * `question` is the canonical phrasing pregenerate.ts sends to the model (addressed to Shashank as "you");
 * its normalised form is the answers.json key. Patterns are anchored to the person ("you/your", "he/his")
 * so corpus vocabulary in an unrelated question cannot trigger a wrong canned answer.
 */
export type Canned = { question: string; patterns: RegExp[]; /** Too generic to answer on a project page. */ pageSensitive?: boolean };

const YOU = "(?:you|he|shashank)";
const YOUR = "(?:your|his)";

export const canned: Canned[] = [
  { question: "What do you actually build?", pageSensitive: true, patterns: [new RegExp(`what (?:do|does) ${YOU} (?:actually )?(?:build|do|make|work on)`), new RegExp(`what (?:is|are) ${YOUR} (?:work|services|offer)`)] },
  { question: "Where are you based?", patterns: [new RegExp(`where (?:is|does|are|do) ${YOU}(?: live| based| located| from)`), new RegExp(`${YOUR} (?:location|city|base)\\b`), /\bbased in\b/] },
  { question: "How do I contact you?", patterns: [new RegExp(`how (?:do|can) i (?:contact|reach|email|get in touch with) ${YOU}`), new RegExp(`${YOUR} (?:email|phone|contact|linkedin)`), /\bcontact (?:details|info|information)\b/] },
  { question: "Do you have a resume?", patterns: [/\b(?:resume|résumé|cv|curriculum vitae)\b/] },
  { question: "What is your current role and company?", patterns: [new RegExp(`${YOUR} (?:current )?(?:role|job|title|company|employer|designation)\\b`), new RegExp(`where (?:do|does) ${YOU} work`), new RegExp(`who (?:do|does) ${YOU} work for`)] },
  { question: "How many years of experience do you have?", patterns: [/\bhow many years\b/, /\byears of experience\b/, new RegExp(`how long (?:have|has) ${YOU} (?:been|worked)`), /\bhow experienced\b/] },
  { question: "What is your education?", patterns: [new RegExp(`${YOUR} (?:education|degree|college|university|cgpa|qualification)`), new RegExp(`where did ${YOU} (?:study|graduate)`), /\bb\.?tech\b/, /\bcgpa\b/] },
  { question: "Do you know Siebel?", patterns: [new RegExp(`(?:do|does) ${YOU} (?:know|use|work (?:with|in|on)) siebel`), new RegExp(`${YOUR} siebel (?:experience|skills|background)`), new RegExp(`siebel (?:experience|expert|skills)`)] },
  { question: "Do you build voice agents?", patterns: [new RegExp(`(?:do|does|can) ${YOU} (?:build|make|do|offer) (?:voice|phone|call)`), new RegExp(`${YOUR} voice (?:agents?|bots?|work)`)] },
  { question: "What is Dhobi Dash?", patterns: [/\bdhobi\b/, /\bdry.?clean/, /\blaundry\b/] },
  { question: "What are you?", patterns: [/^(?:so |and )?(?:what|who) (?:exactly |really |actually )?are you(?: exactly| really| actually| then)?$/, /\bare you (?:a bot|an ai|a chatbot|chatgpt|gpt|claude|human|real|actually shashank|shashank himself)\b/, /\bam i (?:talking|speaking|chatting) to\b/, /\bhow (?:do|does) (?:you|this|this assistant|the assistant|this bot) work\b/, /\bwhat model (?:is this|are you|powers)\b/] },
  { question: "Can I see your code?", patterns: [/\bgithub\b/, /\bsource code\b/, /\b(?:repo|repository|repositories)\b/, /\bopen source\b/, new RegExp(`see ${YOUR} code`)] },
  { question: "Are you open to consulting work?", patterns: [new RegExp(`(?:open to|available for|do ${YOU} (?:do|take|offer)) (?:consulting|freelance|contract)`), /\b(?:consult\w*|freelanc\w*) (?:work|gigs?|projects?|engagements?)\b/, new RegExp(`hire ${YOU}\\b`), /\bhiring\b/, new RegExp(`what (?:is|are) ${YOU} looking for`), /\blooking for (?:work|a job|roles?|opportunities)\b/, /\bfull.?time\b/] },
  { question: "Is any of it live?", pageSensitive: true, patterns: [/\b(?:is|are) (?:any|anything|it|this|that|they|these)(?: of (?:it|them|this))? (?:live|in production|deployed|shipped|running)\b/, /\bwhat(?: of it)? is (?:live|in production)\b/, /\blive projects?\b/] },
  { question: "What is your tech stack?", pageSensitive: true, patterns: [/\btech stack\b/, new RegExp(`${YOUR} (?:stack|skills|skill ?set|toolkit)\\b`), /\bwhat stack\b/, new RegExp(`(?:what )?(?:technologies|tools|frameworks?|languages) (?:do|does) ${YOU} (?:use|know|work with|code in)`)] },
  { question: "What languages do you speak?", patterns: [new RegExp(`languages? (?:do|does|can) ${YOU} speak`), /\bspoken languages?\b/, /\bspeak (?:hindi|english)\b/, /\bhindi\b/] },
  { question: "Have you won any awards?", patterns: [/\bawards?\b/, /\brecognitions?\b/, /\bdiamond award\b/] },
  { question: "Do you have any certifications?", patterns: [/\bcertif\w*\b/, /\bpendo\b/] },
  { question: "Do you work remotely?", patterns: [/\bremote\w*\b/, /\brelocat\w*\b/, /\bhybrid\b/, /\bwork from home\b/, /\bwfh\b/, /\b(?:abroad|overseas)\b/] },
  { question: "What is your biggest project?", pageSensitive: true, patterns: [new RegExp(`${YOUR} (?:biggest|largest|most impressive|best|proudest|favou?rite|flagship) (?:project|work|thing)`), /\b(?:biggest|largest|proudest) (?:project|thing|piece of work)\b/] },
  { question: "Do you use vector databases or embeddings?", patterns: [/\bvector (?:db|database|store)s?\b/, /\bembeddings?\b/, /\b(?:pinecone|weaviate|chroma|langchain|llamaindex)\b/, /\brag pipeline\b/] },
  { question: "Why AI, coming from CRM?", patterns: [/\bwhy ai\b/, /\b(?:from|out of) (?:crm|siebel) (?:to|into) ai\b/, /\btransition\w* (?:to|into) ai\b/] },
  { question: "What are you strongest at?", patterns: [new RegExp(`${YOUR} (?:strengths?|strongest|core skill|superpower|specialit(?:y|ies))`), new RegExp(`what (?:is|are) ${YOU} (?:strongest at|best at|good at)`), new RegExp(`${YOU} specialis\\w*`)] },
];

/** Suggestion strings are matched exactly (after normalisation) before keyword rules. */
const suggestionKeys = new Map(allSuggestionStrings().map((s) => [normalize(s), s]));

export type CannedMatch = { question: string; via: "suggestion" | "exact" | "keyword" };

/** Questions that name a specific project or client artefact are too specific for a generic canned answer. */
const ENTITY =
  /\b(voltas|hero|airtel|fuso|mitsubishi|tdd|booking|hr policy|hr bot|easyapply|leadsquared|docusign|cubastion|contract|monitoring|production|payout|prd|incident|schema|register)\b/;
const MAX_KEYWORD_WORDS = 9;

export const matchCanned = (raw: string, route?: string): CannedMatch | undefined => {
  const n = normalize(raw);
  const s = suggestionKeys.get(n);
  if (s) return { question: s, via: "suggestion" };
  for (const c of canned) if (normalize(c.question) === n) return { question: c.question, via: "exact" };
  // Keyword rules only for short, generic questions. Anything specific goes to the model.
  if (n.split(" ").length > MAX_KEYWORD_WORDS || ENTITY.test(n)) return undefined;
  const onProjectPage = route?.startsWith("/work/") ?? false;
  for (const c of canned) {
    if (onProjectPage && c.pageSensitive) continue; // "what's the stack" on /work/voltas means Voltas's stack
    if (c.patterns.some((p) => p.test(n))) return { question: c.question, via: "keyword" };
  }
  return undefined;
};

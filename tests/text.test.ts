import { describe, expect, it } from "vitest";
import { normalize } from "@/lib/normalize";
import { checkDenylist } from "@/lib/denylist";
import { canned, matchCanned } from "@/lib/canned";
import { parseSourcesLine, scanForIds, SYSTEM_PROMPT, buildPrompt } from "@/lib/prompt";
import { stripIds } from "@/lib/model";
import { SITE } from "@/lib/site";

describe("normalize", () => {
  it("lowercases, strips punctuation, collapses whitespace, keeps apostrophes", () => {
    expect(normalize("  What’s   HE  building?!  ")).toBe("what's he building");
    expect(normalize("Is any of it live?")).toBe("is any of it live");
    expect(normalize("17% uplift + more")).toBe("17% uplift + more");
  });
  it("folds accents so résumé and resume agree", () => {
    expect(normalize("Résumé?")).toBe("resume");
    expect(normalize("naïve")).toBe("naive");
  });
});

describe("denylist", () => {
  it("catches compensation, availability and personal questions in either voice", () => {
    expect(checkDenylist("What is his salary?")?.id).toBe("compensation");
    expect(checkDenylist("what's your CTC")?.id).toBe("compensation");
    expect(checkDenylist("What is your expected package?")?.id).toBe("compensation");
    expect(checkDenylist("How much do you charge?")?.id).toBe("compensation");
    expect(checkDenylist("What is your notice period?")?.id).toBe("availability");
    expect(checkDenylist("When can you start?")?.id).toBe("availability");
    expect(checkDenylist("Are you married?")?.id).toBe("personal");
    expect(checkDenylist("How old are you?")?.id).toBe("personal");
  });

  it("does not catch ordinary work questions that share vocabulary", () => {
    for (const q of [
      "What does the monitoring cover?",
      "How do shops pay in Dhobi Dash?",
      "Is the payout paid via SAP?",
      "What does high-availability mean on the Fuso estate?",
      "Is joining the extension schema hard?",
      "How old is the Voltas monitoring tool?",
      "Which npm package does the TDD generator use?",
      "What age group are Dhobi Dash customers?",
    ]) {
      expect(checkDenylist(q), q).toBeUndefined();
    }
  });

  it("refusals speak in the first person and carry the email", () => {
    expect(checkDenylist("salary")?.response).toContain(SITE.email);
  });
});

describe("canned matching", () => {
  it("matches suggestion strings exactly after normalisation", () => {
    const m = matchCanned("  is ANY of it live? ");
    expect(m?.via).toBe("suggestion");
    expect(m?.question).toBe("Is any of it live?");
  });

  it("matches short person-directed questions by keyword in either voice", () => {
    expect(matchCanned("where is he based")?.question).toBe("Where are you based?");
    expect(matchCanned("where are you based?")?.question).toBe("Where are you based?");
    expect(matchCanned("do you have a cv")?.question).toBe("Do you have a resume?");
    expect(matchCanned("what are you")?.question).toBe("What are you?");
    expect(matchCanned("are you a bot?")?.question).toBe("What are you?");
  });

  it("does not fire on corpus vocabulary in unrelated questions", () => {
    for (const q of [
      "How did contract turnaround improve?",
      "What is Cubastion Consulting?",
      "Which city is the Voltas estate in?",
      "What is production monitoring?",
      "Does the voice agent use the phone line?",
      "To what degree is the payout automated?",
      "Is there a PRD pdf?",
      "What are you working on right now?",
    ]) {
      const m = matchCanned(q);
      expect(m?.via ?? "none", `${q} → ${m?.question}`).not.toBe("keyword");
    }
  });

  it("sends specific or long questions to the model, and page-sensitive ones on project pages", () => {
    expect(matchCanned("What tools does the Voltas monitoring use?")).toBeUndefined();
    expect(matchCanned("Can you explain in detail how the Hero extension schema handoff works at night?")).toBeUndefined();
    expect(matchCanned("what's the tech stack", "/work/voltas")).toBeUndefined();
    expect(matchCanned("what's the tech stack", "/about")?.question).toBe("What is your tech stack?");
  });

  it("has unique canonical questions", () => {
    expect(new Set(canned.map((c) => normalize(c.question))).size).toBe(canned.length);
  });
});

describe("prompt protocol", () => {
  it("parses the sources line, drops unknown ids, and never mistakes prose for it", () => {
    expect(parseSourcesLine("sources: work.voltas, work.fuso, nope.thing")).toEqual(["work.voltas", "work.fuso"]);
    expect(parseSourcesLine("Sources: none")).toEqual([]);
    expect(parseSourcesLine("Source: the HR bot is live at cubastion-hr-bot.onrender.com")).toBeUndefined();
    expect(parseSourcesLine("I build three kinds of things.")).toBeUndefined();
  });

  it("scans text only for dotted ids, never for words like contact or hero", () => {
    expect(scanForIds("see work.voltas and stack.crm")).toEqual(expect.arrayContaining(["work.voltas", "stack.crm"]));
    expect(scanForIds("You can contact me by email. He is a hero.")).toEqual([]);
  });

  it("builds a stable system prompt and a user turn with an optional route hint", () => {
    const a = buildPrompt("Q?", "/work/voltas");
    const b = buildPrompt("Other?", undefined);
    expect(a.system).toBe(b.system); // byte-identical prefix → prompt cache hits
    expect(a.system.startsWith(SYSTEM_PROMPT)).toBe(true);
    expect(a.user).toContain("/work/voltas");
    expect(b.user).toBe("Other?");
  });
});

describe("stripIds", () => {
  it("removes real ids only, leaving ordinary parentheticals alone", () => {
    expect(stripIds("Dhobi Dash is live (work.dhobidash), and the HR bot (work.hrbot, work.fuso) too.")).toBe(
      "Dhobi Dash is live, and the HR bot too.",
    );
    expect(stripIds("See work.voltas for details.").trim()).toBe("See for details.");
    expect(stripIds("Built on Node (node.js), e.g. (e.g.) with a 17% uplift (hero).")).toBe(
      "Built on Node (node.js), e.g. (e.g.) with a 17% uplift (hero).",
    );
  });
});

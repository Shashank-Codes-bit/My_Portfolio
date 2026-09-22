import { describe, expect, it } from "vitest";
import { byId, caseStudies, corpus, entryIds, neighbours, slugOf, workEntries } from "@/lib/corpus";
import { suggestions } from "@/lib/suggestions";

const routes = new Set<string>(["/", "/how-i-build", "/about", ...caseStudies.map((e) => e.href!)]);

describe("corpus invariants", () => {
  it("has unique ids", () => {
    expect(new Set(entryIds).size).toBe(entryIds.length);
  });

  it("every href points at a real route (ignoring the hash)", () => {
    for (const e of corpus) {
      if (!e.href) continue;
      const path = e.href.split("#")[0] || "/";
      expect(routes.has(path), `${e.id} → ${e.href}`).toBe(true);
    }
  });

  it("every work entry has a group, status and owner", () => {
    for (const e of workEntries) {
      expect(e.group, e.id).toBeTruthy();
      expect(e.status, e.id).toBeTruthy();
      expect(e.owner, e.id).toBeTruthy();
    }
  });

  it("case studies have slugs, summaries and non-empty bodies", () => {
    for (const e of caseStudies) {
      expect(slugOf(e)).toMatch(/^[a-z0-9-]+$/);
      expect(e.summary?.length ?? 0).toBeGreaterThan(10);
      expect(e.body.length).toBeGreaterThan(200);
    }
  });

  it("prev/next walk the case studies without gaps", () => {
    const first = slugOf(caseStudies[0]);
    const last = slugOf(caseStudies[caseStudies.length - 1]);
    expect(neighbours(first).prev).toBeUndefined();
    expect(neighbours(last).next).toBeUndefined();
    for (let i = 1; i < caseStudies.length - 1; i++) {
      const n = neighbours(slugOf(caseStudies[i]));
      expect(n.prev?.id).toBe(caseStudies[i - 1].id);
      expect(n.next?.id).toBe(caseStudies[i + 1].id);
    }
    expect(neighbours("does-not-exist")).toEqual({ prev: undefined, next: undefined });
  });

  it("entries referenced by the pages exist", () => {
    for (const id of ["hero", "offer.assistants", "offer.agents", "offer.enterprise", "principles", "background", "contact", "assistant"]) {
      expect(byId(id), id).toBeDefined();
    }
  });

  it("no entry body contains a raw entry id in prose", () => {
    for (const e of corpus) {
      expect(e.body).not.toMatch(/\b(work|principle|stack|offer)\.[a-z]+\b/);
    }
  });
});

describe("suggestions", () => {
  it("every suggestion route is a real route and has three questions", () => {
    for (const [route, qs] of Object.entries(suggestions)) {
      expect(routes.has(route), route).toBe(true);
      expect(qs.length, route).toBe(3);
      for (const q of qs) expect(q.endsWith("?"), q).toBe(true);
    }
  });

  it("every case study has its own suggestions", () => {
    for (const e of caseStudies) expect(suggestions[e.href!], e.href).toBeDefined();
  });
});

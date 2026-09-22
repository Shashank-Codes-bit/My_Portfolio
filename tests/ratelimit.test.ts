import { describe, expect, it } from "vitest";
import { allowModelCall, allowRequest, clientIp } from "@/lib/ratelimit";

describe("rate limiting", () => {
  it("allows 20 requests per IP per minute and then refuses", () => {
    const ip = `test-${Math.random()}`;
    for (let i = 0; i < 20; i++) expect(allowRequest(ip)).toBe(true);
    expect(allowRequest(ip)).toBe(false);
  });

  it("caps model calls per session", () => {
    const s = `session-${Math.random()}`;
    let allowed = 0;
    for (let i = 0; i < 40; i++) if (allowModelCall(s)) allowed++;
    expect(allowed).toBe(30);
  });

  it("prefers Fly's client IP, then the LAST x-forwarded-for hop (the first is client-controlled)", () => {
    expect(clientIp(new Request("http://x", { headers: { "fly-client-ip": "9.9.9.9", "x-forwarded-for": "1.2.3.4" } }))).toBe("9.9.9.9");
    expect(clientIp(new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } }))).toBe("10.0.0.1");
    expect(clientIp(new Request("http://x"))).toBe("local");
  });
});

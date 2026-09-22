/**
 * In-memory rate limiting. Fine for a single warm Fly machine; state resets on deploy.
 * Only model calls count against the session and global caps. Deny-list and canned
 * responses are free. Expired entries are evicted; nothing is ever wiped wholesale,
 * so a flood of new keys cannot reset everyone else's counters.
 */

const PER_IP_WINDOW_MS = 60_000;
const PER_IP_MAX = 20; // any request
const PER_SESSION_WINDOW_MS = 3_600_000;
const PER_SESSION_MODEL_MAX = 30; // model calls per (ip + session) per hour
const GLOBAL_WINDOW_MS = 3_600_000;
const GLOBAL_MODEL_MAX = 300; // model calls per hour, protects the key
const MAX_KEYS = 5000;

const ipHits = new Map<string, number[]>();
const sessionHits = new Map<string, number[]>();
let globalModelCalls: number[] = [];

const prune = (arr: number[], windowMs: number, now: number) => arr.filter((t) => now - t < windowMs);

/** Drop expired keys, then, if still over the cap, the oldest ones. Never a full clear. */
const evict = (map: Map<string, number[]>, windowMs: number, now: number) => {
  if (map.size <= MAX_KEYS) return;
  for (const [k, v] of map) if (!prune(v, windowMs, now).length) map.delete(k);
  while (map.size > MAX_KEYS) {
    const oldest = map.keys().next().value;
    if (oldest === undefined) break;
    map.delete(oldest);
  }
};

/**
 * The client's address. Fly sets `Fly-Client-IP` from the connection, so it is trusted first.
 * `X-Forwarded-For` is appended to by proxies, so only its LAST hop can be trusted, never the first.
 */
export const clientIp = (req: Request): string => {
  const fly = req.headers.get("fly-client-ip");
  if (fly) return fly.trim();
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const hops = fwd.split(",").map((s) => s.trim()).filter(Boolean);
    if (hops.length) return hops[hops.length - 1];
  }
  return req.headers.get("x-real-ip")?.trim() || "local";
};

/** False when this IP has sent too many requests in the last minute. */
export const allowRequest = (ip: string): boolean => {
  const now = Date.now();
  const hits = prune(ipHits.get(ip) ?? [], PER_IP_WINDOW_MS, now);
  if (hits.length >= PER_IP_MAX) {
    ipHits.set(ip, hits);
    return false;
  }
  hits.push(now);
  ipHits.set(ip, hits);
  evict(ipHits, PER_IP_WINDOW_MS, now);
  return true;
};

/** False when the session or the whole site has used up its model calls for the hour. */
export const allowModelCall = (sessionKey: string): boolean => {
  const now = Date.now();
  globalModelCalls = prune(globalModelCalls, GLOBAL_WINDOW_MS, now);
  if (globalModelCalls.length >= GLOBAL_MODEL_MAX) return false;
  const hits = prune(sessionHits.get(sessionKey) ?? [], PER_SESSION_WINDOW_MS, now);
  if (hits.length >= PER_SESSION_MODEL_MAX) {
    sessionHits.set(sessionKey, hits);
    return false;
  }
  hits.push(now);
  sessionHits.set(sessionKey, hits);
  globalModelCalls.push(now);
  evict(sessionHits, PER_SESSION_WINDOW_MS, now);
  return true;
};

/** A call that never reached the model (missing key, network down) should not count. */
export const refundModelCall = (sessionKey: string) => {
  globalModelCalls.pop();
  const hits = sessionHits.get(sessionKey);
  if (hits?.length) hits.pop();
};

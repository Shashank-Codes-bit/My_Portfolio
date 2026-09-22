import "server-only";
import { existsSync } from "node:fs";
import { join } from "node:path";

let cached: string | undefined | null = null;

/** Server-only: the public path of the portrait if one has been added, else undefined. Checked once per process. */
export const portraitSrc = (): string | undefined => {
  if (cached !== null) return cached;
  const f = ["portrait.jpg", "portrait.jpeg", "portrait.png", "portrait.webp"].find((name) =>
    existsSync(join(process.cwd(), "public", name)),
  );
  cached = f ? `/${f}` : undefined;
  return cached;
};

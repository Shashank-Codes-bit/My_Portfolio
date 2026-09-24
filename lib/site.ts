/**
 * Site-wide constants that are safe to ship to the browser.
 * The corpus itself (lib/corpus.ts) is server-only; client components import from here.
 */
export const SITE = {
  name: "Shashank Jindal",
  email: "shashankjindal1306@gmail.com",
  phone: "+91 96543 46434",
  linkedin: "https://www.linkedin.com/in/shashankcodes",
  linkedinHandle: "/in/shashankcodes",
  github: "https://github.com/Shashank-Codes-bit",
  githubHandle: "Shashank-Codes-bit",
  location: "New Delhi, India",
  city: "New Delhi",
  availability: "Open to consulting work and full-time AI roles",
  title: "AI and enterprise systems consultant",
  h1: "I build AI that doesn't make things up.",
  subline:
    "Three years inside Oracle Siebel CRM — Mitsubishi Fuso, Airtel, Hero and Voltas. 200+ dealerships, 2,500+ service centres, 1,300 franchisees. I build AI for systems like those: grounded, cited, and wired into the data that already runs the business.",
  resumePath: "/Shashank_Jindal_Resume.pdf",
} as const;

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Only the production origin is indexable; staging and local builds mark themselves noindex. */
export const PRODUCTION_URL = "https://shashankjindal.fly.dev";
export const isProduction = siteUrl === PRODUCTION_URL;

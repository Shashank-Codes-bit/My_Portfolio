import type { MetadataRoute } from "next";
import { caseStudies } from "@/lib/corpus";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/how-i-build`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    ...caseStudies.map((e) => ({ url: `${siteUrl}${e.href}`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.8 })),
  ];
}

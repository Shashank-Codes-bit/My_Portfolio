import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CaseStudy from "@/components/CaseStudy";
import { bySlug, caseStudies, neighbours, SITE, slugOf } from "@/lib/corpus";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return caseStudies.map((e) => ({ slug: slugOf(e) }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const e = bySlug(slug);
  if (!e) return {};
  const title = e.label;
  const description = e.summary ?? "";
  return {
    title,
    description,
    alternates: { canonical: e.href },
    openGraph: {
      type: "article",
      title: `${title} — ${SITE.name}`,
      description,
      url: e.href,
      siteName: SITE.name,
    },
    twitter: { card: "summary", title: `${title} — ${SITE.name}`, description },
  };
}

export default async function WorkPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const entry = bySlug(slug);
  if (!entry) notFound();
  const { prev, next } = neighbours(slug);
  return <CaseStudy entry={entry} prev={prev} next={next} />;
}

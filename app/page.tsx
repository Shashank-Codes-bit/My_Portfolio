import Hero from "@/components/Hero";
import QA from "@/components/landing/QA";
import Offers from "@/components/Offers";
import WorkIndex from "@/components/WorkIndex";
import { AboutTeaser, HowTeaser } from "@/components/Teasers";
import Contact from "@/components/Contact";
import Portrait from "@/components/Portrait";
import { portraitSrc } from "@/lib/portrait";

/**
 * The landing page is written as answers to the questions visitors actually ask.
 * Same content the assistant answers from; the pages and the assistant cannot disagree.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <div className="wrap">
        <QA id="what-i-do" question="What do you actually build?">
          <Offers />
        </QA>
        <QA id="work" question="Is any of it live?">
          <WorkIndex />
        </QA>
        <QA id="how" question="How do you build?">
          <HowTeaser />
        </QA>
        <QA id="who" question="Who are you?">
          <AboutTeaser portrait={<Portrait src={portraitSrc()} />} />
        </QA>
        <QA id="contact" question="How do I reach you?">
          <Contact />
        </QA>
      </div>
    </>
  );
}

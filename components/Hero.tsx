import { resolveSources } from "@/lib/corpus";
import { lookupAnswer } from "@/lib/answers";
import { portraitSrc } from "@/lib/portrait";
import HeroStage, { type IntroTurn } from "./HeroStage";
import Portrait from "./Portrait";

const INTRO_QUESTIONS = ["What do you actually build?", "Is any of it live?"];

/** Server side: picks the intro answers from the pregenerated file and the byline avatar. */
export default function Hero() {
  const intro: IntroTurn[] = INTRO_QUESTIONS.flatMap((q) => {
    const a = lookupAnswer(q, "/");
    return a ? [{ q, a: a.text, sources: resolveSources(a.sources) }] : [];
  });
  return <HeroStage intro={intro} avatar={<Portrait src={portraitSrc()} variant="avatar" />} />;
}

import { groupLabel, groupOrder, workEntries, type Group } from "@/lib/corpus";
import Reveal from "./Reveal";
import WorkRow from "./WorkRow";

const NOTE: Partial<Record<Group, string>> = {
  live: "Built and run on my own time.",
  building: "Built on my own time.",
  enterprise: "Client engagements I delivered as part of Cubastion Consulting teams. The systems are the clients'; the changes described are mine.",
};

/** All nine rows, grouped, as the answer to "Is any of it live?" */
export default function WorkIndex() {
  return (
    <>
      {groupOrder.map((g, i) => {
        const rows = workEntries.filter((e) => e.group === g);
        if (!rows.length) return null;
        return (
          <Reveal key={g} delay={i * 80}>
            <div className="mb-3">
              <h3 className="text-[15px] font-semibold text-ink">{groupLabel[g]}</h3>
              {NOTE[g] ? <p className="mt-0.5 max-w-[38em] text-[14px] text-ink-3">{NOTE[g]}</p> : null}
            </div>
            <div className="flex flex-col">
              {rows.map((e) => (
                <WorkRow key={e.id} entry={e} />
              ))}
            </div>
          </Reveal>
        );
      })}
    </>
  );
}

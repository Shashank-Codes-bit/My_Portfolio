import type { Entry } from "@/lib/corpus";

export default function StackGroup({ entry }: { entry: Entry }) {
  return (
    <div className="grid gap-2.5 md:grid-cols-[15ch_1fr] md:gap-6">
      <h3 className="pt-1 text-[15px] font-semibold text-ink">{entry.label}</h3>
      <ul className="flex flex-wrap gap-2">
        {(entry.stack ?? []).map((s) => (
          <li key={s} className="tag">
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

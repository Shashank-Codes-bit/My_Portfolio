/** One landing section, shaped like an answered question. Source chips live only in the assistant. */
export default function QA({
  id,
  question,
  note,
  children,
}: {
  id?: string;
  question: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="qa on-paper scroll-mt-6">
      <div className="qa-q">
        <h2>{question}</h2>
        {note ? <p>{note}</p> : null}
      </div>
      <div className="qa-a">{children}</div>
    </section>
  );
}

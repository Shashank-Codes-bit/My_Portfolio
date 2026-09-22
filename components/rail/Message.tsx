import { memo } from "react";
import { SITE } from "@/lib/site";
import SourceTag from "./SourceTag";
import type { Message as Msg } from "./RailProvider";

/** One chat message. Memoised: streaming patches only re-render the message that changed. */
function MessageView({ message }: { message: Msg }) {
  if (message.role === "user") {
    return (
      <div className="bubble-you">
        {message.text}
        {message.streaming ? <span className="caret" aria-hidden /> : null}
      </div>
    );
  }
  if (message.error) {
    return (
      <div className="bubble-ai">
        <p className="text-ink-2">{message.text || "I can't answer right now."}</p>
        <a href={`mailto:${SITE.email}`} className="btn btn-primary justify-self-start text-[14px]">
          Email me instead
        </a>
      </div>
    );
  }
  return (
    <div className="bubble-ai">
      <p>
        {message.text}
        {message.streaming && !message.text ? <span className="caret" aria-hidden /> : null}
      </p>
      {message.sources && message.sources.length > 0 ? (
        <div className="src">
          <span className="src-label">FROM</span>
          {message.sources.map((s) => (
            <SourceTag key={s.id} source={s} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

const Message = memo(MessageView);
export default Message;

import { SITE } from "@/lib/site";

/**
 * The portrait, shown plainly.
 *  - avatar: small round byline photo (hero)
 *  - card: rounded 4:5 photo with caption ("Who are you?" section, About page)
 * Without a file at public/portrait.jpg the card renders a quiet placeholder and the avatar renders nothing.
 * Plain <img>: the image optimizer is disabled (single static file, sized by CSS), so next/image adds nothing.
 */
export default function Portrait({
  src,
  variant = "card",
  className = "",
  priority = false,
}: {
  src?: string;
  variant?: "avatar" | "card";
  className?: string;
  /** Above the fold: load eagerly with high priority (LCP). */
  priority?: boolean;
}) {
  if (variant === "avatar") {
    if (!src) return null;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={56}
        height={56}
        loading="eager"
        fetchPriority="high"
        className={`h-14 w-14 rounded-full object-cover ring-2 ring-stage-line ${className}`}
      />
    );
  }
  return (
    <figure className={`portrait m-0 ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`${SITE.name}, portrait`} width={432} height={540} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(165deg,var(--stage-2),var(--stage)_60%)]" aria-hidden>
          <svg viewBox="0 0 200 220" className="absolute inset-x-0 bottom-0 h-[86%] w-full">
            <ellipse cx="100" cy="72" rx="44" ry="50" fill="rgba(255,255,255,.22)" />
            <path d="M14 220c0-62 38-96 86-96s86 34 86 96z" fill="rgba(255,255,255,.22)" />
          </svg>
        </div>
      )}
      <figcaption>
        <span>{SITE.name}</span>
        <span>{SITE.city}</span>
      </figcaption>
    </figure>
  );
}

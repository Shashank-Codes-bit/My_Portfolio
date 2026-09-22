import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name} — ${SITE.h1}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social card: the thesis on the stage colours. Rendered once at build. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(160deg, #141A44 0%, #0B1030 60%)",
          color: "#F2F0EA",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, color: "#9A9FBF", fontFamily: "Helvetica, Arial, sans-serif" }}>
          {SITE.name} · {SITE.title}
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 92, lineHeight: 1.02, letterSpacing: -2 }}>
          <span>I build AI that</span>
          <span>
            <span style={{ color: "#7EF2C0", fontStyle: "italic" }}>doesn&apos;t</span> make things up.
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#9A9FBF", fontFamily: "Helvetica, Arial, sans-serif" }}>
          <span>Grounded assistants · Voice agents · AI into Siebel</span>
          <span style={{ color: "#FFB100" }}>{SITE.city}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}

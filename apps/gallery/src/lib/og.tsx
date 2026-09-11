import { ImageResponse } from "next/og";

/*
 * Share cards. Colours are the literal values of Bezel tokens, because the
 * image renderer cannot read CSS variables:
 *   --bz-void #0c0c0f, --bz-void-raised #1a1a1a, --bz-paper-raised #f7f3ee,
 *   --bz-paper-sunken #fafafa, --bz-accent #912c22, --bz-void-ink-muted.
 */

export const ogSize = { width: 1200, height: 630 };

const VOID = "#0c0c0f";
const RAISED = "#1a1a1a";
const CREAM = "#f7f3ee";
const PAPER = "#fafafa";
const BRICK = "#912c22";
const MUTED = "rgba(255,255,255,0.8)";
const LINE = "rgba(255,255,255,0.1)";

function Mark({ size = 64 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        border: `${Math.max(3, size / 16)}px solid ${CREAM}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: size * 0.46, height: size * 0.46, borderRadius: size * 0.13, background: BRICK }} />
    </div>
  );
}

/** A small grid of stage tiles in the three tones, standing in for the index. */
function Stages() {
  const tones = [CREAM, RAISED, PAPER, RAISED, PAPER, CREAM];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", width: 440, gap: 16 }}>
      {tones.map((tone, i) => (
        <div
          key={i}
          style={{
            width: 212,
            height: 132,
            borderRadius: 18,
            background: tone,
            border: `1px solid ${LINE}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: i % 2 ? 72 : 110,
              height: 26,
              borderRadius: i === 0 ? "0 16px 0 16px" : 999,
              background: tone === RAISED ? CREAM : BRICK,
              opacity: tone === RAISED ? 0.9 : 1,
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function siteCard({ count }: { count: number }) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: VOID, padding: 72, color: "#fff" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <Mark />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: MUTED }}>
              React component library
            </div>
            <div style={{ fontSize: 132, fontWeight: 700, letterSpacing: -4, lineHeight: 1, marginTop: 12 }}>Bezel</div>
            <div style={{ fontSize: 32, lineHeight: 1.35, color: MUTED, marginTop: 20, maxWidth: 560 }}>
              {`${count} components for interfaces that need motion and craft, behind a WCAG AA contrast gate.`}
            </div>
          </div>
          <div style={{ fontSize: 24, color: MUTED }}>npm i bezel-ui · bezel-ui.vercel.app</div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Stages />
        </div>
      </div>
    ),
    ogSize,
  );
}

export function componentCard({
  slug,
  name,
  description,
  category,
}: {
  slug: string;
  name: string;
  description: string;
  category: string;
}) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: VOID, padding: 72, color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Mark size={52} />
          <div style={{ fontSize: 30, fontWeight: 600 }}>Bezel</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: MUTED }}>{category}</div>
          <div style={{ fontSize: name.length > 18 ? 92 : 112, fontWeight: 700, letterSpacing: -3, lineHeight: 1.02, marginTop: 14 }}>
            {name}
          </div>
          <div style={{ fontSize: 36, lineHeight: 1.35, color: MUTED, marginTop: 22, maxWidth: 980 }}>{description}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: MUTED }}>
          <div>{`npx bezel-add add ${slug}`}</div>
          <div>bezel-ui.vercel.app</div>
        </div>
      </div>
    ),
    ogSize,
  );
}

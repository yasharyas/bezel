"use client";

import { Fragment, useState, type ReactNode } from "react";
import { ThorLink, ThorLinkProvider } from "bezel-ui/interaction/ThorLink";
import { usePreviewEnv } from "../kit";

type Piece = string | { to: string; text: string };
type Article = { title: string; kicker: string; body: Piece[][] };

/* Three small articles that link to each other. No network: the "route" is a key in this object. */
const ARTICLES: Record<string, Article> = {
  thunder: {
    kicker: "Weather notes",
    title: "Thunder",
    body: [
      [
        "Thunder is the sound a ",
        { to: "lightning", text: "lightning bolt" },
        " makes as it heats the air around it to five times the heat of the sun's surface. The air expands faster than sound, and the shock wave rolls out as a crack or a long rumble.",
      ],
      [
        "Count the seconds between flash and sound and divide by three for the distance in kilometres. Storms that grow tall enough to make it are covered in ",
        { to: "cumulonimbus", text: "cumulonimbus clouds" },
        ".",
      ],
    ],
  },
  lightning: {
    kicker: "Weather notes",
    title: "Lightning",
    body: [
      [
        "Lightning is a discharge between charged regions of a storm cloud, or between the cloud and the ground. A faint leader steps down first, and the bright return stroke races back up the channel it opened.",
      ],
      [
        "A single stroke lasts a few microseconds, and most flashes carry three or four of them, which is why it flickers. The sound it leaves behind is ",
        { to: "thunder", text: "thunder" },
        ", and the clouds that build the charge are ",
        { to: "cumulonimbus", text: "cumulonimbus" },
        ".",
      ],
    ],
  },
  cumulonimbus: {
    kicker: "Weather notes",
    title: "Cumulonimbus",
    body: [
      [
        "A cumulonimbus is a towering cloud that can reach twelve kilometres, its top flattened into an anvil where it meets the stratosphere. Ice and water collide inside it, and the collisions separate the charge that feeds ",
        { to: "lightning", text: "lightning" },
        ".",
      ],
      [
        "Heavy rain, hail and gusts come with it, and on a summer afternoon you will often hear its ",
        { to: "thunder", text: "thunder" },
        " before the first drop falls.",
      ],
    ],
  },
};

export default function ThorLinkPreview() {
  const { reducedMotion } = usePreviewEnv();
  const [page, setPage] = useState("thunder");
  const a = ARTICLES[page];

  const render = (piece: Piece, i: number): ReactNode =>
    typeof piece === "string" ? (
      <Fragment key={i}>{piece}</Fragment>
    ) : (
      <ThorLink
        key={i}
        href={`#${piece.to}`}
        onNavigate={() => setPage(piece.to)}
        className="font-medium text-[#1d4ed8] underline decoration-[#1d4ed8]/40 underline-offset-2 hover:decoration-[#1d4ed8] focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4ed8]"
      >
        {piece.text}
      </ThorLink>
    );

  return (
    <ThorLinkProvider reducedMotion={reducedMotion ? "always" : "auto"}>
      <main data-thor-shake className="flex min-h-screen items-center bg-[#fafafa] px-8 pb-12 pt-40 text-[#1a1a1a]">
        <article className="mx-auto w-full max-w-xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#5c5c60]">{a.kicker}</p>
          <h1 className="mt-2 font-serif text-4xl">{a.title}</h1>
          <div className="mt-5 space-y-4 text-[17px] leading-relaxed">
            {a.body.map((para, p) => (
              <p key={`${page}-${p}`}>{para.map(render)}</p>
            ))}
          </div>
          <p className="mt-8 text-sm text-[#5c5c60]">Click a blue link. Sound plays after your first click.</p>
        </article>
      </main>
    </ThorLinkProvider>
  );
}

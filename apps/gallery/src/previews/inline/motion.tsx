"use client";

import { useId, useState } from "react";
import { LayoutGroup } from "framer-motion";
import {
  Apple,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Cookie,
  CupSoda,
  Home,
  LayoutGrid,
  Mail,
  Milk,
  Wheat,
} from "lucide-react";

import { TubelightNavBar } from "bezel-ui/navigation/TubelightNavBar";
import { ShinyText } from "bezel-ui/animation/ShinyText";
import { CircularText } from "bezel-ui/display/CircularText";
import { Highlighter } from "bezel-ui/animation/Highlighter";

import { Caption, Center, IMAGES, useIdleInterval, usePreviewEnv } from "../kit";
import type { PreviewModule } from "../types";

const noop = () => {};

const NAV_ITEMS = [
  { name: "Home", url: "#home", icon: Home },
  { name: "Work", url: "#work", icon: Briefcase },
  { name: "Journal", url: "#journal", icon: BookOpen },
  { name: "Contact", url: "#contact", icon: Mail },
];

function TubelightNavBarPreview() {
  const [active, setActive] = useState("Work");
  const groupId = useId();
  useIdleInterval(() => {
    setActive((current) => {
      const index = NAV_ITEMS.findIndex((item) => item.name === current);
      return NAV_ITEMS[(index + 1) % NAV_ITEMS.length].name;
    });
  }, 2400);
  return (
    // The lamp uses a shared layoutId; a group keeps two copies of this
    // preview on one page from animating into each other.
    <LayoutGroup id={groupId}>
      <div className="relative h-full w-full">
        <TubelightNavBar
          items={NAV_ITEMS}
          activeItem={active}
          onNavigate={(url) => setActive(NAV_ITEMS.find((item) => item.url === url)?.name ?? active)}
        />
        <div className="flex h-full flex-col items-center justify-center pt-12 text-center text-white">
          <Caption>You are on</Caption>
          <p className="mt-2 font-serif text-4xl">{active}</p>
        </div>
      </div>
    </LayoutGroup>
  );
}

const EMPTY_TYPES = ["cart", "search", "network"] as const;

function ShinyTextPreview() {
  return (
    <Center>
      <div className="w-[280px] text-left">
        <ShinyText text="Reviewing your documents" className="text-2xl font-medium" />
        <ul className="mt-5 space-y-2 text-sm text-[#4a4a4c]">
          <li className="flex items-center gap-2">
            <CheckCircle2 aria-hidden size={16} className="text-[#912c22]" />
            Identity verified
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 aria-hidden size={16} className="text-[#912c22]" />
            Address confirmed
          </li>
        </ul>
      </div>
    </Center>
  );
}

function CircularTextPreview() {
  return (
    <Center>
      <CircularText text="BEZEL · COMPONENTS · MOTION · " size="md" onHover="speedUp" className="!w-44">
        <span className="font-serif text-4xl text-[#912c22]">B</span>
      </CircularText>
    </Center>
  );
}

function HighlighterPreview() {
  // Replay passes its count to `replayKey`, so the marks redraw on the same
  // words instead of the whole preview remounting.
  const { replay = 0 } = usePreviewEnv();
  return (
    <Center>
      {/* The highlight sits before a space, not a comma: its rough edge would
          paint over punctuation next to it. */}
      <p className="max-w-[300px] text-center text-2xl leading-relaxed text-[#0a0a0a]">
        Good work is{" "}
        <Highlighter action="underline" color="#912c22" animationDuration={700} replayKey={replay}>
          honest
        </Highlighter>
        ,{" "}
        <Highlighter action="highlight" color="#f3d9a4" replayKey={replay}>
          specific
        </Highlighter>{" "}
        and{" "}
        <Highlighter action="circle" color="#912c22" animationDuration={900} replayKey={replay}>
          finished
        </Highlighter>
        .
      </p>
    </Center>
  );
}

export const previews: PreviewModule = {
  "tubelight-navbar": TubelightNavBarPreview,
  "shiny-text": ShinyTextPreview,
  "circular-text": CircularTextPreview,
  highlighter: HighlighterPreview,
};

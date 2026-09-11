"use client";

import {
  Component,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { MousePointer2, RotateCcw } from "lucide-react";
import { loadPreview } from "@/previews/load";
import { specs } from "@/previews/specs";
import { PreviewEnvContext, useReducedMotion } from "@/previews/kit";
import type { InlineSpec, PreviewComponent, StageSize } from "@/previews/types";
import { PreviewFrame } from "./PreviewFrame";

const SIZE_CLASS: Record<StageSize, string> = {
  card: "aspect-[3/2]",
  feature: "aspect-[16/10]",
  large: "aspect-[4/3] sm:aspect-[16/10] max-h-[72vh] w-full",
};

type Props = {
  slug: string;
  name: string;
  size?: StageSize;
  /** Mount immediately instead of waiting to scroll near the viewport. */
  eager?: boolean;
  className?: string;
};

/**
 * A contained, lazily mounted preview.
 *
 * - Nothing mounts until the stage is within 400px of the viewport, and it
 *   unmounts again once it scrolls away, so the index never runs 107
 *   components at once.
 * - In the index (`size="card"`) the preview is inert until a pointer enters
 *   it: keyboard and screen reader users move card to card through the
 *   component links, and get the fully interactive preview on the component
 *   page. Focus that lands inside while pointing keeps it live.
 * - Links inside a preview never navigate.
 */
export function PreviewStage({ slug, name, size = "card", eager = false, className = "" }: Props) {
  const spec = specs[slug];
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pointerInside = useRef(false);
  const [near, setNear] = useState(eager);
  const [engaged, setEngaged] = useState(false);
  const [replayToken, setReplayToken] = useState(0);
  const reducedMotion = useReducedMotion();
  const inertUntilPointer = size === "card";

  useEffect(() => {
    if (eager) return;
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      rootMargin: "400px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [eager]);

  // React 18 does not know the `inert` attribute, so it is set directly.
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (inertUntilPointer && !engaged) el.setAttribute("inert", "");
    else el.removeAttribute("inert");
  }, [engaged, inertUntilPointer, near]);

  const release = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    if (pointerInside.current) return;
    if (root.contains(document.activeElement)) return;
    setEngaged(false);
  }, []);

  if (!spec) return null;

  return (
    <div
      ref={rootRef}
      className={`stage tone-${spec.tone} ${SIZE_CLASS[size]} ${className}`}
      data-engaged={engaged || undefined}
      onPointerEnter={() => {
        pointerInside.current = true;
        setEngaged(true);
      }}
      onPointerLeave={() => {
        pointerInside.current = false;
        release();
      }}
      onFocusCapture={() => setEngaged(true)}
      onBlurCapture={() => window.setTimeout(release, 0)}
      onClickCapture={(event) => {
        const anchor = (event.target as HTMLElement).closest?.("a[href]");
        if (anchor && rootRef.current?.contains(anchor)) event.preventDefault();
      }}
    >
      {near ? (
        <div ref={contentRef} className="stage-content absolute inset-0">
          <PreviewEnvContext.Provider value={{ engaged, reducedMotion, size }}>
            <PreviewBoundary name={name}>
              {spec.kind === "frame" ? (
                <PreviewFrame slug={slug} name={name} spec={spec} size={size} replayToken={replayToken} />
              ) : (
                <InlinePreview key={replayToken} slug={slug} spec={spec} />
              )}
            </PreviewBoundary>
          </PreviewEnvContext.Provider>
        </div>
      ) : null}

      {spec.hint && size === "card" ? (
        <span
          aria-hidden
          data-pointer-only={/^(Move|Hover|Move near)$/.test(spec.hint) || undefined}
          className={`stage-hint pointer-events-none absolute bottom-2.5 left-2.5 z-10 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium leading-none transition-opacity duration-300 motion-safe-transition ${
            spec.tone === "void"
              ? "bg-white/10 text-void-muted ring-1 ring-inset ring-white/10"
              : "bg-white/85 text-ink-muted ring-1 ring-inset ring-black/[0.08]"
          } ${engaged ? "opacity-0" : "opacity-100"}`}
        >
          <MousePointer2 aria-hidden size={11} strokeWidth={2.25} />
          {spec.hint}
        </span>
      ) : null}

      {spec.replay && near ? (
        <button
          type="button"
          onClick={() => setReplayToken((t) => t + 1)}
          tabIndex={size === "card" ? -1 : 0}
          aria-label={`Replay ${name} preview`}
          title="Replay"
          className={`focus-ring absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full transition-opacity duration-200 motion-safe-transition ${
            spec.tone === "void"
              ? "bg-white/10 text-void-ink hover:bg-white/20"
              : "bg-white/85 text-ink-muted ring-1 ring-inset ring-black/[0.08] hover:bg-white"
          } ${size === "card" && !engaged ? "pointer-events-none opacity-0" : "opacity-100"}`}
        >
          <RotateCcw aria-hidden size={14} strokeWidth={2.25} />
        </button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ inline */

function InlinePreview({ slug, spec }: { slug: string; spec: InlineSpec }) {
  const [Preview, setPreview] = useState<PreviewComponent | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    loadPreview(slug)
      .then((component) => live && setPreview(() => component))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [slug]);

  if (failed) return <PreviewError />;
  if (!Preview) return null;
  if (spec.fit) {
    return (
      <FitBox width={spec.fit}>
        <Preview />
      </FitBox>
    );
  }
  return <Preview />;
}

/**
 * Lays children out at a real width, then scales them down to fit the stage.
 * The component renders as itself, just smaller, instead of as a crop.
 */
function FitBox({ width, children }: { width: number; children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const measure = () => {
      const pad = Math.max(16, Math.min(32, o.clientWidth * 0.05));
      const next = Math.min(1, (o.clientWidth - pad * 2) / width, (o.clientHeight - pad * 2) / i.offsetHeight);
      setScale(Number.isFinite(next) && next > 0 ? next : 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={outer} className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div
        ref={inner}
        style={{
          width,
          flex: "none",
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          visibility: scale ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ errors */

function PreviewError() {
  return (
    <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm opacity-80">
      This preview failed to load. Reload the page to try again.
    </div>
  );
}

class PreviewBoundary extends Component<{ name: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Preview for ${this.props.name} threw.`, error, info.componentStack);
  }

  render() {
    return this.state.failed ? <PreviewError /> : this.props.children;
  }
}

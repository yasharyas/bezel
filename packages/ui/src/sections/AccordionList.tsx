"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";

/*
 * AccordionList: questions and answers, or any titled rows, that open in place.
 *
 * Opening measures the answer and animates the panel's height to it, then hands
 * the height back to `auto` so the content can reflow. Closing pins the current
 * height and animates it to zero, and only then hides the panel and makes it
 * inert, so a closed answer leaves both the tab order and the accessibility
 * tree. A token per row lets a close interrupt an open cleanly.
 *
 * The whole row is the button. Its arrow disc tumbles and turns with a small
 * overshoot, a hairline under the row fills on hover, keyboard focus and while
 * open, and a plain-text answer rises into place line by line.
 */

const CSS = `
.bz-al{color:var(--bz-ink,#0a0a0a);font-family:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif)}
.bz-al *,.bz-al *::before,.bz-al *::after{box-sizing:border-box}
.bz-al-head{margin:0 0 24px}
.bz-al-title{margin:0;font-size:clamp(1.75rem,3.2vw,2.25rem);line-height:1.15;font-weight:600;letter-spacing:-0.02em}
.bz-al-subtitle{margin:8px 0 0;font-size:1rem;line-height:1.55;color:var(--bz-ink-muted,#4a4a4c)}
.bz-al-list{margin:0;padding:0;list-style:none;border-top:1px solid var(--bz-line-strong,rgba(10,10,10,0.13))}
.bz-al-item{position:relative}
.bz-al-heading{margin:0;font:inherit}
.bz-al-trigger{display:grid;grid-template-columns:2.5rem minmax(0,1fr) auto 48px;align-items:center;gap:12px;width:100%;min-height:72px;margin:0;padding:12px 0;border:0;border-radius:8px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.bz-al-trigger:focus-visible{outline:2px solid var(--bz-focus-ring,#912c22);outline-offset:2px}
.bz-al-index{font:500 0.75rem/1 var(--bz-font-mono,ui-monospace,SFMono-Regular,Menlo,monospace);letter-spacing:0.08em;color:var(--bz-ink-subtle,#6b6b70)}
.bz-al-name{font-size:1.125rem;line-height:1.35;font-weight:600;letter-spacing:-0.01em}
.bz-al-meta{font-size:0.875rem;white-space:nowrap;color:var(--bz-ink-muted,#4a4a4c)}
.bz-al-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
.bz-al-disc{position:relative;display:grid;justify-self:end;place-items:center;width:40px;height:40px;margin-right:4px;border-radius:999px;background:var(--bz-ink,#0a0a0a);color:#ffffff;transition:rotate 420ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-al-disc::after{content:"";position:absolute;inset:0;border:1.5px solid var(--bz-ink,#0a0a0a);border-radius:999px;opacity:0;pointer-events:none}
.bz-al-clip{display:block;width:20px;height:20px;overflow:hidden}
.bz-al-strip{display:block;transition:transform 280ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)) 200ms}
.bz-al-strip svg{display:block;width:20px;height:20px}
.bz-al-item[data-expanded="true"] .bz-al-disc{rotate:180deg;transition:rotate 500ms var(--bz-ease-spring,cubic-bezier(0.34,1.56,0.64,1)) 180ms}
.bz-al-item[data-expanded="true"] .bz-al-strip{transform:translateY(-50%);transition-delay:0ms}
.bz-al-item[data-expanded="true"] .bz-al-disc::after{animation:bz-al-pulse 700ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)) 140ms}
@keyframes bz-al-pulse{from{opacity:0.45;transform:scale(1)}to{opacity:0;transform:scale(1.9)}}
.bz-al-rule{position:relative;height:1px;background:var(--bz-line-strong,rgba(10,10,10,0.13))}
.bz-al-fill{position:absolute;top:0;bottom:0;left:0;width:0;background:var(--bz-accent,#912c22);transition:width 500ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-al-item[data-expanded="true"] .bz-al-fill,.bz-al-item:has(.bz-al-trigger:focus-visible) .bz-al-fill{width:100%}
@media (hover:hover){.bz-al-item:hover .bz-al-fill{width:100%}}
.bz-al-panel{overflow:hidden}
.bz-al-body{padding:0 64px 28px calc(2.5rem + 12px);font-size:1rem;line-height:1.6;color:var(--bz-ink-muted,#4a4a4c)}
.bz-al-text{max-width:40rem;margin:0}
.bz-al-line{display:block;overflow:hidden}
.bz-al-line>span{display:block;transform:translateY(105%);transition:transform 450ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-al-item[data-expanded="true"] .bz-al-line>span{transform:none;transition-delay:var(--bz-al-delay,0ms)}
.bz-al-empty{margin:0;padding:24px 0;font-size:0.9375rem;color:var(--bz-ink-muted,#4a4a4c)}
@media (max-width:560px){.bz-al-trigger{grid-template-columns:2rem minmax(0,1fr) 48px}.bz-al-meta{display:none}.bz-al-body{padding:0 8px 24px 0}}
@media (prefers-reduced-motion:reduce){.bz-al-disc,.bz-al-item[data-expanded="true"] .bz-al-disc,.bz-al-strip,.bz-al-item[data-expanded="true"] .bz-al-strip,.bz-al-fill,.bz-al-line>span,.bz-al-item[data-expanded="true"] .bz-al-line>span{transition:none}.bz-al-item[data-expanded="true"] .bz-al-disc::after{animation:none}}
`;

const RM_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(RM_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const readReducedMotion = () => window.matchMedia(RM_QUERY).matches;
const serverReducedMotion = () => false;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const OPEN_MS = 500;

export type AccordionItem = {
  id?: string;
  title: ReactNode;
  /** Plain text rises line by line; anything else appears as a block. */
  content: ReactNode;
  /** A short second column, such as a date or a category. Hidden on narrow screens. */
  meta?: ReactNode;
};

export type AccordionListProps = {
  items: AccordionItem[];
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Allow more than one row open at a time. */
  multiple?: boolean;
  /** Index or indexes open at first. `null` starts with everything closed. */
  defaultOpen?: number | number[] | null;
  /** Heading level for each row's title. The list title is always an h2. */
  headingLevel?: 2 | 3 | 4;
  emptyMessage?: string;
  className?: string;
};

/** Splits plain text into its rendered lines, so each can rise on its own. */
function Lines({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
  const [lines, setLines] = useState<string[] | null>(null);
  const measuredWidth = useRef(0);

  useIsoLayoutEffect(() => {
    setLines(null);
  }, [text]);

  useIsoLayoutEffect(() => {
    if (lines !== null) return;
    const el = ref.current;
    if (!el) return;
    const spans = Array.from(el.querySelectorAll<HTMLElement>(".bz-al-word"));
    const groups: string[] = [];
    let top = Number.NaN;
    for (const span of spans) {
      const word = span.textContent?.trim() ?? "";
      if (!groups.length || Math.abs(span.offsetTop - top) > 2) {
        groups.push(word);
        top = span.offsetTop;
      } else {
        groups[groups.length - 1] += ` ${word}`;
      }
    }
    measuredWidth.current = el.clientWidth;
    setLines(groups);
  }, [lines, words]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth && Math.abs(el.clientWidth - measuredWidth.current) > 1) setLines(null);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!lines) {
    return (
      <p ref={ref} className="bz-al-text">
        {words.map((word, i) => (
          <span key={i} className="bz-al-word">
            {word}{" "}
          </span>
        ))}
      </p>
    );
  }
  const count = lines.length;
  return (
    <p ref={ref} className="bz-al-text">
      {lines.map((line, i) => (
        <span key={i} className="bz-al-line">
          <span style={{ ["--bz-al-delay" as string]: `${(count > 1 ? Math.round((i * 300) / (count - 1)) : 0) + 120}ms` } as CSSProperties}>
            {line}
          </span>
        </span>
      ))}
    </p>
  );
}

function Row({
  item,
  index,
  open,
  onToggle,
  headingLevel,
  reduced,
  baseId,
}: {
  item: AccordionItem;
  index: number;
  open: boolean;
  onToggle: (index: number) => void;
  headingLevel: 2 | 3 | 4;
  reduced: boolean;
  baseId: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const token = useRef(0);
  const firstRun = useRef(true);
  // Set once, so React never fights the height the effect animates.
  const [initialStyle] = useState<CSSProperties | undefined>(() => (open ? undefined : { height: 0, visibility: "hidden" }));

  useIsoLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (firstRun.current) {
      firstRun.current = false;
      if (!open) panel.setAttribute("inert", "");
      return;
    }
    const run = ++token.current;
    const duration = reduced ? 0 : OPEN_MS;
    panel.style.transition = duration ? `height ${duration}ms var(--bz-ease-out, cubic-bezier(0.23, 1, 0.32, 1))` : "none";
    let raf = 0;
    let timer = 0;
    if (open) {
      panel.removeAttribute("inert");
      panel.style.visibility = "visible";
      panel.style.height = `${panel.getBoundingClientRect().height}px`;
      const target = panel.scrollHeight;
      if (!duration) {
        panel.style.height = "auto";
      } else {
        raf = requestAnimationFrame(() => {
          if (token.current === run) panel.style.height = `${target}px`;
        });
        timer = window.setTimeout(() => {
          if (token.current === run) panel.style.height = "auto";
        }, duration + 30);
      }
    } else {
      panel.style.height = `${panel.getBoundingClientRect().height}px`;
      void panel.offsetHeight;
      panel.style.height = "0px";
      const finish = () => {
        if (token.current !== run) return;
        panel.style.visibility = "hidden";
        panel.setAttribute("inert", "");
      };
      if (!duration) finish();
      else timer = window.setTimeout(finish, duration + 30);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [open]);

  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const triggerId = `${baseId}-trigger-${index}`;
  const panelId = `${baseId}-panel-${index}`;

  return (
    <li className="bz-al-item" data-expanded={open ? "true" : "false"}>
      <Heading className="bz-al-heading">
        <button
          type="button"
          id={triggerId}
          className="bz-al-trigger"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => onToggle(index)}
        >
          <span className="bz-al-index" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="bz-al-name">{item.title}</span>
          <span className="bz-al-meta">
            {item.meta ? (
              <>
                <span className="bz-al-sr">, </span>
                {item.meta}
              </>
            ) : null}
          </span>
          <span className="bz-al-disc" aria-hidden="true">
            <span className="bz-al-clip">
              <span className="bz-al-strip">
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="M10 4.5v11m0 0 4.5-4.5M10 15.5 5.5 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="M10 4.5v11m0 0 4.5-4.5M10 15.5 5.5 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </span>
          </span>
        </button>
      </Heading>
      <div ref={panelRef} id={panelId} role="region" aria-labelledby={triggerId} className="bz-al-panel" style={initialStyle}>
        <div className="bz-al-body">{typeof item.content === "string" ? <Lines text={item.content} /> : item.content}</div>
      </div>
      <div className="bz-al-rule" aria-hidden="true">
        <span className="bz-al-fill" />
      </div>
    </li>
  );
}

export function AccordionList({
  items,
  title,
  subtitle,
  multiple = false,
  defaultOpen = 0,
  headingLevel = 3,
  emptyMessage = "Nothing here yet.",
  className = "",
}: AccordionListProps) {
  const reduced = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, serverReducedMotion);
  const baseId = useId().replace(/:/g, "");
  const [open, setOpen] = useState<Set<number>>(
    () => new Set(defaultOpen === null ? [] : Array.isArray(defaultOpen) ? defaultOpen : [defaultOpen]),
  );

  const toggle = useCallback(
    (index: number) => {
      setOpen((prev) => {
        const next = multiple ? new Set(prev) : new Set<number>();
        if (prev.has(index)) next.delete(index);
        else next.add(index);
        return next;
      });
    },
    [multiple],
  );

  const titleId = `${baseId}-title`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <section className={`bz-al ${className}`.trim()} aria-labelledby={title ? titleId : undefined}>
        {title || subtitle ? (
          <div className="bz-al-head">
            {title ? (
              <h2 id={titleId} className="bz-al-title">
                {title}
              </h2>
            ) : null}
            {subtitle ? <p className="bz-al-subtitle">{subtitle}</p> : null}
          </div>
        ) : null}
        {items.length ? (
          <ul className="bz-al-list">
            {items.map((item, index) => (
              <Row
                key={item.id ?? index}
                item={item}
                index={index}
                open={open.has(index)}
                onToggle={toggle}
                headingLevel={headingLevel}
                reduced={reduced}
                baseId={baseId}
              />
            ))}
          </ul>
        ) : (
          <p className="bz-al-empty" role="status">
            {emptyMessage}
          </p>
        )}
      </section>
    </>
  );
}

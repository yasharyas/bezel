"use client";

import {
  useEffect,
  useRef,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";

type BlurInRevealProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  as?: ElementType;
  delay?: 0 | 1 | 2 | 3 | 4;
};

export function BlurInReveal({
  children,
  className = "",
  as: Tag = "div",
  delay = 0,
  ...rest
}: BlurInRevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      el.classList.add("bir--in");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("bir--in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <style>{`
        .bir {
          opacity: 0;
          transform: translateY(30px);
          filter: blur(7px);
          transition:
            opacity 0.95s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.95s cubic-bezier(0.22, 1, 0.36, 1),
            filter 0.95s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .bir--d1 { transition-delay: 0.09s; }
        .bir--d2 { transition-delay: 0.18s; }
        .bir--d3 { transition-delay: 0.27s; }
        .bir--d4 { transition-delay: 0.36s; }
        .bir--in {
          opacity: 1;
          transform: none;
          filter: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .bir {
            opacity: 1;
            transform: none;
            filter: none;
            transition: none;
          }
        }
      `}</style>
      <Tag
        ref={ref as never}
        className={`bir${delay ? ` bir--d${delay}` : ""} ${className}`.trim()}
        {...rest}
      >
        {children}
      </Tag>
    </>
  );
}

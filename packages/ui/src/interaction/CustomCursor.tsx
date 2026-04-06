"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 2;

    const onMove = (e: MouseEvent) => {
      currentX = e.clientX;
      currentY = e.clientY;
      cursor.classList.add("active");
      gsap.to(cursor, {
        x: currentX - cursor.offsetWidth / 2,
        y: currentY - cursor.offsetHeight / 2,
        duration: 0.55,
        ease: "power3.out",
      });
    };

    const onEnterGrow = () => gsap.to(cursor, { scale: 2.5, duration: 0.3, ease: "power2.out" });
    const onLeaveGrow = () => gsap.to(cursor, { scale: 1, duration: 0.3, ease: "power2.out" });

    const onHide = () => gsap.to(cursor, { opacity: 0, duration: 0.3 });
    const onShow = () => cursor.classList.contains("active") && gsap.to(cursor, { opacity: 1, duration: 0.3 });

    const setupGrow = () => {
      document.querySelectorAll("[data-cursor-grow]").forEach((el) => {
        el.addEventListener("mouseenter", onEnterGrow);
        el.addEventListener("mouseleave", onLeaveGrow);
      });
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onHide);
    document.addEventListener("mouseenter", onShow);
    setupGrow();

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onHide);
      document.removeEventListener("mouseenter", onShow);
      document.querySelectorAll("[data-cursor-grow]").forEach((el) => {
        el.removeEventListener("mouseenter", onEnterGrow);
        el.removeEventListener("mouseleave", onLeaveGrow);
      });
    };
  }, []);

  return (
    <>
      <style>{`
        .yui-cursor {
          width: 1.7rem; height: 1.7rem;
          position: fixed; top: 0; left: 0;
          pointer-events: none;
          mix-blend-mode: difference;
          z-index: 100000; opacity: 0;
          transition: opacity 0.3s;
        }
        .yui-cursor.active { opacity: 1; }
        .yui-cursor-bar {
          position: absolute;
          background-color: #fff;
        }
        .yui-cursor-left, .yui-cursor-right {
          width: 0.5rem; height: 0.2rem;
          top: 50%; transform: translateY(-50%);
        }
        .yui-cursor-top, .yui-cursor-bottom {
          height: 0.5rem; width: 0.2rem;
          left: 50%; transform: translateX(-50%);
        }
        .yui-cursor-right { right: 0; }
        .yui-cursor-left { left: 0; }
        .yui-cursor-top { top: 0; }
        .yui-cursor-bottom { bottom: 0; }
        @media (max-width: 768px) { .yui-cursor { display: none; } }
      `}</style>
      <div className="yui-cursor" ref={cursorRef}>
        <span className="yui-cursor-bar yui-cursor-top" />
        <span className="yui-cursor-bar yui-cursor-bottom" />
        <span className="yui-cursor-bar yui-cursor-left" />
        <span className="yui-cursor-bar yui-cursor-right" />
      </div>
    </>
  );
}

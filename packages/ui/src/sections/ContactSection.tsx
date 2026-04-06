"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

type Props = {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  ctaHref?: string;
  /** Optional image URL to mask through the heading text via background-clip */
  headingImageSrc?: string;
};

export function ContactSection({
  eyebrow = "GOT A PROJECT IN MIND?",
  heading = "LET'S",
  subheading = "TALK.",
  ctaHref = "mailto:hello@example.com",
  headingImageSrc,
}: Props) {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const spotlight = spotlightRef.current;
    if (!section || !spotlight) return;

    const onMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      gsap.to(spotlight, {
        x: e.clientX - rect.left - spotlight.offsetWidth / 2,
        y: e.clientY - rect.top - spotlight.offsetHeight / 2,
        duration: 0.6,
        ease: "power3.out",
      });
    };

    section.addEventListener("mousemove", onMove);
    return () => section.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <>
      <style>{`
        @property --yui-border-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        .yui-contact {
          position: relative; overflow: hidden;
          min-height: 60vh; padding: 6rem 5rem;
          background: radial-gradient(ellipse at 60% 40%, #1a1a2e 0%, #000 70%);
          border-radius: 2rem;
          display: flex; flex-direction: column; justify-content: center;
        }
        .yui-contact::before {
          content: ''; position: absolute; inset: -2px; border-radius: inherit; z-index: 0;
          background: conic-gradient(
            from var(--yui-border-angle),
            transparent 70%,
            rgba(99,102,241,0.6) 80%,
            rgba(139,92,246,0.8) 85%,
            rgba(99,102,241,0.6) 90%,
            transparent 100%
          );
          animation: yui-border-spin 4s linear infinite;
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          padding: 2px;
        }
        @keyframes yui-border-spin { to { --yui-border-angle: 360deg; } }
        .yui-contact-spotlight {
          position: absolute; width: 30rem; height: 30rem; border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
          pointer-events: none; will-change: transform; z-index: 1;
        }
        .yui-contact-content { position: relative; z-index: 2; }
        .yui-contact-eyebrow {
          font-size: 0.8rem; letter-spacing: 0.15em; text-transform: uppercase;
          opacity: 0.5; margin-bottom: 1.5rem;
        }
        .yui-contact-heading {
          font-size: clamp(5rem, 10vw, 14rem); font-weight: 700; line-height: 0.85;
          letter-spacing: -0.05em; text-transform: uppercase; margin: 0 0 3rem;
        }
        .yui-contact-circle {
          position: relative; width: 10rem; height: 10rem;
        }
        .yui-contact-circle a {
          display: flex; align-items: center; justify-content: center;
          width: 100%; height: 100%; text-decoration: none; position: relative;
        }
        .yui-contact-circle svg {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform: rotate(-90deg);
        }
        .yui-contact-circle-label {
          position: relative; z-index: 1; text-align: center; line-height: 1.3;
          font-size: 0.75rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.8;
        }
        @media (max-width: 768px) {
          .yui-contact { padding: 5rem 2rem; min-height: auto; }
          .yui-contact-heading { font-size: 5rem; }
        }
      `}</style>
      <div ref={sectionRef} className="yui-contact">
        <div ref={spotlightRef} className="yui-contact-spotlight" />
        <div className="yui-contact-content">
          <p className="yui-contact-eyebrow">{eyebrow}</p>
          <h2
            className="yui-contact-heading"
            style={headingImageSrc ? {
              backgroundImage: `url(${headingImageSrc})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
            } : undefined}
          >
            <span style={{ display: "block" }}>{heading}</span>
            <span style={{ display: "block" }}>{subheading}</span>
          </h2>
          <div className="yui-contact-circle">
            <a href={ctaHref}>
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" className="yui-contact-circle-draw" />
              </svg>
              <div className="yui-contact-circle-label">
                <span style={{ display: "block" }}>write a</span>
                <span style={{ display: "block" }}>message</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

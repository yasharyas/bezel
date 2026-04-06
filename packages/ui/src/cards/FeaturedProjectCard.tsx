"use client";

type Props = {
  title: string;
  eyebrow?: string;
  imageSrc: string;
  imageAlt?: string;
  href?: string;
  tags?: string[];
  alignRight?: boolean;
};

export function FeaturedProjectCard({
  title,
  eyebrow = "",
  imageSrc,
  imageAlt = "",
  href = "#",
  tags = [],
  alignRight = false,
}: Props) {
  return (
    <>
      <style>{`
        .yui-feat-card { position: relative; }
        .yui-feat-card a { display: block; text-decoration: none; color: inherit; }
        .yui-feat-img {
          width: 100%; overflow: hidden; border-radius: 2rem;
          aspect-ratio: 4/3; isolation: isolate;
        }
        .yui-feat-card--right .yui-feat-img { width: 70%; margin-left: auto; }
        .yui-feat-img img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.9s cubic-bezier(0.25,1,0.5,1);
        }
        .yui-feat-card:hover .yui-feat-img img { transform: scale(1.05); }
        .yui-feat-info { margin-top: 2rem; }
        .yui-feat-info--right { text-align: right; }
        .yui-feat-eyebrow {
          display: block; font-size: 0.8rem; letter-spacing: 0.15em; text-transform: uppercase;
          opacity: 0.5; margin-bottom: 0.5rem;
        }
        .yui-feat-title {
          font-size: clamp(3.5rem, 6vw, 8rem); font-weight: 600; line-height: 0.9;
          letter-spacing: -0.04em; text-transform: uppercase; margin: 0 0 1.5rem;
        }
        .yui-feat-meta { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .yui-feat-info--right .yui-feat-meta { justify-content: flex-end; }
        .yui-feat-tag {
          font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase;
          padding: 0.25rem 0.75rem; border: 1px solid currentColor; border-radius: 999px; opacity: 0.5;
        }
      `}</style>
      <article className={`yui-feat-card${alignRight ? " yui-feat-card--right" : ""}`}>
        <a href={href}>
          <div className="yui-feat-img">
            <img src={imageSrc} alt={imageAlt} />
          </div>
          <div className={`yui-feat-info${alignRight ? " yui-feat-info--right" : ""}`}>
            {eyebrow && <span className="yui-feat-eyebrow">{eyebrow}</span>}
            <h2 className="yui-feat-title">{title}</h2>
            {tags.length > 0 && (
              <div className="yui-feat-meta">
                {tags.map((t) => <span key={t} className="yui-feat-tag">{t}</span>)}
              </div>
            )}
          </div>
        </a>
      </article>
    </>
  );
}

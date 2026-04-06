"use client";

type Props = {
  title: string;
  subtitle?: string;
  imageSrc: string;
  imageAlt?: string;
  href?: string;
  large?: boolean;
};

export function ProjectCard({ title, subtitle = "", imageSrc, imageAlt = "", href = "#", large = false }: Props) {
  return (
    <>
      <style>{`
        .yui-proj-card { position: relative; break-inside: avoid; margin-bottom: 3rem; }
        .yui-proj-card a { display: block; text-decoration: none; color: inherit; }
        .yui-proj-card-img {
          overflow: hidden; border-radius: 1.5rem; isolation: isolate;
          aspect-ratio: 4/3;
        }
        .yui-proj-card-img img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.8s cubic-bezier(0.25,1,0.5,1);
        }
        .yui-proj-card:hover .yui-proj-card-img img { transform: scale(1.05); }
        .yui-proj-card-info { margin-top: 1.5rem; }
        .yui-proj-card-info h3 {
          font-size: 2.5rem; font-weight: 600; line-height: 1;
          letter-spacing: -0.05em; text-transform: uppercase; margin: 0 0 0.4rem;
        }
        .yui-proj-card--large .yui-proj-card-info h3 {
          font-size: 4rem; letter-spacing: -0.08em;
        }
        .yui-proj-card-info span {
          font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.5;
        }
      `}</style>
      <article className={`yui-proj-card${large ? " yui-proj-card--large" : ""}`}>
        <a href={href}>
          <div className="yui-proj-card-img">
            <img src={imageSrc} alt={imageAlt} />
          </div>
          <div className="yui-proj-card-info">
            <h3>{title}</h3>
            {subtitle && <span>{subtitle}</span>}
          </div>
        </a>
      </article>
    </>
  );
}

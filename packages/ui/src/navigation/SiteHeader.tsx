"use client";

type NavLink = { label: string; href: string };

type Props = {
  logo?: string;
  logoHref?: string;
  navLinks?: NavLink[];
  ctaLabel?: string;
  ctaHref?: string;
  visible?: boolean;
};

export function SiteHeader({
  logo = "BRAND.",
  logoHref = "/",
  navLinks = [],
  ctaLabel = "GET IN TOUCH",
  ctaHref = "#contact",
  visible = true,
}: Props) {
  return (
    <>
      <style>{`
        .yui-site-header {
          display: flex; align-items: center; justify-content: space-between;
          position: fixed; top: 0; left: 0; width: 100%;
          padding: 2rem 5rem; z-index: 1000;
          transform: translateY(-100%);
          transition: transform 0.8s cubic-bezier(0.25,1,0.5,1);
        }
        .yui-site-header.visible { transform: translateY(0); }
        .yui-site-header-logo { font-size: 2rem; letter-spacing: -0.1rem; font-weight: 500; color: #fff; text-decoration: none; }
        .yui-site-header-nav { display: flex; list-style: none; gap: 1.5rem; margin: 0; padding: 0; }
        .yui-nav-item {
          position: relative; overflow: hidden;
          font-size: 1rem; font-weight: 500;
          border-radius: 999px; cursor: pointer;
        }
        .yui-nav-link {
          position: relative; display: inline-flex; flex-direction: column;
          overflow: hidden; line-height: 1; padding: 0.5rem 1.2rem;
          text-decoration: none;
        }
        .yui-nav-link .link-outer { display: block; color: #fff; transition: transform 0.5s cubic-bezier(0.25,1,0.5,1); }
        .yui-nav-link .link-inner {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          color: #000; transform: translateY(100%);
          transition: transform 0.5s cubic-bezier(0.25,1,0.5,1);
        }
        .yui-nav-item:hover .link-outer { transform: translateY(-100%); }
        .yui-nav-item:hover .link-inner { transform: translateY(0); }
        .yui-nav-bubble {
          position: absolute; inset: 0; overflow: hidden; border-radius: 999px; pointer-events: none;
        }
        .yui-nav-bubble::before {
          content: ''; position: absolute; width: 150%; height: 150%;
          background: #fff; border-radius: 50%;
          top: 100%; left: -25%; transform: translateY(0);
          transition: top 0.4s cubic-bezier(0.25,1,0.5,1);
        }
        .yui-nav-item:hover .yui-nav-bubble::before { top: -25%; }
        .yui-site-cta {
          position: relative; overflow: hidden;
          display: inline-flex; align-items: center;
          padding: 0.5rem 1.4rem; border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.3);
          font-size: 0.9rem; font-weight: 500; color: #fff;
          text-decoration: none; cursor: pointer;
        }
        .yui-site-cta .link-outer { position: relative; z-index: 1; transition: color 0.3s; }
        .yui-site-cta-bubble {
          position: absolute; inset: 0; overflow: hidden; border-radius: 999px;
        }
        .yui-site-cta-bubble::before {
          content: ''; position: absolute; width: 150%; height: 150%;
          background: #fff; border-radius: 50%;
          top: 100%; left: -25%;
          transition: top 0.4s cubic-bezier(0.25,1,0.5,1);
        }
        .yui-site-cta:hover .yui-site-cta-bubble::before { top: -25%; }
        .yui-site-cta:hover .link-outer { color: #000; }
      `}</style>
      <header className={`yui-site-header${visible ? " visible" : ""}`}>
        <a href={logoHref} className="yui-site-header-logo">{logo}</a>
        {navLinks.length > 0 && (
          <ul className="yui-site-header-nav">
            {navLinks.map((link) => (
              <li key={link.href} className="yui-nav-item">
                <div className="yui-nav-bubble" />
                <a href={link.href} className="yui-nav-link">
                  <span className="link-outer">{link.label}</span>
                  <span className="link-inner">{link.label}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
        <a href={ctaHref} className="yui-site-cta">
          <div className="yui-site-cta-bubble" />
          <span className="link-outer">{ctaLabel}</span>
        </a>
      </header>
    </>
  );
}

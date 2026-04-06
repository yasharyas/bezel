"use client";
import { useState } from "react";

type NavLink = { label: string; href: string };

type Props = {
  logo?: string;
  logoHref?: string;
  links?: NavLink[];
};

export function MobileMenu({ logo = "MK.", logoHref = "/", links = [] }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <style>{`
        .yui-mnav {
          display: flex; align-items: center; justify-content: space-between;
          position: fixed; top: 0; left: 0; width: 100%;
          padding: 2rem; z-index: 2000;
          mix-blend-mode: difference;
        }
        .yui-mnav-logo { font-size: 2.5rem; font-weight: 500; color: #fff; text-decoration: none; }
        .yui-burger {
          width: 2.4rem; height: 1.8rem;
          display: flex; flex-direction: column; justify-content: space-between;
          background: none; border: none; cursor: pointer; padding: 0;
        }
        .yui-burger span {
          width: 100%; height: 0.2rem; background: #fff; border-radius: 999px;
          transition: transform 0.4s cubic-bezier(0.25,1,0.5,1), opacity 0.3s;
          transform-origin: center;
        }
        .yui-burger.open span:nth-child(1) { transform: translateY(0.8rem) rotate(45deg); }
        .yui-burger.open span:nth-child(2) { opacity: 0; }
        .yui-burger.open span:nth-child(3) { transform: translateY(-0.8rem) rotate(-45deg); }
        .yui-moverlay {
          position: fixed; inset: 0; z-index: 1999;
          background: #000;
          display: flex; align-items: center; justify-content: center;
          opacity: 0; visibility: hidden;
          transition: opacity 0.5s, visibility 0.5s;
        }
        .yui-moverlay.open { opacity: 1; visibility: visible; }
        .yui-moverlay ul { display: flex; flex-direction: column; gap: 2.5rem; list-style: none; margin: 0; padding: 0; text-align: center; }
        .yui-moverlay li a {
          display: inline-block;
          font-size: 3rem; font-weight: 500; color: #fff;
          text-decoration: none; text-transform: uppercase; letter-spacing: -0.05em;
          padding: 0.3rem 1.5rem; border: 1px solid rgba(255,255,255,0.2); border-radius: 999px;
          transition: background 0.3s, color 0.3s;
        }
        .yui-moverlay li a:hover { background: #fff; color: #000; }
      `}</style>
      <nav className="yui-mnav">
        <a href={logoHref} className="yui-mnav-logo">{logo}</a>
        <button
          className={`yui-burger${open ? " open" : ""}`}
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <span /><span /><span />
        </button>
      </nav>
      <div className={`yui-moverlay${open ? " open" : ""}`} onClick={() => setOpen(false)}>
        <ul onClick={(e) => e.stopPropagation()}>
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} onClick={() => setOpen(false)}>{link.label}</a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export interface ComponentEntry {
  name: string;
  slug: string;
  path: string;
  code: string;
  prompt: string;
  tags: string[];
}

export const registry: ComponentEntry[] = [
  {
    name: "GlassButton",
    slug: "glass-button",
    path: "GlassButton.tsx",
    code: `import React from "react";

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function GlassButton({ children, className = "", ...props }: GlassButtonProps) {
  return (
    <button
      className={\`px-6 py-2 rounded-xl font-medium text-white backdrop-blur-md bg-white/10 border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-200 \${className}\`}
      {...props}
    >
      {children}
    </button>
  );
}`,
    prompt: "A glassmorphism-styled button with blur and transparency effects.",
    tags: ["button", "glass", "ui"],
  },
  {
    name: "Card",
    slug: "card",
    path: "Card.tsx",
    code: `import React from "react";

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, children, className = "" }: CardProps) {
  return (
    <div
      className={\`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-md \${className}\`}
    >
      {title && <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>}
      <div className="text-white/80">{children}</div>
    </div>
  );
}`,
    prompt: "A translucent card component with optional title.",
    tags: ["card", "layout", "glass"],
  },
  {
    name: "Input",
    slug: "input",
    path: "Input.tsx",
    code: `import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm text-white/70 font-medium">{label}</label>}
      <input
        className={\`px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all \${className}\`}
        {...props}
      />
    </div>
  );
}`,
    prompt: "A styled input field with optional label.",
    tags: ["input", "form", "ui"],
  },
];

export function getComponent(slug: string): ComponentEntry | undefined {
  return registry.find((c) => c.slug === slug);
}

export function getAllComponents(): ComponentEntry[] {
  return registry;
}

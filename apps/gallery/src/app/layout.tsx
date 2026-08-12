import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yash UI - Component Gallery",
  description: "Open-source UI components. Preview, copy, and use.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#0c0c0f] text-white min-h-screen flex flex-col">
        <div className="flex-1">{children}</div>
        <footer className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-center">
            <a
              href="https://yash-arya.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-neutral-500 hover:text-white transition-colors"
            >
              Built by Yash Arya — yash-arya.com
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}

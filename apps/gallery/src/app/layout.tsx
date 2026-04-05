import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yash UI - Component Gallery",
  description: "Open-source UI components. Preview, copy, and use.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#0c0c0f] text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}

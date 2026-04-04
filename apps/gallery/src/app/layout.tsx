import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yash UI - Component Gallery",
  description: "Preview and copy reusable UI components",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

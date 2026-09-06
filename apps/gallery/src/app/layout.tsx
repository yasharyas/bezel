import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://yash-ui-system-gallery.vercel.app";
const TITLE = "Bezel — Component Gallery";
const DESCRIPTION =
  "Bezel is a React component library for interface work that needs motion and craft. Preview every component, then copy the source.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Bezel",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
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

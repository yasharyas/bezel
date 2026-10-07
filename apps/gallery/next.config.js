const SITE_URL = "https://bezel-ui.vercel.app";

// The canonical is also sent as an HTTP Link header. Google reads headers at
// fetch time, so the canonical still counts when a crawl's render comes back
// without the <head> tags. It must stay identical to each page's
// alternates.canonical.
const canonical = (path) => ({
  key: "Link",
  value: `<${SITE_URL}${path}>; rel="canonical"`,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["bezel-ui", "@bezel/registry"],
  // Ship no browser source maps: the component source is public on GitHub and
  // npm, but the gallery's own bundle does not need to be readable.
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      { source: "/", headers: [canonical("")] },
      { source: "/principles", headers: [canonical("/principles")] },
      { source: "/states", headers: [canonical("/states")] },
      { source: "/component/:slug", headers: [canonical("/component/:slug")] },
    ];
  },
};

module.exports = nextConfig;

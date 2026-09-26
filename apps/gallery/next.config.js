/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["bezel-ui", "@bezel/registry"],
  // Ship no browser source maps: the component source is public on GitHub and
  // npm, but the gallery's own bundle does not need to be readable.
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;

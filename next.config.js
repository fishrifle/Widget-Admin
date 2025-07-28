// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    domains: ["localhost"],
  },
  // Turbo configuration (replaces webpack config)
  experimental: {
    turbo: {
      // Turbo-specific configurations if needed
    },
  },
};

module.exports = nextConfig;

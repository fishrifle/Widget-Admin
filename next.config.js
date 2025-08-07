// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["localhost"],
  },
  experimental: {
    // Remove turbo for deployment stability
  },
  // Disable static optimization for dynamic routes
  trailingSlash: false,
};

module.exports = nextConfig;

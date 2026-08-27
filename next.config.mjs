/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Enables partial prerendering — useful for the marketing landing while the /demo stays dynamic.
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // R3F + Rapier: avoid double-mount physics churn in dev
  transpilePackages: ["three"],
};

export default nextConfig;

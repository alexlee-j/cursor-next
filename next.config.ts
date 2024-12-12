import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // 忽略ESLint检查
    ignoreDuringBuilds: true
},
  reactStrictMode: true,
};

export default nextConfig;

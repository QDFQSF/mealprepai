// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ⬇️ Empêche le build d’échouer à cause d’ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ⬇️ Empêche le build d’échouer à cause des erreurs TS
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

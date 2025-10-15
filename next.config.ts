// next.config.ts - Configuration pour Cloudflare Pages
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Génération statique (export HTML pur)
  output: 'export',
  
  // Désactive les optimisations d'images (pas supportées en mode export)
  images: {
    unoptimized: true
  },
  
  // Assure que les routes dynamiques sont générées
  trailingSlash: true,
  
  // Skip les checks ESLint au build (optionnel)
  eslint: {
    ignoreDuringBuilds: true
  },
  
  typescript: {
    ignoreBuildErrors: true
  }
};

export default nextConfig;
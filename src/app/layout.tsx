// src/app/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import ToasterProvider from "@/components/ToasterProvider";
import { Home, Heart, ListChecks } from "lucide-react";
import ImgReady from "./ImgReady";

/** Petit logomark inline (beige + ambre) pour éviter tout asset externe */
function LogoMark({ size = 22 }: { size?: number }) {
  // Couleurs compatibles avec le thème sombre actuel
  const AMBER = "#F4A21E";   // accent
  const BEIGE = "#E9E4D8";   // teint (ex "sauge" remplacé par beige)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {/* bol / visage */}
      <path
        d="M8 24c0 13.255 10.745 24 24 24s24-10.745 24-24H8z"
        fill={BEIGE}
        opacity="0.9"
      />
      {/* yeux */}
      <circle cx="24.5" cy="34.5" r="2.8" fill="#0b0f13" />
      <circle cx="39.5" cy="34.5" r="2.8" fill="#0b0f13" />
      {/* sourire */}
      <path
        d="M24 40c2.2 2.1 5 3.2 8 3.2s5.8-1.1 8-3.2"
        stroke="#0b0f13"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
      {/* chapeau / mèche stylisée */}
      <path
        d="M10 20h44c-1.8-6.2-7.2-10-14.5-10-6.3 0-9.9 2.4-12.7 5.2C23.6 18 21 20 16.5 20H10z"
        fill={AMBER}
      />
    </svg>
  );
}

export const metadata: Metadata = {
  title: "MealPrepAI - Idées repas intelligentes et rapides",
  description: "Trouve des recettes adaptées à tes ingrédients, ton temps et ton régime alimentaire. Recherche intelligente, liste de courses automatique, 100% gratuit.",
  keywords: ["recettes faciles", "meal prep", "idées repas", "cuisine rapide", "liste de courses", "recettes végétariennes", "batch cooking"],
  authors: [{ name: "MealPrepAI" }],
  creator: "MealPrepAI",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://mealprepai.fr",
    title: "MealPrepAI - Ton assistant repas intelligent",
    description: "Trouve des recettes adaptées à tes ingrédients et ton emploi du temps. Recherche intelligente, liste de courses auto.",
    siteName: "MealPrepAI",
    images: [
      {
        url: "/og-image.jpg", // À créer : 1200x630px
        width: 1200,
        height: 630,
        alt: "MealPrepAI - Idées repas intelligentes"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "MealPrepAI - Ton assistant repas intelligent",
    description: "Trouve des recettes adaptées à tes ingrédients en quelques secondes",
    images: ["/og-image.jpg"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        {/* En-tête */}
        <header className="site-header">
          <div className="container" style={{ gap: 14 }}>
            <Link href="/" className="brand" aria-label="Retour à l’accueil">
              <LogoMark />
              <span style={{ fontWeight: 800 }}>MealPrepAI</span>
            </Link>

            <nav className="nav" aria-label="Navigation principale">
              <Link href="/" className="navlink">
                <Home size={16} aria-hidden /> <span>Accueil</span>
              </Link>
              <Link href="/favoris" className="navlink">
                <Heart size={16} aria-hidden /> <span>Favoris</span>
              </Link>
              <Link href="/liste" className="navlink">
                <ListChecks size={16} aria-hidden /> <span>Liste</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Contenu */}
        <main className="container">{children}</main>

        {/* Pied de page */}
        <footer className="site-footer">
          <div className="container">
            <small>
              Fait maison ·{" "}
              <a href="https://nextjs.org/" target="_blank" rel="noreferrer">
                Next.js
              </a>
            </small>
          </div>
        </footer>

        {/* Toaster global */}
        <ToasterProvider />
        {/* Fade-in + placeholders images */}
        <ImgReady />
      </body>
    </html>
  );
}

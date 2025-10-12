import "./globals.css";
import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";

// Polices (remplace Geist par Inter/Roboto Mono)
const inter = Inter({ subsets: ["latin"] });
const mono = Roboto_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MealPrepAI",
  description: "Trouve des idées de repas selon les ingrédients que tu as chez toi.",
  manifest: "/manifest.json",        // <-- nécessaire pour PWA
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} ${mono.className} antialiased`}>
        {children}

        {/* Enregistrement du Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker
                    .register('/service-worker.js')
                    .then(() => console.log('✅ Service Worker installé'))
                    .catch(err => console.warn('⚠️ Erreur Service Worker :', err));
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

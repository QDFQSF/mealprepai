// src/components/LogoMealPrep.tsx
"use client";

type Props = {
  size?: number;        // taille en px
  title?: string;       // titre accesibilité
};

export default function LogoMealPrep({ size = 40, title = "MealPrepAI" }: Props) {
  // Couleurs du thème
  const beige = "#F4EDE4";   // (remplace l'ancien vert sauge)
  const gold  = "#D4AF37";   // or doux
  const coral = "#FF7F50";   // accent "chapeau/cheveux"

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      role="img"
      aria-label={title}
      style={{ display: "block" }}
    >
      <title>{title}</title>

      {/* Bol/visage (beige) */}
      <defs>
        <clipPath id="face-clip">
          <circle cx="64" cy="60" r="40" />
        </clipPath>
      </defs>

      {/* Bol */}
      <path
        d="M24 56a40 40 0 0 0 80 0H24z"
        fill={beige}
        opacity="0.95"
      />
      {/* Visage (yeux + sourire) */}
      <g clipPath="url(#face-clip)">
        <circle cx="48" cy="56" r="6" fill="#0b0f13" />
        <circle cx="80" cy="56" r="6" fill="#0b0f13" />
        <path
          d="M46 70c4 6 12 10 18 10s14-4 18-10"
          fill="none"
          stroke="#0b0f13"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </g>

      {/* Chapeau/cheveux (corail) */}
      <path
        d="M36 38c8-10 18-14 28-14s20 4 28 14c-10 2-19 4-28 4s-18-2-28-4z"
        fill={coral}
      />

      {/* Petit liseré doré sous le bol */}
      <rect x="38" y="94" width="52" height="6" rx="3" fill={gold} opacity="0.9" />
    </svg>
  );
}

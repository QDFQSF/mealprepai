// src/app/recettes/[slug]/page.tsx
// ⚠️ PAS de 'use client' ici !

import data from '@/data/recipes_full_v5.json';
import RecipeClient from './RecipeClient';

type Recipe = {
  slug: string;
  name: string;
  time?: number;
  budget?: string;
  type?: string;
  origin?: string;
  difficulty?: string;
  tags?: string[];
  image?: string;
  nutrition?: {
    calories: number;
    proteines: number;
    glucides: number;
    lipides: number;
  };
  servings?: number;
  ingredients?: Array<string | { name: string; qty?: number; unit?: string }>;
  ingredientsQty?: Array<{ name: string; qty?: number; unit?: string }>;
  steps?: string[];
};

const all: Recipe[] = (data as any) as Recipe[];

// ✅ Cette fonction génère toutes les URLs statiques au build
export async function generateStaticParams() {
  return all.map((recipe) => ({
    slug: recipe.slug
  }));
}

// Le composant serveur qui trouve la recette et la passe au client
export default async function RecipePage({ 
  params 
}: { 
  params: Promise<{ slug: string }> | { slug: string } 
}) {
  const p = await params;
  const slug = p?.slug;
  
  const recipe = all.find((r) => r.slug === slug);

  if (!recipe) {
    return (
      <div className="card" style={{ marginTop: 18 }}>
        Recette introuvable.
      </div>
    );
  }

  // On passe la recette au composant client
  return <RecipeClient recipe={recipe} />;
}
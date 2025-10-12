"use client";
import Header from "@/components/Header";
import data from "@/data/recipes.json";
import type { Recipe } from "@/lib/types";
import { favorites } from "@/lib/storage";
import RecipeCard from "@/components/RecipeCard";
import { useEffect, useState } from "react";

export default function FavorisPage() {
  const [items, setItems] = useState<Recipe[]>([]);

  useEffect(() => {
    const favs = new Set(favorites.all());
    setItems((data as Recipe[]).filter(r => favs.has(r.slug)));
  }, []);

  return (
    <div>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-4">Mes favoris</h1>
        {items.length === 0 ? (
          <div className="opacity-70">Aucune recette en favori.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {items.map(r => <RecipeCard key={r.slug} r={r} />)}
          </div>
        )}
      </main>
    </div>
  );
}

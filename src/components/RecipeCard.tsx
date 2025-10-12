"use client";
import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import { favorites, shoplist } from "@/lib/storage";
import { useEffect, useState } from "react";
import type { Recipe } from "@/lib/types";

export default function RecipeCard({ r }: { r: Recipe }) {
  const [fav, setFav] = useState(false);
  useEffect(() => { setFav(favorites.has(r.slug)); }, [r.slug]);

  const toggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    favorites.toggle(r.slug);
    setFav(favorites.has(r.slug));
  };

  const addToList = (e: React.MouseEvent) => {
    e.preventDefault();
    shoplist.add(r.ingredients);
    alert("Ajouté à la liste de courses ✅");
  };

  return (
    <Link href={`/recettes/${r.slug}`} className="border rounded-xl p-4 hover:shadow transition block">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold">{r.name}</h3>
        <button onClick={toggleFav} className="text-rose-600" aria-label="Favori">
          <Heart size={18} fill={fav ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="text-sm opacity-70 mt-1">
        {r.time} min • {r.budget === "éco" ? "€" : r.budget === "normal" ? "€€" : "€€€"}
      </div>
      <div className="text-sm mt-2 line-clamp-2">
        Ingrédients : {r.ingredients.slice(0,5).join(", ")}{r.ingredients.length>5?"…":""}
      </div>
      <button onClick={addToList} className="mt-3 inline-flex items-center gap-1 text-sm px-3 py-1.5 border rounded">
        <Plus size={14}/> Liste de courses
      </button>
    </Link>
  );
}

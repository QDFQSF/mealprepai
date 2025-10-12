"use client";
import Header from "@/components/Header";
import data from "@/data/recipes.json";
import type { Recipe } from "@/lib/types";
import { notFound } from "next/navigation";
import { favorites, shoplist } from "@/lib/storage";
import { useCallback } from "react";

export default function RecipePage({ params }: { params: { slug: string } }) {
  const r = (data as Recipe[]).find((x) => x.slug === params.slug);
  if (!r) return notFound();

  const addList = () => {
    shoplist.add(r.ingredients);
    alert("Ajouté à la liste de courses ✅");
  };

  const toggleFav = () => {
    favorites.toggle(r.slug);
    alert("Mise à jour des favoris");
  };

  const shareRecipe = useCallback(async () => {
    const text =
      `🍽️ ${r.name}\n` +
      `⏱️ ${r.time} min • ${r.budget}\n` +
      (r.tags?.length ? `#${r.tags.join(" #")}\n` : "") +
      `\nIngrédients:\n- ${r.ingredients.join("\n- ")}` +
      `\n\nÉtapes:\n${r.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}` +
      `\n\nEssayé avec MealPrepAI 👇`;

    // Web Share API si dispo, sinon fallback copier
    try {
      if (typeof (navigator as any).share === "function") {
        await (navigator as any).share({ title: r.name, text });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Recette copiée dans le presse-papiers ✅");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        alert("Recette copiée dans le presse-papiers ✅");
      } catch {
        alert("Impossible de partager/copier (permission refusée).");
      }
    }
  }, [r]);

  return (
    <div>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold">{r.name}</h1>
          <div className="flex gap-2">
            <button onClick={shareRecipe} className="px-3 py-2 border rounded">
              Partager
            </button>
            <button onClick={toggleFav} className="px-3 py-2 border rounded">
              Favori
            </button>
            <button onClick={addList} className="px-3 py-2 border rounded">
              Ajouter à la liste
            </button>
          </div>
        </div>

        <div className="opacity-70 text-sm">
          {r.time} min • {r.budget === "éco" ? "€" : r.budget === "normal" ? "€€" : "€€€"}
          {r.tags?.length ? <> • {r.tags.join(", ")}</> : null}
        </div>

        <section>
          <h3 className="font-semibold mt-2">Ingrédients</h3>
          <ul className="list-disc ml-6">
            {r.ingredients.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="font-semibold mt-2">Étapes</h3>
          <ol className="list-decimal ml-6 space-y-1">
            {r.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}

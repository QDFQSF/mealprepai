"use client";

import Header from "@/components/Header";
import IngredientInput from "@/components/IngredientInput";
import RecipeCard from "@/components/RecipeCard";
import EmptyState from "@/components/EmptyState";
import data from "@/data/recipes.json";
import { useEffect, useState, useCallback } from "react";
import { suggest } from "@/lib/engine";
import type { Recipe } from "@/lib/types";
import { getDailyRecipe, rerollDaily } from "@/lib/daily";
import { shoplist } from "@/lib/storage";
import Link from "next/link";

export default function HomePage() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [results, setResults] = useState<Recipe[]>([]);
  const [maxTime, setMaxTime] = useState<number | undefined>(undefined);
  const [budget, setBudget] = useState<string | undefined>(undefined);
  const [tag, setTag] = useState<string | undefined>(undefined);

  // Inspiration du jour
  const [daily, setDaily] = useState<Recipe | null>(null);

  useEffect(() => {
    // charge la recette du jour (déterministe / persistée pour 24h)
    setDaily(getDailyRecipe(data as Recipe[]));
  }, []);

  const shareDaily = useCallback(async () => {
    if (!daily) return;
    const text =
      `✨ Inspiration du jour : ${daily.name}\n` +
      `⏱️ ${daily.time} min • ${daily.budget}\n` +
      (daily.tags?.length ? `#${daily.tags.join(" #")}\n` : "") +
      `\nIngrédients:\n- ${daily.ingredients.join("\n- ")}\n\n` +
      `Essayé avec MealPrepAI 👇`;
    try {
      if (typeof (navigator as any).share === "function") {
        await (navigator as any).share({ title: "Inspiration du jour", text });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Recette copiée dans le presse-papiers ✅");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        alert("Recette copiée dans le presse-papiers ✅");
      } catch {
        alert("Impossible de partager/copier.");
      }
    }
  }, [daily]);

  const addDailyToList = () => {
    if (!daily) return;
    shoplist.add(daily.ingredients);
    alert("Ajouté à la liste de courses ✅");
  };

  const changeToday = () => {
    const next = rerollDaily(data as Recipe[]);
    setDaily(next);
  };

  // suggestions + application des filtres UI
  useEffect(() => {
    const out = suggest(data as Recipe[], ingredients, {
      minScore: 0.3,
      limit: 9,
      maxTime,
      tags: tag ? [tag] : undefined,
    }).filter((r) => !budget || r.budget === budget);
    setResults(out);
  }, [ingredients, maxTime, budget, tag]);

  return (
    <div>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Inspiration du jour */}
        {daily && (
          <section className="border rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm opacity-70 mb-1">Inspiration du jour</div>
                <h2 className="text-lg font-semibold">{daily.name}</h2>
                <div className="text-sm opacity-70">
                  {daily.time} min • {daily.budget === "éco" ? "€" : daily.budget === "normal" ? "€€" : "€€€"}
                  {daily.tags?.length ? <> • {daily.tags.join(", ")}</> : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/recettes/${daily.slug}`} className="px-3 py-2 border rounded">
                  Voir
                </Link>
                <button onClick={addDailyToList} className="px-3 py-2 border rounded">
                  Liste
                </button>
                <button onClick={shareDaily} className="px-3 py-2 border rounded">
                  Partager
                </button>
                <button onClick={changeToday} className="px-3 py-2 border rounded">
                  Changer pour aujourd’hui
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Filtres / saisie */}
        <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold">Qu’est-ce qu’on mange ce soir ?</h1>
              <p className="opacity-70 text-sm">
                Tape ce que tu as, on te propose des idées en 15–20 min.
              </p>
            </div>

            {/* Temps max */}
            <div className="w-full md:w-48">
              <label className="text-sm opacity-70">Temps max</label>
              <select
                value={maxTime ?? 0}
                onChange={(e) =>
                  setMaxTime(Number(e.target.value) || undefined)
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value={0}>Peu importe</option>
                <option value={10}>≤ 10 min</option>
                <option value={15}>≤ 15 min</option>
                <option value={20}>≤ 20 min</option>
                <option value={30}>≤ 30 min</option>
              </select>
            </div>

            {/* Budget */}
            <div className="w-full md:w-44">
              <label className="text-sm opacity-70">Budget</label>
              <select
                value={budget ?? ""}
                onChange={(e) => setBudget(e.target.value || undefined)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Tous</option>
                <option value="éco">Éco</option>
                <option value="normal">Normal</option>
                <option value="plus">Confort</option>
              </select>
            </div>

            {/* Type / Tag */}
            <div className="w-full md:w-44">
              <label className="text-sm opacity-70">Type</label>
              <select
                value={tag ?? ""}
                onChange={(e) => setTag(e.target.value || undefined)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Tous</option>
                <option value="rapide">Rapide</option>
                <option value="végétarien">Végétarien</option>
                <option value="four">Four</option>
                <option value="poêle">Poêle</option>
                <option value="froid">Froid</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <IngredientInput onChange={setIngredients} />
          </div>
        </section>

        {/* Slot Cassiora */}
        <section className="border rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="font-semibold">Pas envie de cuisiner ?</div>
            <div className="text-sm opacity-70">
              Découvre la Box Cassiora à emporter (goûter / salé) — locale et maison.
            </div>
          </div>
          <a
            href="https://cassiora.fr"
            target="_blank"
            className="px-4 py-2 rounded bg-black text-white"
          >
            Voir les box
          </a>
        </section>

        {/* Résultats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {results.length === 0 ? (
            <EmptyState
              title="Aucune idée trouvée"
              hint="Ajoute/retire des ingrédients ou assouplis les filtres."
            />
          ) : (
            results.map((r) => <RecipeCard key={r.slug} r={r} />)
          )}
        </section>
      </main>
    </div>
  );
}

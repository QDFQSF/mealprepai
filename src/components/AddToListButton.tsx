"use client";
import { useLocalStorage } from "./useLocalStorage";
import type { IngredientQty, Recipe } from "@/lib/types";

function asQtyArray(r: Recipe): IngredientQty[] {
  // on essaye: ingredients en objets ? sinon ingredientsQty ? sinon strings -> noms
  if (Array.isArray(r.ingredients) && typeof (r.ingredients as any[])[0] === "object") {
    return (r.ingredients as IngredientQty[]);
  }
  if (r.ingredientsQty?.length) return r.ingredientsQty;
  return (r.ingredients as string[]).map(name => ({ name }));
}

export default function AddToListButton({ recipe }: { recipe: Recipe }) {
  const [list, setList] = useLocalStorage<IngredientQty[]>("shopping-list", []);

  function add() {
    const incoming = asQtyArray(recipe);
    // fusion par nom (case/accents ignorés)
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    const map = new Map<string, IngredientQty>();
    for (const it of [...list, ...incoming]) {
      const k = norm(it.name);
      const prev = map.get(k);
      if (prev && typeof prev.qty === "number" && typeof it.qty === "number" && prev.unit === it.unit) {
        map.set(k, { ...prev, qty: prev.qty + it.qty });
      } else {
        map.set(k, prev ? prev : it);
      }
    }
    setList(Array.from(map.values()));
  }

  return (
    <button onClick={add} className="px-3 py-2 rounded border bg-white">
      Ajouter à la liste
    </button>
  );
}

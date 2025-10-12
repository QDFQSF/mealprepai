"use client";
import { useState } from "react";

export default function IngredientInput({ onChange }: { onChange: (items: string[]) => void }) {
  const [value, setValue] = useState("");

  return (
    <div className="space-y-2">
      <label className="text-sm opacity-70">Ingrédients que tu as (séparés par virgule)</label>
      <input
        value={value}
        onChange={e => {
          setValue(e.target.value);
          const list = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
          onChange(list);
        }}
        className="w-full border rounded px-3 py-2"
        placeholder="ex: pâtes, œufs, tomates, poulet"
      />
      <p className="text-xs opacity-60">Astuce : 3–6 ingrédients donnent les meilleurs résultats.</p>
    </div>
  );
}

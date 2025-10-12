"use client";
import Header from "@/components/Header";
import { shoplist } from "@/lib/storage";
import { useEffect, useState } from "react";

export default function ListPage() {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    setItems(shoplist.get());
  }, []);

  const remove = (i: string) => {
    shoplist.remove(i);
    setItems(shoplist.get());
  };

  const clear = () => {
    if (confirm("Vider la liste ?")) {
      shoplist.clear();
      setItems([]);
    }
  };

  const shareList = async () => {
    if (items.length === 0) return;
    const text = `🛒 Ma liste de courses:\n- ${items.join(
      "\n- "
    )}\n\nGénérée avec MealPrepAI`;

    try {
      if (typeof (navigator as any).share === "function") {
        await (navigator as any).share({ title: "Liste de courses", text });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Liste copiée ✅");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        alert("Liste copiée ✅");
      } catch {
        alert("Impossible de partager/copier (permission refusée).");
      }
    }
  };

  const copyList = async () => {
    if (items.length === 0) return;
    try {
      await navigator.clipboard.writeText(items.join("\n"));
      alert("Liste copiée ✅");
    } catch {
      alert("Impossible de copier (permission refusée).");
    }
  };

  return (
    <div>
      <Header />
      <main className="max-w-xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-2xl font-semibold">Liste de courses</h1>
        {items.length === 0 ? (
          <div className="opacity-70">Ta liste est vide.</div>
        ) : (
          <>
            <ul className="space-y-2">
              {items.map((i) => (
                <li
                  key={i}
                  className="flex items-center justify-between border rounded px-3 py-2"
                >
                  <span>{i}</span>
                  <button
                    onClick={() => remove(i)}
                    className="text-sm opacity-70 hover:opacity-100"
                  >
                    Retirer
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-2">
              <button onClick={clear} className="px-3 py-2 border rounded">
                Vider
              </button>
              <button onClick={shareList} className="px-3 py-2 border rounded">
                Partager
              </button>
              <button onClick={copyList} className="px-3 py-2 border rounded">
                Copier
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

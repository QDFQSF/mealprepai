'use client';

import Link from 'next/link';
import * as React from 'react';
import toast from 'react-hot-toast';
import { shoppingList, favorites } from '@/lib/storage';
import SafeImage from "@/components/SafeImage"


type IngredientQty = { name: string; qty?: number; unit?: string };
type Recipe = {
  slug: string;
  name: string;
  time?: number;
  budget?: string;
  tags?: string[];
  image?: string;
  ingredients?: Array<string | { name: string; qty?: number; unit?: string }>;
  ingredientsQty?: IngredientQty[];
};

const MODE_TAGS = ['four', 'wok', 'poêle', 'poele', 'cru', 'mixeur'] as const;
const NICE_MODE: Record<string, string> = {
  four: 'Four',
  wok: 'Wok',
  'poêle': 'Poêle',
  poele: 'Poêle',
  cru: 'Cru',
  mixeur: 'Mixeur',
};

export default function RecipeCard({ r }: { r: Recipe }) {
  const tags = (r.tags || []).map((t) => t.toLowerCase());
  const modes = tags.filter((t) => MODE_TAGS.includes(t as any));
  const isHealthy = tags.includes('healthy');

  const [adding, setAdding] = React.useState(false);
  const [fav, setFav] = React.useState<boolean>(false);

  React.useEffect(() => {
    try { setFav(favorites.has(r.slug)); } catch { setFav(false); }
  }, [r.slug]);

  function buildItems(): IngredientQty[] {
    if (r.ingredientsQty && r.ingredientsQty.length) return r.ingredientsQty;
    const names =
      (r.ingredients ?? [])
        .map((x: any) => (typeof x === 'string' ? x : x?.name || ''))
        .filter(Boolean) || [];
    return names.map((name) => ({ name, qty: 1, unit: '' }));
  }

  function onQuickAdd(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (adding) return;
    setAdding(true);
    try {
      const base = buildItems();
      const items = base.map((it) => ({ ...it, recipe: r.name }));
      shoppingList.addMany(items);
      toast.success('Ajouté à la liste 🛒');
    } catch { toast.error("Impossible d'ajouter à la liste"); }
    finally { setAdding(false); }
  }

  function onToggleFav(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    try {
      favorites.toggle(r.slug);
      const next = favorites.has(r.slug);
      setFav(next);
      toast[next ? 'success' : 'success'](next ? 'Ajouté aux favoris ⭐' : 'Retiré des favoris');
    } catch { toast.error("Action favoris impossible"); }
  }

  return (
    <article
      className="card card--recipe"
      style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center' }}
    >
      {/* vignette */}
      <Link href={`/recettes/${r.slug}`} className="thumb" aria-label={`Ouvrir ${r.name}`}>
  <SafeImage src={r.image} alt={r.name} mode="thumb" />
</Link>


      <div className="card__main" style={{ display: 'grid', gap: 6 }}>
        <Link href={`/recettes/${r.slug}`} className="card__title">
          {r.name}
        </Link>

        <div className="card__meta">
          {typeof r.time === 'number' && <span className="badge badge--time">⏱ {r.time} min</span>}
          {r.budget && <span className="badge badge--budget">{r.budget}</span>}
          {isHealthy && <span className="badge badge--healthy">Healthy</span>}
          {modes.map((m, i) => (
            <span key={m + i} className="badge badge--mode">
              {NICE_MODE[m] ?? m}
            </span>
          ))}
        </div>
      </div>

      <div className="card__cta" style={{ display: 'flex', gap: 8 }}>
        <button
          className={`btn ghost ${fav ? 'btn--ok' : ''}`}
          onClick={onToggleFav}
          aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
          title="Favori"
        >
          {fav ? '★' : '☆'}
        </button>
        <button
          className="btn ghost"
          onClick={onQuickAdd}
          disabled={adding}
          aria-label="Ajouter rapidement les ingrédients à la liste"
          title="Ajouter à la liste"
        >
          ＋
        </button>
      </div>
    </article>
  );
}

// src/components/ActionsBar.tsx
'use client';

import { useEffect, useState } from 'react';
import { favorites, shoplist, ListItem } from '@/lib/storage';

type Props = {
  slug: string;
  // ingrédients détaillés pour ajout à la liste
  ingredientsQty?: { name: string; qty?: number; unit?: string }[];
  // fallback simple (si pas d'ingredientsQty)
  ingredients?: string[];
};

export default function ActionsBar({ slug, ingredientsQty, ingredients }: Props) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    setFav(favorites.has(slug));
  }, [slug]);

  const toggleFav = () => {
    favorites.toggle(slug);
    setFav(favorites.has(slug));
  };

  const addToList = () => {
    let items: ListItem[] = [];
    if (ingredientsQty?.length) {
      items = ingredientsQty.map(i => ({ name: i.name, qty: i.qty, unit: i.unit }));
    } else if (ingredients?.length) {
      items = ingredients.map(n => ({ name: n }));
    }
    shoplist.addMany(items, slug);
    alert('Ajouté à la liste de courses ✅');
  };

  return (
    <div className="flex gap-2 mb-4">
      <button onClick={addToList} className="btn">Ajouter à la liste</button>
      <button onClick={toggleFav} className="btn-secondary">
        {fav ? '★ Retirer des favoris' : '☆ Favori'}
      </button>
    </div>
  );
}

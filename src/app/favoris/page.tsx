'use client';

import * as React from 'react';
import Link from 'next/link';
import data from '@/data/recipes_full_v5.json';
import RecipeCard from '@/components/RecipeCard';
import { favorites } from '@/lib/storage';

type Recipe = {
  slug: string;
  name: string;
  time?: number;
  budget?: string;
  tags?: string[];
};

const all: Recipe[] = (data as any) as Recipe[];

export default function FavorisPage() {
  const [slugs, setSlugs] = React.useState<string[]>([]);

  React.useEffect(() => {
    // charger les favoris depuis localStorage via la lib
    setSlugs(favorites.get() as string[]);
  }, []);

  function refresh() {
    setSlugs(favorites.get() as string[]);
  }

  function onClear() {
    favorites.clear();
    refresh();
  }

  const recs = React.useMemo(
    () => all.filter((r) => slugs.includes(r.slug)),
    [slugs]
  );

  return (
    <main className="stack" style={{ marginTop: 18 }}>
      <header className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="h1">Favoris</h1>
        {recs.length > 0 && (
          <button className="btn danger" onClick={onClear}>Vider</button>
        )}
      </header>

      {recs.length === 0 ? (
        <div className="card">
          <p className="muted">
            Aucun favori pour le moment. Retourne à l’
            <Link href="/">accueil</Link> pour en ajouter ✨
          </p>
        </div>
      ) : (
        recs.map((r) => <RecipeCard key={r.slug} r={r as any} />)
      )}
    </main>
  );
}

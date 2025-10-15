'use client';

import * as React from 'react';
import toast from 'react-hot-toast';
import { shoppingList, type ListItem } from '@/lib/storage';

export default function ListePage() {
  const [items, setItems] = React.useState<ListItem[]>([]);

  // charger et écouter les changements entre onglets
  React.useEffect(() => {
    const load = () => setItems(shoppingList.get() as ListItem[]);
    load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'mealprep_list') load();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function toggle(i: number) {
    shoppingList.toggleCheck(i);
    setItems(shoppingList.get() as ListItem[]);
  }

  function remove(i: number) {
    const list = shoppingList.get() as ListItem[];
    list.splice(i, 1);
    shoppingList.set(list);
    setItems(list);
    toast.success('Supprimé de la liste');
  }

  function clear() {
    shoppingList.clear();
    setItems([]);
    toast('Liste vidée 🗑️', { icon: '🧼' });
  }

  function copyToClipboard() {
    const text = items.map((it) => `- ${it.checked ? '[x] ' : '[ ] '}${it.qty ?? ''} ${it.unit ?? ''} ${it.name}${it.recipe ? `  (${it.recipe})` : ''}`).join('\n');
    navigator.clipboard.writeText(text).then(() => toast.success('Liste copiée 📋'));
  }

  function downloadTxt() {
    const text = items.map((it) => `- ${it.qty ?? ''} ${it.unit ?? ''} ${it.name}${it.recipe ? `  (${it.recipe})` : ''}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'liste_courses.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Téléchargé ✔️');
  }

  // regroupement récapitulatif (nom + unité)
  const recap = React.useMemo(() => {
    const map = new Map<string, { qty: number; unit: string; recipes: Set<string> }>();
    for (const it of items) {
      const key = `${(it.name || '').toLowerCase()}|${(it.unit || '').toLowerCase()}`;
      if (!map.has(key)) map.set(key, { qty: 0, unit: it.unit || '', recipes: new Set() });
      const row = map.get(key)!;
      row.qty += Number(it.qty || 0);
      if (it.recipe) row.recipes.add(it.recipe);
    }
    return Array.from(map.entries()).map(([key, v]) => {
      const [name] = key.split('|');
      return { name, qty: v.qty, unit: v.unit, recipes: Array.from(v.recipes) };
    });
  }, [items]);

  return (
    <main className="stack" style={{ marginTop: 18 }}>
      <header className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="h1">Liste de courses</h1>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn ghost" onClick={copyToClipboard}>Copier</button>
          <button className="btn ghost" onClick={downloadTxt}>Télécharger .txt</button>
          <button className="btn danger" onClick={clear}>Vider</button>
        </div>
      </header>

      {/* Colonne gauche : à acheter */}
      <section className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <h3>À acheter</h3>
          <div className="stack" style={{ marginTop: 10 }}>
            {items.length === 0 && <p className="muted">Ta liste est vide.</p>}

            {items.map((it, i) => (
              <div key={i} className="row" style={{ alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <label className="row" style={{ gap: 8, alignItems: 'center', flex: 1 }}>
                  <input
                    type="checkbox"
                    checked={!!it.checked}
                    onChange={() => toggle(i)}
                    aria-label={`cocher ${it.name}`}
                  />
                  <span style={{ opacity: it.checked ? .5 : 1 }}>
                    <b>{it.qty ?? ''} {it.unit ?? ''}</b> {it.name}
                    {it.recipe && <span className="muted">  ({it.recipe})</span>}
                  </span>
                </label>

                <button className="btn ghost" onClick={() => remove(i)} aria-label="Supprimer">×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne droite : récap quantités cumulées */}
        <div className="card">
          <h3>Récap (quantités cumulées)</h3>
          <div className="stack" style={{ marginTop: 10 }}>
            {recap.length === 0 && <p className="muted">—</p>}
            {recap.map((r, i) => (
              <div key={i} className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <b>{r.qty || '—'} {r.unit}</b> {r.name}
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {r.recipes.join(' · ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

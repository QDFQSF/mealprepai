'use client';

import * as React from 'react';
import data from '@/data/recipes_full_v5.json';
import { favorites, shoppingList, toggleFavorite, type ListItem } from '@/lib/storage';
import SafeImage from "@/components/SafeImage";

type Params = { slug: string };

type Recipe = {
  slug: string;
  name: string;
  time?: number;
  budget?: 'eco' | 'normal' | 'plus' | string;
  type?: 'plat' | 'entree' | 'dessert' | 'soupe' | 'petit-dej' | string;
  origin?: string;
  difficulty?: 'facile' | 'moyen' | 'avance' | string;
  tags?: string[];
  image?: string;
  nutrition?: {
    calories: number;   // PAR PERSONNE
    proteines: number;  // g
    glucides: number;   // g
    lipides: number;    // g
  };
  servings?: number; // base personnes de référence (défaut 2)
  ingredients?: Array<string | { name: string; qty?: number; unit?: string }>;
  ingredientsQty?: Array<{ name: string; qty?: number; unit?: string }>;
  steps?: string[];
};

const all: Recipe[] = (data as any) as Recipe[];

/* ---------- Helpers ---------- */

function formatQty(n?: number) {
  if (n == null) return '';
  const rounded = Math.round(n * 10) / 10;
  const isInt = Math.abs(rounded - Math.round(rounded)) < 1e-6;
  return isInt ? String(Math.round(rounded)) : String(rounded);
}

// Ajoute des quantités par défaut si manquantes (ex: petits pois, farine, huile…)
function enrichQtyUnit(name: string, qty?: number, unit?: string) {
  const n = (name || '').toLowerCase().trim();
  let q = qty;
  let u = unit;

  // normalisation unités
  if (u) u = u.replace('c.a.s', 'c.à.s.').replace('cas', 'c.à.s.').trim();

  // quantités par défaut si non renseigné
  if (q == null || q === 0) {
    if (/\boignon(s)?\b/.test(n)) q = 1;
    else if (/\bail\b/.test(n)) { q = 1; u = u || 'gousse'; }
    else if (/\b(oeuf|œuf)\b/.test(n)) q = 2;
    else if (/\bavocat\b/.test(n)) q = 1;
    else if (/\bconcombre\b/.test(n)) q = 0.5;
    else if (/\btomate(s)?\b/.test(n)) q = 2;
    else if (/\bcitron\b/.test(n)) q = 0.5;
    else if (/\bpomme de terre\b/.test(n)) { q = 250; u = u || 'g'; }
    else if (/\b(courgette|aubergine|poivron|champignon|carotte)\b/.test(n)) q = 1;
    else if (/\b(petits?\s+pois|pois\s+chiches)\b/.test(n)) { q = 200; u = u || 'g'; }
    else if (/\b(riz|pates|pâtes|quinoa|boulgour|semoule|gnocchis|flocons d'avoine)\b/.test(n)) { q = 180; u = u || 'g'; }
    else if (/\b(poulet|boeuf|bœuf|saumon|poisson|crevettes|thon|tofu|filet mignon|steak|jambon|lardons)\b/.test(n)) { q = 250; u = u || 'g'; }
    else if (/\b(lait|bouillon|lait de coco|cr[èe]me|yaourt|pesto|sauce|soja|tomate( concass[ée]e)?)\b/.test(n)) { q = 200; u = u || 'ml'; }
    else if (/\b(fromage|parmesan|gruy[èe]re?|feta|beurre|chocolat|graines|noix|pignon|sucre|farine)\b/.test(n)) { q = 40; u = u || 'g'; }
    else if (/\bhuile\b/.test(n)) { q = 1; u = u || 'c.à.s.'; }
    else if (/\b(sel|poivre|cannelle|cumin|curry|paprika)\b/.test(n)) { q = 1; u = u || 'pincée'; }
  }

  // unité manquante
  if (!u) {
    if (/\b(lait|bouillon|lait de coco|cr[èe]me|yaourt|pesto|sauce|soja)\b/.test(n)) u = 'ml';
    else if (/\b(fromage|parmesan|gruy|feta|beurre|chocolat|graines|noix|farine|sucre|petits?\s+pois|pois\s+chiches)\b/.test(n)) u = 'g';
    else if (/\bhuile\b/.test(n)) u = 'c.à.s.';
  }

  return { qty: q, unit: u };
}

export default function RecipePage({ params }: { params: Promise<Params> | Params }) {
  // Next 15 : params peut être un Promise -> React.use()
  const p = React.use(params as any) as Params;
  const slug = p?.slug;

  const recipe = React.useMemo(() => all.find((r) => r.slug === slug), [slug]);

  const baseServings = recipe?.servings && recipe.servings > 0 ? recipe.servings : 2;
  const [servings, setServings] = React.useState<number>(baseServings);
  const [isFav, setIsFav] = React.useState(false);

  React.useEffect(() => { if (slug) setIsFav(favorites.has(slug)); }, [slug]);
  React.useEffect(() => { setServings(baseServings); }, [baseServings]);

  if (!recipe) return <div className="card" style={{ marginTop: 18 }}>Recette introuvable.</div>;

  // Ingrédients normalisés (avec valeurs par défaut si manquantes)
  const baseItems: ListItem[] = React.useMemo(() => {
    const src = Array.isArray(recipe.ingredientsQty) && recipe.ingredientsQty.length
      ? recipe.ingredientsQty
      : (recipe.ingredients || []).map((x: any) => typeof x === 'string' ? { name: x } : x);

    return src.map((i: any) => {
      const enriched = enrichQtyUnit(i.name, i.qty, i.unit);
      return { name: i.name, qty: enriched.qty, unit: enriched.unit, recipe: recipe.name };
    });
  }, [recipe]);

  // Mise à l’échelle selon personnes
  const scaledItems: ListItem[] = React.useMemo(() => {
    const factor = servings / baseServings;
    return baseItems.map((it) => ({
      ...it,
      qty: typeof it.qty === 'number' ? Number((it.qty * factor).toFixed(2)) : undefined,
    }));
  }, [baseItems, servings, baseServings]);

  // Étapes
  const steps: string[] = React.useMemo(() => {
    return recipe.steps && recipe.steps.length
      ? recipe.steps
      : ['Prépare les ingrédients.', 'Cuisson principale.', 'Assaisonne et lie si besoin.', 'Laisse reposer 1–2 min.', 'Dresse et sers.'];
  }, [recipe]);

  // Nutrition : par personne (référence) + total pour X personnes
  const per = recipe.nutrition;
  const total = per
    ? {
        calories: Math.round(per.calories * servings),
        proteines: Math.round(per.proteines * servings),
        glucides: Math.round(per.glucides * servings),
        lipides: Math.round(per.lipides * servings),
      }
    : null;

  function addToList() {
    if (scaledItems.length === 0) return;
    scaledItems.forEach((it) => shoppingList.add(it));
    alert('Ajouté à la liste de courses ✅');
  }

  function onToggleFav() {
    const now = toggleFavorite(slug);
    setIsFav(now);
  }

  function dec() { setServings((s) => Math.max(1, s - 1)); }
  function inc() { setServings((s) => Math.min(12, s + 1)); }

  return (
    <>
      {/* En-tête recette */}
      <section className="card" style={{ marginTop: 18 }}>
        {/* Image "safe" (placeholder + fade-in) */}
        <SafeImage src={recipe.image} alt={recipe.title} mode="hero" />

        <h1 className="h1" style={{ marginBottom: 6 }}>{recipe.name}</h1>

        {/* Métadonnées */}
        <div className="row muted" style={{ gap: 8, flexWrap: 'wrap' }}>
          {typeof recipe.time === 'number' && <span className="badge">{recipe.time} min</span>}
          {recipe.budget && <span className="badge">{recipe.budget}</span>}
          {recipe.type && <span className="badge">{recipe.type}</span>}
          {recipe.difficulty && <span className="badge">{recipe.difficulty}</span>}
          {recipe.origin && <span className="badge">{recipe.origin}</span>}
          {recipe.tags?.map((t) => (<span key={t} className="badge">{t}</span>))}
        </div>

        {/* Nutrition : par personne + total */}
        {per && (
          <div className="mt-12" style={{ color: 'rgba(232,237,247,0.9)', display: 'grid', gap: 6 }}>
            <div><b>Nutrition (par personne)</b> — {per.calories} kcal • P {per.proteines} g • G {per.glucides} g • L {per.lipides} g</div>
            <div className="muted">
              <b>Total pour {servings} personne(s)</b> — {total!.calories} kcal • P {total!.proteines} g • G {total!.glucides} g • L {total!.lipides} g
            </div>
          </div>
        )}

        <div className="row" style={{ gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <button className="btn" onClick={addToList}>Ajouter à la liste</button>
          <button className="btn ghost" onClick={onToggleFav}>{isFav ? '★ Favori' : '☆ Favori'}</button>
        </div>
      </section>

      {/* Deux colonnes : ingrédients / étapes */}
      <div className="columns" style={{ marginTop: 16 }}>
        {/* Ingrédients */}
        <section className="card">
          <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="h2">Ingrédients</div>

            {/* Sélecteur de personnes — version compacte & élégante */}
            <div
              className="row"
              style={{
                gap: 6,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '10px',
                padding: '4px 8px',
                alignItems: 'center',
              }}
            >
              <span className="muted" style={{ fontSize: '0.9rem' }}>Personnes :</span>
              <button className="btn ghost" onClick={dec} style={{ padding: '0 10px' }}>−</button>
              <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 600, color: '#fff', fontSize: '1rem' }}>
                {servings}
              </span>
              <button className="btn ghost" onClick={inc} style={{ padding: '0 10px' }}>+</button>
            </div>
          </div>

          <p className="muted" style={{ marginTop: 4 }}>
            Quantités ajustées depuis la base <b>{baseServings}</b> personne(s).
          </p>

          <ul className="clean-ul">
            {scaledItems.map((it, i) => (
              <li key={i} className="item">
                {(it.qty || it.unit) ? (
                  <span className="badge">
                    {it.qty != null ? `${formatQty(it.qty)} ` : ''}
                    {it.unit ?? ''}
                  </span>
                ) : <span className="badge">•</span>}
                <span>{it.name}</span>
              </li>
            ))}
            {scaledItems.length === 0 && <li className="muted">Aucun ingrédient renseigné.</li>}
          </ul>
        </section>

        {/* Étapes */}
        <section className="card">
          <div className="h2">Étapes</div>
          {steps.length ? (
            <ol className="clean-ul" style={{ paddingLeft: 4 }}>
              {steps.map((s, i) => (
                <li key={i} className="item">
                  <b style={{ width: 20 }}>{i + 1}.</b>
                  <span className="muted">{s}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">Pas d’étapes détaillées pour cette recette.</p>
          )}
        </section>
      </div>
    </>
  );
}

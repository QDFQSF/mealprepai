'use client';

import * as React from 'react';
import data from '@/data/recipes_full_v5.json';
import RecipeCard from '@/components/RecipeCard';
import { parseQuery, matchRecipes } from '@/lib/mealAI';

/* ======================== Types & données ======================== */
type Recipe = {
  slug: string;
  name: string;
  time?: number;
  budget?: string;
  tags?: string[];
  ingredients?: Array<string | { name: string; qty?: number; unit?: string }>;
  ingredientsQty?: Array<{ name: string; qty?: number; unit?: string }>;
};

const all: Recipe[] = (data as any) as Recipe[];

/* ======================== Helpers recherche ======================== */
function normalize(str: string) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’\-_/.,;:()]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function tokenize(input: string) {
  return normalize(input)
    .split(/[\s,;/|]+/)
    .filter((t) => t.length >= 2)
    .slice(0, 12);
}

// singularisation FR (ordre important)
function singularizeFr(word: string) {
  let w = word.trim().toLowerCase();
  if (w === 'œufs' || w === 'oeufs') return 'oeuf';
  if (w === 'pdt') return 'pomme de terre';
  if (/(eaux)$/.test(w)) return w.replace(/eaux$/, 'eau'); // gâteaux -> gateau
  if (/(aux)$/.test(w) && w.length > 3) return w.replace(/aux$/, 'al'); // journaux -> journal
  if (/(x)$/.test(w)) return w.slice(0, -1);
  if (/(s)$/.test(w)) return w.slice(0, -1); // "s" avant "es"
  if (/(es)$/.test(w)) return w.slice(0, -2);
  return w;
}
function expandTokens(tokens: string[]) {
  const set = new Set<string>();
  tokens.forEach((t) => {
    const n = t.trim().toLowerCase();
    if (!n) return;
    set.add(n);
    const s = singularizeFr(n);
    if (s && s !== n) set.add(s);
  });
  return Array.from(set);
}

// Intention depuis la phrase
type Intent = {
  sansGluten?: boolean;
  sansLactose?: boolean;
  maxTime?: number | null;
  wantedModes?: string[]; // ['Wok','Four','Poêle','Cru','Mixeur']
};
function extractIntent(q: string): Intent {
  const nq = normalize(q);
  const intent: Intent = { sansGluten: false, sansLactose: false, maxTime: null, wantedModes: [] };

  if (/\bsans\s+gluten\b/.test(nq)) intent.sansGluten = true;
  if (/\bsans\s+(lait|lactose)\b/.test(nq)) intent.sansLactose = true;

  const m = nq.match(/(?:en\s*)?(\d{1,2})\s*min\b/);
  if (m) intent.maxTime = parseInt(m[1], 10);

  if (/\bwok\b/.test(nq)) intent.wantedModes!.push('Wok');
  if (/\bfour\b/.test(nq)) intent.wantedModes!.push('Four');
  if (/\bpoele\b|\bpoêle\b/.test(nq)) intent.wantedModes!.push('Poêle');
  if (/\bcru\b/.test(nq)) intent.wantedModes!.push('Cru');
  if (/\bmixeur\b/.test(nq)) intent.wantedModes!.push('Mixeur');

  return intent;
}

// Texte ingrédients (noms uniquement)
function recipeTextIngredients(r: Recipe) {
  const names =
    r.ingredientsQty?.map((i) => i.name) ??
    (r.ingredients ?? []).map((x: any) => (typeof x === 'string' ? x : x?.name || ''));
  return normalize((names || []).join(' '));
}

// Lexique d’ingrédients global → permet d’identifier les mots “ingrédients” dans la requête
function buildIngredientLexicon(recipes: Recipe[]) {
  const set = new Set<string>();
  for (const r of recipes) {
    (r.ingredientsQty ?? []).forEach((i) => {
      const n = singularizeFr(i.name);
      if (n && n.length >= 3) set.add(normalize(n));
    });
    (r.ingredients ?? []).forEach((x: any) => {
      const n = singularizeFr(typeof x === 'string' ? x : x?.name || '');
      if (n && n.length >= 3) set.add(normalize(n));
    });
  }
  return set;
}

function scoreRecipe(r: Recipe, tokens: string[]) {
  if (!tokens.length) return 0;
  const name = normalize(r.name);
  const tagStr = normalize((r.tags || []).join(' '));
  const ingStr = recipeTextIngredients(r);
  let score = 0;
  for (const t of tokens) {
    if (name.includes(t)) score += 3;
    if (tagStr.includes(t)) score += 2;
    if (ingStr.includes(t)) score += 1;
  }
  return score;
}

function canonDietFromTags(tags: string[] = []) {
  const t = tags.map((x) => normalize(x));
  const has = (needle: string) => t.includes(normalize(needle));
  const out = new Set<string>();
  if (has('végétarien') || has('vegetarien') || has('vege') || has('veggie') || has('veg')) out.add('Végétarien');
  if (has('vegan') || has('végétalien') || has('vegetalien')) out.add('Vegan');
  if (has('sans gluten') || has('gluten free') || has('gluten-free') || has('sg')) out.add('Sans gluten');
  if (has('sans lactose') || has('lactose free') || has('lactose-free') || has('sl')) out.add('Sans lactose');
  return out;
}
function modesFromTags(tags: string[] = []) {
  const t = tags.map((x) => normalize(x));
  const out = new Set<string>();
  if (t.includes('four')) out.add('Four');
  if (t.includes('wok')) out.add('Wok');
  if (t.includes('poele') || t.includes('poêle')) out.add('Poêle');
  if (t.includes('cru')) out.add('Cru');
  if (t.includes('mixeur')) out.add('Mixeur');
  return out;
}
function hasHealthy(tags: string[] = []) {
  return tags.map((x) => normalize(x)).includes('healthy');
}

/* ======= Détection d'intention + activation IA ======= */
const VERBISH = ['je', 'j', 'veux', 'voudrais', 'cherche', 'trouve', 'propose', 'idee', 'idée', 'donne', 'fais', 'faire', 'manger', 'mange'];
const QUICK = ['rapide', 'vite', 'express', 'simple'];
const KID = ['enfant', 'fils', 'fille', 'kid', 'gamin', 'ado'];
const CHEAP = ['pas cher', 'eco', 'éco', 'economique', 'économique', 'budget'];
const HEALTHY = ['healthy', 'equilibre', 'équilibré', 'leger', 'léger', 'light'];
const METHODS = ['wok', 'poele', 'poêle', 'four', 'grill', 'cocotte', 'micro-onde', 'microonde'];
const BASES = ['riz', 'pates', 'pâtes', 'semoule', 'quinoa', 'boulgour', 'lentilles', 'pois chiche', 'poischiche', 'pois-chiche', 'pdt', 'pomme de terre', 'pommes de terre', 'oeuf', 'œuf', 'oeufs', 'œufs'];
const MEAT = ['viande', 'boeuf', 'bœuf', 'poulet', 'porc', 'dinde', 'agneau', 'lardon', 'jambon', 'saucisse'];
const DAIRY = ['lait', 'creme', 'crème', 'beurre', 'fromage', 'yaourt'];
const GLUTEN = ['gluten', 'ble', 'blé', 'farine'];

function containsAny(text: string, words: string[]) {
  return words.some((w) => text.includes(w));
}
function hasNegationFor(tokens: string[], vocab: string[]) {
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const n1 = tokens[i + 1] || '';
    const n2 = tokens[i + 2] || '';
    if (t === 'sans' && vocab.includes(n1)) return true;
    if (t === 'pas' && (n1 === 'de' || n1 === 'd') && vocab.includes(n2)) return true;
  }
  return false;
}
function shouldActivateAI(qRaw: string, recipes: Recipe[]) {
  const q = normalize(qRaw);
  const tokens = q.split(' ').filter(Boolean);
  const hasVerb = containsAny(q, VERBISH);
  const hasFoodish =
    containsAny(q, QUICK) ||
    containsAny(q, KID) ||
    containsAny(q, CHEAP) ||
    containsAny(q, HEALTHY) ||
    containsAny(q, METHODS) ||
    containsAny(q, BASES) ||
    hasNegationFor(tokens, MEAT) ||
    hasNegationFor(tokens, DAIRY) ||
    hasNegationFor(tokens, GLUTEN);

  const looksLikeExactTitle =
    recipes.length > 0 && q.length >= 4 && recipes.some((r) => normalize(r.name) === q);

  return hasVerb || hasFoodish || (!looksLikeExactTitle && tokens.length >= 2);
}

/* ======================== Page ======================== */
export default function HomePage() {
  const [q, setQ] = React.useState('');
  const [time, setTime] = React.useState<'Peu importe' | '15' | '20' | '30'>('Peu importe');
  const [budget, setBudget] = React.useState<string>('Tous');
  const [diet, setDiet] = React.useState<string>('Tous');
  const [mode, setMode] = React.useState<string>('Tous');
  const [healthyOnly, setHealthyOnly] = React.useState<boolean>(false);

  // IA
  const [aiMode, setAiMode] = React.useState<boolean>(false);
  const [aiResults, setAiResults] = React.useState<Recipe[]>([]);
  const [aiActiveBanner, setAiActiveBanner] = React.useState<boolean>(false);

  const tokens = React.useMemo(() => expandTokens(tokenize(q)), [q]);

  // Lexique ingrédients + ingrédients demandés dans la phrase
  const ING_LEX = React.useMemo(() => buildIngredientLexicon(all), []);
  const wantedIngs = React.useMemo(
    () => tokens.filter((t) => ING_LEX.has(t)),
    [tokens, ING_LEX]
  );

  // listes dynamiques
  const budgets = React.useMemo(() => {
    const values = new Set<string>();
    for (const r of all) if (r.budget && r.budget.trim()) values.add(r.budget.trim());
    const sorted = Array.from(values).sort((a, b) => a.localeCompare(b, 'fr'));
    return ['Tous', ...sorted];
  }, []);
  const dietsList = React.useMemo(() => {
    const set = new Set<string>();
    for (const r of all) for (const d of canonDietFromTags(r.tags)) set.add(d);
    return ['Tous', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'))];
  }, []);
  const modesList = React.useMemo(() => {
    const set = new Set<string>();
    for (const r of all) for (const m of modesFromTags(r.tags)) set.add(m);
    return ['Tous', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'))];
  }, []);

  /* -------- Détection + exécution "mode IA" -------- */
  React.useEffect(() => {
    const wantAI = shouldActivateAI(q, all);
    if (!wantAI) {
      setAiMode(false);
      setAiResults([]);
      setAiActiveBanner(false);
      return;
    }

    setAiMode(true);

    // ✅ Appel direct aux fonctions importées (plus de require)
    try {
      const intent = parseQuery(q, all);
      const results: Recipe[] = matchRecipes(all, intent, 3);
      setAiResults(results);
      setAiActiveBanner(results.length > 0);
      return;
    } catch {
      // si jamais la lib crashe, on retombera sur le petit fallback local plus bas
    }

    // --- Fallback local “intelligent” ---
    const nq = normalize(q);
    const tks = tokenize(q);

    const quick = containsAny(nq, QUICK) || /(15|20|30)\s*min/.test(nq);
    const kid = containsAny(nq, KID);
    const cheap = containsAny(nq, CHEAP);
    const healthy = containsAny(nq, HEALTHY);

    const methods = METHODS.filter((m) => nq.includes(m));
    const bases = BASES.filter((b) => nq.includes(b));

    const noMeat = hasNegationFor(nq.split(' '), MEAT) || nq.includes('sans viande') || nq.includes('vegetarien') || nq.includes('végétarien');
    const noDairy = hasNegationFor(nq.split(' '), DAIRY) || nq.includes('sans lactose') || nq.includes('sans lait');
    const noGluten = hasNegationFor(nq.split(' '), GLUTEN) || nq.includes('sans gluten');

    const arr = all
      .map((r) => {
        let s = scoreRecipe(r, tks);
        const title = normalize(r.name);
        const tags = normalize((r.tags || []).join(' '));
        const ing = recipeTextIngredients(r);

        for (const b of bases) if (title.includes(b) || tags.includes(b) || ing.includes(b)) s += 3;
        for (const m of methods) if (tags.includes(m)) s += 2;

        if (quick) {
          const t = r.time ?? 999;
          if (t <= 25) s += 3; else s -= 1;
        }
        if (kid && (tags.includes('enfant') || tags.includes('kid'))) s += 2;
        if (cheap && (tags.includes('eco') || tags.includes('pas cher') || (r.budget && normalize(r.budget).includes('eco')))) s += 2;
        if (healthy && tags.includes('healthy')) s += 2;

        const diets = canonDietFromTags(r.tags);
        if (noMeat) s += diets.has('Végétarien') || diets.has('Vegan') ? 3 : -2;
        if (noDairy) s += tags.includes('sans lactose') || diets.has('Vegan') ? 3 : -2;
        if (noGluten) s += diets.has('Sans gluten') ? 3 : -2;

        // si user a demandé des ingrédients précis, bonus si présents
        if (wantedIngs.length > 0 && wantedIngs.every((w) => ing.includes(w))) s += 4;

        return { r, s };
      })
      .filter(({ s }) => s > -1)
      .sort((a, b) => b.s - a.s)
      .slice(0, 3)
      .map(({ r }) => r);

    setAiResults(arr);
    setAiActiveBanner(arr.length > 0);
  }, [q, wantedIngs]);

  /* -------- Résultats (IA prioritaire + contraintes “dures”) -------- */
  const results = React.useMemo(() => {
    const intent = extractIntent(q);

    // 1) IA si dispo
    if (aiMode && aiResults.length > 0) return aiResults;

    // 2) Classique + contraintes issues de la phrase
    const hasAnyFilter =
      tokens.length > 0 ||
      budget !== 'Tous' ||
      diet !== 'Tous' ||
      time !== 'Peu importe' ||
      mode !== 'Tous' ||
      healthyOnly ||
      intent.sansGluten ||
      intent.sansLactose ||
      intent.maxTime != null ||
      (intent.wantedModes?.length ?? 0) > 0 ||
      wantedIngs.length > 0;

    if (!hasAnyFilter) return [];

    const arr = all
      .map((r) => ({ r, s: scoreRecipe(r, tokens) }))
      .filter(({ r, s }) => {
        // Filtres UI existants
        if (budget !== 'Tous' && (r.budget || '').toLowerCase() !== budget.toLowerCase()) return false;
        if (diet !== 'Tous' && !canonDietFromTags(r.tags).has(diet)) return false;
        if (mode !== 'Tous' && !modesFromTags(r.tags).has(mode)) return false;
        if (healthyOnly && !hasHealthy(r.tags)) return false;
        if (time !== 'Peu importe') {
          const t = parseInt(time, 10);
          if (isFinite(t) && (r.time ?? 999) > t) return false;
        }

        // Contraintes dures issues de la phrase
        if (intent.sansGluten && !canonDietFromTags(r.tags).has('Sans gluten')) return false;
        if (intent.sansLactose && !canonDietFromTags(r.tags).has('Sans lactose')) return false;
        if (intent.maxTime != null && (r.time ?? 999) > intent.maxTime) return false;
        if ((intent.wantedModes?.length ?? 0) > 0) {
          const rModes = modesFromTags(r.tags);
          for (const m of intent.wantedModes!) if (!rModes.has(m)) return false;
        }
        if (wantedIngs.length > 0) {
          const ingText = recipeTextIngredients(r);
          if (!wantedIngs.every((w) => ingText.includes(w))) return false;
        }

        // si pas de tokens → ok ; sinon demande un match minimal
        return tokens.length === 0 ? true : s > 0;
      })
      .sort((a, b) => b.s - a.s)
      .map(({ r }) => r);

    // 3) IA active mais vide → top 3 classiques
    if (aiMode && arr.length > 0) return arr.slice(0, 3);

    return arr;
  }, [q, tokens, budget, diet, mode, healthyOnly, time, aiMode, aiResults, wantedIngs]);

  const Pill: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <button type="button" className={`pill ${active ? 'pill--active' : ''}`} onClick={onClick} aria-pressed={active}>
      {label}
    </button>
  );

  function clearAll() {
    setQ('');
    setTime('Peu importe');
    setBudget('Tous');
    setDiet('Tous');
    setMode('Tous');
    setHealthyOnly(false);
    setAiMode(false);
    setAiResults([]);
    setAiActiveBanner(false);
  }

  return (
    <>
      <div className="search-wrap">
        <section className="card stack search-panel" style={{ marginTop: 18 }}>
          <h1 className="h1">Qu’est-ce qu’on mange ?</h1>

          <input
            className="input"
            style={{ flex: 1 }}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ex : wok rapide avec thon et poivron • ‘pâtes sans gluten en 20 min’"
            aria-label="Tape tes envies ou ingrédients"
          />

          {q && (
            <p className="muted" style={{ marginTop: 6 }}>
              <small>Ingrédients détectés : {wantedIngs.join(', ') || '—'}</small>
            </p>
          )}

          {aiActiveBanner && (
            <p className="muted ai-hint" style={{ marginTop: 8 }}>
              🤖 Mode IA activé — je cherche les plats qui correspondent à ta phrase !
            </p>
          )}

          {!aiMode && (
            <>
              <div className="row" style={{ gap: 12, marginTop: 12 }}>
                <select
                  className="select"
                  value={time}
                  onChange={(e) => setTime(e.target.value as typeof time)}
                  aria-label="Temps maximum"
                >
                  <option value="Peu importe">Temps</option>
                  <option value="15">≤ 15 min</option>
                  <option value="20">≤ 20 min</option>
                  <option value="30">≤ 30 min</option>
                </select>
              </div>

              <div className="stack" style={{ marginTop: 12 }}>
                <label className="muted" style={{ marginBottom: 6 }}>Budget</label>
                <div className="pills">
                  {budgets.map((b) => (
                    <Pill key={b} label={b} active={budget === b} onClick={() => setBudget(b)} />
                  ))}
                </div>
              </div>

              <div className="stack" style={{ marginTop: 8 }}>
                <label className="muted" style={{ marginBottom: 6 }}>Régime</label>
                <div className="pills">
                  {dietsList.map((d) => (
                    <Pill key={d} label={d} active={diet === d} onClick={() => setDiet(d)} />
                  ))}
                </div>
              </div>

              <div className="stack" style={{ marginTop: 8 }}>
                <label className="muted" style={{ marginBottom: 6 }}>Mode de cuisson</label>
                <div className="pills">
                  {modesList.map((m) => (
                    <Pill key={m} label={m} active={mode === m} onClick={() => setMode(m)} />
                  ))}
                </div>
              </div>

              <div className="row" style={{ marginTop: 10, alignItems: 'center', gap: 10 }}>
                <label className="row" style={{ gap: 8, alignItems: 'center' }}>
                  <input type="checkbox" checked={healthyOnly} onChange={(e) => setHealthyOnly(e.target.checked)} />
                  <span>Healthy seulement</span>
                </label>

                <div style={{ flex: 1 }} />
                <button className="btn ghost" onClick={clearAll}>Effacer tout</button>
              </div>
            </>
          )}
        </section>
      </div>
 
      <section className="stack results-list" style={{ marginTop: 18 }}>
        {results.length === 0 ? (
          <div className="card">
            <p className="muted">Aucune idée trouvée. Essaie une autre phrase ou ajoute des ingrédients.</p>
          </div>
        ) : (
          results.map((r) => <RecipeCard key={r.slug} r={r as any} />)
        )}
      </section>
    </>
  );
}

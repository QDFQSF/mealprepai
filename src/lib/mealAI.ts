/* src/lib/mealAI.ts */

export type Recipe = {
  slug: string;
  name: string;
  time?: number;
  budget?: string;
  tags?: string[];
  ingredients?: Array<string | { name: string; qty?: number; unit?: string }>;
  ingredientsQty?: Array<{ name: string; qty?: number; unit?: string }>;
};

export type MealIntent = {
  // contraintes dures
  sansGluten?: boolean;
  sansLactose?: boolean;
  vegetarian?: boolean;
  vegan?: boolean;
  maxTime?: number | null;
  wantedModes?: string[]; // ['Wok','Four','Poêle','Cru','Mixeur']
  // ingrédients (tous requis)
  wantedIngredients?: string[];
  // préférences souples
  cheap?: boolean;
  healthy?: boolean;
  kid?: boolean;
  quick?: boolean;
};

/* ================= Helpers communs ================= */

const normalize = (str: string) =>
  (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’\-_/.,;:()]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (s: string) => normalize(s).split(/[\s,;/|]+/).filter(Boolean);

function singularizeFr(word: string) {
  let w = word.trim().toLowerCase();
  if (w === 'œufs' || w === 'oeufs') return 'oeuf';
  if (w === 'pdt') return 'pomme de terre';
  if (/(eaux)$/.test(w)) return w.replace(/eaux$/, 'eau');
  if (/(aux)$/.test(w) && w.length > 3) return w.replace(/aux$/, 'al');
  if (/(x)$/.test(w)) return w.slice(0, -1);
  if (/(s)$/.test(w)) return w.slice(0, -1); // “s” avant “es”
  if (/(es)$/.test(w)) return w.slice(0, -2);
  return w;
}

const QUICK = ['rapide', 'vite', 'express', 'simple'];
const KID = ['enfant', 'fils', 'fille', 'kid', 'gamin', 'ado'];
const CHEAP = ['pas cher', 'eco', 'éco', 'economique', 'économique', 'budget'];
const HEALTHY = ['healthy', 'equilibre', 'équilibré', 'leger', 'léger', 'light'];
const METHODS = ['wok', 'poele', 'poêle', 'four', 'cru', 'mixeur'];
const MEAT = ['viande', 'boeuf', 'bœuf', 'poulet', 'porc', 'dinde', 'agneau', 'lardon', 'jambon', 'saucisse'];
const DAIRY = ['lait', 'creme', 'crème', 'beurre', 'fromage', 'yaourt'];
const GLUTEN = ['gluten', 'ble', 'blé', 'farine'];

const containsAny = (text: string, words: string[]) => words.some((w) => text.includes(w));

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

export function recipeTextIngredients(r: Recipe) {
  const names =
    r.ingredientsQty?.map((i) => i.name) ??
    (r.ingredients ?? []).map((x: any) => (typeof x === 'string' ? x : x?.name || ''));
  return normalize((names || []).join(' '));
}

export function buildIngredientLexicon(recipes: Recipe[]) {
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

export function canonDietFromTags(tags: string[] = []) {
  const t = tags.map((x) => normalize(x));
  const has = (needle: string) => t.includes(normalize(needle));
  const out = new Set<string>();
  if (has('végétarien') || has('vegetarien') || has('vege') || has('veggie') || has('veg')) out.add('Végétarien');
  if (has('vegan') || has('végétalien') || has('vegetalien')) out.add('Vegan');
  if (has('sans gluten') || has('gluten free') || has('gluten-free') || has('sg')) out.add('Sans gluten');
  if (has('sans lactose') || has('lactose free') || has('lactose-free') || has('sl')) out.add('Sans lactose');
  return out;
}

export function modesFromTags(tags: string[] = []) {
  const t = tags.map((x) => normalize(x));
  const out = new Set<string>();
  if (t.includes('four')) out.add('Four');
  if (t.includes('wok')) out.add('Wok');
  if (t.includes('poele') || t.includes('poêle')) out.add('Poêle');
  if (t.includes('cru')) out.add('Cru');
  if (t.includes('mixeur')) out.add('Mixeur');
  return out;
}

export const hasHealthy = (tags: string[] = []) => tags.map((x) => normalize(x)).includes('healthy');

export function scoreRecipe(r: Recipe, tokens: string[]) {
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

// --- parseQuery V3 : exclusions robustes + modes/contraintes ---
export function parseQuery(raw: string) {
  const q = raw.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, " ");
  const cleaned = q.replace(/[^a-z0-9àâäçéèêëîïôöùûüÿ\s\-']/gi, " ");

  // listes rapides
  const NEG_MARKERS = [
    "sans", "pas de", "pas d", "eviter", "éviter", "no",
    "sans lait", "sans lactose"
  ];
  const MODE_WORDS = {
    four: ["four", "au four", "gratin"],
    wok: ["wok"],
    poele: ["poele", "poêle", "sauté", "sauter"],
    mixeur: ["mixeur", "mixé", "velouté"],
    cru: ["cru", "poke", "tartare", "carpaccio"]
  };
  const BUDGET_WORDS = { eco: ["eco", "éco", "pas cher"], normal: ["normal"], plus: ["plus", "premium"] };

  // time: “en 20 min” / “20 minutes” / “< 25 min”
  let maxTime: number | undefined;
  const tmatch = cleaned.match(/(?:en|≤|<|max)\s*(\d{1,3})\s*(?:min|minutes)?/);
  if (tmatch) maxTime = parseInt(tmatch[1], 10);

  // exclusions “sans X …” (supporte pluriels, composés, et plusieurs occurrences)
  const excluded: string[] = [];
  const withoutRegex = /\b(?:sans|pas de|pas d')\s+([a-zàâäçéèêëîïôöùûüÿ\- ]{2,})\b/gi;
  let m: RegExpExecArray | null;
  while ((m = withoutRegex.exec(cleaned))) {
    const phrase = m[1]
      .replace(/\bet\b.*$/, "") // coupe après “et …” (ex: sans lait et fromage)
      .replace(/[,.;].*$/, "")  // coupe à la première ponctuation
      .trim();
    phrase
      .split(/\s+et\s+|,/)
      .map(s => s.trim())
      .filter(Boolean)
      .forEach(s => excluded.push(s));
  }

  // ingrédients/mots-clés positifs bruts (on retirera ensuite les exclus)
  const tokens = cleaned
    .replace(/\b(sans|pas de|pas d')\b.+/g, "") // évite de re-détecter les exclus en positif
    .split(/\s+/)
    .filter(Boolean);

  const positives: string[] = [];
  for (const tok of tokens) {
    // évite les marqueurs génériques
    if (["un", "une", "des", "de", "du", "avec", "pour", "plat"].includes(tok)) continue;
    positives.push(tok);
  }

  // normalisation exclusions (singulier basique)
  const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
  const singular = (w: string) => w.replace(/s\b/g, ""); // rapide mais efficace pour nos cas

  const exclSet = new Set<string>(
    excluded.flatMap(x => [norm(x), singular(norm(x))])
  );

  // retire des positifs tout mot exclu
  const positivesFiltered = positives.filter(p => !exclSet.has(norm(p)) && !exclSet.has(singular(norm(p))));

  // détection régimes
  const isGF = /\b(sans\s+gluten)\b/.test(cleaned);
  const isDF = /\b(sans\s+lactose|sans\s+lait)\b/.test(cleaned);
  const vegetarian = /\b(végétarien|vegetarien)\b/.test(cleaned);

  // modes
  const modes: string[] = [];
  (Object.entries(MODE_WORDS) as Array<[keyof typeof MODE_WORDS, string[]]>).forEach(([mode, arr]) => {
    if (arr.some(w => cleaned.includes(w))) modes.push(mode);
  });

  // budget
  let budget: "eco" | "normal" | "plus" | undefined;
  (Object.entries(BUDGET_WORDS) as Array<[typeof budget, string[]]>).forEach(([b, arr]) => {
    if (arr.some(w => cleaned.includes(w))) budget = b;
  });

  return {
    positives: positivesFiltered,       // mots-clés/ingrédients positifs
    excluded: Array.from(exclSet),      // exclusions normalisées
    isGF,
    isDF,
    vegetarian,
    modes,                              // ["four", "wok", "poele", "mixeur", "cru"]
    budget,
    maxTime
  };
}


// --- matchRecipes V3 : score souple + exclusions réelles ---
export function matchRecipes(recipes: Recipe[], query: ReturnType<typeof parseQuery>) {
  const {
    positives, excluded, isGF, isDF, vegetarian, modes, budget, maxTime
  } = query;

  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const singular = (w: string) => w.replace(/s\b/g, "");

  const hasWord = (hay: string, needle: string) =>
    hay.includes(needle) || hay.includes(singular(needle));

  // ✅ fonction d’agrégation texte recette (titre + tags + ingrédients)
  const recipeText = (r: Recipe) => {
    const title = norm(r.name);
    const tags = norm((r.tags || []).join(" "));
    const ings = norm((r.ingredientsQty ?? []).map(i => i.name).join(" "));
    return `${title} ${tags} ${ings}`;
  };

  // préfiltrage dur (régimes + temps + budget + exclusions)
  const hardFiltered = recipes.filter(r => {
    // régimes
    if (vegetarian && (r.tags || []).some(t => norm(t) === "viande" || norm(t) === "poulet" || norm(t) === "boeuf" || norm(t) === "poisson")) {
      // NB: si tu veux un végétarien strict, gère un tag “végétarien” sur les recettes veg.
      return false;
    }
    if (isGF && !(r.tags || []).some(t => norm(t) === "sans gluten")) return false;
    if (isDF && (r.tags || []).some(t => ["lait", "lactose", "fromage", "beurre", "crème"].includes(norm(t)))) return false;

    // temps
    if (maxTime && r.time && r.time > maxTime) return false;

    // budget
    if (budget && r.budget && norm(r.budget) !== budget) return false;

    // exclusions par ingrédients (strict)
    if (excluded.length) {
      const txt = recipeText(r);
      for (const x of excluded) {
        if (hasWord(txt, norm(x))) return false;
      }
    }
    return true;
  });

  // scoring souple
  const scored = hardFiltered.map(r => {
    const txt = recipeText(r);

    let score = 0;

    // ingrédients/mots positifs : +3 par hit (mais on ne demande pas 100% des mots)
    let hits = 0;
    for (const p of positives) {
      if (hasWord(txt, norm(p))) {
        hits += 1;
        score += 3;
      }
    }

    // modes demandés → +2 chacun si présent dans tags
    if (modes.length) {
      const tset = new Set((r.tags || []).map(t => norm(t)));
      if (modes.includes("four") && (tset.has("four") || tset.has("gratin"))) score += 2;
      if (modes.includes("wok") && tset.has("wok")) score += 2;
      if (modes.includes("poele") && (tset.has("poele") || tset.has("poêle") || tset.has("sauté"))) score += 2;
      if (modes.includes("mixeur") && tset.has("mixeur")) score += 2;
      if (modes.includes("cru") && tset.has("cru")) score += 2;
    }

    // rapides (si maxTime faible) → bonus léger
    if (maxTime && r.time && r.time <= maxTime) score += 1;

    return { r, score, hits, need: positives.length };
  })
  // seuil souple : au moins 60% de hits OU ≥2 hits si >2 mots, OU ≥1 hit sinon
  .filter(({ hits, need }) => {
    if (need >= 3) return hits >= Math.max(2, Math.ceil(need * 0.6));
    if (need === 2) return hits >= 1;      // tolérant
    return hits >= 1 || need === 0;        // si pas de mot, on tolère
  })
  .sort((a, b) => b.score - a.score)
  .map(x => x.r);

  return scored.slice(0, 12);
}


/* ================= Facilité d’usage côté UI ================= */

export function shouldActivateAI(q: string, recipes: Recipe[]): boolean {
  const nq = normalize(q);
  const tokens = tokenize(q);

  const looksLikeExactTitle =
    recipes.length > 0 && nq.length >= 4 && recipes.some((r) => normalize(r.name) === nq);

  const hasFoodish =
    containsAny(nq, QUICK) ||
    containsAny(nq, KID) ||
    containsAny(nq, CHEAP) ||
    containsAny(nq, HEALTHY) ||
    containsAny(nq, METHODS) ||
    hasNegationFor(tokens, MEAT) ||
    hasNegationFor(tokens, DAIRY) ||
    hasNegationFor(tokens, GLUTEN);

  const hasVerbish = /\b(je|j|veux|voudrais|cherche|trouve|propose|id(ee|é)e|donne|fais|faire|manger|mange)\b/.test(nq);

  return hasVerbish || hasFoodish || (!looksLikeExactTitle && tokens.length >= 2);
}

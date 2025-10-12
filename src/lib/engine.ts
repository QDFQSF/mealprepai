import type { Recipe } from "./types";

/** Supprime accents, caractères spéciaux, met en minuscule, map œ/æ -> oe */
function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/œ|æ/g, "oe")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // accents
    .replace(/[^\p{L}\p{N}\s-]/gu, " ") // garde lettres/chiffres/espaces/tirets
    .replace(/\s+/g, " ")
    .trim();
}

/** Retour à une forme de base : synonymes + singulier approximatif */
function baseForm(s: string) {
  const n = normalize(s);

  // Dictionnaire de synonymes usuels (tu peux l’agrandir au fil du temps)
  const dict: Record<string, string> = {
    "pates": "pate",
    "pate": "pate",
    "pates alimentaires": "pate",

    "oeuf": "oeuf",
    "oeufs": "oeuf",

    "pommes de terre": "pomme de terre",
    "pomme de terre": "pomme de terre",
    "patate": "pomme de terre",
    "patates": "pomme de terre",

    "tomates": "tomate",
    "courgettes": "courgette",
    "poivrons": "poivron",
    "oignons": "oignon",
    "ail": "ail",

    "mozzarella": "mozzarella",
    "fromage rape": "fromage rape",
    "fromage râpe": "fromage rape",
  };

  if (dict[n]) return dict[n];

  // Simplissime singularisation (évite de couper les petits mots)
  if (n.length > 3 && n.endsWith("s")) return n.slice(0, -1);

  return n;
}

/** Distance d’édition (Levenshtein) – petite tolérance aux fautes */
function lev(a: string, b: string) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

/** Deux tokens “matchent” s’ils sont proches */
function tokenMatch(a: string, b: string) {
  const A = baseForm(a);
  const B = baseForm(b);
  if (A === B) return true;
  // inclusions (ex: "pate" ~ "pate fraiche")
  if (A.length > 3 && (B.includes(A) || A.includes(B))) return true;
  // 1 faute autorisée (ex: "patess" ~ "pates")
  if (lev(A, B) <= 1) return true;
  return false;
}

/** Score = nb d'ingrédients de la recette trouvés dans la saisie */
export function scoreRecipe(userItems: string[], recipe: Recipe) {
  const user = userItems.map(baseForm).filter(Boolean);
  if (user.length === 0) return 0;

  let got = 0;
  for (const ing of recipe.ingredients) {
    const ingBase = baseForm(ing);
    if (user.some(u => tokenMatch(u, ingBase))) got++;
  }
  return got / Math.max(1, recipe.ingredients.length);
}

/** Suggestions avec filtres */
export function suggest(
  recipes: Recipe[],
  userItems: string[],
  opts?: { minScore?: number; limit?: number; maxTime?: number; tags?: string[] }
) {
  const { minScore = 0.3, limit = 6, maxTime, tags } = opts || {};
  let list = recipes
    .map(r => ({ r, s: scoreRecipe(userItems, r) }))
    .filter(({ s }) => s >= minScore);

  if (maxTime) list = list.filter(({ r }) => r.time <= maxTime);

  if (tags?.length) {
    const tset = new Set(tags.map(baseForm));
    list = list.filter(({ r }) => (r.tags || []).some(t => tset.has(baseForm(t))));
  }

  list.sort((a, b) => b.s - a.s || a.r.time - b.r.time);
  return list.slice(0, limit).map(x => x.r);
}

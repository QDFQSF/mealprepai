import type { Recipe } from "./types";

/** clé locale */
const KEY = "mealprep.daily";

/** renvoie YYYY-MM-DD */
function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

/** petit hash déterministe pour piocher toujours la même recette pour un seed */
function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Charge la recette du jour depuis localStorage si elle correspond à la date du jour */
function loadDaily(): { date: string; slug: string } | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (obj && obj.date === todayStr() && typeof obj.slug === "string") return obj;
  } catch {}
  return null;
}

/** Sauvegarde la recette du jour */
function saveDaily(slug: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ date: todayStr(), slug }));
  } catch {}
}

/** Choisit la recette du jour de manière déterministe si possible */
export function getDailyRecipe(recipes: Recipe[]): Recipe | null {
  // 1) si l’utilisateur a déjà une recette pour aujourd’hui
  const saved = loadDaily();
  if (saved) {
    const r = recipes.find((x) => x.slug === saved.slug);
    if (r) return r;
  }

  // 2) choix déterministe: seed = date du jour
  const seed = todayStr();
  if (!recipes.length) return null;
  const idx = hash(seed) % recipes.length;
  const picked = recipes[idx];
  // on persiste pour la journée
  saveDaily(picked.slug);
  return picked;
}

/** Reroll manuel (remplace la recette du jour pour aujourd’hui) */
export function rerollDaily(recipes: Recipe[]): Recipe | null {
  if (!recipes.length) return null;
  const current = getDailyRecipe(recipes);
  // on essaie de prendre une autre
  let idx = Math.floor(Math.random() * recipes.length);
  const guard = 10;
  let tries = 0;
  while (current && recipes[idx].slug === current.slug && tries < guard) {
    idx = Math.floor(Math.random() * recipes.length);
    tries++;
  }
  const picked = recipes[idx];
  saveDaily(picked.slug);
  return picked;
}

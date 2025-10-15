"use client";

// --- SHOPPING LIST ---
const KEY_LIST = "mealprep_list";
const KEY_FAVS = "mealprep_favs";

export type ListItem = {
  name: string;
  qty?: number;
  unit?: string;
  recipe?: string;
  checked?: boolean;
};

// ✅ Récupérer la liste complète
function get() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY_LIST) || "[]");
  } catch {
    return [];
  }
}

// ✅ Enregistrer une nouvelle liste
function set(list: ListItem[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY_LIST, JSON.stringify(list));
  }
}

// ✅ Ajouter un seul ingrédient
function add(item: ListItem) {
  const list = get();
  list.push(item);
  set(list);
}

// ✅ Ajouter plusieurs ingrédients à la fois (nouvelle fonction)
function addMany(items: ListItem[]) {
  const list = get();
  const newList = [...list, ...items];
  set(newList);
}

// ✅ Supprimer toute la liste
function clear() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(KEY_LIST);
  }
}

// ✅ Cocher / décocher un ingrédient
function toggleCheck(index: number) {
  const list = get();
  if (list[index]) {
    list[index].checked = !list[index].checked;
    set(list);
  }
}

export const shoppingList = {
  get,
  set,
  add,
  addMany, // 👈 ajouté ici
  clear,
  toggleCheck,
};

// --- FAVORIS ---
function getFavs() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY_FAVS) || "[]");
  } catch {
    return [];
  }
}

function setFavs(favs: string[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY_FAVS, JSON.stringify(favs));
  }
}

function has(slug: string) {
  return getFavs().includes(slug);
}

function toggle(slug: string) {
  const favs = getFavs();
  const updated = has(slug)
    ? favs.filter((f) => f !== slug)
    : [...favs, slug];
  setFavs(updated);
}

function clearFavs() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(KEY_FAVS);
  }
}

export const favorites = {
  get: getFavs,
  has,
  toggle,
  clear: clearFavs,
};

// ✅ Fonction compatible avec les anciens imports
export function toggleFavorite(slug: string) {
  favorites.toggle(slug);
}

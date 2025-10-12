const FAVORITES_KEY = "mpai:favs";
const PANTRY_KEY = "mpai:pantry";
const LIST_KEY = "mpai:list";

export const storage = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const v = window.localStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : fallback;
    } catch { return fallback; }
  },
  set<T>(key: string, value: T) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  },
};

export const favorites = {
  all(): string[] { return storage.get<string[]>(FAVORITES_KEY, []); },
  has(slug: string) { return favorites.all().includes(slug); },
  toggle(slug: string) {
    const f = new Set(favorites.all());
    f.has(slug) ? f.delete(slug) : f.add(slug);
    storage.set(FAVORITES_KEY, Array.from(f));
  },
};

export const pantry = {
  get(): string[] { return storage.get<string[]>(PANTRY_KEY, []); },
  set(items: string[]) { storage.set(PANTRY_KEY, items); },
};

export const shoplist = {
  get(): string[] { return storage.get<string[]>(LIST_KEY, []); },
  add(items: string[]) {
    const s = new Set(shoplist.get());
    items.forEach(i => s.add(i));
    storage.set(LIST_KEY, Array.from(s));
  },
  remove(item: string) {
    const s = new Set(shoplist.get()); s.delete(item);
    storage.set(LIST_KEY, Array.from(s));
  },
  clear() { storage.set(LIST_KEY, []); },
};

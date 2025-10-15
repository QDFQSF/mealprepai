"use client";
import { useLocalStorage } from "./useLocalStorage";

export default function FavoriteButton({ slug }: { slug: string }) {
  const [favs, setFavs] = useLocalStorage<string[]>("favorites", []);
  const isFav = favs.includes(slug);

  return (
    <button
      onClick={() =>
        setFavs(isFav ? favs.filter(s => s !== slug) : [...favs, slug])
      }
      className={`px-3 py-2 rounded border ${isFav ? "bg-yellow-200" : "bg-white"}`}
      title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      {isFav ? "★ Favori" : "☆ Favori"}
    </button>
  );
}

"use client";
import Link from "next/link";
import { ShoppingCart, Heart, Home } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link href="/" className="font-semibold text-lg">MealPrepAI</Link>
        <nav className="ml-auto flex items-center gap-4 text-sm">
          <Link href="/" className="hover:underline flex items-center gap-1"><Home size={16}/> Accueil</Link>
          <Link href="/favoris" className="hover:underline flex items-center gap-1"><Heart size={16}/> Favoris</Link>
          <Link href="/liste" className="hover:underline flex items-center gap-1"><ShoppingCart size={16}/> Liste</Link>
        </nav>
      </div>
    </header>
  );
}

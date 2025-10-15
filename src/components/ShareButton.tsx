"use client";

export default function ShareButton({ title }: { title: string }) {
  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert("Lien copié !");
    }
  }
  return (
    <button onClick={share} className="px-3 py-2 rounded border bg-white">
      Partager
    </button>
  );
}

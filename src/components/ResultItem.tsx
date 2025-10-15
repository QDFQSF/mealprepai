'use client';
import Link from 'next/link';

export function ResultItem({
  slug,
  title,
  meta = [],
  right = null,
}: {
  slug: string;
  title: string;            // ex: r.name ou r.title
  meta?: string[];          // ex: ["18 min", "éco", "riz, poulet"]
  right?: React.ReactNode;  // ex: bouton ★
}) {
  return (
    <div className="result-item">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href={`/recettes/${slug}`} className="result-title">
            {title}
          </Link>
          {!!meta.length && (
            <div className="mt-1 text-sm text-white/60">{meta.join(' · ')}</div>
          )}
        </div>
        <div className="shrink-0">{right}</div>
      </div>
    </div>
  );
}

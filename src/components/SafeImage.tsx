'use client';
import * as React from 'react';

type Props = {
  src?: string | null;
  alt?: string;
  mode?: 'thumb' | 'hero';
  className?: string;
};

export default function SafeImage({ src, alt = '', mode = 'thumb', className = '' }: Props) {
  const [broken, setBroken] = React.useState(!src);

  const base = mode === 'hero' ? 'mp-hero' : 'mp-thumb';
  const classes = `${base} ${broken ? 'mp-fallback' : ''} ${className}`.trim();

  if (!src || broken) {
    return (
      <div role="img" aria-label={alt} className={classes}>
        {/* Fallback = mini version du logo MealPrepAI */}
        <svg
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
          width={mode === 'hero' ? 96 : 28}
          height={mode === 'hero' ? 96 : 28}
          aria-hidden="true"
        >
          <path
            d="M8 24c0 13.255 10.745 24 24 24s24-10.745 24-24H8z"
            fill="#E8DCC8"
          />
          <circle cx="24.5" cy="34.5" r="2.8" fill="#0b0f13" />
          <circle cx="39.5" cy="34.5" r="2.8" fill="#0b0f13" />
          <path
            d="M24 40c2.2 2.1 5 3.2 8 3.2s5.8-1.1 8-3.2"
            stroke="#0b0f13"
            strokeWidth="2.6"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M10 20h44c-1.8-6.2-7.2-10-14.5-10-6.3 0-9.9 2.4-12.7 5.2C23.6 18 21 20 16.5 20H10z"
            fill="#F4A21E"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      className={classes}
      src={src}
      alt={alt}
      loading={mode === 'thumb' ? 'lazy' : 'eager'}
      onError={() => setBroken(true)}
    />
  );
}

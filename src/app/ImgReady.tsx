// src/app/ImgReady.tsx
'use client'
import { useEffect } from 'react'

export default function ImgReady() {
  useEffect(() => {
    const FALLBACK_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%2311161c'/%3E%3Cg fill='none' stroke='%238f9bb0' stroke-width='1.5' stroke-linecap='round'%3E%3Cpath d='M5 15.5h14'/%3E%3Cpath d='M7 15.5c0-3.25 2.75-6 6-6s6 2.75 6 6'/%3E%3Ccircle cx='12' cy='7' r='0.8' fill='%238f9bb0'/%3E%3C/g%3E%3C/svg%3E";


    const onLoad = (e: Event) => {
      const el = e.target as HTMLImageElement
      if (!el || el.tagName !== 'IMG') return
      el.classList.add('img-loaded')
      el.classList.remove('img-placeholder')
    }

    const onError = (e: Event) => {
      const el = e.target as HTMLImageElement
      if (!el || el.tagName !== 'IMG') return
      // évite une boucle infinie si la data-URI échouait (théoriquement impossible)
      if ((el as any).dataset.fallbackApplied === '1') return
      ;(el as any).dataset.fallbackApplied = '1'
      el.src = FALLBACK_SVG
      el.alt = '' // pas de texte parasite
      el.classList.add('img-loaded', 'img-placeholder')
    }

    document.addEventListener('load', onLoad, true)
    document.addEventListener('error', onError, true)

    // Au cas où certaines images ont déjà déclenché "error" avant le montage
    // on force un onerror sur celles qui n'ont pas de dimensions naturelles
    const imgs = Array.from(document.images)
    imgs.forEach((img) => {
      if (!img.complete) return
      if (img.naturalWidth === 0) {
        // simulate error
        const ev = new Event('error')
        img.dispatchEvent(ev)
      } else {
        img.classList.add('img-loaded')
      }
    })

    return () => {
      document.removeEventListener('load', onLoad, true)
      document.removeEventListener('error', onError, true)
    }
  }, [])

  return null
}

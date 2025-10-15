// src/lib/engine.ts
import type { Recipe } from './types';

const normalize = (s: string) =>
  s.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // enlève accents
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function scoreRecipe(r: Recipe, bag: string[]) {
  if (!bag.length) return 0;
  const ing = r.ingredients.map(i => (typeof i === 'string' ? i : i.name));
  const set = new Set(ing.map(normalize));
  let score = 0;
  bag.forEach(b => { if (set.has(b)) score += 2; });
  return score - Math.min(2, Math.max(0, r.steps.length - 8)); // petit bonus “peu d’étapes”
}

export function suggest(
  all: Recipe[],
  input: string,
  opts: { minTerms?: number; maxTime?: number; budget?: string; type?: string } = {},
) {
  const { minTerms = 2, maxTime, budget, type } = opts;
  const bag = input.split(',').map(normalize).filter(Boolean);
  if (bag.length < minTerms) return [];

  return all
    .filter(r => (maxTime ? r.time <= maxTime : true))
    .filter(r => (budget && budget !== 'Tous' ? r.budget === budget : true))
    .filter(r => (type && type !== 'Tous' ? r.tags?.includes(normalize(type)) : true))
    .map(r => ({ r, s: scoreRecipe(r, bag) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map(x => x.r);
}

// src/lib/types.ts
export type Recipe = {
  slug: string;
  name: string;
  ingredients?: string[];
  ingredientsQty?: { name: string; qty?: number; unit?: string }[];
  steps: string[];
  time: number;
  budget: string;
  tags: string[];
};

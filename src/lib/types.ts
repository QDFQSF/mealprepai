export type Recipe = {
  slug: string;
  name: string;
  ingredients: string[];
  steps: string[];
  time: number;                 // minutes
  budget: "éco" | "normal" | "plus";
  tags?: string[];
};

export type Pantry = string[];

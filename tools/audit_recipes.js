// tools/audit_recipes.js
// Usage:
//   node tools/audit_recipes.js                 -> rapport seulement
//   node tools/audit_recipes.js --write         -> écrit corrections + backup
//   node tools/audit_recipes.js --fix-tags      -> force normalisation des tags
//   node tools/audit_recipes.js --fix-steps     -> nettoie steps
//   node tools/audit_recipes.js --infer-tags    -> ajoute tags (Sans gluten / modes cuisson) par heuristique

const fs = require("fs");
const path = require("path");

// --- chemin de ton dataset
const FILE = path.join(process.cwd(), "src/data/recipes_full_v5.json");
const BACKUP = FILE.replace(/\.json$/, `.backup.${Date.now()}.json`);

const argv = new Set(process.argv.slice(2));
const WRITE = argv.has("--write");
const FIX_TAGS = argv.has("--fix-tags");
const FIX_STEPS = argv.has("--fix-steps");
const INFER_TAGS = argv.has("--infer-tags");

// utilitaires
const clean = (s) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const singular = (w) =>
  w
    .replace(/\b(courgettes)\b/g, "courgette")
    .replace(/\b(carottes)\b/g, "carotte")
    .replace(/\b(pates)\b/g, "pate")
    .replace(/\b(oignons)\b/g, "oignon")
    .replace(/\b(tomates)\b/g, "tomate")
    .replace(/\b(poivrons)\b/g, "poivron");

// lexiques très simples (complète si besoin)
const GLUTEN = [
  "ble", "farine", "pain", "pate", "pates", "spaghetti", "nouilles de ble",
  "semoule", "couscous", "chapelure", "biscuit", "biere", "seigle", "orge"
];
const GLUTEN_EXCEPTIONS = [
  "pate sans gluten", "pates sans gluten", "nouilles de riz", "farine de riz", "farine de mais", "farine de sarrasin", "quinoa"
];
const DAIRY = ["lait", "beurre", "creme", "fromage", "yaourt", "mozzarella", "parmesan"];
const COOK_MODES = {
  "Wok": ["wok", "sauter", "sauté", "poele", "poêle"],
  "Poêle": ["poele", "poêle", "snacker", "saisir"],
  "Four": ["four", "prechauffer", "préchauffer", "enfourner", "gratin"],
  "Mixeur": ["mixeur", "blender", "mixer", "veloute"]
};
const TAG_NORMALIZATION = {
  // normalise la casse/orthographe des tags connus
  "sans gluten": "Sans gluten",
  "wok": "Wok",
  "poêle": "Poêle",
  "poele": "Poêle",
  "four": "Four",
  "mixeur": "Mixeur",
  "healthy": "Healthy",
  "eco": "eco",
  "plus": "plus",
  "normal": "normal",
};

function isClearlyGlutenFree(ingredients) {
  const text = clean(ingredients.map(i => i.name || "").join(" "));
  // si mention explicite d'alternatives GF
  for (const safe of GLUTEN_EXCEPTIONS) {
    if (text.includes(clean(safe))) return true;
  }
  // si présence d’un ingrédient gluten évident → pas GF
  for (const g of GLUTEN) {
    if (text.includes(g)) return false;
  }
  // pas trouvé d’ingrédient gluten : on considère GF
  return true;
}

function hasDairy(ingredients) {
  const text = clean(ingredients.map(i => i.name || "").join(" "));
  return DAIRY.some(d => text.includes(d));
}

function inferCookModes(recipe) {
  const base = `${recipe.name} ${(recipe.tags || []).join(" ")} ${(recipe.steps || []).join(" ")}`.toLowerCase();
  const found = new Set();
  for (const [mode, keys] of Object.entries(COOK_MODES)) {
    if (keys.some(k => base.includes(k))) found.add(mode);
  }
  return [...found];
}

function normalizeTags(tags) {
  const out = [];
  for (const t of tags || []) {
    const k = clean(t);
    out.push(TAG_NORMALIZATION[k] || t); // garde l’original si inconnu
  }
  // dédupe en respectant l’ordre
  return out.filter((v, i, a) => a.indexOf(v) === i);
}

function tidySteps(steps) {
  if (!Array.isArray(steps)) return steps;
  return steps
    .filter(Boolean)
    .map(s => String(s).replace(/\s+/g, " ").trim())
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .map(s => /[.!?…:]$/.test(s) ? s : s + ".");
}

function report(msg) {
  console.log("•", msg);
}

function main() {
  if (!fs.existsSync(FILE)) {
    console.error("Fichier introuvable:", FILE);
    process.exit(1);
  }
  const json = JSON.parse(fs.readFileSync(FILE, "utf8"));
  if (!Array.isArray(json)) {
    console.error("recipes_full_v5.json doit être un array.");
    process.exit(1);
  }

  let changed = false;
  const slugs = new Set();
  let invalidCount = 0;

  json.forEach((r, idx) => {
    const where = `#${idx} ${r.slug || r.name}`;
    // validations de base
    if (!r.slug || !r.name) {
      report(`${where} -> slug/name manquant`);
      invalidCount++;
    }
    if (slugs.has(r.slug)) {
      report(`${where} -> slug en double`);
      invalidCount++;
    }
    slugs.add(r.slug);

    // hygiene steps
    if (FIX_STEPS && Array.isArray(r.steps)) {
      const before = JSON.stringify(r.steps);
      r.steps = tidySteps(r.steps);
      if (JSON.stringify(r.steps) !== before) {
        changed = true;
        report(`${where} -> steps normalisées`);
      }
    }

    // tags
    if (FIX_TAGS) {
      const before = JSON.stringify(r.tags);
      r.tags = normalizeTags(r.tags || []);
      if (JSON.stringify(r.tags) !== before) {
        changed = true;
        report(`${where} -> tags normalisés: ${JSON.stringify(r.tags)}`);
      }
    }

    // inférences
    if (INFER_TAGS) {
      const tags = new Set(r.tags || []);
      // Sans gluten
      if ((r.tags || []).map(clean).includes("sans gluten")) {
        // déjà présent → ok
      } else if (isClearlyGlutenFree(r.ingredientsQty || [])) {
        tags.add("Sans gluten");
      } else {
        // si pas GF et tag présent par erreur → on retire
        for (const t of [...tags]) {
          if (clean(t) === "sans gluten") tags.delete(t);
        }
      }
      // modes
      inferCookModes(r).forEach(m => tags.add(m));
      const normalized = normalizeTags([...tags]);
      if (JSON.stringify(normalized) !== JSON.stringify(r.tags || [])) {
        r.tags = normalized;
        changed = true;
        report(`${where} -> tags inférés: ${JSON.stringify(r.tags)}`);
      }
    }
  });

  console.log("\nRésumé:");
  console.log("- recettes:", json.length);
  console.log("- invalides (slug/name/doublon):", invalidCount);

  if (WRITE && changed) {
    fs.copyFileSync(FILE, BACKUP);
    fs.writeFileSync(FILE, JSON.stringify(json, null, 2), "utf8");
    console.log(`\nModifs enregistrées ✅ (backup: ${path.basename(BACKUP)})`);
  } else if (changed) {
    console.log("\nDes corrections sont prêtes. Ajoute --write pour les enregistrer.");
  } else {
    console.log("\nAucune correction nécessaire (avec les options actuelles).");
  }
}

main();

// tools/fix_tags.js
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'src', 'data', 'recipes_full_v5.json');

const CANON = new Map([
  // modes
  ['wok', 'Wok'],
  ['mixeur', 'Mixeur'],
  ['poele', 'Poêle'], ['poêle', 'Poêle'],
  ['four', 'Four'],
  ['cru', 'Cru'],
  // régimes/qualifs
  ['vegetarien', 'Végétarien'], ['végétarien', 'Végétarien'], ['vege', 'Végétarien'],
  ['sansgluten', 'Sans gluten'], ['sans gluten', 'Sans gluten'], ['sg', 'Sans gluten'],
  ['healthy', 'Healthy'],
  // au cas où certains se seraient glissés dans "tags"
  ['eco', 'eco'], ['normal', 'normal'], ['plus', 'plus']
]);

const ALLOWED = new Set([
  'Wok', 'Mixeur', 'Poêle', 'Four', 'Cru',
  'Végétarien', 'Sans gluten', 'Healthy',
  // on tolère s’ils sont utilisés comme tags visuels
  'eco', 'normal', 'plus'
]);

const stripAccents = (s) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '');

function normalizeTag(t) {
  if (!t) return null;
  let s = String(t).trim();
  if (!s) return null;

  // Quelques corrections rapides d’artefacts fréquents
  s = s.replace(/\s+/g, ' ');

  // Version clé sans accents et en minuscule pour le mapping
  const key = stripAccents(s).toLowerCase();

  // Applique le mapping si connu
  if (CANON.has(key)) return CANON.get(key);

  // Si déjà conforme (ex : "Wok", "Four", …), on le garde tel quel
  if (ALLOWED.has(s)) return s;

  // Dernier filet de sécurité : titlecase de mots connus de modes
  if (['wok', 'four', 'poele', 'poêle', 'mixeur', 'cru'].includes(key)) {
    return CANON.get(key) ?? (s.charAt(0).toUpperCase() + s.slice(1).toLowerCase());
  }
  if (['vegetarien','végétarien','vege'].includes(key)) return 'Végétarien';
  if (key.includes('sans') && key.includes('gluten')) return 'Sans gluten';
  if (key === 'healthy') return 'Healthy';

  // Sinon on l’ignore (pas dans la whitelist)
  return null;
}

function uniq(arr) {
  return [...new Set(arr)];
}

function run() {
  const raw = fs.readFileSync(FILE, 'utf8');
  const data = JSON.parse(raw);

  let changed = 0, removed = 0, kept = 0;

  for (const r of data) {
    const before = Array.isArray(r.tags) ? r.tags.slice() : [];
    const mapped = before
      .map(normalizeTag)
      .filter(Boolean);

    const deduped = uniq(mapped).filter(t => ALLOWED.has(t));

    kept += deduped.length;
    removed += Math.max(0, before.length - deduped.length);

    if (JSON.stringify(before) !== JSON.stringify(deduped)) {
      r.tags = deduped;
      changed++;
    }
  }

  // sauvegarde + backup
  const bak = FILE.replace(/\.json$/, `.bak.${Date.now()}.json`);
  fs.writeFileSync(bak, raw, 'utf8');
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8');

  console.log(`✅ Tags normalisés.
  - Recettes modifiées : ${changed}
  - Tags conservés : ${kept}
  - Tags retirés/normalisés : ${removed}
  - Backup : ${bak}`);
}

run();

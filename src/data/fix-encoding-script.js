// fix-encoding.js - Script pour corriger l'encodage UTF-8
const fs = require('fs');
const path = require('path');

const replacements = {
  'Ã©': 'é',
  'Ã¨': 'è',
  'Ã ': 'à',
  'Ã´': 'ô',
  'Ã®': 'î',
  'Ã¢': 'â',
  'Ã»': 'û',
  'Ã§': 'ç',
  'Å"': 'œ',
  'â€™': "'",
  'â€"': '—',
  'â€¢': '•'
};

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let fixed = false;
  
  for (const [wrong, correct] of Object.entries(replacements)) {
    if (content.includes(wrong)) {
      content = content.replaceAll(wrong, correct);
      fixed = true;
    }
  }
  
  if (fixed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Corrigé : ${filePath}`);
  }
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !fullPath.includes('node_modules')) {
      scanDirectory(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.css') || file.endsWith('.json')) {
      fixFile(fullPath);
    }
  }
}

// Démarrer depuis src/
scanDirectory('./src');
console.log('🎉 Encodage corrigé !');

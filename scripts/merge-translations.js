/**
 * @arquivo merge-translations.js
 * @descricao Merge de patches de traducao no pt.json principal
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 *
 * Uso: node scripts/merge-translations.js
 * Le patch-*.json de data/i18n/ e aplica no pt.json
 */
const fs = require("fs");
const path = require("path");

const I18N_DIR = path.join(__dirname, "..", "data", "i18n");
const PT_PATH = path.join(I18N_DIR, "pt.json");

// Le pt.json atual
const pt = JSON.parse(fs.readFileSync(PT_PATH, "utf-8"));

// Encontra todos os patch files
const patches = fs
  .readdirSync(I18N_DIR)
  .filter((f) => f.startsWith("patch-") && f.endsWith(".json"));

let applied = 0;
let skipped = 0;

patches.forEach((patchFile) => {
  const patchPath = path.join(I18N_DIR, patchFile);
  const patch = JSON.parse(fs.readFileSync(patchPath, "utf-8"));

  Object.entries(patch).forEach(([id, definition]) => {
    if (!pt[id]) {
      console.log("  SKIP (nao existe no pt.json): " + id);
      skipped++;
      return;
    }
    pt[id].definition = definition;
    applied++;
  });

  console.log(
    "Patch " + patchFile + ": " + Object.keys(patch).length + " termos",
  );
});

// Escreve pt.json atualizado
fs.writeFileSync(PT_PATH, JSON.stringify(pt, null, 2) + "\n", "utf-8");

console.log("---");
console.log("Aplicados: " + applied + " | Ignorados: " + skipped);
console.log("pt.json atualizado com sucesso!");

/**
 * @arquivo merge-translations-es.js
 * @descricao Merge de patches de traducao espanhol no es.json
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 *
 * Uso: node scripts/merge-translations-es.js
 */
const fs = require("fs");
const path = require("path");

const I18N_DIR = path.join(__dirname, "..", "data", "i18n");
const ES_PATH = path.join(I18N_DIR, "es.json");

const es = JSON.parse(fs.readFileSync(ES_PATH, "utf-8"));

const patches = fs
  .readdirSync(I18N_DIR)
  .filter((f) => f.startsWith("patch-es-") && f.endsWith(".json"));

let applied = 0;
let skipped = 0;

patches.forEach((patchFile) => {
  const patch = JSON.parse(
    fs.readFileSync(path.join(I18N_DIR, patchFile), "utf-8"),
  );

  Object.entries(patch).forEach(([id, definition]) => {
    if (!es[id]) {
      skipped++;
      return;
    }
    es[id].definition = definition;
    applied++;
  });

  console.log(
    "Patch " + patchFile + ": " + Object.keys(patch).length + " termos",
  );
});

fs.writeFileSync(ES_PATH, JSON.stringify(es, null, 2) + "\n", "utf-8");

console.log("---");
console.log("Aplicados: " + applied + " | Ignorados: " + skipped);
console.log("es.json atualizado!");

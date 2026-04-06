const fs = require("fs");
const path = require("path");

const localeDir = path.join(__dirname, "..", "src", "i18n", "locales");
const files = ["en.ftl", "pt.ftl", "es.ftl"];

function extractKeys(filename) {
  const text = fs.readFileSync(path.join(localeDir, filename), "utf8");
  return new Set(
    text
      .split(/\r?\n/)
      .map((line) => line.match(/^([a-z0-9-]+)\s*=/i)?.[1])
      .filter(Boolean),
  );
}

const keySets = Object.fromEntries(files.map((file) => [file, extractKeys(file)]));
let hasMissing = false;

for (const file of files) {
  const missing = files
    .filter((other) => other !== file)
    .flatMap((other) =>
      [...keySets[other]].filter((key) => !keySets[file].has(key)),
    );
  const uniqueMissing = [...new Set(missing)].sort();
  if (uniqueMissing.length > 0) {
    hasMissing = true;
    console.error(`${file} is missing keys: ${uniqueMissing.join(", ")}`);
  }
}

if (hasMissing) {
  process.exit(1);
}

console.log("Locale key sets are aligned across en/pt/es.");

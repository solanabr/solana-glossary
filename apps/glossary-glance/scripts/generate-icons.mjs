/**
 * Optional: regenerate PNG icons (requires sharp or Pillow — see README).
 * Placeholders are committed; this script is for maintainers.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICON_DIR = path.resolve(__dirname, "../icons");
console.log("Use Python+Pillow or design assets — icons committed under", ICON_DIR);

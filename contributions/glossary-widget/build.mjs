import * as esbuild from "esbuild";
import { readFileSync } from "fs";

const watch = process.argv.includes("--watch");

/** @type {esbuild.BuildOptions} */
const shared = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  minify: !watch,
  sourcemap: watch,
  target: ["es2020"],
  define: {
    "process.env.NODE_ENV": watch ? '"development"' : '"production"',
  },
};

// UMD-style IIFE for <script> tag usage
await esbuild.build({
  ...shared,
  outfile: "dist/widget.js",
  format: "iife",
  globalName: "SolanaGlossary",
});

// ESM for npm import
await esbuild.build({
  ...shared,
  outfile: "dist/widget.esm.js",
  format: "esm",
});

console.log("Widget built successfully");

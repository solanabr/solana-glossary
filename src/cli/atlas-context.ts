import { injectGlossaryContext } from "../context/index";
import type { ContextMode, InjectOptions } from "../context/index";

function parseArgs(argv: string[]): { input: string; options: InjectOptions } {
  const flags = argv.slice(2);
  const positional: string[] = [];
  const options: InjectOptions = {};

  for (const flag of flags) {
    if (flag.startsWith("--mode=")) {
      options.mode = flag.slice(7) as ContextMode;
    } else if (flag === "--expand") {
      options.expand = true;
    } else if (flag === "--optimize") {
      options.optimize = true;
    } else if (flag.startsWith("--lang=")) {
      options.lang = flag.slice(7) as InjectOptions["lang"];
    } else {
      positional.push(flag);
    }
  }

  const input = positional.join(" ").trim();
  return { input, options };
}

function main() {
  const { input, options } = parseArgs(process.argv);

  if (!input) {
    process.stderr.write("Usage: atlas-context <input text> [--mode=concise|expanded|structured] [--expand] [--optimize] [--lang=en|es|pt]\n");
    process.exit(1);
  }

  const result = injectGlossaryContext(input, options);

  if (typeof result === "string") {
    process.stdout.write(result + "\n");
  } else {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  }
}

main();

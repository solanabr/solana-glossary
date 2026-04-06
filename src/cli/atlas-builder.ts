import { buildProject } from "../builder/builder";
import type { BuildOptions } from "../builder/builder";

function parseArgs(argv: string[]): { input: string; options: BuildOptions } {
  const flags = argv.slice(2);
  const positional: string[] = [];
  const options: BuildOptions = {};

  for (const flag of flags) {
    if (flag === "--expand") {
      options.expand = true;
    } else if (flag.startsWith("--lang=")) {
      options.lang = flag.slice(7) as BuildOptions["lang"];
    } else {
      positional.push(flag);
    }
  }

  return { input: positional.join(" ").trim(), options };
}

function main() {
  const { input, options } = parseArgs(process.argv);

  if (!input) {
    process.stderr.write(
      "Usage: atlas-builder <description> [--expand] [--lang=en|es|pt]\n" +
      "Example: atlas-builder \"build escrow program\" --expand\n"
    );
    process.exit(1);
  }

  const result = buildProject(input, options);

  process.stdout.write("Concepts:\n");
  for (const concept of result.concepts) {
    process.stdout.write(`  - ${concept.term} [${concept.category}]\n`);
  }

  process.stdout.write("\nArchitecture:\n");

  process.stdout.write("  Components:\n");
  for (const c of result.architecture.components) {
    process.stdout.write(`    - ${c}\n`);
  }

  process.stdout.write("  Flows:\n");
  for (const f of result.architecture.flows) {
    process.stdout.write(`    - ${f}\n`);
  }

  process.stdout.write("  Notes:\n");
  for (const n of result.architecture.notes) {
    process.stdout.write(`    - ${n}\n`);
  }

  process.stdout.write("\nStructure:\n");
  for (const line of result.structure.split("\n")) {
    process.stdout.write(`  ${line}\n`);
  }
}

main();

import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ALLOWED_LAYERS = new Set(["pages", "widgets", "features", "entities", "shared"]);

function printHelp() {
  console.log(
    [
      "UI component generator",
      "",
      "Usage:",
      "  npm run g:ui -- --layer <layer> --name <ComponentName>",
      "",
      "Options:",
      "  --layer  One of: pages, widgets, features, entities, shared",
      "  --name   Component folder and file prefix (PascalCase recommended)",
      "  --dry-run  Print files that would be created without writing them",
      "",
      "Example:",
      "  npm run g:ui -- --layer widgets --name TopBar",
    ].join("\n"),
  );
}

function parseArgs(argv) {
  const args = {
    layer: "",
    name: "",
    dryRun: false,
  };
  const positional = [];

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === "--help" || token === "-h") {
      args.help = true;
      continue;
    }

    if (token === "--layer") {
      args.layer = argv[i + 1] ?? "";
      i += 1;
      continue;
    }

    if (token === "--name") {
      args.name = argv[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (token === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (!token.startsWith("-")) {
      positional.push(token);
    }
  }

  if (!args.layer && positional[0]) {
    args.layer = positional[0];
  }

  if (!args.name && positional[1]) {
    args.name = positional[1];
  }

  return args;
}

function validateName(name) {
  return /^[A-Z][A-Za-z0-9]*$/.test(name);
}

function ensureFileDoesNotExist(pathname) {
  if (existsSync(pathname)) {
    throw new Error(`File already exists: ${pathname}`);
  }
}

function createFile(pathname, content) {
  mkdirSync(dirname(pathname), { recursive: true });
  writeFileSync(pathname, content, { encoding: "utf8" });
}

function buildTsxTemplate(name) {
  return `import styles from "./${name}.module.scss";

export function ${name}() {
  return <section className={styles.root}>${name}</section>;
}
`;
}

function buildScssTemplate() {
  return `.root {
}
`;
}

function buildIndexTemplate(name) {
  return `export { ${name} } from "./${name}";
`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  if (!args.layer || !args.name) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  if (!ALLOWED_LAYERS.has(args.layer)) {
    throw new Error(`Unknown layer "${args.layer}". Allowed: ${Array.from(ALLOWED_LAYERS).join(", ")}`);
  }

  if (!validateName(args.name)) {
    throw new Error('Invalid --name. Use PascalCase, for example "TopBar".');
  }

  const baseDir = join(process.cwd(), "src", "ui", args.layer, args.name);
  const tsxPath = join(baseDir, `${args.name}.tsx`);
  const scssPath = join(baseDir, `${args.name}.module.scss`);
  const indexPath = join(baseDir, "index.ts");

  ensureFileDoesNotExist(tsxPath);
  ensureFileDoesNotExist(scssPath);
  ensureFileDoesNotExist(indexPath);

  if (!args.dryRun) {
    createFile(tsxPath, buildTsxTemplate(args.name));
    createFile(scssPath, buildScssTemplate());
    createFile(indexPath, buildIndexTemplate(args.name));
  }

  const action = args.dryRun ? "Would create" : "Created";
  console.log(`${action}:
  ${tsxPath}
  ${scssPath}
  ${indexPath}`);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
}

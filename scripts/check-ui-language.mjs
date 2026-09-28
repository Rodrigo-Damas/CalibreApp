import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = new URL("../src/", import.meta.url);
const forbidden = [
  { pattern: /[—–]/g, label: "caractere de travessão" },
  { pattern: /\b(?:preparad[oa]s?|treinad[oa]s?)\b/gi, label: "marcação de gênero na comunicação" },
];
const extensions = new Set([".ts", ".tsx", ".css"]);
const failures = [];
async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await scan(path);
    else if (extensions.has(extname(entry.name))) {
      const contents = await readFile(path, "utf8");
      for (const { pattern, label } of forbidden) {
        for (const match of contents.matchAll(pattern)) {
          const line = contents.slice(0, match.index).split("\n").length;
          failures.push(`${relative(root.pathname, path)}:${line}: ${label}: ${match[0]}`);
        }
      }
    }
  }
}
await scan(root.pathname);
if (failures.length) {
  console.error(`Comunicação de interface inválida:\n${failures.join("\n")}`);
  process.exitCode = 1;
} else console.log("Comunicação de interface sem travessões ou marcação de gênero.");

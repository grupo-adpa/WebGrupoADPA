import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "parse5";

// Expectativa explícita: independiente de la lógica de Vite y del estado de dist.
const expected = process.argv[2];
assert.ok(
  ["true", "false"].includes(expected),
  "Uso: node scripts/check-invue.mjs true|false",
);
const active = expected === "true";
const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else files.push(path);
  }
}
await walk("dist");
assert.equal(
  files.includes("dist/invue.html"),
  active,
  "invue.html debe coincidir con la bandera",
);
assert.equal(
  files.some((path) => /invue/i.test(path)),
  active,
  "No debe quedar ningún archivo de InVue al desactivarlo",
);
const sitemap = await readFile("dist/sitemap.xml", "utf8");
assert.equal(
  sitemap.includes("/invue"),
  active,
  "Sitemap condicionado por la bandera",
);
for (const path of files.filter((path) => path.endsWith(".html"))) {
  const links = [];
  const visit = (node) => {
    for (const attr of node.attrs ?? []) {
      if (attr.name === "href" && /\/invue(?:[.#/?]|$)/i.test(attr.value))
        links.push(attr.value);
    }
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content);
  };
  visit(parse(await readFile(path, "utf8")));
  assert.equal(links.length > 0, active, `${path}: enlaces InVue`);
}
console.log(
  `INVUE_ACTIVA=${expected}: página, archivos, enlaces y sitemap verificados.`,
);

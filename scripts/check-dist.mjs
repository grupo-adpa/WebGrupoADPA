import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "parse5";
const errors = [];
let count = 0;
async function scan(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await scan(path);
    else if (/\.(html|svg)$/.test(path)) {
      const html = await readFile(path, "utf8");
      const visit = (node) => {
        const attrs = Object.fromEntries(
          (node.attrs ?? []).map((a) => [a.name, a.value]),
        );
        if (
          node.tagName === "style" ||
          (node.tagName === "script" &&
            !attrs.src &&
            attrs.type !== "application/ld+json")
        )
          errors.push(`${path}: ${node.tagName} en línea`);
        for (const [name, value] of Object.entries(attrs)) {
          if (
            name === "style" ||
            /^on/i.test(name) ||
            /^javascript:/i.test(value)
          )
            errors.push(`${path}: atributo prohibido ${name}`);
          if (
            ["src", "href"].includes(name) &&
            /^https?:/.test(value) &&
            ["script", "link", "img"].includes(node.tagName) &&
            attrs.rel !== "canonical"
          )
            errors.push(`${path}: recurso remoto ${value}`);
        }
        for (const child of node.childNodes ?? []) visit(child);
        if (node.content) visit(node.content);
      };
      visit(parse(html));
      if (/__[A-Z_]+__/.test(html))
        errors.push(`${path}: configuración sin resolver`);
      count++;
    }
  }
}
await scan("dist");
if (errors.length) throw new Error(errors.join("\n"));
console.log(
  `${count} archivos HTML/SVG verificados: sin código en línea ni recursos remotos.`,
);

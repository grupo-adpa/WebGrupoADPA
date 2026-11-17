import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "parse5";

export function publicationFlag(value = process.env.PUBLICAR) {
  if (value !== undefined && value !== "true" && value !== "false")
    throw new Error("PUBLICAR debe ser true o false");
  return value === "true";
}
export async function checkPublication(directory, publish) {
  const errors = [];
  let pages = 0;
  async function scan(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        await scan(path);
        continue;
      }
      const content = await readFile(path, "utf8");
      // Todos los archivos, no solo HTML: incluye texto en bundles y assets.
      if (publish && /PENDIENTE|DATO A CONFIRMAR/.test(content))
        errors.push(`${path}: contiene marcadores sin resolver`);
      if (path.endsWith(".html")) {
        pages++;
        const robots = [];
        const visit = (node) => {
          const attrs = Object.fromEntries(
            (node.attrs ?? []).map((a) => [a.name, a.value]),
          );
          if (node.tagName === "meta" && attrs.name?.toLowerCase() === "robots")
            robots.push(attrs.content);
          for (const child of node.childNodes ?? []) visit(child);
        };
        visit(parse(content));
        if (
          !publish &&
          (robots.length !== 1 || robots[0] !== "noindex,nofollow")
        )
          errors.push(
            `${path}: requiere un único meta robots noindex,nofollow`,
          );
      }
    }
  }
  await scan(directory);
  if (!pages) errors.push("No hay páginas HTML que verificar");
  const robots = await readFile(join(directory, "robots.txt"), "utf8");
  if (!publish && !/^User-agent: \*\s+Disallow: \/\s*$/m.test(robots.trim()))
    errors.push("robots.txt debe bloquear todos los rastreadores");
  if (publish && /^Disallow:\s*\/\s*$/m.test(robots))
    errors.push("robots.txt bloquea la publicación");
  if (errors.length)
    throw new Error(`Control PUBLICAR=${publish}:\n${errors.join("\n")}`);
  console.log(
    `PUBLICAR=${publish}: ${pages} páginas y todos los archivos de salida verificados.`,
  );
}

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkPublication, publicationFlag } from "../check-publication.mjs";
async function fixture(fn) {
  const dir = await mkdtemp(join(tmpdir(), "adpa-publication-"));
  try {
    await writeFile(
      join(dir, "index.html"),
      '<html><head><meta name="robots" content="noindex,nofollow"></head><body>Contenido aprobado</body></html>',
    );
    await writeFile(join(dir, "robots.txt"), "User-agent: *\nDisallow: /\n");
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
test("flag cerrada por defecto y estricta", () => {
  assert.equal(publicationFlag("false"), false);
  assert.equal(publicationFlag("true"), true);
  assert.throws(() => publicationFlag("1"));
});
test("revisión exige meta en cada página y robots bloqueante", () =>
  fixture(async (dir) => {
    await checkPublication(dir, false);
    await writeFile(
      join(dir, "invue.html"),
      "<html><head></head><body>InVue</body></html>",
    );
    await assert.rejects(checkPublication(dir, false), /invue.html: requiere/);
  }));
test("publicación limpia pasa; marcadores en HTML o assets la bloquean", () =>
  fixture(async (dir) => {
    await writeFile(join(dir, "robots.txt"), "User-agent: *\nAllow: /\n");
    await checkPublication(dir, true);
    await mkdir(join(dir, "assets"));
    for (const marker of ["PENDIENTE", "DATO A CONFIRMAR"]) {
      await writeFile(
        join(dir, "assets", "bundle.js"),
        `const texto = '${marker}';`,
      );
      await assert.rejects(
        checkPublication(dir, true),
        /bundle.js: contiene marcadores/,
      );
    }
  }));

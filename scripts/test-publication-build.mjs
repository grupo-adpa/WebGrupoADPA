import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { checkPublication } from "./check-publication.mjs";
const build = (env) =>
  spawnSync(process.execPath, ["node_modules/vite/bin/vite.js", "build"], {
    env,
    encoding: "utf8",
  });
// El contenido actual tiene marcadores: habilitar publicación debe impedir el build.
try {
  const result = build({ ...process.env, PUBLICAR: "true" });
  assert.notEqual(
    result.status,
    0,
    "El build publicable debe fallar con los marcadores actuales",
  );
  assert.match(
    result.stderr + result.stdout,
    /contiene marcadores sin resolver/,
  );
  const invalid = build({ ...process.env, PUBLICAR: "yes" });
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /PUBLICAR debe ser true o false/);
} finally {
  // Restituye una salida de revisión segura, aun si falla la prueba.
  const env = { ...process.env };
  delete env.PUBLICAR;
  const result = build(env);
  assert.equal(result.status, 0, result.stderr);
  await checkPublication("dist", false);
}
const draft = build({ ...process.env, PUBLICAR: "false" });
assert.equal(draft.status, 0, draft.stderr);
await checkPublication("dist", false);
console.log(
  "PUBLICAR=true bloqueado con marcadores; false y valor predeterminado no indexables: OK.",
);

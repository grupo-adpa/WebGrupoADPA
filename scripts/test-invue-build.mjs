import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
function run(args, env) {
  const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  assert.equal(result.status, 0, args.join(" "));
}
// Comprobar transición sobre el mismo dist, sin borrarlo desde la prueba.
for (const flag of ["true", "false", undefined]) {
  const env = { ...process.env };
  if (flag === undefined) delete env.INVUE_ACTIVA;
  else env.INVUE_ACTIVA = flag;
  run(["node_modules/vite/bin/vite.js", "build"], env);
  run(["scripts/check-dist.mjs"], env);
  run(["scripts/check-invue.mjs", flag ?? "false"], env);
}
const invalid = spawnSync(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "build"],
  {
    env: { ...process.env, INVUE_ACTIVA: "yes" },
    encoding: "utf8",
  },
);
assert.notEqual(invalid.status, 0);
assert.match(invalid.stderr, /INVUE_ACTIVA debe ser true o false/);
console.log(
  "Transición true → false → valor predeterminado e indicador inválido: OK.",
);

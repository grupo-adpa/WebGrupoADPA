import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const [container] = JSON.parse(readFileSync(process.argv[2], "utf8"));
assert.equal(container.HostConfig.ReadonlyRootfs, true);
assert.ok(container.HostConfig.CapDrop.includes("ALL"));
assert.ok(
  container.HostConfig.SecurityOpt.some((x) =>
    x.startsWith("no-new-privileges"),
  ),
);
assert.equal(container.Config.User, "nginx");
for (const path of ["/var/cache/nginx", "/var/run"])
  assert.ok(container.HostConfig.Tmpfs[path]);
assert.equal(Object.keys(container.NetworkSettings.Networks).length, 1);
console.log(
  "Nginx validado: usuario nginx, raíz read_only, tmpfs, sin capacidades, sin privilegios nuevos, una red.",
);

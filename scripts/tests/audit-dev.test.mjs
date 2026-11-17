import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateAudit } from "../audit-dev.mjs";
const id = "GHSA-fc5q-39xc-vjpf";
const advisory = {
  name: "picomatch",
  severity: "high",
  url: `https://github.com/advisories/${id}`,
};
const exceptions = [
  {
    id,
    paquete: "picomatch",
    motivo: "Aprobación del responsable",
    vence: "2026-12-17",
  },
];
const report = {
  auditReportVersion: 2,
  metadata: { vulnerabilities: { high: 3 } },
  vulnerabilities: {
    picomatch: { severity: "high", via: [advisory] },
    tinyglobby: { severity: "high", via: ["picomatch"] },
    vite: { severity: "high", via: ["tinyglobby", "picomatch"] },
  },
};
const evaluate = (r = report, ex = exceptions, date = "2026-11-17") =>
  evaluateAudit(r, ex, date);
test("una excepción cubre su aviso raíz y los dependientes, sin duplicar", () => {
  assert.deepEqual(evaluate(), { errors: [], advisories: [`${id}:picomatch`] });
});
test("no permite otro aviso del mismo paquete ni el mismo id en otro paquete", () => {
  for (const change of [
    { url: "https://github.com/advisories/GHSA-aaaa-bbbb-cccc" },
    { name: "otro" },
  ]) {
    const r = structuredClone(report);
    r.vulnerabilities.picomatch.via.push({ ...advisory, ...change });
    assert.ok(evaluate(r).errors.some((e) => e.includes("no exceptuado")));
  }
});
test("falla ante avisos moderate, high y critical no exceptuados; admite low", () => {
  for (const severity of ["low", "moderate", "high", "critical"]) {
    const r = structuredClone(report);
    r.vulnerabilities.nuevo = {
      severity,
      via: [{ ...advisory, name: "nuevo", severity }],
    };
    assert.equal(evaluate(r).errors.length > 0, severity !== "low");
  }
});
test("una excepción vencida falla aunque ya no aparezca el aviso", () => {
  const r = { ...report, vulnerabilities: {} };
  assert.ok(
    evaluate(r, exceptions, "2026-12-17").errors.some((e) =>
      e.includes("vencida"),
    ),
  );
  assert.equal(evaluate(r, exceptions, "2026-12-16").errors.length, 0);
});
test("rechaza fechas inválidas, motivos vacíos y excepciones duplicadas", () => {
  for (const ex of [
    [{ ...exceptions[0], vence: "2026-02-30" }],
    [{ ...exceptions[0], motivo: "" }],
    [...exceptions, ...exceptions],
  ])
    assert.ok(evaluate(report, ex).errors.length);
});
test("falla de forma cerrada ante errores de npm, formato inválido y cadenas irresolubles", () => {
  for (const r of [{}, { ...report, error: { code: "ENETWORK" } }])
    assert.throws(() => evaluate(r));
  const r = structuredClone(report);
  r.vulnerabilities.vite.via = ["inexistente"];
  assert.ok(evaluate(r).errors.length);
});

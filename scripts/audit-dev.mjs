import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const levels = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
export function evaluateAudit(report, exceptions, today) {
  const errors = [];
  const allowed = new Map();
  if (!Array.isArray(exceptions))
    throw new Error("audit-exceptions.json debe ser una lista");
  for (const item of exceptions) {
    if (
      !item ||
      !/^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/.test(item.id ?? "") ||
      typeof item.paquete !== "string" ||
      !item.paquete.trim() ||
      typeof item.motivo !== "string" ||
      !item.motivo.trim() ||
      !/^\d{4}-\d{2}-\d{2}$/.test(item.vence ?? "") ||
      Number.isNaN(Date.parse(item.vence)) ||
      new Date(item.vence).toISOString().slice(0, 10) !== item.vence
    ) {
      errors.push(
        "Excepción inválida: requiere id GHSA, paquete, motivo y vence YYYY-MM-DD",
      );
      continue;
    }
    const key = `${item.id}:${item.paquete}`;
    if (allowed.has(key)) errors.push(`Excepción duplicada: ${key}`);
    // Vence al comenzar la fecha indicada en America/Tegucigalpa.
    if (today >= item.vence)
      errors.push(`Excepción vencida: ${key} (${item.vence})`);
    allowed.set(key, item);
  }
  if (
    !report ||
    report.error ||
    report.auditReportVersion !== 2 ||
    !report.vulnerabilities ||
    typeof report.vulnerabilities !== "object" ||
    Array.isArray(report.vulnerabilities) ||
    !report.metadata?.vulnerabilities
  ) {
    throw new Error(
      "npm audit no devolvió un informe válido; no se admite como aprobado",
    );
  }
  const advisories = new Map();
  function roots(name, seen = new Set()) {
    if (seen.has(name)) return [];
    const item = report.vulnerabilities[name];
    if (!item || !Array.isArray(item.via) || !(item.severity in levels)) {
      errors.push(`Cadena de dependencia desconocida: ${name}`);
      return [];
    }
    const next = new Set([...seen, name]);
    return item.via.flatMap((via) => {
      if (typeof via === "string") return roots(via, next);
      if (
        !via ||
        typeof via !== "object" ||
        !(via.severity in levels) ||
        typeof via.name !== "string"
      ) {
        errors.push(`Aviso inválido en ${name}`);
        return [];
      }
      return [via];
    });
  }
  for (const [name, item] of Object.entries(report.vulnerabilities)) {
    if (!(item?.severity in levels)) {
      errors.push(`Severidad desconocida: ${name}`);
      continue;
    }
    if (levels[item.severity] < levels.moderate) continue;
    const found = roots(name).filter(
      (via) => levels[via.severity] >= levels.moderate,
    );
    if (!found.length)
      errors.push(`No se pudo resolver el aviso raíz de ${name}`);
    for (const via of found) {
      const id = /^https:\/\/github\.com\/advisories\/(GHSA-[a-z0-9-]+)$/.exec(
        via.url ?? "",
      )?.[1];
      const key = `${id ?? via.url ?? "sin-id"}:${via.name}`;
      advisories.set(key, via);
      if (!id || !allowed.has(key))
        errors.push(`Aviso no exceptuado (${via.severity}): ${key}`);
    }
  }
  return { errors: [...new Set(errors)], advisories: [...advisories.keys()] };
}

function run() {
  const result = spawnSync("npm", ["audit", "--json"], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    timeout: 120_000,
  });
  if (result.error || ![0, 1].includes(result.status))
    throw new Error("No se pudo ejecutar npm audit --json");
  const report = JSON.parse(result.stdout);
  const exceptions = JSON.parse(readFileSync("audit-exceptions.json", "utf8"));
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Tegucigalpa",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const date = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const { errors, advisories } = evaluateAudit(
    report,
    exceptions,
    `${date.year}-${date.month}-${date.day}`,
  );
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(
    `Audit de desarrollo aprobado: ${advisories.length} aviso(s) con excepción vigente.`,
  );
  for (const advisory of advisories)
    console.log(`Excepción aplicada: ${advisory}`);
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    run();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

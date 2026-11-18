// Servidor local de pruebas de la salida; reproduce la CSP del Nginx de producción.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname } from "node:path";
const root = resolve("dist");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
  ".txt": "text/plain",
};
const headers = {
  "Content-Security-Policy":
    "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};
createServer(async (req, res) => {
  try {
    const path = resolve(
      root,
      "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
    );
    if (path !== root && !path.startsWith(root + "/")) {
      res.writeHead(403, headers).end();
      return;
    }
    const file = (await stat(path)).isDirectory()
      ? resolve(path, "index.html")
      : path;
    const content = await readFile(file);
    res
      .writeHead(200, {
        ...headers,
        "Content-Type": mime[extname(file)] ?? "application/octet-stream",
      })
      .end(content);
  } catch {
    res
      .writeHead(404, { ...headers, "Content-Type": mime[".html"] })
      .end(await readFile(resolve(root, "404.html")));
  }
}).listen(4173, "127.0.0.1", () => console.log("READY http://127.0.0.1:4173"));

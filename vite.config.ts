import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import {
  publicationFlag,
  checkPublication,
} from "./scripts/check-publication.mjs";
const publicar = publicationFlag();
let isBuild = false;
import { site, whatsappUrl, emailUrl } from "./src/config.ts";
const flag = process.env.INVUE_ACTIVA;
if (flag !== undefined && flag !== "true" && flag !== "false") {
  throw new Error("INVUE_ACTIVA debe ser true o false");
}
const invueActiva = flag === undefined ? site.INVUE_ACTIVA : flag === "true";
export default defineConfig({
  plugins: [
    tailwindcss(),
    {
      name: "site-config",
      configResolved(config) {
        isBuild = config.command === "build";
      },
      // En desarrollo tampoco servir la fuente omitida cuando la bandera está apagada.
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const path = new URL(req.url ?? "/", "http://localhost").pathname;
          if (!invueActiva && /^\/invue(?:\.html|\/)?$/.test(path)) {
            res.statusCode = 404;
            res.end("Not found");
          } else next();
        });
      },
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "robots.txt",
          source: publicar
            ? `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`
            : "User-agent: *\nDisallow: /\n",
        });
        this.emitFile({
          type: "asset",
          fileName: "sitemap.xml",
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${site.url}/</loc></url>${invueActiva ? `<url><loc>${site.url}/invue</loc></url>` : ""}</urlset>\n`,
        });
      },
      async closeBundle() {
        if (isBuild) await checkPublication("dist", publicar);
      },
      transformIndexHtml(html) {
        if (!publicar)
          html = html
            .replace(/<meta\b[^>]*\bname=["']robots["'][^>]*>/gi, "")
            .replace(
              "</head>",
              '<meta name="robots" content="noindex,nofollow"></head>',
            );
        html = html
          .replace("__NAV__", readFileSync("src/partials/nav.html", "utf8"))
          .replace(
            "__FOOTER__",
            readFileSync("src/partials/footer.html", "utf8"),
          );
        const values: Record<string, string> = {
          INVUE_NAV_DESKTOP: invueActiva
            ? '<a class="dark-focus text-teal-claro hover:underline" href="/invue">Para comercios</a>'
            : "",
          INVUE_NAV_MOBILE: invueActiva
            ? '<a class="min-h-11 text-xl dark-focus text-teal-claro" href="/invue">Para comercios</a>'
            : "",
          INVUE_CARD: invueActiva
            ? '<a class="dark-focus flex items-center justify-between gap-4 rounded-3xl border border-white/20 bg-white/[.06] p-6 font-heading text-xl font-bold lg:col-span-2" href="/invue">Soluciones para comercios · InVue<i data-lucide="arrow-up-right" aria-hidden="true"></i></a>'
            : "",
          WA_GENERAL: whatsappUrl("general")!,
          WA_INVUE: whatsappUrl("general", "invue")!,
          EMAIL_INVUE: emailUrl("invue"),
          SITE_URL: site.url,
          EMAIL: site.email,
          RIGHTS_EMAIL: site.rightsEmail,
          PRIVACY_VERSION: site.legal.privacyVersion,
          TERMS_VERSION: site.legal.termsVersion,
          YEAR: String(new Date().getFullYear()),
        };
        return html.replace(
          /__([A-Z_]+)__/g,
          (_, key: string) => values[key] ?? _,
        );
      },
    },
  ],
  build: {
    rolldownOptions: {
      input: [
        "index.html",
        "privacidad.html",
        "terminos.html",
        "404.html",
        ...(invueActiva ? ["invue.html"] : []),
      ],
    },
  },
});

import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { site, whatsappUrl } from "./src/config.ts";
import {
  publicationFlag,
  checkPublication,
} from "./scripts/check-publication.mjs";
const publicar = publicationFlag();
let isBuild = false;
export default defineConfig({
  plugins: [
    tailwindcss(),
    {
      name: "site-config",
      configResolved(config) {
        isBuild = config.command === "build";
      },
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "robots.txt",
          source: publicar
            ? `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`
            : "User-agent: *\nDisallow: /\n",
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
          WA_GENERAL: whatsappUrl("general")!,
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
      input: ["index.html", "privacidad.html", "terminos.html", "404.html"],
    },
  },
});

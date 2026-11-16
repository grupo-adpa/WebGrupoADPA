import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { site, whatsappUrl } from "./src/config.ts";
export default defineConfig({
  plugins: [
    tailwindcss(),
    {
      name: "site-config",
      transformIndexHtml(html) {
        const values: Record<string, string> = {
          WA_GENERAL: whatsappUrl("general")!,
          SITE_URL: site.url,
          EMAIL: site.email,
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

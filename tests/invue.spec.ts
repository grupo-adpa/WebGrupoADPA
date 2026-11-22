import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { site } from "../src/config";
const active = process.env.INVUE_ACTIVA === "true";
const whatsapp =
  "https://wa.me/50433039319?text=" +
  encodeURIComponent(
    "Hola, quiero información sobre las soluciones InVue para mi tienda",
  );
const email = "mailto:info@grupoadpa.com?subject=Soluciones%20InVue";

test("bandera InVue: rutas, sitemap y enlaces", async ({ page, request }) => {
  for (const path of ["/invue", "/invue.html"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(active ? 200 : 404);
  }
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap.includes("/invue")).toBe(active);
  for (const path of [
    "/",
    "/privacidad.html",
    "/terminos.html",
    "/no-existe",
  ]) {
    await page.goto(path);
    await expect(page.locator('a[href="/invue"]')).toHaveCount(
      active ? (path === "/" ? 3 : 2) : 0,
    );
  }
});

test.describe("InVue activa", () => {
  test.skip(!active, "La página se excluye del build por defecto");
  for (const width of [360, 768, 1280]) {
    test(`contenido y accesibilidad a ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      const errors: string[] = [];
      const remote: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      page.on("request", (r) => {
        if (!r.url().startsWith("http://127.0.0.1:4173")) remote.push(r.url());
      });
      const response = await page.goto("/invue");
      expect(response?.status()).toBe(200);
      expect(response?.headers()["content-security-policy"]).not.toContain(
        "unsafe-inline",
      );
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveTitle(
        "Seguridad para exhibir productos en tu tienda | InVue en Honduras | Grupo ADPA",
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        "https://www.grupoadpa.com/invue",
      );
      await expect(page.locator("h1")).toHaveText(
        "Exhibe sin miedo. Vende más.",
      );
      await expect(page.locator("#para-quien article")).toHaveCount(6);
      await expect(page.locator("#soluciones article")).toHaveCount(6);
      await expect(page.locator("#onekey li")).toHaveCount(3);
      await expect(page.locator("form")).toHaveCount(0);
      const body = await page.locator("body").innerText();
      expect(body.match(/\[FOTO PENDIENTE:/g)).toHaveLength(7);
      expect(body.match(/\[DATO A CONFIRMAR:/g)).toHaveLength(3);
      for (const name of ["OnePOD", "OneKEY", "Access Manager"])
        expect(body.split(`${name}™`)).toHaveLength(2);
      expect(body).toContain(
        "Grupo ADPA, distribuidor autorizado de InVue en Honduras.",
      );
      expect(body).not.toContain("distribuidor exclusivo");
      expect(body).not.toContain("SCB Comercial");
      for (const img of await page.locator("img").all())
        await expect(img).toHaveAttribute(
          "src",
          /\/brand\/(negativo-|logo-prueba-)/,
        );
      for (const link of await page.locator("[data-whatsapp]").all())
        await expect(link).toHaveAttribute("href", whatsapp);
      await expect(page.locator("[data-email]")).toHaveAttribute("href", email);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      await page
        .getByRole("link", { name: "Ver soluciones", exact: true })
        .click();
      await expect(page).toHaveURL(/\/invue#soluciones$/);
      await page.goto("/invue");
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: testInfo.outputPath(`invue-${width}.png`),
        fullPage: true,
      });
      for (const section of [
        "invue-hero",
        "para-quien",
        "soluciones",
        "onekey",
        "por-que",
        "contacto-invue",
      ]) {
        await page
          .locator(`#${section}`)
          .screenshot({ path: testInfo.outputPath(`${section}-${width}.png`) });
      }
      expect(remote).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
  test("navegación por teclado desde portada y dentro de InVue", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menú" }).press("Enter");
    const link = page
      .getByRole("dialog")
      .getByRole("link", { name: "Para comercios" });
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL("/invue");
    const open = page.getByRole("button", { name: "Abrir menú" });
    await open.press("Enter");
    const dialog = page.getByRole("dialog");
    expect(
      (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
        .violations,
    ).toEqual([]);
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press(i < 6 ? "Tab" : "Shift+Tab");
      expect(
        await dialog.evaluate((el) => el.contains(document.activeElement)),
      ).toBeTruthy();
    }
    await page.keyboard.press("Escape");
    await expect(open).toBeFocused();
    const solutions = page.getByRole("link", {
      name: "Ver soluciones",
      exact: true,
    });
    await solutions.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#soluciones$/);
  });
  test("contenido y contactos sin JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/invue");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content", "noindex,nofollow",
    );
    await expect(
      page.getByRole("link", { name: `WhatsApp +${site.whatsapp.general}` }),
    ).toHaveAttribute("href", whatsapp);
    await expect(
      page.getByRole("link", { name: "Solicita una asesoría" }),
    ).toHaveAttribute("href", whatsapp);
    await expect(page.locator("[data-email]")).toHaveAttribute("href", email);
    await context.close();
  });
});

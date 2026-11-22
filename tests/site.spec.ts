import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [360, 768, 1280]) {
  test(`sitio accesible y sin desbordamiento a ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("h1")).toHaveText(
      "Todo lo que tu espacio necesita, en un solo lugar",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await expect(page.locator("form")).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Solicita una cotización" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Términos de uso" }),
    ).toHaveCount(0);
    for (const link of await page.locator("[data-whatsapp]").all())
      await expect(link).toHaveAttribute(
        "href",
        /^https:\/\/wa\.me\/50433039319(\?text=|$)/,
      );
    await expect(page.locator("[data-email]")).toHaveAttribute(
      "href",
      "mailto:info@grupoadpa.com",
    );
    await expect(page.locator("[data-rights]")).toHaveAttribute(
      "href",
      "mailto:info@grupoadpa.com",
    );
    await expect(page.getByText("Redes sociales:")).toHaveCount(0);
    expect(
      await page
        .locator("h1")
        .evaluate((el) => getComputedStyle(el).fontFamily),
    ).toContain("Manrope");
    for (const image of await page.locator("img").all())
      expect(
        await image.evaluate((el) => (el as HTMLImageElement).naturalWidth),
      ).toBeGreaterThan(0);
    await page.screenshot({
      path: testInfo.outputPath(`portada-${width}.png`),
    });
    for (const section of ["soporte", "trabajos", "contacto"]) {
      await page
        .locator(`#${section}`)
        .screenshot({ path: testInfo.outputPath(`${section}-${width}.png`) });
    }

    await page
      .locator("#construccion")
      .screenshot({ path: testInfo.outputPath(`servicios-${width}.png`) });
    await page.screenshot({
      path: testInfo.outputPath(`pagina-${width}.png`),
      fullPage: true,
    });
    expect(errors).toEqual([]);
    expect(await page.context().cookies()).toEqual([]);
    expect(
      await page.evaluate(() => [localStorage.length, sessionStorage.length]),
    ).toEqual([0, 0]);
  });
}
test("menú móvil: teclado, foco atrapado, Escape y navegación", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const open = page.getByRole("button", { name: "Abrir menú" });
  await open.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((el) => el.contains(document.activeElement)),
    ).toBeTruthy();
  }
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(open).toBeFocused();
  await open.press("Enter");
  await dialog.getByRole("link", { name: "Soporte técnico" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page).toHaveURL(/#soporte$/);
});
for (const path of ["/privacidad.html", "/terminos.html", "/no-existe"]) {
  test(`página auxiliar ${path}`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(path === "/no-existe" ? 404 : 200);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
        .violations,
    ).toEqual([]);
    await page.getByRole("link", { name: "Volver al inicio" }).click();
    await expect(page).toHaveURL("/");
  });
}
test("contactos y contenido funcionan sin JavaScript y sin recursos externos", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const remote: string[] = [];
  page.on("request", (req) => {
    if (!req.url().startsWith("http://127.0.0.1:4173")) remote.push(req.url());
  });
  const response = await page.goto("/");
  expect(response?.headers()["content-security-policy"]).not.toContain(
    "unsafe-inline",
  );
  await expect(page.locator("h1")).toBeVisible();
  await expect(
    page.locator('[aria-labelledby="hero-title"] [data-whatsapp]'),
  ).toHaveAttribute("href", /^https:\/\/wa\.me\/50433039319(\?text=|$)/);
  await expect(page.locator("[data-email]")).toHaveAttribute(
    "href",
    "mailto:info@grupoadpa.com",
  );
  expect(remote).toEqual([]);
  await context.close();
});

test("todas las páginas de revisión impiden indexación", async ({
  page,
  request,
}) => {
  for (const path of [
    "/",
    "/privacidad.html",
    "/terminos.html",
    "/no-existe",
  ]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex,nofollow",
    );
  }
  expect(await (await request.get("/robots.txt")).text()).toBe(
    "User-agent: *\nDisallow: /\n",
  );
});
for (const width of [360, 768, 1280]) {
  test(`mosaico sin celdas vacías a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const filled = await page.locator("#construction-grid").evaluate((grid) => {
      const cards = [...grid.children].map((el) => el.getBoundingClientRect());
      const startsX = [...new Set(cards.map((r) => Math.round(r.left)))];
      const startsY = [...new Set(cards.map((r) => Math.round(r.top)))];
      return startsX.every((x) =>
        startsY.every((y) =>
          cards.some(
            (r) =>
              r.left <= x + 2 &&
              r.right > x + 2 &&
              r.top <= y + 2 &&
              r.bottom > y + 2,
          ),
        ),
      );
    });
    expect(filled).toBeTruthy();
    await expect(page.locator("#trabajos h2")).toHaveText(
      "Algunos trabajos de Grupo ADPA",
    );
  });
}

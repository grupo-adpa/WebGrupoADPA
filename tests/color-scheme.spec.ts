import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";

// Comprueba también texto que axe pueda omitir al encontrar un degradado.
// En las fotos provisionales se usa el fondo del marcador: el velo marino
// solo aumenta su contraste con el texto claro y se conserva sin cambios.
async function textContrast(page: Page) {
  return page.evaluate(() => {
    const ctx = document.createElement("canvas").getContext("2d")!;
    function rgba(color: string) {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data];
    }
    function over(front: number[], back: number[]) {
      const a = front[3] / 255;
      return front.slice(0, 3).map((v, i) => v * a + back[i] * (1 - a));
    }
    function luminance(color: number[]) {
      const linear = color.map((c) => {
        const v = c / 255;
        return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    }
    const failures: { text: string; ratio: number; required: number }[] = [];
    let minimum = Infinity;
    let checked = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const el = node.parentElement;
      if (!el || !node.textContent?.trim() || !el.checkVisibility()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const bounds = range.getBoundingClientRect();
      if (!bounds.width) continue;
      const style = getComputedStyle(el);
      const chain: Element[] = [];
      for (let ancestor: Element | null = el; ancestor; ancestor = ancestor.parentElement)
        chain.unshift(ancestor);
      // La barra transparente es hermana del héroe y se pinta sobre él.
      const header = el.closest("header");
      const hero = document.querySelector("main > .photo-placeholder");
      if (header && hero && getComputedStyle(header.parentElement!).position === "absolute")
        chain.splice(chain.indexOf(document.body) + 1, 0, hero);
      let background = rgba(getComputedStyle(document.body).backgroundColor);
      const signature = document.querySelector<HTMLCanvasElement>(".signature-background");
      const signatureContext = signature?.getContext("2d");
      if (signature && signatureContext) {
        const x = Math.max(0, Math.min(signature.width - 1,
          Math.round((bounds.left + bounds.width / 2) * signature.width / innerWidth)));
        const y = Math.max(0, Math.min(signature.height - 1,
          Math.round((bounds.top + bounds.height / 2) * signature.height / innerHeight)));
        background = [...over([...signatureContext.getImageData(x, y, 1, 1).data], background), 255];
      }
      for (const ancestor of chain)
        background = [...over(rgba(getComputedStyle(ancestor).backgroundColor), background), 255];
      const foreground = over(rgba(style.color), background);
      const light = luminance(foreground);
      const dark = luminance(background.slice(0, 3));
      const ratio = (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05);
      const size = parseFloat(style.fontSize);
      const large = size >= 24 || (size >= 18.6667 && parseInt(style.fontWeight) >= 700);
      const required = large ? 3 : 4.5;
      checked++;
      minimum = Math.min(minimum, ratio);
      if (ratio < required)
        failures.push({ text: node.textContent.trim(), ratio, required });
    }
    return { checked, minimum, failures };
  });
}

const pages = ["/", "/privacidad.html", "/terminos.html", "/no-existe",
  ...(process.env.INVUE_ACTIVA === "true" ? ["/invue"] : [])];

for (const width of [360, 1280]) {
  test(`tema oscuro: contraste, axe y capturas a ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of pages) {
      const response = await page.goto(path);
      expect(response?.headers()["content-security-policy"]).not.toContain("unsafe-inline");
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("body")).toHaveCSS("background-color", "rgb(9, 34, 57)");
      await expect(page.locator(".signature-background")).toBeVisible();
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
      const report = await textContrast(page);
      expect(report.checked).toBeGreaterThan(10);
      expect(report.failures).toEqual([]);
      const name = path === "/" ? "portada" : path.replace(/\W/g, "-");
      const reportPath = testInfo.outputPath(`${name}-oscuro-${width}-contraste.json`);
      await writeFile(reportPath, JSON.stringify(report, null, 2));
      await testInfo.attach(`${name}-contraste`, { path: reportPath, contentType: "application/json" });
      await page.screenshot({ path: testInfo.outputPath(`${name}-oscuro-${width}.png`), fullPage: true });
      // Verificar también estados interactivos: texto, fondo y foco.
      for (const button of await page.locator("main a.btn-outline, main a.btn-dark, main a.btn-primary, main a.hover\\:bg-teal-claro").all()) {
        const outline = await button.evaluate((element) => element.classList.contains("btn-outline"));
        const onTeal = outline && await button.evaluate((element) => Boolean(element.closest(".bg-teal")));
        const backgroundBeforeHover = await button.evaluate((element) => getComputedStyle(element).backgroundColor);
        await button.focus();
        await expect(button).toHaveCSS("outline-width", "3px");
        await button.hover();
        if (outline) {
          const backgroundAfterHover = await button.evaluate((element) => getComputedStyle(element).backgroundColor);
          expect(backgroundAfterHover).not.toBe(backgroundBeforeHover);
          await expect(button).toHaveCSS("background-color", onTeal ? "rgb(9, 34, 57)" : "rgb(255, 255, 255)");
          await expect(button).toHaveCSS("color", onTeal ? "rgb(255, 255, 255)" : "rgb(9, 34, 57)");
        }
        expect((await textContrast(page)).failures).toEqual([]);
      }
    }
    if (width === 360) {
      await page.goto("/");
      await page.getByRole("button", { name: "Abrir menú" }).click();
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
      await page.getByRole("button", { name: "Cerrar menú" }).press("Escape");
      await expect(page.getByRole("button", { name: "Abrir menú" })).toBeFocused();
    }
  });
}

test("la preferencia del sistema y data-theme no crean una variante clara", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(9, 34, 57)");
  await expect(page.locator("body")).toHaveCSS("color", "rgb(255, 255, 255)");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(9, 34, 57)");
  await expect(page.locator("body")).toHaveCSS("color", "rgb(255, 255, 255)");
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(9, 34, 57)");
  await expect(page.locator("body")).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
});

test("el tema oscuro funciona sin JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: "light" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("body")).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(9, 34, 57)");
  await context.close();
});

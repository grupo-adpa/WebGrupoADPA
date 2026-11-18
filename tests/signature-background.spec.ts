import { test, expect } from "@playwright/test";

test("el fondo es fijo, no interactivo y reduce su densidad en teléfono", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const background = page.locator(".signature-background");
  await expect(background).toHaveAttribute("aria-hidden", "true");
  await expect(background).toHaveAttribute("data-density", "16");
  await expect(background).toHaveCSS("position", "fixed");
  await expect(background).toHaveCSS("pointer-events", "none");
  await expect(background).toHaveCSS("z-index", "-1");
  await expect(page.locator("body")).toHaveCSS("isolation", "isolate");

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(background).toHaveAttribute("data-density", "32");
});

test("reduced-motion conserva un cuadro estático y acentos sin animación", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const background = page.locator(".signature-background");
  await expect(background).toHaveAttribute("data-motion", "static");
  const initialFrames = await background.getAttribute("data-frames");
  await page.waitForTimeout(150);
  await expect(background).toHaveAttribute("data-frames", initialFrames!);

  const construction = page.locator("#construccion article").first();
  await construction.hover();
  await expect(background).toHaveAttribute("data-pattern", "construction");
  await page.locator("footer").hover();
  await expect(background).toHaveAttribute("data-pattern", "base");
});

test("la animación se pausa cuando la página queda oculta", async ({ page }) => {
  await page.goto("/");
  const background = page.locator(".signature-background");
  await expect(background).toHaveAttribute("data-motion", "running");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(background).toHaveAttribute("data-motion", "paused");
  const pausedFrames = await background.getAttribute("data-frames");
  await page.waitForTimeout(150);
  await expect(background).toHaveAttribute("data-frames", pausedFrames!);

  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(background).toHaveAttribute("data-motion", "running");
  await expect.poll(async () => background.getAttribute("data-frames")).not.toBe(pausedFrames);
});

test("hover y toque activan el acento del servicio y vuelven al patrón base", async ({
  page,
}) => {
  await page.goto("/");
  const background = page.locator(".signature-background");
  const construction = page.locator("#construccion article").first();
  await construction.hover();
  await expect(background).toHaveAttribute("data-pattern", "construction");
  await page.locator("footer").hover();
  await expect(background).toHaveAttribute("data-pattern", "base");

  const support = page.locator("#soporte article").first();
  await support.dispatchEvent("pointerdown", { pointerType: "touch" });
  await expect(background).toHaveAttribute("data-pattern", "support");
  await support.dispatchEvent("pointerup", { pointerType: "touch" });
  await expect(background).toHaveAttribute("data-pattern", "base");
});

import "./style.css";
import {
  createIcons,
  House,
  Zap,
  Wind,
  PaintRoller,
  ShieldCheck,
  Wifi,
  Tv,
  Package,
  Building2,
  ArrowUpRight,
  Menu,
  X,
} from "lucide";
import { site, whatsappUrl } from "./config";

createIcons({
  icons: {
    House,
    Zap,
    Wind,
    PaintRoller,
    ShieldCheck,
    Wifi,
    Tv,
    Package,
    Building2,
    ArrowUpRight,
    Menu,
    X,
  },
  attrs: { "aria-hidden": "true", "stroke-width": 1.5 },
});
for (const link of document.querySelectorAll<HTMLAnchorElement>(
  "[data-whatsapp]",
)) {
  const channel = link.dataset.whatsapp as keyof typeof site.whatsapp;
  const url = whatsappUrl(channel);
  if (url) link.href = url;
}
for (const link of document.querySelectorAll<HTMLAnchorElement>("[data-email]"))
  link.href = `mailto:${site.email}`;
for (const el of document.querySelectorAll("[data-year]"))
  el.textContent = String(new Date().getFullYear());
for (const el of document.querySelectorAll("[data-privacy-version]"))
  el.textContent = site.legal.privacyVersion;
for (const el of document.querySelectorAll("[data-terms-version]"))
  el.textContent = site.legal.termsVersion;
for (const el of document.querySelectorAll<HTMLElement>("[data-terms-link]"))
  el.hidden = !site.TERMINOS_ACTIVOS;
const dialog = document.querySelector<HTMLDialogElement>("#mobile-menu");
const open = document.querySelector<HTMLButtonElement>("#open-menu");
open?.addEventListener("click", () => {
  dialog?.showModal();
  open.setAttribute("aria-expanded", "true");
});
document
  .querySelector("#close-menu")
  ?.addEventListener("click", () => dialog?.close());
dialog?.addEventListener("close", () => {
  open?.setAttribute("aria-expanded", "false");
});
for (const link of dialog?.querySelectorAll("a") ?? [])
  link.addEventListener("click", () => dialog?.close());
// La navegación sigue funcionando al pasar del menú móvil a escritorio.
window.matchMedia("(min-width: 1000px)").addEventListener("change", (event) => {
  if (event.matches) dialog?.close();
});

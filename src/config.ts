// Única fuente de contacto, versiones legales y banderas del sitio.
export const site = {
  url: "https://www.grupoadpa.com",
  email: "info@grupoadpa.com",
  whatsapp: { general: "50433039319", shipx: "", yatta: "" },
  // Sin mensaje prefijado hasta la confirmación del responsable.
  messages: { general: "", shipx: "", yatta: "" },
  rightsEmail: "info@grupoadpa.com",
  legal: { privacyVersion: "[PENDIENTE]", termsVersion: "[PENDIENTE]" },
  FORMULARIO_ACTIVO: false,
  TERMINOS_ACTIVOS: false,
} as const;
export function whatsappUrl(
  channel: keyof typeof site.whatsapp,
): string | null {
  const phone = site.whatsapp[channel];
  if (!phone) return null;
  const message = site.messages[channel];
  return `https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

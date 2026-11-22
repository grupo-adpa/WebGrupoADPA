// Única fuente de contacto, versiones legales y banderas del sitio.
export const site = {
  url: "https://www.grupoadpa.com",
  email: "info@grupoadpa.com",
  whatsapp: { general: "50433039319", shipx: "", yatta: "" },
  // El mensaje de InVue está aprobado en contenido-pagina-invue.md.
  messages: {
    general:
      "Gracias por contactar a Grupo ADPA. Dinos en qué servicio estás interesado y pronto te responderemos tu pregunta.",
    shipx: "",
    yatta: "",
    invue: "Hola, quiero información sobre las soluciones InVue para mi tienda",
  },
  emailSubjects: { invue: "Soluciones InVue" },
  INVUE_ACTIVA: false,
  rightsEmail: "info@grupoadpa.com",
  legal: {
    privacyVersion: "2026-11-adpa",
    termsVersion: "2026-11-adpa-terminos",
  },
  FORMULARIO_ACTIVO: false,
  TERMINOS_ACTIVOS: false,
} as const;
export function whatsappUrl(
  channel: keyof typeof site.whatsapp,
  messageKey: keyof typeof site.messages = channel,
): string | null {
  const phone = site.whatsapp[channel];
  if (!phone) return null;
  const message = site.messages[messageKey];
  return `https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export function emailUrl(subject?: keyof typeof site.emailSubjects): string {
  return `mailto:${site.email}${subject ? `?subject=${encodeURIComponent(site.emailSubjects[subject])}` : ""}`;
}

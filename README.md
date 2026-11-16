# WebGrupoADPA — PR 1 de 2

Sitio estático preliminar de Grupo ADPA: Vite, TypeScript y Tailwind compilado. La fuente de requisitos es `gadpa-platform/main` (`AGENTS.md`, `docs/brief-chatgpt-sitio-grupoadpa.md`, `docs/design.md` y la referencia visual), revisada el 16/11/2026. Este repositorio no modifica la plataforma.

## Desarrollo y comprobaciones

Requiere Node 26.13.1 o posterior (`.nvmrc`).

```sh
npm ci
npm run dev
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm test
npm run lighthouse
gitleaks git --redact --no-banner
```

`dev` y `preview` escuchan exclusivamente en 127.0.0.1. Playwright levanta la salida estática con los mismos encabezados CSP de Nginx, revisa accesibilidad con axe, teclado, menú modal, contacto sin JavaScript, ausencia de formulario, 404 y desbordamiento a 360/768/1280 px. Las capturas quedan en `test-results/`. Lighthouse ejecuta tres mediciones móviles y exige ≥90 en las cuatro categorías; se puede indicar `CHROME_PATH` si Chrome no está instalado en una ruta habitual. CI publica sus reportes como artefactos.

## Alcance de esta entrega

- Portada, construcción/remodelación, soporte técnico, divisiones, software y contacto.
- WhatsApp general confirmado por la presentación: +504 3303-9319; correo: info@grupoadpa.com.
- Navegación mediante anclas y menú móvil nativo `<dialog>`; fuentes locales, PNG optimizado y formas SVG propias de menos de 6 KB.
- Aviso de privacidad, términos provisionales y 404; metadatos sociales, sitemap y robots. Páginas legales provisionales con `noindex`.
- Sin rastreadores, cookies de seguimiento ni almacenamiento de datos personales.
- `FORMULARIO_ACTIVO: false` en `src/config.ts`; PR 1 no incluye implementación del formulario ni envía solicitudes a `/api/leads`.

El **PR 2** implementará el formulario con bandera de build, contratos de leads, consentimiento, simulador exclusivo de desarrollo y pruebas de respuestas/errores/reintentos. Cambiar ahora `FORMULARIO_ACTIVO` no activa un formulario. `TERMINOS_ACTIVOS` queda en false y no debe activarse hasta completar el texto y su integración en PR 2.

## Identidad y configuración

`src/config.ts` centraliza contactos, mensajes y versiones legales. Vite inyecta los contactos en HTML para que funcionen sin JavaScript. No se inventaron mensajes prefijados ni números de divisiones: esos CTA llevan al contacto general, con el pendiente visible.

El PNG positivo suministrado por el responsable se redujo sin redibujar ni recolorear, conserva transparencia y se usa solo sobre superficies claras. El favicon provisional es el logo completo reducido; no se inventó el monograma. El Open Graph es una composición del mismo PNG sobre lienzo claro. El monograma de Yatta proviene de `gadpa-platform/docs/marca/yatta/yatta-monograma.svg`. No se usan fotos ni logos de terceros sin autorización.

Se fijan todas las dependencias directas, incluido Vite 8.3.8, TypeScript 6.0.3, ESLint 10.14.0 y typescript-eslint 8.72.2. Los overrides fijan minimatch 11.0.8 y basic-ftp 6.2.6 para corregir los avisos de seguridad de dependencias indirectas sin cambiar las versiones solicitadas. Mantenerlos bajo revisión al actualizar las herramientas. Las fuentes Inter y Hedvig Letters Serif conservan su licencia OFL dentro de sus paquetes; Lucide es ISC.

## Despliegue previsto, sin publicar en este PR

```sh
docker build -t web-grupoadpa .
# Configurar PROXY_NETWORK solo cuando el responsable confirme la red.
docker compose config
docker compose up -d
```

Nginx 1.30.2-alpine fijado también por digest, CSP sin `unsafe-inline`, encabezados en respuestas normales y errores, caché anual exclusiva de assets con hash. No hay puertos publicados en Compose y la única red es la del proxy. `PROXY_NETWORK` sin configurar provoca un error explícito: su valor sigue **[PENDIENTE]**. No usar `evolution_default` ni redes con bases de datos. HTTPS, HSTS y el reenvío futuro de `/api/*` son responsabilidad del proxy. No se ha accedido a QA ni producción.

## Pendientes para revisión/publicación

| Marcador                                        | Ubicación / tratamiento                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------ |
| `[LOGO PENDIENTE: ShipX]`                       | Tarjeta ShipX, visible                                                   |
| `[LOGO PENDIENTE: ADPA negativo y monograma g]` | Sin versión negativa sobre oscuro; favicon provisional con logo completo |
| `[TEXTO PENDIENTE: presentación de Yatta]`      | Tarjeta Yatta                                                            |
| `[TEXTO PENDIENTE: Facturación Otis]`           | Software                                                                 |
| `[TEXTO PENDIENTE: Adpabill360]`                | Software                                                                 |
| `[TEXTO PENDIENTE: aviso de privacidad]`        | Privacidad; versión y vigencia pendientes                                |
| `[TEXTO PENDIENTE: términos de uso]`            | Página creada, enlace desactivado                                        |
| `[CORREO PENDIENTE]`                            | Canal de derechos en pie y privacidad; no se inventa un mailto           |
| `[PENDIENTE: WhatsApp de ShipX / Yatta]`        | Divisiones; acceso al contacto general mientras se confirman             |
| `[PENDIENTE: mensajes de WhatsApp por sección]` | Configuración vacía; enlace directo sin mensaje inventado                |
| `[PENDIENTE: redes sociales]`                   | Pie                                                                      |
| `[LISTA PENDIENTE: marcas autorizadas]`         | Tira omitida por completo mientras no exista autorización                |
| `[URL PENDIENTE: Correduría Deras]`             | No se publica el enlace ni se presenta como división                     |
| `[PENDIENTE: red exclusiva del proxy]`          | Compose / variable PROXY_NETWORK                                         |
| `[PENDIENTE: aprobación visual]`                | Formas orgánicas, lienzo y bruma según design.md                         |

Los textos legales deben ser entregados y revisados por el responsable y su abogado antes de publicación. La revisión de cada PR por Claude Code (`revisor-sitios`) queda a cargo del flujo del responsable.

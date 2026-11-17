# WebGrupoADPA — rediseño v2 (PR 3)

Sitio estático con Vite 8.3.8, TypeScript y Tailwind compilado. `gadpa-platform/docs/design.md` v2 es la fuente visual. El rediseño conserva CSP estricta, check-dist, build multipágina y las comprobaciones técnicas del PR #2.

## Desarrollo y validación

Node ≥26.13.1 (`.nvmrc`), versiones directas fijadas y lockfile versionado:

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

`dev`/`preview` solo escuchan en 127.0.0.1. El servidor de Playwright sirve `dist` con la CSP de Nginx. Pruebas: navegación y foco del menú, axe, contacto sin JavaScript, contenido v2, imágenes válidas, 404, ausencia de formulario y desbordamiento a 360/768/1280 px. CI conserva capturas y reportes durante 14 días. Lighthouse mide tres veces y exige ≥90 en las cuatro categorías. En macOS el sandbox puede impedir abrir Chromium: el CI ejecuta las pruebas en Linux.

## Diseño y contenido pendiente

Manrope 700/800 e Inter se alojan localmente desde Fontsource. La maquetación usa clases Tailwind compiladas; los tokens, fuentes y utilidades para rayado/velo se definen en `src/style.css`. La navegación y el pie se comparten en `src/partials`, incluidos en HTML durante el build. Contactos y versiones legales salen de `src/config.ts`. `rightsEmail` es `info@grupoadpa.com`.

Los logos provisionales positivo/negativo provienen de `gadpa-platform/docs/marca/grupoadpa/`; se convierten a WebP lossless para 1x/2x sin recolorear. Barra y pie usan el negativo; favicon e iconos provienen del monograma oficial provisional. Los vectores finales continúan pendientes. No se reutilizan el monograma de Yatta ni el PNG/favicon de la entrega anterior.

Este PR es un **borrador visual para revisión, no publicable**: incluye las posiciones de cifras y proyectos con marcadores, siguiendo la petición del responsable. Antes de publicar, confirmar contenido o retirar esas secciones y sus enlaces. No se han autorizado fotos, cifras, proyectos ni textos legales. No se utilizan fotos de banco.

Pendientes visibles:

- `[FOTO PENDIENTE]`: obra del héroe, obra civil, electricidad, aire acondicionado, instalación de cámaras/red y tres proyectos.
- `[CIFRA PENDIENTE]`: años, proyectos y ciudades.
- `[TEXTO PENDIENTE]`: nombre/tipo/ciudad de cada proyecto, detalles de los pasos 2–4, Facturación Otis, Adpabill360, aviso de privacidad y términos.
- `[PENDIENTE]`: versiones legales y red exclusiva del proxy.
- `[LOGO PENDIENTE]`: vectores definitivos (documentado; los provisionales ya están integrados).
- `[LISTA PENDIENTE]`: marcas autorizadas; no se muestra la tira de logos.
- `[URL PENDIENTE]`: Correduría Deras; no se publica como división ni se incluye enlace.

ShipX y Yatta están en pausa: solo enlaces discretos al contacto general. No hay redes sociales. Términos permanecen sin enlazar mientras `TERMINOS_ACTIVOS=false`; las maquetas no cambian esa regla del brief. No se incorporó el documento de textos propuestos porque sus partes requieren aprobación explícita.

## Seguridad del contenedor y CI

Ver [evidencia de SHA, digests e identidad](docs/verificacion-dependencias.md). Dockerfile fija Node y Nginx por tag y digest. El runtime usa usuario `nginx` sin capacidades, escucha internamente en 8080 y funciona con raíz de solo lectura. Los únicos directorios temporales de escritura son `/var/cache/nginx` y `/var/run` en tmpfs.

Compose no publica puertos. `PROXY_NETWORK` debe identificar exclusivamente la red del proxy; sigue `[PENDIENTE]` y la ausencia de valor falla explícitamente. Nunca usar `evolution_default` ni redes con bases de datos. HTTPS, HSTS y el eventual reenvío de `/api/*` corresponden al proxy. `docker-compose.ci.yml` añade un puerto de loopback solo para el runner. CI prueba el Compose real con las restricciones activas y una red efímera; no toca QA/producción.

## Si npm audit falla por un aviso ajeno al cambio

No desactivar el chequeo, ignorar el aviso ni ejecutar `npm audit fix --force` para poner el PR en verde. Guardar el advisory y la cadena afectada con `npm audit --json` / `npm explain <paquete>`; comprobar si existe también con el lockfile de main en un checkout separado. Documentar versión afectada, alcance (build o runtime), corrección disponible y el resultado de la comparación. Aplicar una actualización u override mínimo y probado si respeta las versiones acordadas; si exige cambiar ese acuerdo, dejar el bloqueo documentado y pedir decisión al responsable. Un fallo preexistente no se presenta como validación aprobada. Los overrides actuales de minimatch y basic-ftp corrigen dependencias indirectas y deben revisarse cuando se actualicen las herramientas.

## Entregas siguientes

PR 4: `/invue`, separado y con bandera apagada por defecto, solo después de abrir el PR 3 y dejarlo en verde. PR 5: formulario y contratos de leads. `FORMULARIO_ACTIVO=false` continúa sin implementación; no se modifica en este rediseño. No se despliega desde estos PR.

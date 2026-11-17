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
- `[TEXTO PENDIENTE]`: nombre/tipo/ciudad de cada proyecto, Facturación Otis, Adpabill360, aviso de privacidad y términos.
- `[PENDIENTE]`: versiones legales y red exclusiva del proxy.
- `[LOGO PENDIENTE]`: vectores definitivos (documentado; los provisionales ya están integrados).
- `[LISTA PENDIENTE]`: marcas autorizadas; no se muestra la tira de logos.
- `[URL PENDIENTE]`: Correduría Deras; no se publica como división ni se incluye enlace.

ShipX y Yatta están en pausa: solo enlaces discretos al contacto general. No hay redes sociales. Términos permanecen sin enlazar mientras `TERMINOS_ACTIVOS=false`; las maquetas no cambian esa regla del brief. No se incorporó el documento de textos propuestos porque sus partes requieren aprobación explícita.

## Seguridad del contenedor y CI

Ver [evidencia de SHA, digests e identidad](docs/verificacion-dependencias.md). Dockerfile fija Node y Nginx por tag y digest. El runtime usa usuario `nginx` sin capacidades, escucha internamente en 8080 y funciona con raíz de solo lectura. Los únicos directorios temporales de escritura son `/var/cache/nginx` y `/var/run` en tmpfs.

Compose no publica puertos. `PROXY_NETWORK` debe identificar exclusivamente la red del proxy; sigue `[PENDIENTE]` y la ausencia de valor falla explícitamente. Nunca usar `evolution_default` ni redes con bases de datos. HTTPS, HSTS y el eventual reenvío de `/api/*` corresponden al proxy. `docker-compose.ci.yml` añade un puerto de loopback solo para el runner. CI prueba el Compose real con las restricciones activas y una red efímera; no toca QA/producción.

## Política de npm audit

Aprobada por el responsable el 17/11/2026. El job independiente `audit` ejecuta
`npm audit --omit=dev --audit-level=moderate` como control bloqueante de las
dependencias de producción y `npm run audit:dev` para el informe completo.
`quality` depende de `audit` y de todas las validaciones: un fallo de audit no
impide obtener lint, tipos, build, check-dist, Playwright/axe, Lighthouse,
gitleaks ni las pruebas del contenedor, pero sí impide el verde global.

`scripts/audit-dev.mjs` no añade dependencias. Ejecuta `npm audit --json` y
resuelve los avisos raíz y sus dependientes transitivos. Cualquier aviso
moderate, high o critical que no tenga una excepción exacta por ID GHSA y
paquete hace fallar el CI. También fallan informes inválidos, errores de npm,
cadenas irresolubles, datos de excepción incompletos y excepciones vencidas.

`audit-exceptions.json` contiene únicamente GHSA-fc5q-39xc-vjpf para picomatch,
con motivo y `vence: "2026-12-17"`. Solo afecta herramientas de build y no hay
versión corregida publicada al aprobar esta excepción. No aplicar override ni
rebajar Vite. Los overrides anteriores de minimatch/basic-ftp no cambian.
La fecha vence al comenzar ese día en America/Tegucigalpa; incluso una excepción
que ya no se use bloquea si venció, para obligar a revisarla o retirarla.

Para agregar o renovar una excepción: registrar el ID, paquete, cadena,
alcance, ausencia de corrección compatible y motivo; obtener **aprobación
explícita del responsable**; actualizar el JSON y su fecha mediante PR; ejecutar
`npm run test:policy`, los dos controles de audit y el CI completo. No añadir
excepciones ni extender fechas automáticamente. Si aparece un aviso nuevo,
comparar también contra main y documentar la corrección o decisión pendiente.
Nunca usar `audit fix --force` ni cambiar el umbral para ocultar un fallo.

## Control de publicación

`PUBLICAR` es una bandera de build, `false` por defecto. Con `false` o sin
variable, cada HTML (incluidos legales y 404) lleva un único
`<meta name="robots" content="noindex,nofollow">` y robots.txt contiene
`User-agent: *` / `Disallow: /`. No es control de acceso ni una autorización
para desplegar.

`PUBLICAR=true npm run build` habilita robots.txt y comprueba **todos** los
archivos de dist, incluidos bundles y assets: cualquier `PENDIENTE` o
`DATO A CONFIRMAR` hace fallar el build. El contenido actual debe fallar porque
conserva marcadores solicitados. No se eliminan marcadores automáticamente.
El Dockerfile recibe `PUBLICAR` como argumento de build, también falso por
defecto; cambiar una variable del contenedor ya construido no cambia la salida.

`npm run test:publication` comprueba el fallo publicable con marcadores, el
rechazo de valores inválidos y la salida no indexable tanto explícita como por
defecto, dejando dist en modo revisión. `npm run test:policy` comprueba también
salidas limpias publicables y marcadores en assets. Playwright comprueba las
metas y robots.txt del sitio servido. CI ejecuta estas pruebas.

Lighthouse mantiene ≥90 en sus cuatro categorías. En modo revisión se excluye
únicamente su auditoría `is-crawlable`, incompatible con el noindex obligatorio;
la prohibición de indexar se verifica explícitamente por las pruebas. En modo
PUBLICAR=true esa exclusión desaparece. No se desactiva ninguna otra auditoría.

## Entregas siguientes

PR 4: `/invue`, separado y con bandera apagada por defecto, solo después de abrir el PR 3 y dejarlo en verde. PR 5: formulario y contratos de leads. `FORMULARIO_ACTIVO=false` continúa sin implementación; no se modifica en este rediseño. No se despliega desde estos PR.

## PR 4: página InVue

La fuente es `gadpa-platform/main/docs/contenido-pagina-invue.md` (16/11/2026).
`invue.html` usa la barra, el pie y el sistema v2 del PR 3. El brief prevalece
sobre las capturas: héroe con velo marino, audiencia sobre bruma y soluciones
con dos columnas en tableta y tres en escritorio. No incorpora fotos ni logo
de InVue; los únicos logos son los provisionales autorizados de Grupo ADPA.

`site.INVUE_ACTIVA` es `false` por defecto. Para revisión local, la variable de
build `INVUE_ACTIVA=true` incluye la página, la navegación «Para comercios», la
tarjeta de soporte y el sitemap. No es una bandera que se cambie en el navegador
ni una variable de runtime del contenedor. Se rechazan valores distintos de
`true` o `false`. Cambiarla requiere reconstruir el sitio.

```sh
# Salida predeterminada: /invue y /invue.html responden 404.
npm run build
node scripts/check-invue.mjs false

# Revisión de la página habilitada; no publica ni despliega.
INVUE_ACTIVA=true npm run build
INVUE_ACTIVA=true npm test
INVUE_ACTIVA=true npm run lighthouse

# Prueba true → false → sin variable sobre el mismo dist.
npm run test:invue-build
```

CI prueba las dos variantes con Playwright/axe, Lighthouse y el Nginx real en
Compose. El argumento Docker `INVUE_ACTIVA` también es `false` por defecto;
CI lo pasa al construir la imagen y verifica HTTP 200/404 en ambas rutas.
Los artefactos `revision-sitio-true` y `revision-sitio-false` incluyen los
informes y las capturas a 360, 768 y 1280 px. No hay pasos de despliegue.

El WhatsApp utiliza el número general y `messages.invue`; el correo utiliza
`emailSubjects.invue`. Ambos enlaces funcionan también sin JavaScript.
La página no debe publicarse hasta resolver [sus pendientes](docs/invue-pendientes.md).
El formulario y cualquier cambio del contrato `leads` quedan fuera de este PR.

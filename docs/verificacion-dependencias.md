# Verificación de referencias — PR 3, 16/11/2026

## GitHub Actions

Se consultó `git ls-remote https://github.com/actions/<acción>.git refs/tags/v4 'refs/tags/v4^{}'` contra cada repositorio oficial. Los tags son referencias directas (sin objeto anotado que resolver). Se comparó literalmente la salida con el SHA completo incorporado en `ci.yml`; el comentario conserva `v4`.

| Tag oficial                | SHA verificado                           |
| -------------------------- | ---------------------------------------- |
| actions/checkout v4        | 11d5960a326750d5838078e36cf38b85af677262 |
| actions/setup-node v4      | 49933ea5288caeca8642d1e84afbd3f7d6820020 |
| actions/upload-artifact v4 | ea165f8d65b6e75b540449e92b4886f43607fa02 |

El tag puede moverse en el futuro; el workflow permanece anclado a estos commits. Los runners actuales ejecutan estas acciones con Node 24 y emiten un aviso de deprecación por su declaración original de Node 20; no se cambia de versión mayor dentro de esta corrección.

## Imágenes Docker

Se consultaron los metadatos oficiales de Docker Hub, `https://registry.hub.docker.com/v2/repositories/library/<imagen>/tags/<tag>`, y se comparó su campo `digest` con el Dockerfile. Son digests del índice multiarquitectura, no de una sola arquitectura.

| Tag                 | Digest del índice                                                       |
| ------------------- | ----------------------------------------------------------------------- |
| node:26.13.1-alpine | sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 |
| nginx:1.30.2-alpine | sha256:5f979dcfed4ce6461873f087e8c980d6e29b084b9e8776d9704a7e989b5f4898 |

El CI descarga esas referencias por digest, construye la imagen y ejecuta el Compose endurecido: usuario nginx, puerto interno 8080, raíz de solo lectura, tmpfs para `/var/cache/nginx` y `/var/run`, `cap_drop: [ALL]` y `no-new-privileges`. Verifica configuración de Nginx, HTTP 200/404, CSP y las restricciones del contenedor con `docker inspect`. La red de CI es efímera y aislada; la red real del proxy continúa `[PENDIENTE]`.

## Identidad Git y documentos

La API pública `https://api.github.com/users/adpa-chatgpt` devuelve login `adpa-chatgpt` e ID `357187252`. Autor y committer se fijan localmente como `adpa-chatgpt <357187252+adpa-chatgpt@users.noreply.github.com>` y se verifican con `git var GIT_AUTHOR_IDENT` / `git var GIT_COMMITTER_IDENT` antes de crear commits.

Fuente de diseño: `gadpa-platform/main` en `737e940ebd6565f7fc085b19c2cfb4ccc0e7857e` (PR #12). Se releen AGENTS, brief, design.md v2 y el README de marca. La mención a tokens v1 en el README de marca es histórica; prevalecen los colores de design.md v2. Las imágenes se convierten sin recolorear.

# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Dependencias
# ---------------------------------------------------------------------------
# En una etapa aparte para que Docker reuse la capa de `npm ci` mientras no
# cambien package.json ni el lock: el deploy tarda segundos en vez de minutos.
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# Compilacion
# ---------------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Estas dos se hornean en el build y NO se pueden cambiar despues arrancando el
# contenedor con otro valor:
#
#   BACKEND_URL          queda escrito en .next/routes-manifest.json, porque el
#                        destino de `rewrites` se resuelve al compilar.
#   NEXT_PUBLIC_API_URL  entra al bundle que corre en el navegador.
#
# Por eso en Coolify van marcadas como *Build Variable*. Es la diferencia con el
# backend .NET, donde todas las variables son de runtime.
ARG BACKEND_URL
ARG NEXT_PUBLIC_API_URL=/api/v1/core

ENV BACKEND_URL=$BACKEND_URL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---------------------------------------------------------------------------
# Imagen final
# ---------------------------------------------------------------------------
FROM node:22-alpine AS final
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Sin HOSTNAME=0.0.0.0 el servidor de Next escucha solo en loopback y el proxy
# de Coolify no lo alcanza: el health check falla sin decir por que.

# `output: "standalone"` deja en .next/standalone el servidor mas unicamente las
# dependencias que el trazado detecta, asi que aca no hace falta `node_modules`
# entero. `static` y `public` no entran en ese trazado y se copian aparte.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

# El optimizador de imagenes escribe en .next/cache; con los archivos de root el
# proceso sin privilegios no puede y las peticiones a /_next/image fallan.
RUN mkdir -p .next/cache && chown -R node:node .next

# La imagen de node trae el usuario `node` sin privilegios, igual que el backend
# usa `app`. Nada de correr como root.
USER node

EXPOSE 3000

CMD ["node", "server.js"]

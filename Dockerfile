# syntax=docker/dockerfile:1
#
# Image de l'application pour un serveur propre (VPS).
#
# Trois etages : les dependances, la compilation, puis une image finale qui ne
# contient que le serveur Node autonome produit par `output: 'standalone'`.
# L'image finale ne contient ni le code source, ni les 1,3 Go de node_modules.
#
#   docker compose build
#   docker compose up -d
#
# Voir docs/deploiement/SERVEUR-VPS.md pour la marche a suivre complete.

########################################
# 1. Dependances
########################################
FROM node:22-bookworm-slim AS deps
WORKDIR /app

# better-sqlite3 telecharge un binaire deja compile quand il en existe un pour
# la plateforme ; ces outils ne servent que s'il doit se recompiler lui-meme.
# Ils disparaissent avec cet etage, qui n'est pas dans l'image finale.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# `.npmrc` porte `legacy-peer-deps=true`, sans quoi `npm ci` refuse d'installer.
COPY package.json package-lock.json .npmrc ./
RUN npm ci

########################################
# 2. Compilation
########################################
FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Les variables NEXT_PUBLIC_* sont figees dans le JavaScript envoye au
# navigateur : elles doivent etre connues *ici*, a la compilation, et pas au
# demarrage du conteneur. C'est pourquoi changer d'adresse impose de
# reconstruire l'image (`docker compose build`), pas seulement de la redemarrer.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_OUTPUT=standalone
ENV NEXT_TELEMETRY_DISABLED=1

# `npx next build` plutot que `npm run build` : le script `postbuild` fabrique
# l'archive tar et copie le binaire Node pour l'installateur Windows, ce qui n'a
# aucun interet ici et allongerait la construction.
RUN npx next build

########################################
# 3. Image finale
########################################
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*

# `node` (uid 1000) existe deja dans l'image officielle. Le serveur ne tourne
# pas en root : une faille dans l'application ne donne alors pas la machine.
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Les donnees vivent dans un volume monte par docker-compose, pas dans l'image :
# reconstruire l'image ne doit rien effacer.
RUN mkdir -p /app/data && chown -R node:node /app/data
VOLUME /app/data

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/robots.txt > /dev/null || exit 1

CMD ["node", "server.js"]

# Site React de JefNet : compilé par Node, servi par nginx
# Étapes : deps -> lint (vérification, utilisée par Jenkins) -> build -> web (image finale)

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM deps AS lint
COPY . .
RUN npm run lint

FROM deps AS build
COPY . .
# l'API et le temps réel passent par le même nginx : adresses relatives,
# le site fonctionne donc sur http://localhost comme sur http://IP-du-PC
ARG VITE_REVERB_APP_KEY
ENV VITE_API_URL=/api \
    VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY \
    VITE_REVERB_SCHEME=http
RUN npm run build

FROM nginx:1.27-alpine AS web
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

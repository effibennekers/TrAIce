ARG NODE_VERSION=26
ARG PORT=8080
ARG VITE_BASE_PATH="/"

FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app

ARG PORT
ENV PORT=${PORT}
EXPOSE ${PORT}

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS builder
ARG VITE_BASE_PATH
ENV VITE_BASE_PATH=${VITE_BASE_PATH}
COPY . .
RUN npm run build
RUN test -f /app/dist/server/index.js || (echo "Build failed: dist/server/index.js not found" && exit 1)
RUN test -d /app/dist/client || (echo "Build failed: dist/client not found" && exit 1)

FROM gcr.io/distroless/nodejs26-debian13:nonroot AS production
WORKDIR /app

ARG PORT
ARG VITE_BASE_PATH
ENV NODE_ENV=production \
    NODE_OPTIONS=--disable-proto=delete \
    PORT=${PORT} \
    BASE_PATH=${VITE_BASE_PATH}

COPY --from=builder --chown=nonroot:nonroot /app/dist/client ./dist/client
COPY --from=builder --chown=nonroot:nonroot /app/dist/server ./dist/server
COPY --from=builder --chown=nonroot:nonroot /app/server.cjs ./server.cjs

USER nonroot
EXPOSE ${PORT}
CMD ["server.cjs"]

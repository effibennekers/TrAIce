ARG NODE_BASE_IMAGE=node@sha256:0b36e8c136b94cd4fcf02188228e76c31ad5872eef3fec8cbd2eee500cfd9e80
ARG DISTROLESS_NODE_IMAGE=gcr.io/distroless/nodejs26-debian13@sha256:a3bb283a564754266646d6029c5b6aa4f760b9415dae1398db8d7f8142ee1375
ARG PORT=8080
ARG VITE_BASE_PATH="/"

FROM ${NODE_BASE_IMAGE} AS base
WORKDIR /app

ARG PORT
ENV PORT=${PORT}
EXPOSE ${PORT}

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS deps-prod
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && \
	npm cache clean --force

FROM deps AS development
COPY . .
ENV NODE_ENV=development
CMD ["sh", "-c", "npm run dev -- --port ${PORT} --host 0.0.0.0"]

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
ARG VITE_BASE_PATH
ARG VITE_API_BASE_URL=/api
ENV VITE_BASE_PATH=${VITE_BASE_PATH}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
COPY . .
RUN test -f /app/server.cjs || (echo "Build failed: server.cjs not found" && exit 1)
RUN npm run build
RUN test -f /app/dist/server/server.js || (echo "Build failed: dist/server/server.js not found" && exit 1)
RUN test -d /app/dist/client || (echo "Build failed: dist/client not found" && exit 1)

FROM ${DISTROLESS_NODE_IMAGE} AS production
WORKDIR /app

ARG PORT
ARG VITE_BASE_PATH
ENV NODE_ENV=production \
	NODE_OPTIONS=--disable-proto=delete \
	PORT=${PORT} \
	BASE_PATH=${VITE_BASE_PATH}

COPY --from=deps-prod --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=builder --chown=nonroot:nonroot /app/dist/client ./dist/client
COPY --from=builder --chown=nonroot:nonroot /app/dist/server ./dist/server
COPY --from=builder --chown=nonroot:nonroot /app/server.cjs ./server.cjs

USER nonroot
EXPOSE ${PORT}
CMD ["server.cjs"]

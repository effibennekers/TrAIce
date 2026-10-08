ARG ALPINE_BASE_IMAGE=alpine@sha256:ce64758a109eb420d874a118f87920e625e12d3634e03b4a5573fd9f6e5d3507
ARG NGINX_UNPRIV_IMAGE=nginxinc/nginx-unprivileged@sha256:65e3e85dbaed8ba248841d9d58a899b6197106c23cb0ff1a132b7bfe0547e4c0

FROM ${ALPINE_BASE_IMAGE} AS certs
RUN apk add --no-cache openssl && \
    mkdir -p /certs && \
    openssl req -x509 -newkey rsa:2048 -sha256 -days 365 -nodes \
      -keyout /certs/tls.key \
      -out /certs/tls.crt \
      -subj "/CN=localhost"

FROM ${NGINX_UNPRIV_IMAGE} AS production
USER root
COPY --from=certs /certs /etc/nginx/certs
COPY nginx/default.prod.conf /etc/nginx/conf.d/default.conf
RUN chmod 644 /etc/nginx/certs/tls.crt && \
  chmod 644 /etc/nginx/certs/tls.key
USER 101
EXPOSE 8080 8443

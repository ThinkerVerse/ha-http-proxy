ARG BUILD_FROM
FROM ${BUILD_FROM}

# Install required packages
RUN apk add --no-cache \
    nginx \
    nodejs \
    npm \
    tinyproxy

# Tinyproxy drops privileges and needs a writable log directory. The Alpine
# package creates the account, but create it defensively so the chown below
# cannot fail the build.
RUN addgroup -S tinyproxy 2>/dev/null || true \
    && adduser -S -D -H -G tinyproxy tinyproxy 2>/dev/null || true \
    && mkdir -p /var/log/tinyproxy \
    && chown tinyproxy:tinyproxy /var/log/tinyproxy

# Install the admin API server (production dependencies only)
WORKDIR /opt/api
COPY api/package.json api/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund \
    && npm cache clean --force
COPY api/server.js ./

# Copy root filesystem
COPY rootfs /

RUN chmod +x /etc/cont-init.d/*.sh /etc/services.d/*/run

EXPOSE 8888 8889

# BUILD_ARCH and BUILD_VERSION are supplied by the Home Assistant Supervisor
# and by the add-on builder action.
ARG BUILD_ARCH="amd64"
ARG BUILD_VERSION="dev"

LABEL \
    io.hass.name="HTTP Proxy" \
    io.hass.description="HTTP proxy server for local network devices" \
    io.hass.arch="${BUILD_ARCH}" \
    io.hass.type="addon" \
    io.hass.version="${BUILD_VERSION}" \
    org.opencontainers.image.title="HTTP Proxy" \
    org.opencontainers.image.description="HTTP proxy server for local network devices" \
    org.opencontainers.image.source="https://github.com/ThinkerVerse/ha-http-proxy" \
    org.opencontainers.image.version="${BUILD_VERSION}" \
    org.opencontainers.image.licenses="MIT" \
    maintainer="ThinkerVerse <https://github.com/ThinkerVerse>"

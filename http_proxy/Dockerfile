ARG BUILD_FROM
FROM $BUILD_FROM

# Install required packages
RUN apk add --no-cache \
    tinyproxy \
    nginx \
    nodejs \
    npm \
    openssl \
    curl

# Set up directories
RUN mkdir -p /opt/api

# Copy root filesystem
COPY rootfs /

# Make scripts executable
RUN chmod -R +x /etc/services.d/*/run \
    && chmod -R +x /etc/cont-init.d/ \
    && chmod -R +x /usr/bin/

# Copy API server files
COPY api /opt/api/

# Install API server dependencies
RUN cd /opt/api && npm install

# Expose ports
EXPOSE 8888 8889

# Labels
LABEL \
    io.hass.name="HTTP Proxy" \
    io.hass.description="HTTP proxy server for local network devices" \
    io.hass.arch="armhf|armv7|aarch64|amd64|i386" \
    io.hass.type="addon" \
    maintainer="Your Name <your.email@example.com>"

# Start script
CMD [ "/usr/bin/run.sh" ]
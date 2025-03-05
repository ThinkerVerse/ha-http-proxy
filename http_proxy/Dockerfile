ARG BUILD_FROM
FROM $BUILD_FROM

# Install required packages
RUN apk add --no-cache \
    squid \
    nginx \
    supervisor \
    jq \
    curl \
    openssl \
    nodejs \
    npm

# Set up directories
RUN mkdir -p /var/cache/squid \
    && mkdir -p /var/log/squid \
    && mkdir -p /var/www/html \
    && mkdir -p /opt/api \
    && chown -R squid:squid /var/cache/squid \
    && chown -R squid:squid /var/log/squid

# Create cache directories for Squid
RUN mkdir -p /var/cache/squid && squid -z

# Copy root filesystem
COPY rootfs /

# Make ABSOLUTELY sure scripts are executable
RUN chmod -R +x /etc/services.d/*/run \
    && chmod -R +x /etc/cont-init.d/ \
    && chmod -R +x /usr/bin/

# Copy API server files
COPY api /opt/api/

# Install API server dependencies
RUN cd /opt/api && npm install

# Create simple admin interface
RUN mkdir -p /var/www/html && echo '<html><head><title>HTTP Proxy Admin</title></head><body><h1>HTTP Proxy Admin</h1><p>Admin interface is under construction. Check back later.</p></body></html>' > /var/www/html/index.html

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
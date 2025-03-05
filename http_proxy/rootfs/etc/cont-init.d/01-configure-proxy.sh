#!/usr/bin/with-contenv bashio
# ==============================================================================
# Home Assistant Add-on: HTTP Proxy
# Configures the TinyProxy before running
# ==============================================================================

# Get configuration values
LOG_LEVEL=$(bashio::config 'log_level')
AUTHENTICATION=$(bashio::config 'authentication')
USERNAME=$(bashio::config 'username')
PASSWORD=$(bashio::config 'password')

# Configure logging
bashio::log.level "${LOG_LEVEL}"
bashio::log.info "Configuring HTTP Proxy..."

# Create TinyProxy configuration - very minimal to avoid any syntax issues
cat > "/etc/tinyproxy/tinyproxy.conf" << EOF
# TinyProxy Configuration for Home Assistant
Port 8888
Timeout 600
LogLevel Critical

# Disable all logging
Syslog Off

# Connection settings
ConnectPort 443
EOF

# Add allowed networks
for network in $(bashio::config 'allowed_networks'); do
  echo "Allow ${network}" >> "/etc/tinyproxy/tinyproxy.conf"
done

# Configure authentication if enabled
if bashio::config.true 'authentication'; then
  if ! bashio::var.is_empty "${USERNAME}" && ! bashio::var.is_empty "${PASSWORD}"; then
    echo "BasicAuth ${USERNAME} ${PASSWORD}" >> "/etc/tinyproxy/tinyproxy.conf"
  fi
fi

# Configure the web admin interface with nginx
cat > "/etc/nginx/http.d/default.conf" << EOF
server {
    listen 8889;
    root /var/www/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
    }
}
EOF

bashio::log.info "HTTP Proxy configuration completed"
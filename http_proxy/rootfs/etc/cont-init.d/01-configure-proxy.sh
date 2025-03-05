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

# Create TinyProxy configuration
cat > "/etc/tinyproxy/tinyproxy.conf" << EOF
# TinyProxy Configuration for Home Assistant

# Main settings
Port 8888
Timeout 600
DefaultErrorFile "/usr/share/tinyproxy/default.html"
StatFile "/usr/share/tinyproxy/stats.html"
LogFile "/var/log/tinyproxy/tinyproxy.log"
Syslog Off

# Logging level (based on Home Assistant log level)
EOF

# Set log level
case "${LOG_LEVEL}" in
  "trace" | "debug")
    echo "LogLevel Debug" >> "/etc/tinyproxy/tinyproxy.conf"
    ;;
  "info" | "notice")
    echo "LogLevel Info" >> "/etc/tinyproxy/tinyproxy.conf"
    ;;
  "warning")
    echo "LogLevel Warning" >> "/etc/tinyproxy/tinyproxy.conf"
    ;;
  "error" | "fatal")
    echo "LogLevel Error" >> "/etc/tinyproxy/tinyproxy.conf"
    ;;
  *)
    echo "LogLevel Info" >> "/etc/tinyproxy/tinyproxy.conf"
    ;;
esac

# Continue configuration
cat >> "/etc/tinyproxy/tinyproxy.conf" << EOF
# Security settings
MaxClients 100
MinSpareServers 5
MaxSpareServers 20
StartServers 10
MaxRequestsPerChild 0

# Access control
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

# Create log directory
mkdir -p /var/log/tinyproxy
chown nobody:nobody /var/log/tinyproxy

bashio::log.info "HTTP Proxy configuration completed"
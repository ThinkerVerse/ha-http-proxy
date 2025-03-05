#!/usr/bin/with-contenv bashio
# ==============================================================================
# Home Assistant Add-on: HTTP Proxy
# Configures the HTTP Proxy before running
# ==============================================================================

# Get configuration values
LOG_LEVEL=$(bashio::config 'log_level')
AUTHENTICATION=$(bashio::config 'authentication')
USERNAME=$(bashio::config 'username')
PASSWORD=$(bashio::config 'password')

# Configure logging
bashio::log.level "${LOG_LEVEL}"
bashio::log.info "Configuring HTTP Proxy..."

# Create Squid configuration with NO caching to avoid memory issues
cat > "/etc/squid/squid.conf" << EOF
# Basic Settings
http_port 8888

# Disable caching completely
cache deny all
memory_pools off

# Log settings
access_log /var/log/squid/access.log
cache_log /var/log/squid/cache.log

# Network access controls
EOF

# Add allowed networks
for network in $(bashio::config 'allowed_networks'); do
  echo "acl allowed_networks src ${network}" >> "/etc/squid/squid.conf"
done

# Configure authentication if enabled
if bashio::config.true 'authentication'; then
  if bashio::var.is_empty "${USERNAME}" || bashio::var.is_empty "${PASSWORD}"; then
    bashio::log.warning "Authentication enabled but username or password is empty"
  else
    # Create password file
    touch /etc/squid/passwd
    echo "${USERNAME}:$(openssl passwd -crypt ${PASSWORD})" > /etc/squid/passwd
    
    # Configure authentication
    cat >> "/etc/squid/squid.conf" << EOF
auth_param basic program /usr/lib/squid/basic_ncsa_auth /etc/squid/passwd
auth_param basic realm HTTP Proxy
acl authenticated proxy_auth REQUIRED
http_access allow authenticated allowed_networks
EOF
  fi
else
  # No authentication
  echo "http_access allow allowed_networks" >> "/etc/squid/squid.conf"
fi

# Deny access to anything not explicitly allowed
echo "http_access deny all" >> "/etc/squid/squid.conf"

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

# Ensure log directory exists
mkdir -p /var/log/squid
chown -R squid:squid /var/log/squid

bashio::log.info "HTTP Proxy configuration completed"
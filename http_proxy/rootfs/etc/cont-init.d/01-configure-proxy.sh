#!/usr/bin/with-contenv bashio
# ==============================================================================
# Home Assistant Add-on: HTTP Proxy
# Generates the Tinyproxy configuration from the add-on options
# ==============================================================================

declare log_level
declare tinyproxy_log_level
declare username
declare password
declare -a allowed_networks=()

log_level=$(bashio::config 'log_level')
bashio::log.level "${log_level}"
bashio::log.info "Configuring HTTP Proxy..."

# Tinyproxy only understands Critical/Error/Warning/Notice/Connect/Info, so map
# the Home Assistant log levels onto the closest Tinyproxy equivalent.
case "${log_level}" in
    trace|debug)    tinyproxy_log_level="Info" ;;
    info)           tinyproxy_log_level="Connect" ;;
    notice)         tinyproxy_log_level="Notice" ;;
    warning)        tinyproxy_log_level="Warning" ;;
    error)          tinyproxy_log_level="Error" ;;
    fatal)          tinyproxy_log_level="Critical" ;;
    *)              tinyproxy_log_level="Connect" ;;
esac

cat > /etc/tinyproxy/tinyproxy.conf << EOF
# Tinyproxy configuration for Home Assistant - generated at start-up.
# Edit the add-on options instead of this file; it is overwritten on restart.
User tinyproxy
Group tinyproxy

Port 8888
Timeout 600
MaxClients 100

LogFile "/var/log/tinyproxy/tinyproxy.log"
LogLevel ${tinyproxy_log_level}
Syslog Off

# Ports permitted for HTTPS/CONNECT tunnelling.
ConnectPort 443
ConnectPort 563
EOF

# Tinyproxy denies every client that is not covered by an Allow rule, but only
# once at least one such rule exists - an empty list would open up the proxy.
if bashio::config.has_value 'allowed_networks'; then
    readarray -t allowed_networks < <(bashio::config 'allowed_networks')
fi

if bashio::var.is_empty "${allowed_networks[*]:-}"; then
    bashio::exit.nok \
        "No allowed_networks configured; refusing to start an open proxy."
fi

for network in "${allowed_networks[@]}"; do
    bashio::log.debug "Allowing network ${network}"
    echo "Allow ${network}" >> /etc/tinyproxy/tinyproxy.conf
done

if bashio::config.true 'authentication'; then
    username=$(bashio::config 'username')
    password=$(bashio::config 'password')

    if bashio::var.is_empty "${username}" || bashio::var.is_empty "${password}"; then
        bashio::exit.nok \
            "Authentication is enabled but username or password is empty."
    fi

    echo "BasicAuth ${username} ${password}" >> /etc/tinyproxy/tinyproxy.conf
    bashio::log.info "Proxy authentication enabled for user ${username}"
fi

bashio::log.info "HTTP Proxy configuration completed"

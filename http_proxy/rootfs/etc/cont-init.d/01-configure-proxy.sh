#!/usr/bin/with-contenv bashio
# ==============================================================================
# Home Assistant Add-on: HTTP Proxy
# Generates the Tinyproxy configuration from the add-on options
# ==============================================================================

readonly OPTIONS_FILE="/data/options.json"
readonly PROXY_CONFIG="/etc/tinyproxy/tinyproxy.conf"

# Options are read straight from the file the Supervisor writes.
#
# bashio::config does not read this file: it fetches the options through the
# Supervisor's /addons/self/options/config endpoint, which returns an error if
# the stored options do not validate against the current schema. bashio turns
# that error into an empty object, after which every option silently reads back
# as the string "null" - so a schema change can quietly blank the whole
# configuration. Reading the file keeps that failure mode out of the picture.
function option() {
    jq --raw-output --arg key "${1}" \
        'if has($key) and .[$key] != null then .[$key] else "" end' \
        "${OPTIONS_FILE}"
}

function option_list() {
    jq --raw-output --arg key "${1}" '.[$key][]?' "${OPTIONS_FILE}"
}

declare log_level
declare tinyproxy_log_level
declare username
declare password
declare -a allowed_networks=()

if ! bashio::fs.file_exists "${OPTIONS_FILE}"; then
    bashio::exit.nok "Add-on options file ${OPTIONS_FILE} is missing."
fi

log_level=$(option 'log_level')
if bashio::var.is_empty "${log_level}"; then
    log_level="info"
fi

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

cat > "${PROXY_CONFIG}" << EOF
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
readarray -t allowed_networks < <(option_list 'allowed_networks')

if [[ "${#allowed_networks[@]}" -eq 0 ]]; then
    bashio::exit.nok \
        "No allowed_networks configured; refusing to start an open proxy. Add at
        least one network (for example 192.168.0.0/16) on the add-on's
        Configuration tab."
fi

for network in "${allowed_networks[@]}"; do
    bashio::log.debug "Allowing network ${network}"
    echo "Allow ${network}" >> "${PROXY_CONFIG}"
done

if [[ "$(option 'authentication')" == "true" ]]; then
    username=$(option 'username')
    password=$(option 'password')

    if bashio::var.is_empty "${username}" || bashio::var.is_empty "${password}"; then
        bashio::exit.nok \
            "Authentication is enabled but username or password is empty."
    fi

    echo "BasicAuth ${username} ${password}" >> "${PROXY_CONFIG}"
    bashio::log.info "Proxy authentication enabled for user ${username}"
fi

bashio::log.info "HTTP Proxy configuration completed"

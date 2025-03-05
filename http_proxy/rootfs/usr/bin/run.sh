#!/usr/bin/with-contenv bashio
# ==============================================================================
# Home Assistant Add-on: HTTP Proxy
# Runs the HTTP Proxy
# ==============================================================================
bashio::log.info "Starting HTTP Proxy addon..."

# Keep the script running to keep container alive
while true; do
  sleep 86400
done
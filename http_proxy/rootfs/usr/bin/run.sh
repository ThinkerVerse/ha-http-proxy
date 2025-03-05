#!/usr/bin/with-contenv bashio
set -e

bashio::log.info "Starting HTTP Proxy addon..."

# Wait for services to start
bashio::log.info "Waiting for services to start..."
sleep 5

# Keep the script running
while true; do
  sleep 600
done
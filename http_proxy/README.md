# Home Assistant Add-on: HTTP Proxy

This addon provides an HTTP proxy server for your local network devices. It allows you to:

- Route HTTP traffic through a central proxy
- Monitor and log web traffic on your network
- Apply content filtering and access controls
- Cache web content to improve performance

## Installation

1. Add this repository to your Home Assistant instance:
   - Navigate to Settings → Add-ons → Add-on Store
   - Click the three dots in the top right corner and select "Repositories"
   - Add the repository URL: `https://github.com/svnsundar/ha-http-proxy`
   - Click "Add"

2. Find the "HTTP Proxy" addon in the store and click "Install"

3. Configure the addon with your preferred settings (see Configuration section)

4. Start the addon

## Configuration

| Option | Description | Default |
|--------|-------------|---------|
| `log_level` | The level of logging detail | `info` |
| `allowed_networks` | List of networks that can use the proxy | `["192.168.0.0/16", "172.16.0.0/12", "10.0.0.0/8"]` |
| `max_connections` | Maximum number of simultaneous connections | `100` |
| `cache_size` | Size of the proxy cache | `100m` |
| `authentication` | Enable/disable proxy authentication | `false` |
| `username` | Username for authentication (if enabled) | `""` |
| `password` | Password for authentication (if enabled) | `""` |

## Using the Proxy

### On Devices

Configure your devices to use the proxy by setting:

- Proxy address: Your Home Assistant IP address
- Proxy port: 8888
- Proxy type: HTTP

### Admin Interface

The addon provides an admin interface accessible at:

`http://your-home-assistant-ip:8889`

From the admin interface, you can:

- Monitor proxy usage and performance
- View access logs
- Adjust configuration settings
- Restart the proxy service

## Troubleshooting

If you encounter issues:

1. Check the addon logs in Home Assistant
2. Verify your network device's proxy settings
3. Ensure your device is in an allowed network
4. Check if authentication is properly configured
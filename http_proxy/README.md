# Home Assistant Add-on: HTTP Proxy

An HTTP proxy server ([Tinyproxy](https://tinyproxy.github.io/)) for your local
network devices, with a small web admin interface. Use it to:

- Route HTTP/HTTPS traffic from local devices through a central proxy
- Restrict which networks may use the proxy
- Optionally require a username and password
- Review recent proxy access logs

## Installation

1. Add this repository to your Home Assistant instance:
   - Navigate to **Settings → Add-ons → Add-on Store**
   - Open the three-dot menu in the top right and select **Repositories**
   - Add the repository URL: `https://github.com/ThinkerVerse/ha-http-proxy`
   - Click **Add**

2. Find the "HTTP Proxy" add-on in the store and click **Install**

3. Configure the add-on (see [Configuration](#configuration))

4. Start the add-on

Only `aarch64` and `amd64` are supported.

## Configuration

| Option | Description | Default |
|--------|-------------|---------|
| `log_level` | Verbosity of the add-on and proxy logs | `info` |
| `allowed_networks` | Networks permitted to use the proxy (IPv4 address or CIDR range). At least one entry is required. | `["192.168.0.0/16", "172.16.0.0/12", "10.0.0.0/8"]` |
| `authentication` | Require a username and password for proxy access | `false` |
| `username` | Username, required when `authentication` is enabled | `""` |
| `password` | Password, required when `authentication` is enabled | `""` |

Tinyproxy denies any client that is not covered by `allowed_networks`. The add-on
refuses to start when the list is empty rather than running an open proxy.

`log_level` is mapped onto the closest Tinyproxy level:

| Add-on | Tinyproxy |
|--------|-----------|
| `trace`, `debug` | `Info` |
| `info` | `Connect` |
| `notice` | `Notice` |
| `warning` | `Warning` |
| `error` | `Error` |
| `fatal` | `Critical` |

## Using the Proxy

### On Devices

Configure your devices to use the proxy by setting:

- Proxy address: your Home Assistant IP address
- Proxy port: `8888`
- Proxy type: HTTP

HTTPS (`CONNECT`) tunnelling is permitted to ports 443 and 563.

### Admin Interface

The add-on serves an admin interface at `http://your-home-assistant-ip:8889`.

From there you can:

- **See whether the proxy is running.**
- **View recent access logs** (the last 100 lines, refreshed on demand).
- **Change the configuration** — log level, allowed networks, authentication and
  credentials. Changes are saved through the Supervisor, exactly as if you had
  edited them on the add-on's Configuration tab, and take effect after an add-on
  restart.
- **Restart the proxy service** without restarting the whole add-on.

> **The admin interface has no authentication of its own.** Anyone who can reach
> port 8889 can change the proxy configuration. Expose it only on a trusted
> network, or remove the `8889/tcp` port mapping on the add-on's Configuration
> tab if you do not need it. The interface never displays the stored proxy
> password: leave the password field blank to keep the current one.

## Troubleshooting

1. Check the add-on logs in Home Assistant.
2. Verify your device's proxy settings (address, port `8888`, type HTTP).
3. Confirm the device's IP falls within one of the `allowed_networks` entries.
4. If authentication is enabled, confirm both a username and password are set —
   the add-on refuses to start otherwise.
5. Raise `log_level` to `debug` for per-connection logging.

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
| `authentication` | Require proxy clients to send a username and password (see below) | `false` |
| `username` | Username, required when `authentication` is enabled | `""` |
| `password` | Password, required when `authentication` is enabled | `""` |

### Who is allowed to use the proxy

There are two independent gates, and neither of them protects the admin
interface:

- **`allowed_networks`** decides *which machines* may connect. Tinyproxy refuses
  any client outside the list. The add-on refuses to start when the list is
  empty rather than running an open proxy.
- **`authentication`** decides whether those machines must *also* prove who they
  are. With it off, any device inside the allowed networks can use the proxy
  immediately. With it on, a device must send the configured username and
  password or the proxy replies `407 Proxy Authentication Required`. Turn it on
  when "anyone on my network" is too broad.

Most browsers and operating systems will prompt for the proxy credentials the
first time they are needed.

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

The add-on adds an **HTTP Proxy** entry to the Home Assistant sidebar. Open it
from there: Home Assistant serves the page itself and applies its own
authentication, so no extra port needs to be exposed.

From the panel you can:

- See whether the proxy is running and how long it has been up.
- Read the last 100 lines of the proxy log, optionally auto-refreshing.
- Change the log level, allowed networks, and authentication settings. Changes
  are saved through the Supervisor, exactly as if you had edited them on the
  add-on's Configuration tab, and take effect after an add-on restart. The
  stored proxy password is never sent to the browser: leave the field blank to
  keep it.
- Restart the proxy service without restarting the whole add-on.

> The same page is also served on port `8889`, which is **unmapped by default**.
> That listener has no authentication of its own, so anyone who can reach the
> port can change the proxy configuration. Map it on the add-on's Configuration
> tab only if you need access from outside Home Assistant.

## Troubleshooting

1. Check the add-on logs in Home Assistant.
2. Verify your device's proxy settings (address, port `8888`, type HTTP).
3. Confirm the device's IP falls within one of the `allowed_networks` entries.
4. If authentication is enabled, confirm both a username and password are set —
   the add-on refuses to start otherwise.
5. Raise `log_level` to `debug` for per-connection logging.

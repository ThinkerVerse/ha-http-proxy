# Home Assistant Add-on: HTTP Proxy

An HTTP proxy for the devices on your local network, powered by
[Tinyproxy][tinyproxy]. Devices send their web traffic to Home Assistant, and
the add-on forwards it on their behalf.

This is useful when you want a single, controlled way out to the internet: for
devices that need a proxy configured, for keeping a record of what a device is
requesting, or for restricting which machines can reach the outside world at all.

## Installation

1. Add this repository to Home Assistant, if you have not already:
   **Settings → Add-ons → Add-on Store**, then the three-dot menu in the top
   right → **Repositories**, and add
   `https://github.com/ThinkerVerse/ha-http-proxy`.
2. Find **HTTP Proxy** in the store and click **Install**.
3. Check the **Configuration** tab. The defaults cover most home networks; see
   [Configuration](#configuration) below.
4. Click **Start**.

Supported architectures are `aarch64` and `amd64`. 32-bit ARM and `i386` are
not supported.

## How to use

Once the add-on is running, point a device at it:

- **Proxy address** — the IP address of the machine running Home Assistant
- **Proxy port** — `8888`
- **Proxy type** — HTTP

The proxy handles both `http://` and `https://` traffic. HTTPS is tunnelled
without being decrypted or inspected, so certificates keep working normally.

See [Configuring your devices](#configuring-your-devices) for where to enter
this on common systems.

## Configuration

Add-on configuration is set on the **Configuration** tab, or from the add-on's
own panel in the sidebar. **Changes take effect when the add-on restarts.**

Example:

```yaml
log_level: info
allowed_networks:
  - 192.168.0.0/16
  - 172.16.0.0/12
  - 10.0.0.0/8
authentication: false
username: ""
password: ""
```

### Option: `log_level`

Controls how much the add-on and the proxy write to the log. Ordered from most
to least detail:

| Value | Shows |
|-------|-------|
| `trace` | Everything, including internal add-on tracing |
| `debug` | Individual requests, in full |
| `info` | Each connection as it is made (**default**) |
| `notice` | Normal but significant events |
| `warning` | Things that went wrong but were survivable |
| `error` | Errors only |
| `fatal` | Only failures that stop the add-on |

Connections are only recorded at `info` or more detailed. If the log looks
empty, this is usually why.

Home Assistant's levels do not map one-to-one onto Tinyproxy's, so the add-on
translates them:

| Add-on | Tinyproxy |
|--------|-----------|
| `trace`, `debug` | `Info` |
| `info` | `Connect` |
| `notice` | `Notice` |
| `warning` | `Warning` |
| `error` | `Error` |
| `fatal` | `Critical` |

### Option: `allowed_networks`

The list of clients permitted to use the proxy. Each entry is an IPv4 address
(`192.168.1.50`) or a CIDR range (`192.168.1.0/24`). Anything not covered by
the list is refused with `403 Access denied`.

The defaults cover the three private address ranges, which is what almost every
home network uses:

```yaml
allowed_networks:
  - 192.168.0.0/16   # most home routers
  - 172.16.0.0/12    # Docker and some corporate ranges
  - 10.0.0.0/8       # larger or VPN-based networks
```

To restrict the proxy to a handful of machines, list them individually:

```yaml
allowed_networks:
  - 192.168.1.40
  - 192.168.1.41
```

**At least one entry is required.** The add-on refuses to start with an empty
list rather than run a proxy that anyone can use. IPv6 addresses are not
supported here.

### Option: `authentication`

Whether clients must supply a username and password in addition to being on an
allowed network. Defaults to `false`.

This protects the **proxy on port 8888**. It does not protect the add-on's
admin panel — see [Who can use the proxy](#who-can-use-the-proxy).

### Option: `username`

The username clients must send when `authentication` is on. Required in that
case; ignored otherwise.

### Option: `password`

The password clients must send when `authentication` is on. Required in that
case; ignored otherwise.

The add-on will not start if `authentication` is on and either of these is
empty. The admin panel never displays the stored password: leave its password
field blank to keep the current one.

## Who can use the proxy

There are two independent gates. A request has to pass both.

| | Controlled by | Answer when refused |
|---|---|---|
| **Which machines** may connect | `allowed_networks` | `403 Access denied` |
| Whether they must **prove who they are** | `authentication` | `407 Proxy Authentication Required` |

The network check happens first. A device outside `allowed_networks` is turned
away before credentials are ever considered.

Most home setups leave `authentication` off — the network allowlist is already
doing the work, and every device on your LAN is one you trust. Turn it on when
"anyone on my network" is too broad: guest Wi-Fi that shares a subnet, IoT
devices you would rather not hand an open route to the internet, or a VPN range
included in the allowlist.

Neither option protects the admin panel. That is handled by Home Assistant
itself — see [The admin panel](#the-admin-panel).

## Configuring your devices

Replace `192.168.1.10` with the address of your Home Assistant machine.

**Windows** — Settings → Network & Internet → Proxy → Manual proxy setup.
Address `192.168.1.10`, port `8888`.

**macOS** — System Settings → Network → your connection → Details → Proxies →
Web Proxy (HTTP) and Secure Web Proxy (HTTPS). Server `192.168.1.10`, port
`8888`.

**iOS / iPadOS** — Settings → Wi-Fi → the ⓘ next to your network → Configure
Proxy → Manual. Server `192.168.1.10`, port `8888`.

**Android** — Settings → Wi-Fi → long-press your network → Modify → Advanced →
Proxy → Manual. Hostname `192.168.1.10`, port `8888`.

**Firefox** (has its own proxy settings) — Settings → Network Settings →
Manual proxy configuration. Check "Also use this proxy for HTTPS".

**Linux and command-line tools** — most respect environment variables:

```bash
export http_proxy=http://192.168.1.10:8888
export https_proxy=http://192.168.1.10:8888
```

With `authentication` enabled, include the credentials:

```bash
export http_proxy=http://username:password@192.168.1.10:8888
export https_proxy=http://username:password@192.168.1.10:8888
```

Graphical systems will normally prompt for the username and password the first
time they are needed.

## The admin panel

The add-on adds an **HTTP Proxy** entry to the Home Assistant sidebar. Home
Assistant serves the page itself and applies its own authentication, so there
is no extra port to expose and no separate password to manage.

From the panel you can:

- See whether the proxy is running, and for how long
- Read the last 100 lines of the proxy log, with optional auto-refresh
- Change the log level, allowed networks, and authentication settings — saved
  through the Supervisor, exactly as if you had edited the Configuration tab
- Restart the proxy service without restarting the whole add-on

The same page is also served on port `8889`, which is **not mapped by default**.
That listener has no authentication of its own: anyone who can reach the port
can change the proxy configuration. Map it on the Configuration tab only if you
need access from outside Home Assistant, and only on a network you trust.

## Ports

| Port | Purpose | Mapped by default |
|------|---------|-------------------|
| `8888` | The proxy itself | Yes |
| `8889` | Admin panel, direct and unauthenticated | No |
| `8099` | Admin panel via Home Assistant ingress | Internal only |

## What this add-on does not do

Worth being explicit, since proxies vary a great deal:

- **No caching.** Tinyproxy does not store responses. Earlier versions of this
  add-on used Squid and mentioned caching; that has not been true since 3.0.0.
- **No HTTPS inspection.** HTTPS is tunnelled through untouched. The add-on
  cannot see, log, or filter the contents of an encrypted connection — only
  which host was contacted.
- **No content or ad filtering.** For that, look at something like AdGuard Home
  or Pi-hole.
- **HTTPS tunnelling is limited to ports 443 and 563.** A site served over
  HTTPS on an unusual port will be refused.
- **IPv4 only** in `allowed_networks`.

## Troubleshooting

Start with the add-on's **Log** tab; most problems announce themselves there.

### The add-on will not start

> `FATAL: No allowed_networks configured; refusing to start an open proxy.`

`allowed_networks` is empty. Add at least one network on the Configuration tab.
The add-on stops rather than start a proxy that anyone could use.

> `FATAL: Authentication is enabled but username or password is empty.`

Either fill in both `username` and `password`, or set `authentication: false`.

### A device gets "403 Access denied"

Its IP address is not covered by `allowed_networks`. Check the device's actual
address — a phone on guest Wi-Fi or a device on a VPN often sits in a different
range than you expect — and add that range.

### A device is asked for a password it does not have

`authentication` is on. Either supply the configured `username` and `password`
on the device, or turn `authentication` off.

### Changes on the Configuration tab do nothing

The proxy reads its configuration at start-up. Restart the add-on after saving.

### The log is empty

Connections are only recorded at log level `info` or more detailed. Set
`log_level` to `debug` to record every request while you investigate.

### The proxy cannot be reached at all

- Confirm the add-on is running and shows no errors in its log.
- Confirm the device is pointed at the right IP address and port `8888`.
- Confirm the device's address falls inside `allowed_networks`.

## Support

Found a problem or have an idea? Open an issue on
[GitHub](https://github.com/ThinkerVerse/ha-http-proxy/issues).

[tinyproxy]: https://tinyproxy.github.io/

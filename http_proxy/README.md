# Home Assistant Add-on: HTTP Proxy

An HTTP proxy for the devices on your local network.

![Supports aarch64 Architecture][aarch64-shield] ![Supports amd64 Architecture][amd64-shield]

## About

This add-on runs [Tinyproxy][tinyproxy], a small and fast HTTP/HTTPS proxy, on
your Home Assistant machine. Devices on your network send their web traffic to
it, and it forwards that traffic on their behalf.

Use it when you want a single, controlled route out to the internet — for
devices that expect a proxy to be configured, to keep a record of what a device
is requesting, or to restrict which machines can reach the outside world at all.

Access is controlled by a list of allowed networks, and optionally by a username
and password. The add-on ships with an admin panel that appears in the Home
Assistant sidebar, where you can check the proxy's status, read its log, and
change its settings without leaving Home Assistant.

Full documentation is in [DOCS.md](DOCS.md), and is also available on the
add-on's **Documentation** tab once installed.

[tinyproxy]: https://tinyproxy.github.io/
[aarch64-shield]: https://img.shields.io/badge/aarch64-yes-green.svg
[amd64-shield]: https://img.shields.io/badge/amd64-yes-green.svg

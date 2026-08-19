# Home Assistant Add-on: HTTP Proxy

HTTP proxy server for Home Assistant, for routing traffic from local network devices.

## Installation

Add this repository to your Home Assistant instance:

1. Navigate to **Settings → Add-ons → Add-on Store**.
2. Open the three-dot menu in the top right and select **Repositories**.
3. Add `https://github.com/ThinkerVerse/ha-http-proxy` and click **Add**.

## Add-ons

This repository contains the following add-ons:

### [HTTP Proxy](./http_proxy)

![Supports aarch64 Architecture][aarch64-shield]
![Supports amd64 Architecture][amd64-shield]

HTTP proxy server for local network devices, backed by
[Tinyproxy](https://tinyproxy.github.io/), with a small web admin interface.

32-bit ARM (`armhf`, `armv7`) and `i386` are not supported.

[aarch64-shield]: https://img.shields.io/badge/aarch64-yes-green.svg
[amd64-shield]: https://img.shields.io/badge/amd64-yes-green.svg

## License

MIT

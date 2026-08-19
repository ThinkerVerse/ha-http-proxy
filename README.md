# ThinkerVerse Home Assistant Add-ons

A Home Assistant add-on repository.

## Installation

Click the button below to add this repository to your Home Assistant instance:

[![Open your Home Assistant instance and show the add add-on repository dialog with a specific repository URL pre-filled.](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2FThinkerVerse%2Fha-http-proxy)

Or add it by hand: go to **Settings → Add-ons → Add-on Store**, open the
three-dot menu in the top right, choose **Repositories**, and add:

```
https://github.com/ThinkerVerse/ha-http-proxy
```

The add-ons below will then appear in the store.

## Add-ons in this repository

### [HTTP Proxy](./http_proxy)

![Supports aarch64 Architecture][aarch64-shield] ![Supports amd64 Architecture][amd64-shield]

An HTTP proxy for the devices on your local network, powered by
[Tinyproxy][tinyproxy]. Restrict which machines may reach the internet,
optionally require a username and password, and manage it all from a panel in
the Home Assistant sidebar.

📖 [Documentation](./http_proxy/DOCS.md) · 📝 [Changelog](./http_proxy/CHANGELOG.md)

## Support

Open an issue on [GitHub](https://github.com/ThinkerVerse/ha-http-proxy/issues).

## License

MIT

[tinyproxy]: https://tinyproxy.github.io/
[aarch64-shield]: https://img.shields.io/badge/aarch64-yes-green.svg
[amd64-shield]: https://img.shields.io/badge/amd64-yes-green.svg

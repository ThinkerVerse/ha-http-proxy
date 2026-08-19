# Changelog

## 3.3.1

### Fixed

- The add-on refused to start with "No allowed_networks configured" even when
  networks were configured. 3.3.0 retyped the `password` option from `str` to
  `password` for masking in the UI, and an existing empty password no longer
  validated against that schema. `bashio::config` reads the options through the
  Supervisor's `/addons/self/options/config` endpoint, which returns an error
  when validation fails; bashio turns that into an empty object, so every option
  silently read back as the string `"null"`. The `password` and `username`
  options are typed `str` again, as they were in 3.2.0.
- Options are now read directly from `/data/options.json`, the file the
  Supervisor writes, rather than through the Supervisor API. A schema or API
  problem can no longer blank the entire configuration without saying so.

## 3.3.0

### Fixed

- The admin interface can now actually save configuration changes. It previously
  wrote `/data/options.json` directly, which the Supervisor overwrites on the
  next start, so every change was silently lost. Options are now persisted
  through the Supervisor API.
- The `log_level` option is now applied to Tinyproxy. It was read at start-up but
  never used, leaving the proxy pinned to `Critical`.
- Proxy logs are now written to `/var/log/tinyproxy/tinyproxy.log` and the
  **Access Logs** panel reads them. The panel previously read a Squid path that
  no longer exists, so it always failed.
- The status endpoint no longer reports "Running" when Tinyproxy has crashed. It
  matched the process name loosely, which also matched the supervising `s6`
  process.
- **Restart Proxy** now works; it used an s6-overlay v2 service path that does
  not exist on the current base image.
- Removed a generated nginx site config that pointed at a non-existent web root.
  It was never loaded, and would have collided with the real config if it were.
- The add-on no longer advertises `armhf`, `armv7` and `i386`. Only `aarch64` and
  `amd64` images are built, so installs on those architectures could never work.

### Security

- The admin API no longer returns the proxy password. Port 8889 has no
  authentication of its own, so anyone on the LAN could read it. The interface
  now only reports whether a password is set; leave the field blank to keep it.
- Configuration submitted to the admin API is validated against the add-on
  schema before being saved. Any JSON body was previously written straight to
  the options file.
- The admin API server binds to loopback only, so it is reachable through nginx
  rather than directly.
- The add-on refuses to start with an empty `allowed_networks` list, which
  Tinyproxy would otherwise treat as "allow everyone".

### Changed

- Passwords are masked in the add-on configuration UI (`password` schema type).
- Removed the `cache_hit_rate`, `uptime` and request-count fields from the admin
  interface. They were left over from Squid and always displayed `N/A`.
- Renamed the `squid` service to `tinyproxy`.
- nginx logs now go to the add-on log instead of a file inside the container.
- Node dependencies are installed from a committed lockfile with `npm ci`,
  production dependencies only.
- Dropped the unused `openssl` and `curl` packages and the redundant `run.sh`
  sleep loop; s6-overlay supervises the services directly.
- Added a CI workflow running add-on config linting, Hadolint, ShellCheck and a
  Docker build for both architectures.

## 3.2.0

- Update base images, dependencies, and version.

## 3.1.0

- Drop support for 32-bit ARM devices.

## 3.0.0

- Switch from Squid to Tinyproxy for a lighter proxy.

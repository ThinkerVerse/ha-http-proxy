const express = require('express');
const fs = require('fs');
const { execFile } = require('child_process');

const app = express();
const PORT = 3000;

// Only nginx (same container) talks to this server; never bind it to the LAN.
const HOST = '127.0.0.1';

const OPTIONS_PATH = '/data/options.json';
const LOG_PATH = '/var/log/tinyproxy/tinyproxy.log';
const LOG_LINES = 100;

// USER_HZ on Linux; /proc/<pid>/stat reports start time in these ticks.
const CLOCK_TICKS_PER_SECOND = 100;

// s6-overlay v3 exposes the supervised services here; the v2 path is kept as a
// fallback so the endpoint keeps working on older base images.
const SERVICE_PATHS = [
  '/run/service/tinyproxy',
  '/var/run/s6/services/tinyproxy',
];

const SUPERVISOR_URL = 'http://supervisor';
const SUPERVISOR_TOKEN = process.env.SUPERVISOR_TOKEN;

const LOG_LEVELS = [
  'trace', 'debug', 'info', 'notice', 'warning', 'error', 'fatal',
];

// IPv4 address with an optional CIDR prefix, e.g. 10.0.0.0/8 or 192.168.1.5.
const NETWORK_PATTERN =
  /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(\/(\d|[12]\d|3[0-2]))?$/;

app.use(express.json({ limit: '64kb' }));

function readOptions() {
  try {
    return JSON.parse(fs.readFileSync(OPTIONS_PATH, 'utf8'));
  } catch (error) {
    console.error('Error reading options file:', error.message);
    return {};
  }
}

function isValidNetwork(value) {
  const match = NETWORK_PATTERN.exec(value);
  if (!match) return false;
  return [1, 2, 3, 4].every((i) => Number(match[i]) <= 255);
}

/**
 * Builds the option set to persist, taking only known keys from the request and
 * falling back to the current value for anything missing or invalid-by-omission.
 * Returns { options } on success or { error } with a human-readable reason.
 */
function buildOptions(body, current) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object' };
  }

  const options = { ...current };

  if (body.log_level !== undefined) {
    if (!LOG_LEVELS.includes(body.log_level)) {
      return { error: `log_level must be one of: ${LOG_LEVELS.join(', ')}` };
    }
    options.log_level = body.log_level;
  }

  if (body.allowed_networks !== undefined) {
    if (!Array.isArray(body.allowed_networks) ||
        !body.allowed_networks.every((n) => typeof n === 'string')) {
      return { error: 'allowed_networks must be an array of strings' };
    }
    const invalid = body.allowed_networks.filter((n) => !isValidNetwork(n));
    if (invalid.length > 0) {
      return { error: `Not a valid IPv4 address or CIDR range: ${invalid.join(', ')}` };
    }
    if (body.allowed_networks.length === 0) {
      return { error: 'At least one allowed network is required' };
    }
    options.allowed_networks = body.allowed_networks;
  }

  if (body.authentication !== undefined) {
    if (typeof body.authentication !== 'boolean') {
      return { error: 'authentication must be a boolean' };
    }
    options.authentication = body.authentication;
  }

  if (body.username !== undefined) {
    if (typeof body.username !== 'string') {
      return { error: 'username must be a string' };
    }
    options.username = body.username;
  }

  // The password is never sent back to the browser, so an empty value here means
  // "unchanged" rather than "clear it".
  if (typeof body.password === 'string' && body.password !== '') {
    options.password = body.password;
  }

  if (options.authentication && (!options.username || !options.password)) {
    return { error: 'Username and password are required when authentication is enabled' };
  }

  return { options };
}

async function supervisorRequest(path, init = {}) {
  if (!SUPERVISOR_TOKEN) {
    throw new Error('SUPERVISOR_TOKEN is not set; is hassio_api enabled?');
  }

  const response = await fetch(`${SUPERVISOR_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${SUPERVISOR_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || `Supervisor returned HTTP ${response.status}`);
  }
  return payload;
}

function resolveServicePath() {
  return SERVICE_PATHS.find((path) => fs.existsSync(path));
}

// --- Routes -----------------------------------------------------------------

app.get('/api/config', (req, res) => {
  const { password, ...config } = readOptions();
  // Report only whether a password is set; the admin port has no auth of its own.
  res.json({ ...config, password_set: Boolean(password) });
});

app.post('/api/config', async (req, res) => {
  const { options, error } = buildOptions(req.body, readOptions());

  if (error) {
    res.status(400).json({ success: false, message: error });
    return;
  }

  try {
    // Persist through the Supervisor: writing /data/options.json directly is
    // undone the next time the Supervisor starts the add-on.
    await supervisorRequest('/addons/self/options', {
      method: 'POST',
      body: JSON.stringify({ options }),
    });
    res.json({
      success: true,
      message: 'Configuration saved. Restart the add-on to apply the changes.',
    });
  } catch (err) {
    console.error('Error saving configuration:', err.message);
    res.status(500).json({
      success: false,
      message: `Failed to save configuration: ${err.message}`,
    });
  }
});

/**
 * Seconds the given pid has been running, from the kernel's own bookkeeping:
 * field 22 of /proc/<pid>/stat is the process start time in clock ticks since
 * boot, and /proc/uptime is how long ago boot was. Returns null if either read
 * fails, which is not worth treating as an error.
 */
function processUptime(pid) {
  try {
    const systemUptime = parseFloat(fs.readFileSync('/proc/uptime', 'utf8').split(' ')[0]);
    const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
    // The second field is the executable name in parentheses and may itself
    // contain spaces, so split after the closing parenthesis.
    const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
    // Field 22 overall is index 19 once the first two fields are removed.
    const startTicks = parseInt(fields[19], 10);
    if (!Number.isFinite(systemUptime) || !Number.isInteger(startTicks)) return null;
    return Math.max(0, Math.round(systemUptime - startTicks / CLOCK_TICKS_PER_SECOND));
  } catch {
    return null;
  }
}

app.get('/api/status', (req, res) => {
  // Match the proxy binary itself: a substring match would also hit the
  // s6-supervise process, which stays alive even when tinyproxy has died.
  execFile('pgrep', ['-x', 'tinyproxy'], (error, stdout) => {
    if (error) {
      res.json({ running: false, pid: null, uptime: null });
      return;
    }
    const pid = parseInt(stdout.trim().split('\n')[0], 10);
    res.json({
      running: true,
      pid: Number.isInteger(pid) ? pid : null,
      uptime: Number.isInteger(pid) ? processUptime(pid) : null,
    });
  });
});

app.post('/api/proxy/restart', (req, res) => {
  const servicePath = resolveServicePath();

  if (!servicePath) {
    res.status(500).json({
      success: false,
      message: 'Could not locate the tinyproxy service directory.',
    });
    return;
  }

  execFile('s6-svc', ['-r', servicePath], (error) => {
    if (error) {
      console.error('Error restarting proxy service:', error.message);
      res.status(500).json({
        success: false,
        message: `Failed to restart proxy service: ${error.message}`,
      });
      return;
    }
    res.json({ success: true, message: 'Proxy service restarted successfully.' });
  });
});

app.get('/api/logs', (req, res) => {
  fs.readFile(LOG_PATH, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.json({ success: true, logs: [] });
        return;
      }
      console.error('Error reading proxy log:', err.message);
      res.status(500).json({ success: false, message: 'Failed to read logs' });
      return;
    }

    const lines = data.split('\n').filter((line) => line !== '').slice(-LOG_LINES);
    res.json({ success: true, logs: lines });
  });
});

app.listen(PORT, HOST, () => {
  console.log(`API server listening on ${HOST}:${PORT}`);
});

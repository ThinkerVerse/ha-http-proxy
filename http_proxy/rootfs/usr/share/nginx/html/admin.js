(() => {
    'use strict';

    // Work out where the API lives. Home Assistant serves this page under
    // /api/hassio_ingress/<token>/, so a hardcoded "/api" would miss it.
    // Anchor to the ingress prefix when it is present (with or without a
    // trailing slash), otherwise resolve against the current directory.
    function resolveApiBase(pathname) {
        const ingress = pathname.match(/^(.*\/api\/hassio_ingress\/[^/]+)/);
        if (ingress) return `${ingress[1]}/api`;
        return `${pathname.replace(/[^/]*$/, '')}api`;
    }

    const API_BASE = resolveApiBase(window.location.pathname);

    const LOG_POLL_MS = 10000;

    const el = (id) => document.getElementById(id);

    const statusPill = el('status-pill');
    const factState = el('fact-state');
    const factUptime = el('fact-uptime');
    const message = el('message');
    const logs = el('logs');
    const autoRefresh = el('auto-refresh');
    const logLevel = el('log_level');
    const allowedNetworks = el('allowed_networks');
    const authentication = el('authentication');
    const username = el('username');
    const password = el('password');
    const passwordHint = el('password-hint');
    const saveButton = el('save-config');
    const restartButton = el('restart-proxy');

    // Whether a password is already stored, so a blank field can mean
    // "leave it alone" rather than "clear it".
    let passwordIsSet = false;
    let logTimer = null;
    let messageTimer = null;

    function showMessage(text, kind) {
        message.textContent = text;
        message.className = `message message--${kind}`;
        clearTimeout(messageTimer);
        messageTimer = setTimeout(() => {
            message.className = 'message';
            message.textContent = '';
        }, 6000);
    }

    async function api(path, options) {
        const response = await fetch(`${API_BASE}${path}`, options);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || `Request failed (HTTP ${response.status})`);
        }
        return data;
    }

    function formatDuration(seconds) {
        if (seconds === null || seconds === undefined) return '—';
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (days) return `${days}d ${hours}h`;
        if (hours) return `${hours}h ${minutes}m`;
        if (minutes) return `${minutes}m`;
        return `${seconds}s`;
    }

    // --- status ---
    async function loadStatus() {
        try {
            const data = await api('/status');
            if (data.running) {
                statusPill.textContent = 'Running';
                statusPill.className = 'pill pill--ok';
                factState.textContent = 'Running';
                factUptime.textContent = formatDuration(data.uptime);
            } else {
                statusPill.textContent = 'Stopped';
                statusPill.className = 'pill pill--bad';
                factState.textContent = 'Stopped';
                factUptime.textContent = '—';
            }
        } catch (error) {
            statusPill.textContent = 'Unavailable';
            statusPill.className = 'pill pill--bad';
            factState.textContent = '—';
            factUptime.textContent = '—';
            showMessage(`Could not read status: ${error.message}`, 'error');
        }
    }

    // --- logs ---
    async function loadLogs(quiet) {
        try {
            const data = await api('/logs');
            logs.textContent = data.logs.length
                ? data.logs.join('\n')
                : 'Nothing logged yet. Connections are recorded at log level info or more detailed.';
            logs.scrollTop = logs.scrollHeight;
        } catch (error) {
            logs.textContent = 'Could not load the log.';
            if (!quiet) showMessage(`Could not load the log: ${error.message}`, 'error');
        }
    }

    function setAutoRefresh(on) {
        clearInterval(logTimer);
        logTimer = null;
        if (on) {
            logTimer = setInterval(() => {
                loadLogs(true);
                loadStatus();
            }, LOG_POLL_MS);
        }
    }

    // --- configuration ---
    function syncAuthFields() {
        const on = authentication.checked;
        username.disabled = !on;
        password.disabled = !on;
        password.placeholder = passwordIsSet ? '(unchanged)' : '';
        passwordHint.textContent = on && passwordIsSet
            ? 'Leave blank to keep the current password.'
            : '';
    }

    async function loadConfig() {
        try {
            const config = await api('/config');
            logLevel.value = config.log_level || 'info';
            allowedNetworks.value = Array.isArray(config.allowed_networks)
                ? config.allowed_networks.join(', ')
                : '';
            authentication.checked = Boolean(config.authentication);
            username.value = config.username || '';
            passwordIsSet = Boolean(config.password_set);
            password.value = '';
            syncAuthFields();
        } catch (error) {
            showMessage(`Could not load the configuration: ${error.message}`, 'error');
        }
    }

    async function saveConfig() {
        const payload = {
            log_level: logLevel.value,
            allowed_networks: allowedNetworks.value
                .split(',')
                .map((n) => n.trim())
                .filter(Boolean),
            authentication: authentication.checked,
            username: username.value,
        };
        // Only send a password when one was actually typed.
        if (password.value) payload.password = password.value;

        saveButton.disabled = true;
        try {
            const result = await api('/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            showMessage(result.message, 'ok');
            await loadConfig();
        } catch (error) {
            showMessage(error.message, 'error');
        } finally {
            saveButton.disabled = false;
        }
    }

    // --- controls ---
    async function restartProxy() {
        if (!confirm('Restart the proxy service? Active connections will drop.')) return;
        restartButton.disabled = true;
        try {
            const result = await api('/proxy/restart', { method: 'POST' });
            showMessage(result.message, 'ok');
            setTimeout(loadStatus, 2000);
        } catch (error) {
            showMessage(error.message, 'error');
        } finally {
            restartButton.disabled = false;
        }
    }

    // --- wiring ---
    el('refresh-status').addEventListener('click', loadStatus);
    el('refresh-logs').addEventListener('click', () => loadLogs(false));
    autoRefresh.addEventListener('change', () => setAutoRefresh(autoRefresh.checked));
    authentication.addEventListener('change', syncAuthFields);
    saveButton.addEventListener('click', saveConfig);
    restartButton.addEventListener('click', restartProxy);

    loadStatus();
    loadLogs(false);
    loadConfig();
})();

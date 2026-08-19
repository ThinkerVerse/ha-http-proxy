document.addEventListener('DOMContentLoaded', () => {
    const statusValue = document.getElementById('status-value');
    const refreshStatusBtn = document.getElementById('refresh-status-btn');

    const logsContent = document.getElementById('logs-content');
    const refreshLogsBtn = document.getElementById('refresh-logs-btn');

    const logLevelSelect = document.getElementById('log_level');
    const allowedNetworksInput = document.getElementById('allowed_networks');
    const authenticationCheckbox = document.getElementById('authentication');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const passwordHint = document.getElementById('password-hint');
    const saveConfigBtn = document.getElementById('save-config-btn');

    const restartProxyBtn = document.getElementById('restart-proxy-btn');
    const messageArea = document.getElementById('message-area');

    const API_BASE_URL = '/api';

    // Tracks whether a password is already stored, so an empty password field
    // can mean "leave it alone" instead of "clear it".
    let passwordIsSet = false;

    // --- Message Display Utility ---
    let messageTimer;
    function showMessage(message, type = 'success') {
        messageArea.textContent = message;
        messageArea.className = `message-area ${type}`;
        clearTimeout(messageTimer);
        messageTimer = setTimeout(() => {
            messageArea.textContent = '';
            messageArea.className = 'message-area';
        }, 5000);
    }

    async function requestJson(path, options) {
        const response = await fetch(`${API_BASE_URL}${path}`, options);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        return data;
    }

    // --- Proxy Status ---
    async function fetchStatus() {
        try {
            const data = await requestJson('/status');
            statusValue.textContent = data.running ? 'Running' : 'Stopped';
        } catch (error) {
            console.error('Error fetching status:', error);
            statusValue.textContent = 'Error loading status';
            showMessage(`Error fetching status: ${error.message}`, 'error');
        }
    }

    // --- Access Logs ---
    async function fetchLogs() {
        try {
            logsContent.textContent = 'Loading logs...';
            const data = await requestJson('/logs');
            logsContent.textContent = data.logs.join('\n') || 'No logs found.';
        } catch (error) {
            console.error('Error fetching logs:', error);
            logsContent.textContent = 'Error loading logs.';
            showMessage(`Error fetching logs: ${error.message}`, 'error');
        }
    }

    // --- Configuration ---
    async function fetchConfig() {
        try {
            const config = await requestJson('/config');

            logLevelSelect.value = config.log_level || 'info';
            allowedNetworksInput.value = Array.isArray(config.allowed_networks)
                ? config.allowed_networks.join(', ')
                : '';
            authenticationCheckbox.checked = config.authentication || false;
            usernameInput.value = config.username || '';
            passwordIsSet = Boolean(config.password_set);
            passwordInput.value = '';
            toggleAuthFields();
        } catch (error) {
            console.error('Error fetching config:', error);
            showMessage(`Error fetching configuration: ${error.message}`, 'error');
        }
    }

    function toggleAuthFields() {
        const enabled = authenticationCheckbox.checked;
        usernameInput.disabled = !enabled;
        passwordInput.disabled = !enabled;
        passwordInput.placeholder = passwordIsSet ? '(unchanged)' : '';
        passwordHint.textContent = enabled && passwordIsSet
            ? 'Leave blank to keep the current password.'
            : '';
    }

    authenticationCheckbox.addEventListener('change', toggleAuthFields);

    async function saveConfig() {
        const newConfig = {
            log_level: logLevelSelect.value,
            allowed_networks: allowedNetworksInput.value
                .split(',')
                .map((net) => net.trim())
                .filter((net) => net),
            authentication: authenticationCheckbox.checked,
            username: usernameInput.value,
        };

        // Only send a password when one was actually typed.
        if (passwordInput.value) {
            newConfig.password = passwordInput.value;
        }

        try {
            const result = await requestJson('/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
            showMessage(result.message, 'success');
            await fetchConfig();
        } catch (error) {
            console.error('Error saving config:', error);
            showMessage(`Error saving configuration: ${error.message}`, 'error');
        }
    }

    // --- Controls ---
    async function restartProxy() {
        if (!confirm('Are you sure you want to restart the proxy?')) {
            return;
        }
        try {
            const result = await requestJson('/proxy/restart', { method: 'POST' });
            showMessage(result.message, 'success');
            setTimeout(fetchStatus, 2000);
        } catch (error) {
            console.error('Error restarting proxy:', error);
            showMessage(`Error restarting proxy: ${error.message}`, 'error');
        }
    }

    // --- Event Listeners ---
    refreshStatusBtn.addEventListener('click', fetchStatus);
    refreshLogsBtn.addEventListener('click', fetchLogs);
    saveConfigBtn.addEventListener('click', saveConfig);
    restartProxyBtn.addEventListener('click', restartProxy);

    // --- Initial Data Load ---
    fetchStatus();
    fetchLogs();
    fetchConfig();
});

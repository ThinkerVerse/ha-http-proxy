document.addEventListener('DOMContentLoaded', () => {
    const statusValue = document.getElementById('status-value');
    const uptimeValue = document.getElementById('uptime-value');
    const requestsValue = document.getElementById('requests-value');
    const cacheHitRateValue = document.getElementById('cache-hit-rate-value');
    const refreshStatusBtn = document.getElementById('refresh-status-btn');

    const logsContent = document.getElementById('logs-content');
    const refreshLogsBtn = document.getElementById('refresh-logs-btn');

    const configForm = document.getElementById('config-form');
    const logLevelSelect = document.getElementById('log_level');
    const allowedNetworksInput = document.getElementById('allowed_networks');
    const authenticationCheckbox = document.getElementById('authentication');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const saveConfigBtn = document.getElementById('save-config-btn');

    const restartProxyBtn = document.getElementById('restart-proxy-btn');
    const messageArea = document.getElementById('message-area');

    const API_BASE_URL = '/api'; // Assuming the API is served from the same origin

    // --- Message Display Utility ---
    function showMessage(message, type = 'success') {
        messageArea.textContent = message;
        messageArea.className = `message-area ${type}`;
        setTimeout(() => {
            messageArea.textContent = '';
            messageArea.className = 'message-area';
        }, 5000);
    }

    // --- Proxy Status ---
    async function fetchStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/status`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.running) {
                statusValue.textContent = 'Running';
                if (data.stats) {
                    uptimeValue.textContent = data.stats.uptime || 'N/A';
                    requestsValue.textContent = data.stats.client_http_requests || 'N/A'; // Example, actual key might differ
                    // Assuming squidclient mgr:info format; tinyproxy might differ.
                    // Placeholder for cache hit rate as tinyproxy status is basic via pgrep
                    cacheHitRateValue.textContent = data.stats.cache_hit_rate || 'N/A (Tinyproxy does not provide this easily)';
                } else {
                    uptimeValue.textContent = 'N/A';
                    requestsValue.textContent = 'N/A';
                    cacheHitRateValue.textContent = 'N/A';
                }
            } else {
                statusValue.textContent = 'Stopped';
                uptimeValue.textContent = 'N/A';
                requestsValue.textContent = 'N/A';
                cacheHitRateValue.textContent = 'N/A';
            }
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
            const response = await fetch(`${API_BASE_URL}/logs`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.success && Array.isArray(data.logs)) {
                logsContent.textContent = data.logs.join('\n') || 'No logs found.';
            } else {
                logsContent.textContent = 'Failed to load logs.';
                showMessage(data.message || 'Failed to load logs.', 'error');
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            logsContent.textContent = 'Error loading logs.';
            showMessage(`Error fetching logs: ${error.message}`, 'error');
        }
    }

    // --- Configuration ---
    async function fetchConfig() {
        try {
            const response = await fetch(`${API_BASE_URL}/config`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const config = await response.json();

            logLevelSelect.value = config.log_level || 'info';
            allowedNetworksInput.value = Array.isArray(config.allowed_networks) ? config.allowed_networks.join(', ') : '';
            authenticationCheckbox.checked = config.authentication || false;
            usernameInput.value = config.username || '';
            passwordInput.value = config.password || '';
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
        if (!enabled) {
            usernameInput.value = '';
            passwordInput.value = '';
        }
    }

    authenticationCheckbox.addEventListener('change', toggleAuthFields);

    async function saveConfig() {
        const newConfig = {
            log_level: logLevelSelect.value,
            allowed_networks: allowedNetworksInput.value.split(',').map(net => net.trim()).filter(net => net),
            authentication: authenticationCheckbox.checked,
            username: usernameInput.value,
            password: passwordInput.value,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newConfig),
            });
            const result = await response.json();
            if (result.success) {
                showMessage('Configuration saved successfully. Restart the addon to apply changes.', 'success');
            } else {
                showMessage(result.message || 'Failed to save configuration.', 'error');
            }
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
            const response = await fetch(`${API_BASE_URL}/proxy/restart`, {
                method: 'POST',
            });
            const result = await response.json();
            if (result.success) {
                showMessage('Proxy restart command issued successfully.', 'success');
                // Optionally, refresh status after a delay
                setTimeout(fetchStatus, 2000);
            } else {
                showMessage(result.message || 'Failed to restart proxy.', 'error');
            }
        } catch (error) {
            console.error('Error restarting proxy:', error);
            showMessage(`Error restarting proxy: ${error.message}`, 'error');
        }
    }

    // --- Event Listeners ---
    if(refreshStatusBtn) refreshStatusBtn.addEventListener('click', fetchStatus);
    if(refreshLogsBtn) refreshLogsBtn.addEventListener('click', fetchLogs);
    if(saveConfigBtn) saveConfigBtn.addEventListener('click', saveConfig);
    if(restartProxyBtn) restartProxyBtn.addEventListener('click', restartProxy);

    // --- Initial Data Load ---
    fetchStatus();
    fetchLogs();
    fetchConfig();
});

const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');
const app = express();
const port = 3000;

// Middleware
app.use(express.json());

// Config path
const CONFIG_PATH = '/data/options.json';

// Read configuration
function getConfig() {
  try {
    const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Error reading config file:', error);
    return {};
  }
}

// Update configuration
function updateConfig(newConfig) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing config file:', error);
    return false;
  }
}

// Get proxy status
function getProxyStatus(callback) {
  // Check if the process managed by s6 under the name 'squid' (which runs tinyproxy) is active.
  exec('pgrep -f squid', (error, stdout, stderr) => {
    if (error) {
      // pgrep returns an error if no process is found
      callback({ running: false });
      return;
    }
    // If pgrep succeeds, the process is running.
    // Tinyproxy does not have a direct equivalent to 'squidclient mgr:info' for rich stats.
    // We'll return a basic status message.
    callback({ 
      running: true, 
      stats: { 
        message: "Tinyproxy service is running (managed as 'squid' by s6).",
        // uptime and other detailed stats are not readily available from Tinyproxy via CLI.
        uptime: "N/A", 
        client_http_requests: "N/A",
        cache_hit_rate: "N/A"
      } 
    });
  });
}

// Routes
app.get('/api/config', (req, res) => {
  const config = getConfig();
  res.json(config);
});

app.post('/api/config', (req, res) => {
  const newConfig = req.body;
  const success = updateConfig(newConfig);
  
  if (success) {
    res.json({ success: true, message: 'Configuration updated. Restart the addon to apply changes.' });
  } else {
    res.status(500).json({ success: false, message: 'Failed to update configuration' });
  }
});

app.get('/api/status', (req, res) => {
  getProxyStatus((status) => {
    res.json(status);
  });
});

app.post('/api/proxy/restart', (req, res) => {
  // Note: The service name is 'squid' as identified in rootfs/etc/services.d/
  // even though the underlying proxy is tinyproxy.
  exec('s6-svc -r /var/run/s6/services/squid', (error, stdout, stderr) => {
    if (error) {
      console.error('Error restarting proxy service:', error);
      res.status(500).json({ success: false, message: 'Failed to restart proxy service.', error: error.message });
      return;
    }
    res.json({ success: true, message: 'Proxy service restarted successfully.' });
  });
});

app.get('/api/logs', (req, res) => {
  fs.readFile('/var/log/squid/access.log', 'utf8', (err, data) => {
    if (err) {
      res.status(500).json({ success: false, message: 'Failed to read logs' });
      return;
    }
    
    // Return the last 100 lines
    const lines = data.split('\n').slice(-100);
    res.json({ success: true, logs: lines });
  });
});

// Start server
app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
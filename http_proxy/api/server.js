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
  exec('pgrep -f squid', (error, stdout, stderr) => {
    if (error) {
      callback({ running: false });
      return;
    }
    
    exec('squidclient mgr:info', (error, stdout, stderr) => {
      if (error) {
        callback({ running: true, stats: null });
        return;
      }
      
      // Parse squid stats
      const stats = {};
      const lines = stdout.split('\n');
      lines.forEach(line => {
        const parts = line.split(':');
        if (parts.length === 2) {
          stats[parts[0].trim()] = parts[1].trim();
        }
      });
      
      callback({ running: true, stats });
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
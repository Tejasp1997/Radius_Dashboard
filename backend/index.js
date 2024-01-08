const fs = require('fs');
const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());

// Store connected users and their connection count along with the latest log entry
const connectedUsers = {};

// Store the last read position in the log file
let lastReadPosition = 0;

app.get('/api/logs', (req, res) => {
    const radiusLogPath = '/var/log/freeradius/radius.log';

    // Read the logs from the file or use a log parser library
    const logs = readNewLogs(radiusLogPath);

    // Process logs to count connected users
    processLogs(logs);

    // Calculate the overall connected users count
    const overallCount = Object.keys(connectedUsers).length;
  
    // Log the connected users for debugging
   console.log('Connected Users:', connectedUsers);

    // Send the connected users count as JSON
    res.json({ overallCount, connectedUsers });
});

function readNewLogs(logPath) {
    try {
        // Read the logs from the last read position to the end of the file
        const logContent = fs.readFileSync(logPath, 'utf8');
        const newLogs = logContent.slice(lastReadPosition);

        // Update the last read position
        lastReadPosition = Buffer.from(logContent).length;

        // Split the new log content into an array of logs based on newline characters
        const logsArray = newLogs.split('\n');

        // Filter logs to include only lines containing "Login OK"
        const filteredLogs = logsArray.filter(log => /Login OK/.test(log));

        return filteredLogs;
    } catch (error) {
        console.error('Error reading logs:', error);
        return [];
    }
}

function processLogs(logs) {
    // Iterate through each log entry and update connectedUsers
    logs.forEach(log => {
        // Extract MAC address from the log entry (adjust regex as needed)
        const match = log.match(/cli\s+([0-9A-Fa-f:-]+)/);
        if (match) {
            const macAddress = match[1].toUpperCase(); // Normalize to uppercase
            const timestamp = new Date(match[2]);

            
            // Update connectedUsers count and store the latest log entry
            if (!connectedUsers[macAddress]) {
                connectedUsers[macAddress] = { count: 1, latestLog: log };
            } else {
                connectedUsers[macAddress].count += 1;
                connectedUsers[macAddress].latestLog = log;
            }

            
        
        }
    });
}




app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


const fs = require("fs");
const express = require("express");
const cors = require("cors");
const moment = require("moment");
const mariadb = require("mariadb");
const jwt = require("jsonwebtoken");
// const socketIO = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
// const io = socketIO(server);
const port = 5004;

app.use(cors({
  origin: 'http://172.23.1.14:3000',
   methods: 'GET,POST,PUT,DELETE',
   allowedHeaders: 'Content-Type,Authorization'
}));

app.use(express.json());

// Create a MySQL connection pool
const pool = mariadb.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "root",
  database: "radiuslogs",
});

pool
  .getConnection()
  .then((conn) => {
    console.log("Connected to MariaDB!");
    conn.release(); // Release the connection back to the pool
  })
  .catch((err) => {
    console.error("Error connecting to MariaDB:", err);
  });
// Store connected users and their connection count along with the latest log entry
const connectedUsers = {};

// Store the last read position in the log file
let lastReadPosition = 0;

let lastProcessedTimestamp = moment(); // Set an initial timestamp

// Create a counter to store the daily counts of incorrect logins
const dailyIncorrectLogins = {};

app.get("/api/logs", async (req, res) => {
  const radiusLogPath = "/var/log/freeradius/radius.log";
  const date = req.query.date;

  // Read the logs from the file or use a log parser library
  const logs = readNewLogs(radiusLogPath);

  // Process logs to count connected users and store in the database
  await processLogs(logs);

  // Calculate the overall connected users count
  const overallCount = Object.keys(connectedUsers).length;


//console.log("overallcount:",overallCount)
  // Send the connected users count as JSON
  res.json({ overallCount, connectedUsers });
});



async function processLogs(logs) {
  for (const log of logs) {
    const match = log.match(/cli\s+([0-9A-Fa-f:-]+)/);
    if (match) {
      const macAddress = match[1].toUpperCase();

      const logDateMatch = log.match(/([A-Za-z]{3}\s+\d+\s+\d{2}:\d{2}:\d{2})/);
      const logDate = logDateMatch
        ? moment(logDateMatch[0], "MMM D HH:mm:ss").format("YYYY-MM-DD")
        : null;

      const logTimeMatch = log.match(/\d{2}:\d{2}:\d{2}/);
      const logTime = logTimeMatch ? logTimeMatch[0] : null;

      const statusMatch = log.match(
        /Auth:\s+\((\d+)\)\s+(Login (OK|incorrect))/
      );
      const status = statusMatch ? statusMatch[3] : "Unknown";

      const nameMatch = log.match(/\[([^)]+)\]/);
      const name = nameMatch ? nameMatch[1] : "Unknown";
      
      if (status === "OK") {
      const isRegistered = await checkIfRegistered(macAddress);
      if (!isRegistered) {
        // Insert the device into the registered_users table
        await registerDevice(macAddress, name);

        // Increment the count of registered devices
       // await incrementRegisteredDevicesCount();

        // Notify about the new device registration
        console.log(`New device registered: ${name} (${macAddress})`);
      }
      }
      // Insert parsed data into the database
      const query = `
                INSERT INTO logs (macAddress, date, time, status, name)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE macAddress = macAddress;
            `;
      const values = [macAddress, logDate, logTime, status, name, log];

      try {
        const conn = await pool.getConnection();
        await conn.query(query, values);
        conn.release();
      } catch (error) {
        console.error("Error inserting log into database:", error);
      }

      // Update connectedUsers count and store the latest log entry
      if (!connectedUsers[macAddress]) {
        connectedUsers[macAddress] = {
          count: 1,
          latestLog: log,
          latestLogDate: logDate,
        };
      } else {
        connectedUsers[macAddress].count += 1;
        connectedUsers[macAddress].latestLog = log;
        connectedUsers[macAddress].latestLogDate = logDate;
      }
    }
  }
}

function readNewLogs(logPath) {
  try {
    // Read the logs from the last read position to the end of the file
    const logContent = fs.readFileSync(logPath, "utf8");
    const newLogs = logContent.slice(lastReadPosition);

    // Update the last read position
    lastReadPosition = Buffer.from(logContent).length;

    // Split the new log content into an array of logs based on newline characters
    //const logsArray = newLogs.split('\n');
    const logsArray = newLogs.split("\n");

    // Filter logs to include only lines containing "Login OK" or "Login incorrect"
    const filteredLogs = logsArray.filter((log) =>
      /Auth:\s+\(\d+\)\s+([^:]+):/.test(log)
    );

    return filteredLogs;
  } catch (error) {
    console.error("Error reading logs:", error);
    return [];
  }
}

async function checkIfRegistered(macAddress) {
  const conn = await pool.getConnection();
  try {
    const query = `SELECT COUNT(*) AS count FROM registered_users WHERE macAddress = ?`;
    const result = await conn.query(query, [macAddress]);
    return result[0].count > 0; // true if device is registered
  } catch (error) {
    console.error("Error checking device registration:", error);
    return false;
  } finally {
    conn.release();
  }
}


async function registerDevice(macAddress, name) {
  const conn = await pool.getConnection();
  try {
    const query = `INSERT INTO registered_users (macAddress, name) VALUES (?, ?)`;
    console.log("Executing SQL query:", query); // Debugging statement
    console.log("Data to insert:", macAddress, name);
    await conn.query(query, [macAddress, name]);
    console.log("Device registered successfully");    
  } catch (error) {
    console.error("Error registering device:", error);
  } finally {
    conn.release();
  }
}
// API endpoint to fetch newly connected devices
app.get("/api/new-devices", async (req, res) => {
  try {
    const { lastCheckedTime } = req.query;
    const conn = await pool.getConnection();
    const query = `SELECT macAddress, name FROM registered_users WHERE registration_date > ?`;
    const result = await conn.query(query, [req.query.lastCheckedTime]); // Assuming lastCheckedTime is passed in the query params
    conn.release();
    console.log(result);
    res.json(result);
  } catch (error) {
    console.error("Error fetching new devices:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//
// async function incrementRegisteredDevicesCount() {
//   const conn = await pool.getConnection();
//   try {
//     // Increment the count of registered devices in the counter table
//     const updateQuery = `UPDATE registered_devices_counter SET count = count + 1`;
//     await conn.query(updateQuery);
//   } catch (error) {
//     console.error("Error incrementing registered devices count:", error);
//   } finally {
//     conn.release();
//   }
// }


app.get("/api/total-registered-devices", async (req, res) => {
  try {
    // Fetch the total registered devices count from the database
    // const totalCount = await getTotalRegisteredDevicesCount();
    // res.json({ totalCount });
    const devicesInfo = await getRegisteredDevicesInfo();
    res.json(devicesInfo);
    //console.log("resgister:",devicesInfo)
  } catch (error) {
    console.error("Error fetching total registered devices count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Function to fetch the total registered devices count from the database
async function getRegisteredDevicesInfo() {
  try {
    const conn = await pool.getConnection();
   // const query = "SELECT COUNT(*) AS totalCount FROM registered_users";
   const query = "SELECT name, registration_date, macAddress FROM registered_users" 
   const result = await conn.query(query);
    conn.release();
   // const totalCount = Number(result[0].totalCount);
    const totalCount = result.length;
     // Map the result to include additional information
     const devicesInfo = result.map(row => ({
      name: row.name,
      registration_date: row.registration_date,
      macAddress: row.macAddress
    }));
   // console.log(devicesInfo);
    return { totalCount, devicesInfo };
  } catch (error) {
    console.error("Error fetching total registered devices count:", error);
    throw error;
  }
}
//To get data from db
app.get("/api/logs/db", async (req, res) => {
  const date = req.query.date;

  // Fetch logs from the database based on the selected date
  try {
    const conn = await pool.getConnection();
    const query = `
            SELECT *
            FROM logs
            WHERE date = ?
        `;
    const result = await conn.query(query, [date]);
    conn.release();

    const logsFromDB = result.map((log) => ({
      macAddress: log.macAddress,
      date: log.date,
      time: log.time,
      status: log.status,
      name: log.name,
    }));

    res.json({ logs: logsFromDB });
    console.log('fetchlogs:',logsFromDB)
  } catch (error) {
    console.error("Error fetching logs from database:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint to get the daily count of incorrect logins
app.get("/api/incorrect-logins", async(req, res) => {
  // const todayDate = moment().format("YYYY-MM-DD"); 
  try {
    const conn = await pool.getConnection();
    // Query the database for the total count and details of incorrect logins for today
    const todayDate = new Date().toISOString().split("T")[0];
    const incorrectQuery = `
      SELECT (SELECT COUNT(DISTINCT macAddress) FROM logs WHERE date = ? AND status = 'incorrect') as incorrectCount,name, macAddress
      FROM logs
      WHERE  date = ?
    `;
    const currentCountResult = await conn.query(incorrectQuery, [
      todayDate,
      todayDate,
      
    ]);
    
    
    const currentCounts = {
      incorrectCount: currentCountResult.length > 0 ? Number(currentCountResult[0].incorrectCount) : 0
    };
    
    //console.log("currentCounts:", currentCounts);
    conn.release();


   
    res.json(currentCounts);
    
   
  } catch (error) {
    console.error("Error fetching incorrect login details for today:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }

})

app.get("/api/logs-daily-count", async (req, res) => {
  try {
    const conn = await pool.getConnection();

    // Query to fetch count for the current date
    const currentDate = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format
    const currentCountQuery = `
       SELECT COUNT(DISTINCT macAddress) as count
       FROM logs
       WHERE date = ? AND status = 'ok'
     `;
    const currentCountResult = await conn.query(currentCountQuery, [
      currentDate,
    ]);
    const currentCount = Number(currentCountResult[0].count);

    const query = `
      SELECT date, COUNT(DISTINCT macAddress) as count
      FROM logs 
      WHERE status = 'ok'
      GROUP BY date
      ORDER BY date;
    `;
    const result = await conn.query(query);
    conn.release();

    

    // Convert the result to an object for easier consumption
    const dailyCounts = result.reduce((acc, { date, count }) => {
      acc[date] = Number(count);
      return acc;
    }, {});

  //  console.log("dailycount:", dailyCounts);
  //  console.log("currentCount:", currentCount);

    res.json({ dailyCounts, currentCount });
  } catch (error) {
    console.error("Error fetching daily log counts from database:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/graph-daily-count", async (req, res) => {
  try {
    const conn = await pool.getConnection();

    // Query to fetch counts for the last 7 days
    const dailyCountQuery = `
      SELECT DATE(date) as date, COUNT(DISTINCT macAddress) as count
      FROM logs
      WHERE date >= CURDATE() - INTERVAL 6 DAY AND status = 'ok'
      GROUP BY DATE(date)
      ORDER BY DATE(date);
    `;

    const result = await conn.query(dailyCountQuery);
    conn.release();

    // Convert the result to an object for easier consumption
    const graphdailyCounts = {};
    const currentDate = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      const formattedDate = date.toString().split(" ").slice(0, 4).join(" ");
      graphdailyCounts[formattedDate] = 0; // Initialize all days with 0
    }

    result.forEach(({ date, count }) => {
      const formattedDate = date.toString().split(" ").slice(0, 4).join(" ");
      graphdailyCounts[formattedDate] = Number(count);
    });

    res.json(graphdailyCounts);
    // console.log("graphcount:",graphdailyCounts)
  } catch (error) {
    console.error("Error fetching daily log counts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/api/graph-incorrect-counts", async (req, res) => {
  try {
    const conn = await pool.getConnection();

    // Query to fetch counts of incorrect logins for the last 7 days
    const incorrectCountQuery = `
      SELECT DATE(date) as date, COUNT(DISTINCT macAddress) as count
      FROM logs
      WHERE date >= CURDATE() - INTERVAL 6 DAY AND status = 'incorrect'
      GROUP BY DATE(date)
      ORDER BY DATE(date);
    `;

    const result = await conn.query(incorrectCountQuery);
    conn.release();

    // Convert the result to an object for easier consumption
    const graphincorrectCounts = {};
    const currentDate = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      const formattedDate = date.toString().split(" ").slice(0, 4).join(" ");
      graphincorrectCounts[formattedDate] = 0; // Initialize all days with 0
    }

    result.forEach(({ date, count }) => {
      const formattedDate = date.toString().split(" ").slice(0, 4).join(" ");
      graphincorrectCounts[formattedDate ] = Number(count);
    });

    res.json(graphincorrectCounts);
    // console.log("graphincorrect:",graphincorrectCounts)
  } catch (error) {
    console.error("Error fetching incorrect login counts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


//LOGIN
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  // Hardcoded username and password for the admin account
  const adminUsername = "admin";
  const adminPassword = "admin";

  // Check if the provided username and password match the admin credentials
  if (username === adminUsername && password === adminPassword) {
    // Generate a token or session identifier
    const token = generateToken(username);
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid username or password" });
  }
});

function generateToken(username) {
  // Implement token generation logic (e.g., using JWT)
  // Return a token that can be used for authentication
  const payload = {
    username: username,
    // Add any additional user information here
  };

  // Generate a JWT token with the payload and a secret key
  const token = jwt.sign(payload, "cdac@boss$radius", { expiresIn: "1h" }); // Token expires in 1 hour

  return token;
}

app.post("/api/logout", (req, res) => {
  delete req.headers.authorization; // Remove the token from the request headers

  res.json({ message: "Logout successful" });
  //console.log(res)
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});



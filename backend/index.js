const fs = require("fs");
const express = require("express");
const cors = require("cors");
const moment = require("moment");
const mariadb = require("mariadb");

const app = express();
const port = 3001;

app.use(cors());

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

  // Process logs to count connected users
  // processLogs(logs);

  // Process logs to count connected users and store in the database
  await processLogs(logs);

  // Calculate the overall connected users count
  const overallCount = Object.keys(connectedUsers).length;

  // Log the connected users for debugging
  console.log("Connected Users:", connectedUsers);

  // Send the connected users count as JSON
  res.json({ overallCount, connectedUsers });
});

async function processLogs(logs) {
  // Iterate through each log entry and update connectedUsers
  for (const log of logs) {
    // Extract MAC address from the log entry (adjust regex as needed)
    const match = log.match(/cli\s+([0-9A-Fa-f:-]+)/);
    if (match) {
      const monthAbbreviationToNumber = {
        Jan: "01",
        Feb: "02",
        Mar: "03",
        Apr: "04",
        May: "05",
        Jun: "06",
        Jul: "07",
        Aug: "08",
        Sep: "09",
        Oct: "10",
        Nov: "11",
        Dec: "12",
      };
      const macAddress = match[1].toUpperCase(); // Normalize to uppercase

      // Extract relevant information from the latestLog
      const logParts = log.split(" ");

      const day = logParts[2].length === 1 ? `0${logParts[2]}` : logParts[2];
      const month = monthAbbreviationToNumber[logParts[1]];
      const year = logParts[4];
      const time = logParts[3];

      const rawDate = `${year}-${month}-${day}`;
      const dateObject = moment(`${rawDate} ${time}`, "YYYY-MM-DD HH:mm:ss");

      const formattedDate = dateObject.isValid()
        ? dateObject.format("YYYY-MM-DD")
        : null;
     // const statusMatch = log.match(/Auth:\s+\((\d+)\)\s+([^:]+):/);
     // const status = statusMatch ? statusMatch[2].trim() : "Unknown";
     const statusMatch = log.match(/Auth:\s+\((\d+)\)\s+([^:]+):\s*(Login (OK|incorrect))/);
     const status = statusMatch ? statusMatch[3].trim() : "Unknown";

     // Check if the login status is 'incorrect' and increment the count
    if (status === "incorrect") {
      const formattedDate = dateObject.format("YYYY-MM-DD");
      dailyIncorrectLogins[formattedDate] = (dailyIncorrectLogins[formattedDate] || 0) + 1;
    }


     const nameMatch = log.match(/\[([^)]+)\]/);
      const name = nameMatch ? nameMatch[1] : "Unknown";

      console.log("formattedDate:", formattedDate);
      console.log("connectedUsers:", connectedUsers);
      console.log("macAddress:", macAddress);
      console.log("dateObject:", dateObject.format("YYYY-MM-DD HH:mm:ss"));
      console.log(
        "latestLogDate:",
        connectedUsers[macAddress]
          ? connectedUsers[macAddress].latestLogDate
          : "N/A"
      );

      // Insert parsed data into the database
      const query = `
                INSERT INTO logs (macAddress, date, time, status, name)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE macAddress = macAddress;
            `;
      const values = [macAddress, formattedDate, time, status, name, log];

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
          latestLogDate: formattedDate,
        };
      } else {
        connectedUsers[macAddress].count += 1;
        connectedUsers[macAddress].latestLog = log;
        connectedUsers[macAddress].latestLogDate = formattedDate;
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

    // Update the last read position to the length of the entire log content
    // lastReadPosition = Buffer.from(logContent).length;

    // Filter logs to include only lines containing "Login OK" or "Login incorrect"
    //        const filteredLogs = logsArray.filter((log) => /Auth:\s+\(\d+\)\s+([^:]+):/.test(log));

    return filteredLogs;
  } catch (error) {
    console.error("Error reading logs:", error);
    return [];
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
    // console.log('fetchlogs:',logsFromDB)
  } catch (error) {
    console.error("Error fetching logs from database:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Endpoint to get the daily count of incorrect logins
app.get("/api/incorrect-logins", (req, res) => {
  const date = req.query.date;

  // Check if the date is provided
  if (!date) {
    return res.status(400).json({ error: "Date is required in the query parameters." });
  }

  // Check if the date is in the correct format (YYYY-MM-DD)
  if (!moment(date, "YYYY-MM-DD", true).isValid()) {
    return res.status(400).json({ error: "Invalid date format. Please use YYYY-MM-DD." });
  }
  try {
    const dailyCount = dailyIncorrectLogins[date];
    const safeCount = dailyCount !== undefined ? dailyCount : 0;
    res.json({ date, dailyCount: safeCount });
  } catch (error) {
    console.error("Error fetching incorrect login count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
  // Fetch the count of incorrect logins for the provided date
//   const dailyCount = dailyIncorrectLogins[date] || 0;
// console.log(dailyCount)
//   res.json({ date, dailyCount });
// });
app.get("/api/logs-daily-count", async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const query = `
      SELECT date, COUNT(DISTINCT macAddress) as count
      FROM logs
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
console.log(dailyCounts)
    res.json(dailyCounts);
  } catch (error) {
    console.error("Error fetching daily log counts from database:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


//LOGIN
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  // Perform authentication logic here (e.g., check username and password against a database)
  if (username === "admin" && password === "admin") {
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
  const token = jwt.sign(payload, 'cdac@boss$radius', { expiresIn: '1h' }); // Token expires in 1 hour

  return token;
}




app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

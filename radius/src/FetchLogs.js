import React, { useState } from "react";
import axios from "axios";

const FetchLogs = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [logs, setLogs] = useState([]);

  const handleFetchLogs = () => {
    // Fetch logs based on selected date from the database
    axios
      .get(`http://localhost:3001/api/logs/db?date=${selectedDate}`)
      .then((response) => setLogs(response.data.logs))

      .catch((error) =>
        console.error("Error fetching logs from database:", error)
      );
  };

  return (
    <div>
      <h2>Fetch Logs</h2>
      <label>Select Date: </label>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      />
      <button onClick={handleFetchLogs}>Fetch Logs</button>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Name</th>
            <th>Mac Address</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <tr key={index}>
              {/* <td>{log.date.split("T")[0]}</td> */}
              <td>{new Date(log.date).toLocaleDateString()}</td>
              <td>{log.time}</td>
              <td>{log.name}</td>
              <td>{log.macAddress}</td>
              <td>{log.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FetchLogs;

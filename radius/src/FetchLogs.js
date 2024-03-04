import React, { useState } from "react";
import axios from "axios";
import './Logs.css'

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
    <div className="dashboard-container">
      {/* <div className="dashboard-header">
      <h2>Fetch Logs</h2>
      </div> */}
      <div>
      <label>Select Date: </label>
      </div>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      />
      <button onClick={handleFetchLogs}>Fetch Logs</button>
      <div className="dashboard-content">
        <div className="logs-table">
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
    </div>
    </div>
  );
};

export default FetchLogs;

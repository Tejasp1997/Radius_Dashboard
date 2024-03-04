import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
//import axios from "axios";
//import { Line } from "react-chartjs-2";
import "./Logs.css";

const Logs = () => {
  const [overallCount, setOverallCount] = useState(0);
  const [connectedUsers, setConnectedUsers] = useState([]);

  const compareUsersByLatestLog = (userA, userB) => {
    const timeA = new Date(userA.latestLog.split(" ").slice(1, 6).join(" "));
    const timeB = new Date(userB.latestLog.split(" ").slice(1, 6).join(" "));

    return timeB - timeA; // Sort in descending order
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://172.23.1.14:3001/api/logs");
        const data = await response.json();

        // console.log(data.overallCount);
        console.log(data);

        setOverallCount(data.overallCount);

        // Remove users who haven't connected for a day
        const updatedConnectedUsers = Object.keys(data.connectedUsers)
          .filter((macAddress) => {
            const user = data.connectedUsers[macAddress];
            const lastConnectionTime = new Date(
              user.latestLog.split(" ").slice(1, 6).join(" ")
            ); // Assuming the timestamp format is consistent
            const currentTime = new Date();
            const timeDifference = Math.abs(currentTime - lastConnectionTime);
            const hoursDifference = timeDifference / (1000 * 60 * 60);
            return hoursDifference < 24; // Check if last connection was within the last 24 hours
          })
          .reduce((obj, key) => {
            obj[key] = data.connectedUsers[key];
            return obj;
          }, {});

        // const sortedConnectedUsers = Object.values(updatedConnectedUsers).sort(compareUsersByLatestLog);

        const sortedConnectedUsers = Object.values(updatedConnectedUsers)
          .map((user, index) => ({
            ...user,
            macAddress: Object.keys(updatedConnectedUsers)[index],
          }))
          .sort(compareUsersByLatestLog);
        // Update the overall count based on the number of connected users
        setOverallCount(Object.keys(updatedConnectedUsers).length);

        console.log(updatedConnectedUsers);
        setConnectedUsers(sortedConnectedUsers);

        //console.log(sortedConnectedUsers)
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    //const intervalId = setInterval(fetchData, 5000);

    //return () => clearInterval(intervalId);
  }, []);

  const formatDate = (dateString) => {
    const options = { month: "short", day: "numeric", year: "numeric" };
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", options).format(date);
  };

  const formatTime = (timeString) => {
    const options = { hour: "numeric", minute: "numeric", second: "numeric" };
    const time = new Date(`January 1, 2024 ${timeString}`);
    return time.toLocaleTimeString("en-US", options);
  };
  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <Link to="/fetchlogs">Fetch Logs</Link>
      </nav>
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="circle-box">
          <div className="circle">
            <div className="circle-content">{overallCount}</div>
          </div>
        </div>
      </div>
      <div className="dashboard-content">
        <div className="logs-table">
          <h1>Connected Users Log</h1>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Name</th>
                <th>MAC Address</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {connectedUsers.map((user) => {
                const dateTimeParts = user.latestLog.split(" ");
                const date = formatDate(
                  `${dateTimeParts[1]} ${dateTimeParts[2]} ${dateTimeParts[4]}`
                );
                //const date = dateTimeParts.slice(1, 4).join(' ');
                //const time = dateTimeParts[4];
                const time = formatTime(dateTimeParts[3]);

                const nameMatch = user.latestLog.match(/\[([^)]+)\]/);
                const name = nameMatch ? nameMatch[1] : "Unknown";
                console.log("Log Entry:", user.latestLog);
                const statusMatch =
                  user.latestLog.match(/Login (OK|incorrect)/);
                const status = statusMatch ? statusMatch[1] : "Unknown";

                console.log("Status Match:", statusMatch);

                console.log("Extracted Status:", status);

                return (
                  <tr key={user.macAddress}>
                    <td>{date}</td>
                    <td>{time}</td>
                    <td>{name}</td>
                    <td>{user.macAddress}</td>
                    <td>{status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    //     <div className="dashboard-container">

    //       <div className="dashboard-header">
    //         <h1>Dashboard</h1>
    //         <div className="overall-count">{overallCount}</div>
    //       </div>
    //       <div className="dashboard-content">
    //         <div className="connected-users-box">
    //           <h2>Connected Users</h2>
    //           <div className="count-box">{overallCount}</div>
    //         </div>
    //         <div className="logs-table">
    //           <h1>Connected Users Log</h1>
    //           <table>
    //             <thead>
    //               <tr>
    //                 <th>Date</th>
    //                 <th>Time</th>
    //                 <th>Name</th>
    //                 <th>MAC Address</th>
    //                 <th>Status</th>
    //               </tr>
    //             </thead>
    //             <tbody>
    //               {connectedUsers.map((user) => {
    //                 const dateTimeParts = user.latestLog.split(" ");
    //                 const date = formatDate(
    //                   `${dateTimeParts[1]} ${dateTimeParts[2]} ${dateTimeParts[4]}`
    //                 );
    //                 //const date = dateTimeParts.slice(1, 4).join(' ');
    //                 //const time = dateTimeParts[4];
    //                 const time = formatTime(dateTimeParts[3]);

    //                 const nameMatch = user.latestLog.match(/\[([^)]+)\]/);
    //                 const name = nameMatch ? nameMatch[1] : "Unknown";
    //                 console.log("Log Entry:", user.latestLog);
    //                 const statusMatch = user.latestLog.match(/Login (OK|incorrect)/);
    // const status = statusMatch ? statusMatch[1] : "Unknown";

    //                 console.log("Status Match:", statusMatch);

    //                 console.log("Extracted Status:", status);

    //                 return (
    //                   <tr key={user.macAddress}>
    //                     <td>{date}</td>
    //                     <td>{time}</td>
    //                     <td>{name}</td>
    //                     <td>{user.macAddress}</td>
    //                     <td>{status}</td>
    //                   </tr>
    //                 );
    //               })}
    //             </tbody>
    //           </table>
    //         </div>
    //       </div>
    //     </div>
  );
};

export default Logs;

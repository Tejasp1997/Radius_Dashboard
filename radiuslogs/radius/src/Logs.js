import React, { useEffect, useState} from "react";
import './components/Home.css'
import moment from "moment";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
//import { Paginator } from 'primereact/paginator';
import { InputText } from 'primereact/inputtext';
// import { Button } from 'primereact/button';
import { CSVLink } from 'react-csv';
import csvimg from './images/csv.png'
import "./Logs.css";



const Logs = () => {
  // const [overallCount, setOverallCount] = useState(0);
  const [connectedUsers, setConnectedUsers] = useState([]);
  // const [loginOkUsersCount, setLoginOkUsersCount] = useState(0);
  const [globalFilter, setGlobalFilter] = useState('');
  

  const onFilter = (e) => {
    setGlobalFilter(e.target.value);
  };

  // const filterData = (value, field) => {
  //   return value.toLowerCase().includes(globalFilter.toLowerCase());
  // };

  
 


  const compareUsersByLatestLog = (userA, userB) => {
    const timeA = new Date(userA.latestLog.split(" ").slice(1, 6).join(" "));
    const timeB = new Date(userB.latestLog.split(" ").slice(1, 6).join(" "));

    return timeB - timeA; // Sort in descending order
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://172.23.1.14:5004/api/logs");
        const data = await response.json();
      const currentTime = new Date();
      const count = Object.values(data.connectedUsers)
        .filter(user => {
          const lastConnectionTime = new Date(user.latestLog.split(" ").slice(1, 6).join(" "));
          const timeDifference = Math.abs(currentTime - lastConnectionTime);
          const hoursDifference = timeDifference / (1000 * 60 * 60);
          return user.latestLog.includes("Login OK") && hoursDifference < 24;
        })
        .length;

      // setLoginOkUsersCount(count); // Update loginOkUsersCount state
      // setOverallCount(count);
        
   
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
        // setOverallCount(Object.keys(updatedConnectedUsers).length);

        // console.log('updatedusers:',updatedConnectedUsers);
        setConnectedUsers(sortedConnectedUsers);

        console.log(sortedConnectedUsers)
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    //const intervalId = setInterval(fetchData, 5000);

    //return () => clearInterval(intervalId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const formatDate = (logString) => {
    const parts = logString.split(" ");
    const month = parts[1];
    const day = parseInt(parts[2]);
    const year = parts[4];
    const monthNumber = moment().month(month).format("MM");
    //console.log('date:',day,monthNumber,year);
    return `${monthNumber}/${day}/${year}`;
  };

  const formatTime = (logString) => {
    const timeMatch = logString.match(/\d{2}:\d{2}:\d{2}/);
    const time = timeMatch ? timeMatch[0] : "Invalid Time";
    return time;
  };

 const nameFormat = (logString) => {

  const nameMatch = logString.match(/\[([^)]+)\]/);
   const name = nameMatch ? nameMatch[1] : "Unknown";
   return name;
 };
  
 
 const headers = [
  { label: 'Date', key: 'formattedDate' },
  { label: 'Time', key: 'formattedTime' },
  { label: 'Name', key: 'formattedName' },
  { label: 'MAC Address', key: 'macAddress' },
  { label: 'Status', key: 'status' }
];

// Format the data for CSV export
const formattedData = connectedUsers.map(user => ({
  formattedDate: formatDate(user.latestLog),
  formattedTime: formatTime(user.latestLog),
  formattedName: nameFormat(user.latestLog),
  macAddress: user.macAddress,
  status: user.latestLog.includes("Login OK") ? "Login OK" : "Login Incorrect"
}));


  
  return (
    <>
  

<main className="main-container">
      <div className="dashboard-container">
        <div className="dashboard-content">
          <div className="logs-table">
            <div className="line"></div>
            <h3>Active Users List</h3>
            <div className="logview">
            {/* <div className="search-container"> */}
              <span className="search-icon">
                <i className="pi pi-search" />
              </span>
              <InputText
                value={globalFilter}
                onChange={onFilter}
                placeholder="Search"
                className="search-input two"
              />
               <CSVLink data={formattedData} headers={headers} filename={"ActiveUsers.csv"}>
        <img src={csvimg} alt="Download CSV" title="Download CSV file" style={{ width: '50px', height: '50px', cursor: 'pointer', position: 'absolute', right: '40px'}} />
      </CSVLink>
              {/* </div> */}
              </div>
            
    
            <DataTable value={connectedUsers}   paginator rows={20} globalFilter={globalFilter} emptyMessage="No records found">
              <Column field="latestLog" header="Date" style={{textAlign: 'center'}} body={(rowData) => formatDate(rowData.latestLog)} />
              <Column field="latestLog" header="Time" style={{textAlign: 'center'}} body={(rowData) => formatTime(rowData.latestLog)} />
              <Column field="name" header="Name" style={{textAlign: 'center'}}     body={(rowData) => nameFormat(rowData.latestLog)}/>
              <Column field="macAddress" header="MAC Address"  style={{textAlign: 'center'}}/>
              {/* <Column field="status" header="Status" body={(rowData) => rowData.latestLog.includes("Login OK") ? "Login OK" : "Login Incorrect"} style={(rowData) => ({ color: rowData.latestLog.includes("Login OK") ? "green" : "red" })} /> */}
              <Column field="status" header="Status" style={{textAlign: 'center'}} body={(rowData) => (
              <span className={rowData.latestLog.includes("Login OK") ? "login-ok" : "login-incorrect"}>
                {rowData.latestLog.includes("Login OK") ? "Login OK" : "Login Incorrect"}
              </span>
            )}
          />
            </DataTable>

            {/* <Paginator first={first} rows={rows} totalRecords={connectedUsers.length} onPageChange={onPageChange} /> */}
          </div>
        </div>
      </div>
    </main>
    </>
  );
};

export default Logs;















  {/* <main className="main-container">
      <div className="dashboard-container">
      
        <div className="dashboard-content">
          <div className="logs-table">
            <div className="line"></div>
            <h3>Active Users List</h3>
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
                  //const dateTimeParts = user.latestLog.split(" ");

                  const date = formatDate(user.latestLog);
                  const time = formatTime(user.latestLog);

                  const nameMatch = user.latestLog.match(/\[([^)]+)\]/);
                  const name = nameMatch ? nameMatch[1] : "Unknown";
                  //console.log("Log Entry:", user.latestLog);
                  const statusMatch =
                    user.latestLog.match(/Login (OK|incorrect)/);
                  //const status = statusMatch ? statusMatch[1] : "Unknown";
                  const status = statusMatch
                    ? statusMatch[1] === "OK"
                      ? "Login OK"
                      : "Login Incorrect"
                    : "Unknown";
                  const statusColor = status.includes("OK") ? "green" : "red";
                  //console.log("Status Match:", statusMatch);

                  //console.log("Extracted Status:", status);

                  return (
                    <tr key={user.macAddress}>
                      <td>{date}</td>
                      <td>{time}</td>
                      <td>{name}</td>
                      <td>{user.macAddress}</td>
                      <td style={{ color: statusColor }}>{status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </main> */}
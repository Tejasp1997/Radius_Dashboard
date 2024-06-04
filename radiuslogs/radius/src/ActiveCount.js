import React, { useEffect, useState } from "react";
import "./components/Home.css";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { CSVLink } from "react-csv";
import { FaUsers } from "react-icons/fa";
import "./Logs.css";
import csvimg from "./images/csv.png";

const ActiveCounts = () => {
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [loginOkUsersCount, setLoginOkUsersCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://172.23.1.14:5004/api/logs");
        const data = await response.json();
        console.log("logs:", data);
        const currentTime = new Date();

        const loginOkUsers = Object.values(data.connectedUsers)
          .filter((user) => {
            // Parse the latestLog date
            const logParts = user.latestLog.split(" ");
            const dateString = logParts.slice(1, 6).join(" ");

            const lastConnectionTime = new Date(dateString);
            
            // Calculate the time difference
            const timeDifference = Math.abs(currentTime - lastConnectionTime);
            const hoursDifference = timeDifference / (1000 * 60 * 60);
            console.log(`Time difference in hours: ${hoursDifference}`);
            // Check if the log includes "Login OK" and is within the last 2 hours
            return user.latestLog.includes("Login OK") && hoursDifference < 6;
          })
          .map((user, index) => {
            const logParts = user.latestLog.split(" ");
            const dateString = logParts.slice(1, 6).join(" ");
            const logDate = new Date(dateString);

            // Format the date as MM-DD-YYYY
            const formattedDate = `${
              logDate.getMonth() + 1
            }-${logDate.getDate()}-${logDate.getFullYear()}`;

            const time = logParts[4];
            const nameMatch = user.latestLog.match(/\[(.*?)\]/);
            const name = nameMatch ? nameMatch[1] : "Unknown";
            const macAddress = Object.keys(data.connectedUsers).find(
              (key) => data.connectedUsers[key] === user
            );
            const status = "Login OK";

            return {
              
              formattedDate,
              time,
              name,
              macAddress,
              status,
              lastConnectionTime: logDate,
            };
          })
          .sort((a, b) => b.lastConnectionTime - a.lastConnectionTime)
          .map((user, index) => ({ ...user, serialNumber: index + 1 }));
        // Calculate the count of users with "Login OK" within the last 24 hours
        const count = loginOkUsers.length;

        setLoginOkUsersCount(count); // Update loginOkUsersCount state
        setConnectedUsers(loginOkUsers); // Update connectedUsers state

        console.log("Formatted login OK users:", loginOkUsers);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    //const intervalId = setInterval(fetchData, 5000);

    //return () => clearInterval(intervalId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showDialog = () => {
    setIsDialogVisible(true);
  };

  const hideDialog = () => {
    setIsDialogVisible(false);
  };

  const onFilter = (e) => {
    setGlobalFilter(e.target.value);
  };

  const headers = [
    { label: "Date", key: "formattedDate" },
    { label: "Time", key: "time" },
    { label: "Name", key: "name" },
    { label: "MAC Address", key: "macAddress" },
    { label: "Status", key: "status" },
  ];

  const statusBodyTemplate = (rowData) => {
    const statusStyle = {
      color: rowData.status === "Login OK" ? "green" : "red" ,
      fontWeight: "bold",
    };
    return <span style={statusStyle}>{rowData.status}</span>;
  };

  return (
    <>
      <div className="card second" onClick={showDialog}>
        <div className="card-inner">
          <h3>Active Count</h3>
          <FaUsers className="card_icon" />
        </div>
        <h1>{loginOkUsersCount}</h1>
      </div>
      <Dialog
        header="Active Client Counts"
        visible={isDialogVisible}
        onHide={hideDialog}
        modal
        style={{
          width: "60vw",
          background: "rgba(255, 255, 255, 1)",
          fontSize: "30px",
        }}
        contentStyle={{ padding: "2rem" }}
      >
        <div className="regview">
          <span className="search-icon">
            <i icon="pi pi-search" />
          </span>
          <InputText
            value={globalFilter}
            onChange={onFilter}
            placeholder="Search"
            className="search-input"
          />
          <CSVLink
            data={connectedUsers}
            headers={headers}
            filename={"ActiveClientCounts.csv"}
          >
            <img
              src={csvimg}
              alt="Download CSV"
              title="Download CSV file"
              style={{
                width: "40px",
                height: "40px",
                cursor: "pointer",
                position: "absolute",
                right: "40px",
              }}
            />
          </CSVLink>
        </div>
        <div className="logs-table">
          <div className="dialog-content">
            <DataTable
              value={connectedUsers}
              globalFilter={globalFilter}
              paginator
              rows={10}
              scrollable
              scrollHeight="calc(100% - 50px)"
              tableStyle={{
                border: "3px solid #ddd",
                marginBottom: "0.5rem",
              }}
            >
              <Column
                field="serialNumber"
                header="Serial No"
                style={{ textAlign: "center" }}
              />
              <Column
                field="formattedDate"
                header="Date"
                style={{ textAlign: "center" }}
              />
              <Column
                field="time"
                header="Time"
                style={{ textAlign: "center" }}
              />
              <Column
                field="name"
                header="Name"
                style={{ textAlign: "center" }}
              />
              <Column
                field="macAddress"
                header="MAC Address"
                style={{ textAlign: "center" }}
              />
              <Column
                field="status"
                header="Status"
                body={statusBodyTemplate}
                style={{ textAlign: "center" }}
              />
            </DataTable>
          </div>
        </div>
      </Dialog>
      {isDialogVisible && <div className="dialog-overlay"></div>}
    </>
  );
};

export default ActiveCounts;

// useEffect(() => {
//   const fetchData = async () => {
//     try {
//       const response = await fetch("http://172.23.1.14:5004/api/logs");
//       const data = await response.json();
//       console.log("logs:", data);
//       const currentTime = new Date();

//       const count = Object.values(data.connectedUsers).filter((user) => {
//         const lastConnectionTime = new Date(
//           user.latestLog.split(" ").slice(1, 6).join(" ")
//         );
//         const timeDifference = Math.abs(currentTime - lastConnectionTime);
//         const hoursDifference = timeDifference / (1000 * 60 * 60);
//         return user.latestLog.includes("Login OK") && hoursDifference < 24;
//       }).length;

//       const loginOkUsers = Object.values(data.connectedUsers)
//         .filter((user) => user.latestLog.includes("Login OK"))
//         .map((user, index) => {
//           const logParts = user.latestLog.split(" ");
//           //const date = logParts.slice(1, 4).join(" ");
//           const dateString = logParts.slice(1, 6).join(" ");
//           const logDate = new Date(dateString);

// // Calculate the time difference
// const timeDifference = Math.abs(currentTime - logDate);
// const hoursDifference = timeDifference / (1000 * 60 * 60);

// // Check if the log includes "Login OK" and is within the last 24 hours
// return user.latestLog.includes("Login OK") && hoursDifference < 24;

//           // Format the date as MM-DD-YYYY
//           const formattedDate = `${
//             logDate.getMonth() + 1
//           }-${logDate.getDate()}-${logDate.getFullYear()}`;

//           const time = logParts[3];
//           const nameMatch = user.latestLog.match(/\[(.*?)\]/);
//           const name = nameMatch ? nameMatch[1] : "Unknown";
//           const macAddress = Object.keys(data.connectedUsers).find(
//             (key) => data.connectedUsers[key] === user
//           );
//           const status = "Login OK";

//           return { serialNumber: index + 1, formattedDate, time, name, macAddress, status };
//         });

//       setLoginOkUsersCount(count); // Update loginOkUsersCount state
//       setConnectedUsers(loginOkUsers);

//       console.log("Formatted login OK users:", loginOkUsers);
//     } catch (error) {
//       console.error("Error fetching data:", error);
//     }
//   };

//   fetchData();
//   //const intervalId = setInterval(fetchData, 5000);

//   //return () => clearInterval(intervalId);
// }, []);

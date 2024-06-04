import React, { useEffect, useState } from "react";
import "./components/Home.css";
import { FaUserAltSlash } from "react-icons/fa";
import "./components/Home.css";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { CSVLink } from "react-csv";
import "./Logs.css";
import csvimg from "./images/csv.png";

const IncorrectLogins = () => {
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [connectedUsers, setConnectedUsers] = useState([]);

  useEffect(() => {
    const fetchIncorrectLogins = async () => {
      try {
        const response = await fetch(
          "http://172.23.1.14:5004/api/incorrect-logins"
        );
        const data = await response.json();
        setIncorrectCount(data.incorrectCount);
        // console.log("incrt:", data);
      } catch (error) {
        console.error("Error fetching incorrect logins:", error);
      }
    };

    fetchIncorrectLogins();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://172.23.1.14:5004/api/logs");
        const data = await response.json();
        // console.log("logs:", data);
        const currentTime = new Date();

        const loginIncorrectUsers = Object.values(data.connectedUsers)
          .filter((user) => {
            const logParts = user.latestLog.split(" ");
            const dateString = logParts.slice(1, 6).join(" ");
            const lastConnectionTime = new Date(dateString);

            // Calculate the time difference
            const timeDifference = Math.abs(currentTime - lastConnectionTime);
            const hoursDifference = timeDifference / (1000 * 60 * 60);

            return (
              user.latestLog.includes("Login incorrect") && hoursDifference < 6
            );
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
            const status = "Invalid Login";

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

        setConnectedUsers(loginIncorrectUsers); // Update connectedUsers with formatted data

        // console.log("Formatted login incorrect users:", loginIncorrectUsers);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

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
      <div className="card fourth" onClick={showDialog}>
        <div className="card-inner">
          <h3>Invalid Login Count</h3>
          <FaUserAltSlash className="card_icon" />
        </div>
        <h1>{incorrectCount}</h1>
      </div>

      <Dialog
        header="Invalid Client Login"
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
            filename={"InvalidLogins.csv"}
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

export default IncorrectLogins;

// useEffect(() => {
//   const fetchData = async () => {
//     try {
//       const response = await fetch("http://172.23.1.14:5004/api/logs");
//       const data = await response.json();
//       console.log("logs:", data);

//       const loginIncorrectUsers = Object.values(data.connectedUsers)
//         .filter((user) => user.latestLog.includes("Login incorrect"))
//         .map((user, index) => {
//           const logParts = user.latestLog.split(" ");
//           const dateString = logParts.slice(1, 5).join(" ");
//           const logDate = new Date(dateString);

//           // Format the date as MM-DD-YYYY
//           const formattedDate = `${logDate.getMonth() + 1}-${logDate.getDate()}-${logDate.getFullYear()}`;

//           const time = logParts[3];
//           const nameMatch = user.latestLog.match(/\[(.*?)\]/);
//           const name = nameMatch ? nameMatch[1] : "Unknown";
//           const macAddress = Object.keys(data.connectedUsers).find(
//             (key) => data.connectedUsers[key] === user
//           );
//           const status = "Login incorrect";

//           return { serialNumber: index + 1, formattedDate, time, name, macAddress, status };
//         });

//       setConnectedUsers(loginIncorrectUsers); // Update connectedUsers with formatted data

//       console.log("Formatted login incorrect users:", loginIncorrectUsers);
//     } catch (error) {
//       console.error("Error fetching data:", error);
//     }
//   };

//   fetchData();
// }, []);

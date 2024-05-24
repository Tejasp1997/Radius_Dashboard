import React, { useState } from "react";
import axios from "axios";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
// import { Button } from 'primereact/button';
import { CSVLink } from 'react-csv';
import './Logs.css'
import csvimg from './images/csv.png'

const FetchLogs = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [logs, setLogs] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  

  const onFilter = (e) => {
    setGlobalFilter(e.target.value);
  };
  // const filterData = (value, field) => {
  //   return value.toLowerCase().includes(globalFilter.toLowerCase());
  // };
  const handleFetchLogs = () => {
    // Fetch logs based on selected date from the database
    axios
      .get(`http://172.23.1.14:5004/api/logs/db?date=${selectedDate}`)
      .then((response) => setLogs(response.data.logs))

      .catch((error) =>
        console.error("Error fetching logs from database:", error)
      );
  };


  const headers = [
    { label: 'Date', key: 'date' },
    { label: 'Time', key: 'time' },
    { label: 'Name', key: 'name' },
    { label: 'MAC Address', key: 'macAddress' },
    { label: 'Status', key: 'status' }
  ];
  return (

    <main className="main-container">
    <div className="dashboard-container">
     
      <div className="topview">
      <label>Select Date: </label>
      
      <input className="datesrch"
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      />
      <button className="button-7" onClick={handleFetchLogs}>Fetch Logs</button>

     
              <span className="search-icon">
                <i icon="pi pi-search" />
                </span>
              <InputText
                value={globalFilter}
                onChange={onFilter}
                placeholder="Search"
                className="search-input"
              />
              
               <CSVLink data={logs} headers={headers} filename={"Logs.csv"}>
        {/* <Button label="Download CSV" icon="pi pi-download" className="p-button-success" /> */}
        <img src={csvimg} alt="Download CSV" title="Download CSV file" style={{ width: '40px', height: '40px', cursor: 'pointer', position: 'absolute', right: '40px' }} />
      </CSVLink>
              </div>
     
      <div className="dashboard-content">
      <div className="logs-table">
          <DataTable value={logs} paginator rows={15} globalFilter={globalFilter} emptyMessage="No records found">
            <Column field="date" header="Date" style={{textAlign: 'center'}} body={(rowData) => new Date(rowData.date).toLocaleDateString()} />
            <Column field="time" header="Time" style={{textAlign: 'center'}}/>
            <Column field="name" header="Name" style={{textAlign: 'center'}}/>
            <Column field="macAddress" header="Mac Address" style={{textAlign: 'center'}}/>
            <Column field="status" header="Status" style={{textAlign: 'center'}}/>
          </DataTable>
        </div>
        </div>
    </div>
    </main>
  );
};

export default FetchLogs;










 {/* <div className="dashboard-content">
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
    </div> */}
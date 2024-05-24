import React, { useEffect, useState } from "react";
//import { Link } from "react-router-dom";
import axios from "axios";
import "./components/Home.css";
import IncorrectLogins from "./IncorrectLogins";
import Registercount from "./Registercount";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { CSVLink } from "react-csv";
import { FaUserCheck } from "react-icons/fa";
import "./Logs.css";
import csvimg from "./images/csv.png";
import ActiveCounts from "./ActiveCount";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";



const Home = () => {
  // const [dailyCounts, setDailyCounts] = useState({});
  const [currentCount, setCurrentCount] = useState(0);
  const [graphIncorrect, setGraphIncorrect] = useState({});
  const [graphCount, setGraphCount] = useState({});
  const [dailyCounts, setDailyCounts] = useState([]);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [incorrectResponse, countResponse] = await Promise.all([
        axios.get("http://172.23.1.14:5004/api/graph-incorrect-counts"),
        axios.get("http://172.23.1.14:5004/api/graph-daily-count"),
      ]);
      setGraphIncorrect(incorrectResponse.data);
      setGraphCount(countResponse.data);
      console.log("incorrectgraph:", incorrectResponse);
      console.log("countdaily:", countResponse);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    const fetchDailyCounts = async () => {
      try {
        const response = await fetch(
          "http://172.23.1.14:5004/api/logs-daily-count"
        );
        const data = await response.json();

        
        setCurrentCount(data.currentCount);
        setDailyCounts(data.dailyCounts);
        //console.log("dailycount;", data);
      } catch (error) {
        console.error("Error fetching daily log counts:", error);
      }
    };
    fetchDailyCounts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showDialog = () => {
    setIsDialogVisible(true);
  };

  const hideDialog = () => {
    setIsDialogVisible(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: "numeric", month: "2-digit", day: "2-digit" };
    return date.toLocaleDateString("en-US", options);
  };

  const dailyCountsArray = Object.keys(dailyCounts).map((date,index) => ({
    serialNumber: index + 1,
    date,
    count: dailyCounts[date],
  }));

  const onFilter = (e) => {
    setGlobalFilter(e.target.value);
  };

  const headers = [
    { label: "Serial No", key: "serialNumber" },
    { label: "Date", key: "date" },
    { label: "Count", key: "count" },
  ];

  const formattedData = dailyCountsArray.map((item) => ({
    serialNumber: item.serialNumber,
    date: formatDate(item.date),
    count: item.count,
  }));

  

  return (
    <main className="main-container">
      <div className="main-title">
        <h3>DASHBOARD</h3>
      </div>

      <div className="main-cards">
        <div>
          <Registercount />
        </div>
      <div>
        <ActiveCounts />
      </div>

        <div className="card third" onClick={showDialog}>
          <div className="card-inner">
            <h3>Daily Count</h3>
            <FaUserCheck className="card_icon" />
          </div>
          <h1>{currentCount}</h1>
        </div>

        <Dialog
          header="Daily Log Counts"
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
              tooltip="Search"
            />
            <CSVLink
              data={formattedData}
              headers={headers}
              filename={"DailyLogCounts.csv"}
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
                value={dailyCountsArray}
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
                 <Column field="serialNumber" header="Serial No" style={{ textAlign: 'center' }} />
                <Column
                  field="date"
                  header="Date"
                  style={{ textAlign: "center" }}
                  body={(rowData) => formatDate(rowData.date)}
                />
                <Column
                  field="count"
                  header="Count"
                  style={{ textAlign: "center" }}
                />
              </DataTable>
            </div>
          </div>
        </Dialog>
        {isDialogVisible && <div className="dialog-overlay"></div>}

        <div>
          <IncorrectLogins />
        </div>
      </div>

      <div className="charts">
        <div className="chart">
          <h3 className="chart-title">Invalid Logins</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              width={500}
              height={500}
              data={Object.entries(graphIncorrect).map(([date, count]) => ({
                date,
                count,
              }))}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#e73535" />
              {/* <Bar dataKey="uv" fill="#82ca9d" /> */}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart">
          <h3 className="chart-title">Daily Logins</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              width={500}
              height={500}
              data={Object.entries(graphCount).map(([date, count]) => ({
                date,
                count,
              }))}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
              {/* <Line type="monotone" dataKey="uv" stroke="#82ca9d" /> */}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </main>
  );
};

export default Home;

import React, { useState, useEffect } from 'react';
import axios from "axios";
import { PiUsersFourFill } from "react-icons/pi";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {Dialog} from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { CSVLink } from 'react-csv';
import './components/Home.css';
import "./Logs.css";
import csvimg from './images/csv.png'


function Registercount() {
  const [totalCount, setTotalCount] = useState(0);
  const [devicesInfo, setDevicesInfo] = useState([]);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');


  const onFilter = (e) => {
    setGlobalFilter(e.target.value);
  };

  useEffect(() => {
    // Fetch total registered devices info from the API
    axios.get('http://172.23.1.14:5004/api/total-registered-devices')
      .then(response => {
        const { totalCount, devicesInfo } = response.data;
        setTotalCount(totalCount);
        setDevicesInfo(devicesInfo.map((device, index) => ({ ...device, serialNumber: index + 1 })));
      })
      .catch(error => {
        console.error('Error fetching registered devices info:', error);
      });
  }, []);// eslint-disable-line react-hooks/exhaustive-deps


  // Function to open the dialog and set the selected device
  const showDialog = () => {
    // Select the first device from devicesInfo array
    setSelectedDevice(devicesInfo.length > 0 ? devicesInfo[0] : null);
    setIsDialogVisible(true);
  };

  // Function to close the dialog
  const hideDialog = () => {
    setIsDialogVisible(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return date.toLocaleDateString('en-US', options);
  };


  const headers = [
    { label: 'Name', key: 'name' },
    { label: 'Date', key: 'formattedDate' }, 
    { label: 'MAC Address', key: 'macAddress' },
  ]
    // Format the data for CSV export
const formattedData = devicesInfo.map(user => ({
  name : user.name,
  formattedDate: formatDate(user.registration_date),
  macAddress: user.macAddress,

}));
  
  return (

    <>
    <div className='card first'  onClick={showDialog}>
    <div className='card-inner'>
        <h3>Total RegisterDevice</h3>
        <PiUsersFourFill className='card_icon'/>
    </div>
    <h1>{totalCount}</h1>
</div>
    
     {/* Dialog for displaying device information */}
     <Dialog  header="Register Devices"  visible={isDialogVisible}   onHide={hideDialog} modal style={{ width: '60vw', background: 'rgba(255, 255, 255, 1)', fontSize: '30px' }} contentStyle={{ padding: '2rem' }} >
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
              
               <CSVLink data={formattedData} headers={headers} filename={"RegisteredDevices.csv"}>
        {/* <Button label="Download CSV" icon="pi pi-download" className="p-button-success" /> */}
        <img src={csvimg} alt="Download CSV" title="Download CSV file" style={{ width: '40px', height: '40px', cursor: 'pointer', position: 'absolute', right: '40px' }} />
      </CSVLink>
              </div>
     <div className="logs-table">
     <div className="dialog-content">
          <DataTable value={devicesInfo} globalFilter={globalFilter} paginator rows={10}  scrollable scrollHeight="calc(100% - 50px)"  tableStyle={{ border: '3px solid #ddd', marginBottom: '0.5rem'}}>
            <Column field="serialNumber" header="SR.No" style={{textAlign: 'center'}} /> 
            <Column field="name" header="Name" style={{textAlign: 'center'}}/>
            <Column field="registration_date" header="Date" style={{textAlign: 'center'}} body={(rowData) => formatDate(rowData.registration_date)} />
            <Column field="macAddress" header="MAC Address" style={{textAlign: 'center'}} />
          </DataTable>
        </div>
        </div>
      </Dialog>
      {isDialogVisible && <div className="dialog-overlay"></div>}
     
        </>
  );
}

export default Registercount;



// scrollableStyle={{ marginTop: '0px' }}
import {Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import './App.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Home from './Home';
import Login from './Login';
import Fetchlogs from './FetchLogs';
import Logs from './Logs'
import RegisterDevice from './components/RegisterDevice';
import ActiveCounts from './ActiveCount';


function App() {
  const [openSidebarToggle, setOpenSidebarToggle] = useState(false);

  const OpenSidebar = () => {
    setOpenSidebarToggle(!openSidebarToggle);
  };

  const isAuthenticated = !!localStorage.getItem("token"); // Check if user is authenticated

  return (
    
      <div className={isAuthenticated ? 'grid-container' : ''}>
       {isAuthenticated && <Header OpenSidebar={OpenSidebar}/>}
        {isAuthenticated && <Sidebar openSidebarToggle={openSidebarToggle} OpenSidebar={OpenSidebar}/> }
       
        <Routes>
          <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" replace/>} />
          <Route exact path="/login" element={<Login />} />
          <Route path='/logs' element={<Logs />} />
          <Route path='/fetchlogs' element={<Fetchlogs />} />
          <Route path='/registerdevice' element={<RegisterDevice />} />
          <Route path='/activecounts' element={<ActiveCounts />} />
         
        </Routes>
        </div>
    
  );
}

export default App;






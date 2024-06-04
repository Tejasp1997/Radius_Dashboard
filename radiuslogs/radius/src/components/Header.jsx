import React, {  useEffect, useRef }  from "react";
import { Link } from "react-router-dom";
import { MdOutlineMenu } from "react-icons/md";
import { FaPowerOff } from "react-icons/fa";
import { IoPersonCircleSharp } from "react-icons/io5";
import { Toast } from 'primereact/toast';
import io from 'socket.io-client';
import 'primeicons/primeicons.css';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeflex/primeflex.css';
import "./Home.css";



const socket = io('http://172.23.1.14:5004');

function Header({ OpenSidebar }) {


  useEffect(() => {
    fetch('http://172.23.1.14:5004/api/logs')
      .then(response => response.json())
      .catch(error => console.error('Error fetching logs:', error));
    
    socket.on('new-device-registered', (device) => {
      
      showToast(`${device.name} (${device.macAddress}) registered`);
    });

    return () => {
      socket.off('new-device-registered');
    };
  }, []);

  
  const toast = useRef(null);

 
  const showToast = (message) => {
    toast.current.show({
      severity: 'info',
      summary: 'New Device Registered',
      detail: message,
      life: 20000, // 10 seconds
     // sticky: true, // Keep the toast visible until manually closed
    });
  };


  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };
  return (
    <header className="header">
      <div className="menu-icon" onClick={OpenSidebar}>
        <MdOutlineMenu className="icon menu" />
      </div>
      <div className="header-left">
        <IoPersonCircleSharp className='icon_header'/> 
        <span className="admin">SECWIFI ADMIN</span>
      </div>
      
      <div className="header-right">
        <Link to="/login" onClick={handleLogout}>
          <FaPowerOff className="icon-logout" />
        </Link>
      </div>
      
      
      <Toast ref={toast} />
      
    </header>
  );
}

export default Header;





  import React from 'react'
import "./Home.css";
import { Link } from "react-router-dom";
import { CiLogin } from "react-icons/ci";
import { AiOutlineDashboard } from "react-icons/ai";
import { FaRegListAlt } from "react-icons/fa";
import { CiFilter } from "react-icons/ci";
import { PiUsersFourFill } from "react-icons/pi";
import logo from "../images/cdac.PNG";



function Sidebar({openSidebarToggle, OpenSidebar}) {
   
    //Logout function
  const handleLogout = () => {
    // Remove the token from local storage (assuming it's stored there)
    localStorage.removeItem("token");
    // Redirect the user to the login page or perform any other necessary action
    window.location.href = "/login"; // Redirect to the login page
  };
  return (
    <aside id="sidebar" className={openSidebarToggle ? "sidebar-responsive": ""}>
        <div className='sidebar-title'>
            <div className='sidebar-brand'>
                {/* <IoPersonCircleSharp className='icon_header'/>  */}
                <img src={logo} alt="logo" className="icon logo" />
                <span className='text_header'>SEC-WIFI </span>
            </div>
            <span className='icon close_icon' onClick={OpenSidebar}>X</span>
        </div>

        <ul className='sidebar-list'>
        <Link to="/">
            <li className='sidebar-list-item'>
                 
                    <AiOutlineDashboard className='icon'/> 
                    Dashboard
                   
            </li>
            </Link>

            <Link to="/logs">
            <li className='sidebar-list-item'>
           
                    <FaRegListAlt className='icon'/> 
                    Logs
               
            </li>
            </Link>

            <Link to="/fetchlogs">
            <li className='sidebar-list-item'>
            
                    <CiFilter className='icon'/> 
                    Fetch Logs
                
            </li>
            </Link>

            <Link to="/registerdevice">
            <li className='sidebar-list-item'>
            
                    <PiUsersFourFill  className='icon'/> 
                    Register Devices
                
            </li>
            </Link>

            <Link to='/login' onClick={handleLogout}>
            <li className='sidebar-list-item'>
                
                    <CiLogin  className='icon'/>
                     Log Out
                
            </li>
            </Link>
        </ul>
    </aside>
  )
}

export default Sidebar





// function Sidebar({openSidebarToggle, OpenSidebar})
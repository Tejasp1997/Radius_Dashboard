import React from "react";
import { Link } from "react-router-dom";
import { MdOutlineMenu } from "react-icons/md";
import { FaPowerOff } from "react-icons/fa";
import { IoPersonCircleSharp } from "react-icons/io5";
import "./Home.css";

function Header({ OpenSidebar }) {
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
    </header>
  );
}

export default Header;

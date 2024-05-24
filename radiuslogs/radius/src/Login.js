import React, { useState,useRef } from "react";
import './Login.css';
import { Toast } from "primereact/toast";
//import logo from './images/C-DAC.jpg'
import "primereact/resources/themes/saga-blue/theme.css"; // You can choose any theme
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";


const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const toast = useRef(null);


  const handleLogin = async () => {
    try {
      const response = await fetch("http://172.23.1.14:5004/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        throw new Error("Login failed"); // Throw error if response is not OK
      }
      const data = await response.json();
      localStorage.setItem("token", data.token); // Store token in local storage
      // Redirect to the dashboard or home page upon successful login
      window.location.href = "/";
    } catch (error) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'Invalid username or password', life: 3000 });
      console.error("Login failed:", error);
      // Handle login failure (e.g., display error message)
    }
  };

  // const handleSubmit =(e) => {
  //   e.preventDefault();
  //   handleLogin();
  // };

  return (
    <>
     <Toast ref={toast} />
    <div id="login-page" >
   
  
    <div id="loginform">
      <h2 id="headerTitle">Login</h2>
      <div className="row">
        <label>Username</label>
        <input
          type="text"
          description="Username"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <label className="pass">Password</label>
        <input
          type="password"
          description="Password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />


      </div>
      <div id="button" className="row">
        <button onClick={handleLogin}>Login</button>
      </div>


    </div>
  </div>
  </>
   
  );
}



export default Login;








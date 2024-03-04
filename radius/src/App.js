import React from 'react';
import { BrowserRouter as Router,Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login'
import Logs from './Logs';
import FetchLogs from './FetchLogs';

const App = () => {
  const isAuthenticated = localStorage.getItem("token"); // Check if user is authenticated
  return (
    <div>
      <Router>
        <Routes>
       <Route path="/login" element={<Login />} />
      <Route path="/" element={isAuthenticated ? <Logs /> : <Navigate to="/login" />} />
      <Route path="/fetchlogs" element={<FetchLogs />} />
      </Routes>
      </Router>
    </div>
  );
};

export default App;

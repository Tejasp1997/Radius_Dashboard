import React from 'react';
import { BrowserRouter as Router,Routes, Route } from 'react-router-dom';

import Logs from './Logs';
import FetchLogs from './FetchLogs';

const App = () => {
  return (
    <div>
      <Router>
        <Routes>
      <Route exact path="/" element={<Logs />} />
      <Route path="/fetchlogs" element={<FetchLogs />} />
      </Routes>
      </Router>
    </div>
  );
};

export default App;

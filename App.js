import React, { useState } from "react";
import { Container, InputGroup, Form, Row, Col } from "react-bootstrap";
import RequestCard from "./components/RequestCard";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SubscriberDashboard from './components/SubscriberDashboard';
import DownloadReportComponent from './components/DownloadReportComponent';
import SubscriptionRequestComponent from './components/SubscriptionRequestComponent';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard/*" element={<SubscriberDashboard />} />
      </Routes>
    </Router>
  );
}


export default App;

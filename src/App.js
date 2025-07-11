import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx'; // Jalur dan ekstensi file yang benar
import Login from './pages/login.jsx';         // Jalur dan ekstensi file yang benar
import Register from './pages/register.jsx';     // Jalur dan ekstensi file yang benar

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
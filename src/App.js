// File: src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import RegisterNgo from './pages/RegisterNgo';
import RegisterFarmer from './pages/RegisterFarmer';
import Login from './pages/Login';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NgoDashboard from './pages/NgoDashboard';
import FarmerDashboard from './pages/FarmerDashboard';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterNgo />} />
        <Route path="/register/farmer" element={<RegisterFarmer />} />
        <Route path="/dashboard/super-admin" element={<SuperAdminDashboard />} />
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
        <Route path="/dashboard/ngo" element={<NgoDashboard />} />
        <Route path="/dashboard/farmer" element={<FarmerDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


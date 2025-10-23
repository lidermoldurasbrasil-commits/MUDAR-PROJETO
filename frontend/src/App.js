import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProductionBoard from './pages/ProductionBoard';
import Returns from './pages/Returns';
import MarketingTasks from './pages/MarketingTasks';
import PurchaseRequests from './pages/PurchaseRequests';
import PurchaseOrders from './pages/PurchaseOrders';
import AccountsPayable from './pages/AccountsPayable';
import Sales from './pages/Sales';
import CostCenter from './pages/CostCenter';
import Breakeven from './pages/Breakeven';
import StoresMenu from './pages/StoresMenu';
import StoreProduction from './pages/StoreProduction';
import Complaints from './pages/Complaints';
import CRM from './pages/CRM';
import Layout from './components/Layout';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get(`${API}/auth/me`)
        .then(res => {
          setUser(res.data);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
        } />
        
        {user ? (
          <Route element={<Layout user={user} onLogout={handleLogout} />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/production" element={<ProductionBoard />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/marketing" element={<MarketingTasks />} />
            <Route path="/purchase-requests" element={<PurchaseRequests />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/accounts-payable" element={<AccountsPayable />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/cost-center" element={<CostCenter />} />
            <Route path="/breakeven" element={<Breakeven />} />
            <Route path="/stores" element={<StoresMenu />} />
            <Route path="/stores/:storeId/production" element={<StoreProduction />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/crm" element={<CRM />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
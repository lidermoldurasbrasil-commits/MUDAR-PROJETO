import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import DirectorDashboard from './pages/DirectorDashboard';
import ProductionBoard from './pages/ProductionBoard';
import Returns from './pages/Returns';
import MarketingTasks from './pages/MarketingTasks';
import PurchaseRequests from './pages/PurchaseRequests';
import PurchaseOrders from './pages/PurchaseOrders';
import AccountsPayableAdvanced from './pages/AccountsPayableAdvanced';
import Sales from './pages/Sales';
import CostCenter from './pages/CostCenter';
import Breakeven from './pages/Breakeven';
import Factory from './pages/Factory';
import StoreView from './pages/StoreView';
import CustomProduction from './pages/CustomProduction';
import Complaints from './pages/Complaints';
import CRM from './pages/CRM';
import Layout from './components/Layout';
import NotFound from './pages/NotFound';
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
            <Route path="/" element={<DirectorDashboard />} />
            
            {/* Marketplace */}
            <Route path="/marketplace/production" element={<ProductionBoard />} />
            <Route path="/marketplace/returns" element={<Returns />} />
            <Route path="/marketplace/marketing" element={<MarketingTasks />} />
            <Route path="/marketplace/purchases" element={<PurchaseRequests />} />
            <Route path="/marketplace/accounts-payable" element={<AccountsPayableAdvanced />} />
            <Route path="/marketplace/sales" element={<Sales />} />
            <Route path="/marketplace/cost-center" element={<CostCenter />} />
            <Route path="/marketplace/breakeven" element={<Breakeven />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            
            {/* Factory & Stores */}
            <Route path="/factory" element={<Factory />} />
            <Route path="/factory/production" element={<CustomProduction />} />
            <Route path="/store/:storeId" element={<StoreView />} />
            <Route path="/store/:storeId/production" element={<CustomProduction />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/crm" element={<CRM />} />
            
            {/* Legacy routes - redirect to marketplace */}
            <Route path="/production" element={<Navigate to="/marketplace/production" replace />} />
            <Route path="/returns" element={<Navigate to="/marketplace/returns" replace />} />
            <Route path="/marketing" element={<Navigate to="/marketplace/marketing" replace />} />
            <Route path="/purchase-requests" element={<Navigate to="/marketplace/purchases" replace />} />
            <Route path="/accounts-payable" element={<Navigate to="/marketplace/accounts-payable" replace />} />
            <Route path="/sales" element={<Navigate to="/marketplace/sales" replace />} />
            <Route path="/cost-center" element={<Navigate to="/marketplace/cost-center" replace />} />
            <Route path="/breakeven" element={<Navigate to="/marketplace/breakeven" replace />} />
            
            <Route path="*" element={<NotFound />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
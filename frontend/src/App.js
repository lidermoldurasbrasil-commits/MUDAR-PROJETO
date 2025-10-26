import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import DirectorDashboard from './pages/DirectorDashboard';
import ProductionBoardV2 from './pages/ProductionBoardV2';
import ReturnsManagement from './pages/ReturnsManagement';
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

// Novos componentes do Sistema de Gestão
import GestaoLayout from './components/gestao/GestaoLayout';
import Produtos from './pages/gestao/Produtos';
import Pedidos from './pages/gestao/Pedidos';
import Producao from './pages/gestao/Producao';
import Estoque from './pages/gestao/Estoque';
import Financeiro from './pages/gestao/Financeiro';
import ContasBancarias from './pages/gestao/financeiro/ContasBancarias';
import ContasAReceber from './pages/gestao/financeiro/ContasAReceber';
import Clientes from './pages/gestao/Clientes';
import GestaoUsuarios from './pages/gestao/GestaoUsuarios';
import Relatorios from './pages/gestao/Relatorios';
import MarketplacesCentral from './pages/gestao/MarketplacesCentral';
import MarketplaceProjetoDetalhes from './pages/gestao/MarketplaceProjetoDetalhes';
import RelatorioVendasMarketplace from './pages/gestao/RelatorioVendasMarketplace';
import ConfiguracoesStatus from './pages/gestao/ConfiguracoesStatus';

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
          <>
            {/* Sistema de Gestão - Nova estrutura */}
            <Route path="/gestao" element={<GestaoLayout user={user} onLogout={handleLogout} />}>
              <Route index element={<Navigate to="/gestao/produtos" replace />} />
              <Route path="produtos" element={<Produtos />} />
              <Route path="pedidos" element={<Pedidos />} />
              <Route path="producao" element={<Producao />} />
              <Route path="estoque" element={<Estoque />} />
              <Route path="financeiro" element={<Financeiro />} />
              <Route path="financeiro/contas-bancarias" element={<ContasBancarias />} />
              <Route path="financeiro/contas-receber" element={<ContasAReceber />} />
              <Route path="marketplaces" element={<MarketplacesCentral />} />
              <Route path="marketplaces/projeto/:projetoId" element={<MarketplaceProjetoDetalhes />} />
              <Route path="marketplaces/relatorio-vendas" element={<RelatorioVendasMarketplace />} />
              <Route path="marketplaces/configuracoes-status" element={<ConfiguracoesStatus />} />
              <Route path="cadastros" element={<Clientes />} />
              <Route path="relatorios" element={<Relatorios />} />
            </Route>

            {/* Sistema Antigo - Layout anterior */}
            <Route element={<Layout user={user} onLogout={handleLogout} />}>
              <Route path="/" element={<DirectorDashboard />} />
              
              {/* Marketplace */}
              <Route path="/marketplace/production" element={<MarketplacesCentral />} />
              <Route path="/marketplace/production/projeto/:projetoId" element={<MarketplaceProjetoDetalhes />} />
              <Route path="/marketplace/returns" element={<ReturnsManagement />} />
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
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
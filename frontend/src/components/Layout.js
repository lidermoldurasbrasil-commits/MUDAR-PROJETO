import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, Home, Package, RefreshCcw, Megaphone, ShoppingCart, FileText, DollarSign, TrendingUp, Calculator, Store, AlertCircle, Users, LogOut, Factory } from 'lucide-react';
import { Toaster } from 'sonner';
import { useState } from 'react';

export default function Layout({ user, onLogout }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard Geral', testId: 'nav-dashboard' },
    
    // === MARKETPLACE ===
    { section: 'Marketplace', items: [
      { path: '/marketplace/production', icon: Package, label: 'Produção Marketplace', testId: 'nav-marketplace-production' },
      { path: '/marketplace/returns', icon: RefreshCcw, label: 'Devoluções', testId: 'nav-returns' },
      { path: '/marketplace/marketing', icon: Megaphone, label: 'Marketing', testId: 'nav-marketing' },
      { path: '/marketplace/purchases', icon: ShoppingCart, label: 'Compras', testId: 'nav-purchases' },
    ]},
    
    // === FÁBRICA E LOJAS ===
    { section: 'Fábrica & Lojas', items: [
      { path: '/factory', icon: Factory, label: 'Fábrica', testId: 'nav-factory' },
      { path: '/store/1', icon: Store, label: 'Loja 1', testId: 'nav-store-1' },
      { path: '/store/2', icon: Store, label: 'Loja 2', testId: 'nav-store-2' },
      { path: '/store/3', icon: Store, label: 'Loja 3', testId: 'nav-store-3' },
    ]},
    
    // === FINANCEIRO ===
    { section: 'Financeiro', items: [
      { path: '/accounts-payable', icon: DollarSign, label: 'Contas a Pagar', testId: 'nav-accounts-payable' },
      { path: '/sales', icon: TrendingUp, label: 'Vendas', testId: 'nav-sales' },
      { path: '/cost-center', icon: Calculator, label: 'Centro de Custos', testId: 'nav-cost-center' },
      { path: '/breakeven', icon: TrendingUp, label: 'Ponto de Equilíbrio', testId: 'nav-breakeven' },
    ]},
    
    // === ATENDIMENTO ===
    { section: 'Atendimento', items: [
      { path: '/complaints', icon: AlertCircle, label: 'Reclamações', testId: 'nav-complaints' },
      { path: '/crm', icon: Users, label: 'CRM / Leads', testId: 'nav-crm' },
    ]},
  ];

  return (
    <div className="layout-container">
      <Toaster position="top-right" richColors />
      
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`} data-testid="sidebar">
        <div className="sidebar-header">
          <h2>MFG Manager</h2>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="sidebar-toggle">
            <Menu size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, idx) => {
            if (item.section) {
              // Render section with items
              return (
                <div key={idx} className="nav-section">
                  {sidebarOpen && <div className="nav-section-title">{item.section}</div>}
                  {item.items.map(subItem => (
                    <Link
                      key={subItem.path}
                      to={subItem.path}
                      className={`nav-item ${location.pathname === subItem.path ? 'active' : ''}`}
                      data-testid={subItem.testId}
                    >
                      <subItem.icon size={20} />
                      {sidebarOpen && <span>{subItem.label}</span>}
                    </Link>
                  ))}
                </div>
              );
            } else {
              // Render single item
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                  data-testid={item.testId}
                >
                  <item.icon size={20} />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            }
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header" data-testid="header">
          <div className="header-left">
            <h1 className="page-title">
              {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="header-right">
            <div className="user-info" data-testid="user-info">
              <span className="user-name">{user.username}</span>
              <span className="user-role">{user.role}</span>
            </div>
            <button onClick={onLogout} className="btn-logout" data-testid="logout-button">
              <LogOut size={18} />
              <span>Sair</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <style jsx>{`
        .layout-container {
          display: flex;
          min-height: 100vh;
        }

        .sidebar {
          width: 260px;
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          color: white;
          position: fixed;
          left: 0;
          top: 0;
          height: 100vh;
          transition: width 0.3s;
          z-index: 100;
          overflow-y: auto;
        }

        .sidebar.closed {
          width: 70px;
        }

        .sidebar-header {
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sidebar-header h2 {
          font-size: 20px;
          font-weight: 700;
        }

        .sidebar-toggle {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: background 0.2s;
        }

        .sidebar-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .sidebar-nav {
          padding: 16px 0;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 24px;
          color: #cbd5e1;
          text-decoration: none;
          transition: background 0.2s, color 0.2s;
          font-size: 14px;
          font-weight: 500;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .nav-item.active {
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-left: 4px solid white;
        }

        .main-content {
          flex: 1;
          margin-left: 260px;
          transition: margin-left 0.3s;
        }

        .sidebar.closed + .main-content {
          margin-left: 70px;
        }

        .header {
          background: white;
          padding: 20px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .page-title {
          font-size: 24px;
          color: #2d3748;
          font-weight: 600;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .user-name {
          font-weight: 600;
          color: #2d3748;
          font-size: 14px;
        }

        .user-role {
          font-size: 12px;
          color: #718096;
          text-transform: capitalize;
        }

        .btn-logout {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-logout:hover {
          background: #dc2626;
        }

        .page-content {
          padding: 32px;
          max-width: 1400px;
          margin: 0 auto;
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 70px;
          }
          .main-content {
            margin-left: 70px;
          }
          .user-info {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
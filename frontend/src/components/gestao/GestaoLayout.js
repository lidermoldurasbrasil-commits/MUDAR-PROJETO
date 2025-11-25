import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Package, ShoppingCart, Archive, DollarSign, Users, BarChart3, LogOut, Factory, Store, UserCog, Building2, Megaphone } from 'lucide-react';

const LOJAS = [
  { id: 'fabrica', nome: 'Fábrica' },
  { id: 'mantiqueira', nome: 'Mantiqueira' },
  { id: 'lagoa_santa', nome: 'Lagoa Santa' },
  { id: 'sao_joao_batista', nome: 'São João Batista' }
];

export default function GestaoLayout({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [lojaAtual, setLojaAtual] = useState('fabrica');
  const [menuAberto, setMenuAberto] = useState(null);

  const menuItems = [
    { path: '/gestao/produtos', icon: Package, label: 'Produtos' },
    { path: '/gestao/pedidos', icon: ShoppingCart, label: 'Pedidos' },
    { path: '/gestao/producao', icon: Factory, label: 'Produção' },
    { path: '/gestao/marketplaces', icon: Store, label: 'Marketplaces' },
    { path: '/gestao/marketing', icon: Megaphone, label: 'Marketing', submenu: [
      { path: '/gestao/marketing/membros', label: 'Equipe' },
      { path: '/gestao/marketing/calendario', label: 'Calendário' },
      { path: '/gestao/marketing/dashboard', label: 'Dashboard' }
    ]},
    { path: '/gestao/estoque', icon: Archive, label: 'Estoque' },
    { path: '/gestao/financeiro', icon: DollarSign, label: 'Financeiro' },
    { path: '/gestao/cadastros', icon: Users, label: 'Cadastros' },
    { path: '/gestao/usuarios', icon: UserCog, label: 'Usuários' },
    { path: '/gestao/relatorios', icon: BarChart3, label: 'Relatórios' }
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  const handleLojaChange = (e) => {
    setLojaAtual(e.target.value);
    // Aqui você pode adicionar lógica para recarregar dados da loja selecionada
  };

  return (
    <div className="gestao-layout">
      {/* Header Superior */}
      <div className="gestao-header">
        <div className="header-left">
          <div className="logo">
            <h1>Gestão em Molduras - MAC</h1>
          </div>
        </div>
        <div className="header-right">
          <div className="loja-selector">
            <label>Selecionar Loja:</label>
            <select value={lojaAtual} onChange={handleLojaChange}>
              {LOJAS.map(loja => (
                <option key={loja.id} value={loja.id}>{loja.nome}</option>
              ))}
            </select>
          </div>
          <div className="user-info">
            <span className="company">LíderMolduras</span>
            <span className="user-name">{user?.username || 'Admin'}</span>
            <span className="user-role">Administrador</span>
          </div>
          <button className="btn-logout" onClick={onLogout}>
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Menu Principal */}
      <div className="gestao-menu">
        {menuItems.map(item => {
          const Icon = item.icon;
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const isMenuOpen = menuAberto === item.path;
          
          return (
            <div key={item.path} className="menu-item-container">
              <button
                className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => {
                  if (hasSubmenu) {
                    setMenuAberto(isMenuOpen ? null : item.path);
                  } else {
                    navigate(item.path);
                  }
                }}
              >
                <Icon size={24} />
                <span>{item.label}</span>
                {hasSubmenu && (
                  <span className="submenu-arrow">{isMenuOpen ? '▼' : '▶'}</span>
                )}
              </button>
              
              {hasSubmenu && isMenuOpen && (
                <div className="submenu">
                  {item.submenu.map(subitem => (
                    <button
                      key={subitem.path}
                      className={`submenu-item ${location.pathname === subitem.path ? 'active' : ''}`}
                      onClick={() => navigate(subitem.path)}
                    >
                      {subitem.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Conteúdo */}
      <div className="gestao-content">
        <Outlet context={{ lojaAtual, user }} />
      </div>

      <style jsx>{`
        .gestao-layout {
          min-height: 100vh;
          background: #111827;
          display: flex;
          flex-direction: column;
        }

        .gestao-header {
          background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 30px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border-bottom: 1px solid #374151;
        }

        .header-left .logo h1 {
          color: white;
          font-size: 22px;
          font-weight: 600;
          margin: 0;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 25px;
        }

        .loja-selector {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .loja-selector label {
          color: #D1D5DB;
          font-size: 14px;
          font-weight: 500;
        }

        .loja-selector select {
          padding: 8px 15px;
          border: 1px solid #4B5563;
          border-radius: 8px;
          background: #374151;
          color: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          outline: none;
          transition: all 0.2s;
        }

        .loja-selector select:hover {
          background: #4B5563;
          border-color: #6B7280;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          color: white;
        }

        .user-info .company {
          font-size: 12px;
          opacity: 0.9;
          color: #9CA3AF;
        }

        .user-info .user-name {
          font-size: 16px;
          font-weight: 600;
        }

        .user-info .user-role {
          font-size: 12px;
          opacity: 0.85;
          color: #D1D5DB;
        }

        .btn-logout {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          padding: 8px 12px;
          color: #FCA5A5;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: all 0.2s;
        }

        .btn-logout:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
        }

        .gestao-menu {
          background: #1F2937;
          display: flex;
          padding: 0 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          border-bottom: 1px solid #374151;
        }

        .menu-item {
          background: none;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 15px 25px;
          color: #9CA3AF;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 3px solid transparent;
          position: relative;
        }

        .menu-item:hover {
          background: rgba(59, 130, 246, 0.1);
          color: #60A5FA;
        }

        .menu-item.active {
          background: rgba(59, 130, 246, 0.15);
          border-bottom-color: #3B82F6;
          color: white;
        }

        .menu-item span {
          font-size: 13px;
          font-weight: 500;
        }

        .menu-item-container {
          position: relative;
        }

        .submenu-arrow {
          font-size: 10px;
          margin-left: 8px;
          transition: transform 0.2s;
        }

        .submenu {
          position: absolute;
          top: 100%;
          left: 0;
          background: #374151;
          border: 1px solid #4B5563;
          border-radius: 8px;
          min-width: 180px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          z-index: 1000;
          margin-top: 5px;
          overflow: hidden;
        }

        .submenu-item {
          width: 100%;
          background: none;
          border: none;
          padding: 12px 20px;
          color: #D1D5DB;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          font-size: 14px;
          border-bottom: 1px solid #4B5563;
        }

        .submenu-item:last-child {
          border-bottom: none;
        }

        .submenu-item:hover {
          background: rgba(59, 130, 246, 0.1);
          color: #60A5FA;
        }

        .submenu-item.active {
          background: rgba(59, 130, 246, 0.2);
          color: #3B82F6;
          font-weight: 600;
        }

        .gestao-content {
          flex: 1;
          padding: 0;
          background: #111827;
        }
      `}</style>
    </div>
  );
}

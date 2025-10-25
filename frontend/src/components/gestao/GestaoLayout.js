import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Package, ShoppingCart, Archive, DollarSign, Users, BarChart3, LogOut, Factory, Store } from 'lucide-react';

const LOJAS = [
  { id: 'fabrica', nome: 'Fábrica' },
  { id: 'loja1', nome: 'Loja 1' },
  { id: 'loja2', nome: 'Loja 2' },
  { id: 'loja3', nome: 'Loja 3' },
  { id: 'loja4', nome: 'Loja 4' },
  { id: 'loja5', nome: 'Loja 5' }
];

export default function GestaoLayout({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [lojaAtual, setLojaAtual] = useState('fabrica');

  const menuItems = [
    { path: '/gestao/produtos', icon: Package, label: 'Produtos' },
    { path: '/gestao/pedidos', icon: ShoppingCart, label: 'Pedidos' },
    { path: '/gestao/producao', icon: Factory, label: 'Produção' },
    { path: '/gestao/marketplaces', icon: Store, label: 'Marketplaces' },
    { path: '/gestao/estoque', icon: Archive, label: 'Estoque' },
    { path: '/gestao/financeiro', icon: DollarSign, label: 'Financeiro' },
    { path: '/gestao/cadastros', icon: Users, label: 'Cadastros' },
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
          return (
            <button
              key={item.path}
              className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <Icon size={24} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo */}
      <div className="gestao-content">
        <Outlet context={{ lojaAtual }} />
      </div>

      <style jsx>{`
        .gestao-layout {
          min-height: 100vh;
          background: #f5f5f5;
          display: flex;
          flex-direction: column;
        }

        .gestao-header {
          background: linear-gradient(135deg, #5dceaa 0%, #4db89a 100%);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 30px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
          color: white;
          font-size: 14px;
          font-weight: 500;
        }

        .loja-selector select {
          padding: 8px 15px;
          border: 2px solid white;
          border-radius: 8px;
          background: white;
          color: #2d3748;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          outline: none;
          transition: all 0.2s;
        }

        .loja-selector select:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
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
        }

        .user-info .user-name {
          font-size: 16px;
          font-weight: 600;
        }

        .user-info .user-role {
          font-size: 12px;
          opacity: 0.85;
        }

        .btn-logout {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 8px;
          padding: 8px 12px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: all 0.2s;
        }

        .btn-logout:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .gestao-menu {
          background: #4db89a;
          display: flex;
          padding: 0 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.08);
        }

        .menu-item {
          background: none;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 15px 25px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 3px solid transparent;
          position: relative;
        }

        .menu-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .menu-item.active {
          background: rgba(255, 255, 255, 0.15);
          border-bottom-color: white;
        }

        .menu-item span {
          font-size: 13px;
          font-weight: 500;
        }

        .gestao-content {
          flex: 1;
          padding: 25px 30px;
        }
      `}</style>
    </div>
  );
}

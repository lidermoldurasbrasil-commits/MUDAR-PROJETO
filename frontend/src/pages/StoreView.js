import { useParams, Link } from 'react-router-dom';
import { Store as StoreIcon, Package, Users, DollarSign, TrendingUp } from 'lucide-react';

export default function StoreView() {
  const { storeId } = useParams();
  const storeName = `Loja ${storeId}`;

  const modules = [
    { 
      path: `/store/${storeId}/production`, 
      icon: Package, 
      title: 'Produção Personalizada',
      description: 'Pedidos personalizados da loja',
      color: '#667eea'
    },
    { 
      path: `/store/${storeId}/crm`, 
      icon: Users, 
      title: 'CRM / Leads',
      description: 'Gestão de leads e clientes',
      color: '#56ab2f'
    },
    { 
      path: `/store/${storeId}/accounts`, 
      icon: DollarSign, 
      title: 'Contas a Pagar',
      description: 'Controle financeiro da loja',
      color: '#f093fb'
    },
    { 
      path: `/store/${storeId}/dashboard`, 
      icon: TrendingUp, 
      title: 'Dashboard',
      description: 'Visão consolidada da loja',
      color: '#764ba2'
    },
  ];

  return (
    <div data-testid={`store-${storeId}-page`}>
      <div className="page-header">
        <div className="header-with-icon">
          <StoreIcon size={40} color="#667eea" />
          <div>
            <h2>{storeName}</h2>
            <p>Gestão completa da loja física</p>
          </div>
        </div>
        <a href="/gestao/produtos" className="btn-gestao-access">
          🏭 Sistema de Gestão Multiloja
        </a>
      </div>

      <div className="modules-grid">
        {modules.map(module => (
          <Link 
            key={module.path} 
            to={module.path} 
            className="module-card"
            data-testid={`store-module-${module.path.split('/').pop()}`}
          >
            <div className="module-icon" style={{ background: `${module.color}20`, color: module.color }}>
              <module.icon size={32} />
            </div>
            <h3>{module.title}</h3>
            <p>{module.description}</p>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .header-with-icon {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .btn-gestao-access {
          background: linear-gradient(135deg, #5dceaa 0%, #4db89a 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(93, 206, 170, 0.3);
          white-space: nowrap;
        }

        .btn-gestao-access:hover {
          background: linear-gradient(135deg, #4db89a 0%, #3da788 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(93, 206, 170, 0.4);
        }

        .modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-top: 32px;
        }

        .module-card {
          background: white;
          border-radius: 16px;
          padding: 32px;
          text-decoration: none;
          color: inherit;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .module-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        }

        .module-icon {
          width: 80px;
          height: 80px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .module-card h3 {
          font-size: 20px;
          color: #2d3748;
          margin-bottom: 8px;
        }

        .module-card p {
          color: #718096;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}

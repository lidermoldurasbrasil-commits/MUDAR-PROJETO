import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard, PiggyBank, Plus } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/gestao/financeiro`;

export default function Financeiro() {
  const navigate = useNavigate();
  const { lojaAtual } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, [lojaAtual]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dashboard?loja=${lojaAtual}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboard(response.data);
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  const cards = dashboard?.cards || {};

  return (
    <div className="financeiro-container">
      <div className="page-header">
        <div>
          <h1>Dashboard Financeiro</h1>
          <p>Visão consolidada das finanças</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/gestao/financeiro/lancamento-rapido')}>
          <Plus size={20} />
          Lançamento Rápido
        </button>
      </div>

      {/* Menu Rápido */}
      <div className="menu-rapido">
        <button className="menu-item" onClick={() => navigate('/gestao/financeiro/contas-bancarias')}>
          Contas Bancárias
        </button>
        <button className="menu-item" onClick={() => navigate('/gestao/financeiro/contas-pagar')}>
          Contas a Pagar
        </button>
        <button className="menu-item" onClick={() => navigate('/gestao/financeiro/contas-receber')}>
          Contas a Receber
        </button>
        <button className="menu-item" onClick={() => navigate('/gestao/financeiro/categorias')}>
          Categorias
        </button>
        <button className="menu-item" onClick={() => navigate('/gestao/financeiro/transferencias')}>
          Transferências
        </button>
        <button className="menu-item" onClick={() => navigate('/gestao/financeiro/dre')}>
          DRE
        </button>
      </div>

      {/* Cards de Indicadores */}
      <div className="cards-grid">
        <div className="card-indicador receita">
          <div className="card-icon">
            <TrendingUp size={32} />
          </div>
          <div className="card-content">
            <span className="card-label">Receita Total</span>
            <span className="card-value">{formatCurrency(cards.receita_total)}</span>
          </div>
        </div>

        <div className="card-indicador despesa">
          <div className="card-icon">
            <TrendingDown size={32} />
          </div>
          <div className="card-content">
            <span className="card-label">Despesas Totais</span>
            <span className="card-value">{formatCurrency(cards.despesas_totais)}</span>
          </div>
        </div>

        <div className="card-indicador saldo">
          <div className="card-icon">
            <Wallet size={32} />
          </div>
          <div className="card-content">
            <span className="card-label">Saldo Consolidado</span>
            <span className="card-value">{formatCurrency(cards.saldo_consolidado)}</span>
          </div>
        </div>

        <div className="card-indicador lucro">
          <div className="card-icon">
            <DollarSign size={32} />
          </div>
          <div className="card-content">
            <span className="card-label">Lucro do Mês</span>
            <span className="card-value">{formatCurrency(cards.lucro)}</span>
            <span className="card-subtitle">{cards.margem_percentual?.toFixed(1)}% de margem</span>
          </div>
        </div>

        <div className="card-indicador pendentes">
          <div className="card-icon">
            <CreditCard size={32} />
          </div>
          <div className="card-content">
            <span className="card-label">Contas Pendentes</span>
            <span className="card-value">{cards.contas_pendentes || 0}</span>
            <span className="card-subtitle">
              {formatCurrency(cards.total_pagar)} a pagar
            </span>
          </div>
        </div>

        <div className="card-indicador previsao">
          <div className="card-icon">
            <PiggyBank size={32} />
          </div>
          <div className="card-content">
            <span className="card-label">Saldo Previsto</span>
            <span className="card-value">{formatCurrency(cards.saldo_liquido_previsto)}</span>
            <span className="card-subtitle">
              {formatCurrency(cards.total_receber)} a receber
            </span>
          </div>
        </div>
      </div>

      {/* Contas Bancárias */}
      <div className="contas-section">
        <h2>Contas Bancárias</h2>
        <div className="contas-grid">
          {dashboard?.contas_bancarias?.map(conta => (
            <div key={conta.id} className="conta-card">
              <span className="conta-nome">{conta.nome}</span>
              <span className="conta-saldo">{formatCurrency(conta.saldo)}</span>
            </div>
          ))}
          {(!dashboard?.contas_bancarias || dashboard.contas_bancarias.length === 0) && (
            <div className="empty-state">
              <p>Nenhuma conta bancária cadastrada</p>
              <button className="btn-add" onClick={() => navigate('/gestao/financeiro/contas-bancarias')}>
                Cadastrar Conta
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .financeiro-container {
          padding: 20px;
        }

        .page-header {
          margin-bottom: 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .page-header h1 {
          font-size: 28px;
          color: #2d3748;
          margin: 0 0 8px 0;
        }

        .page-header p {
          color: #718096;
          margin: 0;
        }

        .btn-primary {
          background: #5dceaa;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: #4db89a;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(93, 206, 170, 0.3);
        }

        .menu-rapido {
          display: flex;
          gap: 12px;
          margin-bottom: 25px;
          flex-wrap: wrap;
        }

        .menu-item {
          background: white;
          border: 2px solid #e2e8f0;
          padding: 10px 20px;
          border-radius: 8px;
          color: #4a5568;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .menu-item:hover {
          border-color: #5dceaa;
          color: #5dceaa;
          background: #f0fdf9;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .card-indicador {
          background: white;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: transform 0.2s;
        }

        .card-indicador:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }

        .card-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .receita .card-icon {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .despesa .card-icon {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .saldo .card-icon {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .lucro .card-icon {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }

        .pendentes .card-icon {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }

        .previsao .card-icon {
          background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
        }

        .card-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .card-label {
          font-size: 14px;
          color: #718096;
          font-weight: 500;
        }

        .card-value {
          font-size: 24px;
          font-weight: 700;
          color: #2d3748;
        }

        .card-subtitle {
          font-size: 12px;
          color: #a0aec0;
        }

        .contas-section {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .contas-section h2 {
          font-size: 20px;
          color: #2d3748;
          margin: 0 0 20px 0;
        }

        .contas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
        }

        .conta-card {
          background: linear-gradient(135deg, #5dceaa 0%, #4db89a 100%);
          padding: 20px;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          color: white;
        }

        .conta-nome {
          font-size: 14px;
          font-weight: 500;
          opacity: 0.9;
        }

        .conta-saldo {
          font-size: 22px;
          font-weight: 700;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 40px 20px;
          color: #718096;
        }

        .empty-state p {
          margin-bottom: 15px;
        }

        .btn-add {
          background: #5dceaa;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-add:hover {
          background: #4db89a;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #718096;
        }
      `}</style>
    </div>
  );
}

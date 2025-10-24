import { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, DollarSign, Package, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import axios from 'axios';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/gestao`;

const COLORS = ['#5dceaa', '#3b82f6', '#f97316', '#a78bfa', '#34d399', '#fbbf24', '#ef4444', '#8b5cf6'];

export default function Relatorios() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [consumo, setConsumo] = useState([]);
  const [evolucao, setEvolucao] = useState({ labels: [], valores: [] });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Buscar estatísticas
      const statsRes = await axios.get(`${API}/pedidos/estatisticas`, { headers });
      setStats(statsRes.data);

      // Buscar consumo de insumos
      const consumoRes = await axios.get(`${API}/pedidos/consumo-insumos`, { headers });
      const consumoArray = Object.entries(consumoRes.data).map(([tipo, dados]) => ({
        tipo,
        quantidade: dados.quantidade,
        custo: dados.custo
      })).filter(item => item.custo > 0);
      setConsumo(consumoArray);

      // Buscar evolução diária
      const evolucaoRes = await axios.get(`${API}/pedidos/evolucao-diaria?dias=30`, { headers });
      setEvolucao(evolucaoRes.data);

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div>Carregando dashboard...</div>
      </div>
    );
  }

  // Preparar dados para gráfico de status
  const statusData = stats?.por_status ? Object.entries(stats.por_status).map(([status, count]) => ({
    status,
    quantidade: count
  })).filter(item => item.quantidade > 0) : [];

  // Preparar dados para evolução (últimos 14 dias para melhor visualização)
  const evolucaoData = evolucao.labels.slice(-14).map((label, idx) => ({
    data: new Date(label).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    pedidos: evolucao.valores.slice(-14)[idx]
  }));

  return (
    <div className="relatorios-container">
      <h1>Dashboard de Produção</h1>

      {/* Cards de Resumo */}
      <div className="cards-grid">
        <div className="card card-green">
          <div className="card-icon">
            <Package size={32} />
          </div>
          <div className="card-content">
            <div className="card-label">Pedidos em Produção</div>
            <div className="card-value">{stats?.cards?.em_producao || 0}</div>
          </div>
        </div>

        <div className="card card-yellow">
          <div className="card-icon">
            <AlertCircle size={32} />
          </div>
          <div className="card-content">
            <div className="card-label">Pedidos em Atraso</div>
            <div className="card-value">{stats?.cards?.em_atraso || 0}</div>
          </div>
        </div>

        <div className="card card-red">
          <div className="card-icon">
            <TrendingUp size={32} />
          </div>
          <div className="card-content">
            <div className="card-label">Perdas Técnicas (mês)</div>
            <div className="card-value">{stats?.cards?.perdas_tecnicas_cm?.toFixed(0) || 0} cm</div>
            <div className="card-subtitle">{formatCurrency(stats?.cards?.perdas_tecnicas_valor || 0)}</div>
          </div>
        </div>

        <div className="card card-blue">
          <div className="card-icon">
            <DollarSign size={32} />
          </div>
          <div className="card-content">
            <div className="card-label">Lucro Médio</div>
            <div className="card-value">{formatCurrency(stats?.cards?.lucro_medio || 0)}</div>
            <div className="card-subtitle">Margem: {stats?.cards?.margem_media?.toFixed(1) || 0}%</div>
          </div>
        </div>

        <div className="card card-purple">
          <div className="card-icon">
            <Package size={32} />
          </div>
          <div className="card-content">
            <div className="card-label">Total Finalizados</div>
            <div className="card-value">{stats?.cards?.finalizados || 0}</div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-grid">
        {/* Gráfico de Barras - Pedidos por Status */}
        <div className="chart-card">
          <h3><BarChart3 size={20} /> Pedidos por Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantidade" fill="#5dceaa" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Linha - Evolução Diária */}
        <div className="chart-card">
          <h3><TrendingUp size={20} /> Evolução Diária (últimos 14 dias)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolucaoData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="pedidos" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Pizza - Consumo de Insumos */}
      {consumo.length > 0 && (
        <div className="chart-card-full">
          <h3><PieChartIcon size={20} /> Distribuição de Custos por Insumo</h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={consumo}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ tipo, custo }) => `${tipo}: ${formatCurrency(custo)}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="custo"
              >
                {consumo.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabela de Consumo de Insumos */}
      {consumo.length > 0 && (
        <div className="table-card">
          <h3>Consumo Consolidado de Insumos</h3>
          <table className="consumo-table">
            <thead>
              <tr>
                <th>Tipo de Insumo</th>
                <th>Quantidade</th>
                <th>Custo Total</th>
              </tr>
            </thead>
            <tbody>
              {consumo.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.tipo}</td>
                  <td>{item.quantidade.toFixed(2)}</td>
                  <td>{formatCurrency(item.custo)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td><strong>TOTAL</strong></td>
                <td>-</td>
                <td><strong>{formatCurrency(consumo.reduce((sum, item) => sum + item.custo, 0))}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .relatorios-container {
          padding: 30px;
          max-width: 1800px;
          margin: 0 auto;
        }

        h1 {
          font-size: 28px;
          color: #2d3748;
          margin-bottom: 30px;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          display: flex;
          gap: 20px;
          align-items: center;
          transition: transform 0.2s;
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }

        .card-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .card-green .card-icon { background: linear-gradient(135deg, #5dceaa, #4db89a); }
        .card-yellow .card-icon { background: linear-gradient(135deg, #fbbf24, #f59e0b); }
        .card-red .card-icon { background: linear-gradient(135deg, #ef4444, #dc2626); }
        .card-blue .card-icon { background: linear-gradient(135deg, #3b82f6, #2563eb); }
        .card-purple .card-icon { background: linear-gradient(135deg, #a78bfa, #8b5cf6); }

        .card-content {
          flex: 1;
        }

        .card-label {
          font-size: 13px;
          color: #718096;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .card-value {
          font-size: 28px;
          font-weight: 700;
          color: #2d3748;
        }

        .card-subtitle {
          font-size: 12px;
          color: #a0aec0;
          margin-top: 4px;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .chart-card,
        .chart-card-full {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        .chart-card-full {
          margin-bottom: 30px;
        }

        .chart-card h3,
        .chart-card-full h3 {
          font-size: 16px;
          color: #2d3748;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .table-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        .table-card h3 {
          font-size: 16px;
          color: #2d3748;
          margin-bottom: 20px;
        }

        .consumo-table {
          width: 100%;
          border-collapse: collapse;
        }

        .consumo-table thead {
          background: #f7fafc;
        }

        .consumo-table th {
          padding: 12px;
          text-align: left;
          font-size: 13px;
          font-weight: 600;
          color: #4a5568;
          border-bottom: 2px solid #e2e8f0;
        }

        .consumo-table td {
          padding: 12px;
          font-size: 14px;
          color: #2d3748;
          border-bottom: 1px solid #e2e8f0;
        }

        .total-row {
          background: #f7fafc;
        }

        .total-row td {
          border-top: 2px solid #e2e8f0;
          border-bottom: none;
          padding: 16px 12px;
        }
      `}</style>
    </div>
  );
}

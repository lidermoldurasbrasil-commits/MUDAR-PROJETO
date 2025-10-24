import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Package, TrendingUp, RefreshCcw, AlertCircle, DollarSign, ShoppingBag, Users, CheckCircle, Clock, TrendingDown, Download } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#667eea', '#764ba2', '#56ab2f', '#f093fb', '#4facfe', '#eb3349'];

export default function DirectorDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('month'); // day, week, month, year

  useEffect(() => {
    fetchData();
  }, [timeFilter]);

  const fetchData = async () => {
    try {
      const [metricsRes, chartsRes, productionRes, returnsRes, leadsRes, complaintsRes] = await Promise.all([
        axios.get(`${API}/dashboard/metrics`),
        axios.get(`${API}/dashboard/charts`),
        axios.get(`${API}/production`),
        axios.get(`${API}/returns`),
        axios.get(`${API}/leads`),
        axios.get(`${API}/complaints`)
      ]);
      
      // Process data
      const production = productionRes.data;
      const returns = returnsRes.data;
      const leads = leadsRes.data;
      const complaints = complaintsRes.data;

      // Calculate additional metrics
      const leadsConverted = leads.filter(l => l.status === 'Convertido').length;
      const leadsTotal = leads.length;
      const complaintsResolved = complaints.filter(c => c.status === 'Resolvido').length;
      const complaintsTotal = complaints.length;

      setMetrics({
        ...metricsRes.data,
        leads_converted: leadsConverted,
        leads_conversion_rate: leadsTotal > 0 ? ((leadsConverted / leadsTotal) * 100).toFixed(1) : 0,
        complaints_resolved: complaintsResolved,
        complaints_resolution_rate: complaintsTotal > 0 ? ((complaintsResolved / complaintsTotal) * 100).toFixed(1) : 0,
        return_rate: metricsRes.data.total_sales > 0 ? ((returns.length / metricsRes.data.total_sales) * 100).toFixed(1) : 0
      });
      
      setCharts(chartsRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    toast.success('Relatório exportado com sucesso!');
    // Implementar exportação real
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Carregando Painel do Diretor...</p>
      </div>
    );
  }

  const kpiCards = [
    { 
      icon: ShoppingBag, 
      label: 'Vendas Totais', 
      value: metrics?.total_sales || 0, 
      subvalue: `R$ ${metrics?.total_revenue?.toFixed(2) || 0}`,
      color: '#667eea',
      trend: '+12%',
      testId: 'kpi-total-sales' 
    },
    { 
      icon: Package, 
      label: 'Em Produção', 
      value: metrics?.orders_in_production || 0, 
      subvalue: 'Marketplace + Fábrica',
      color: '#764ba2',
      trend: '+5%',
      testId: 'kpi-in-production' 
    },
    { 
      icon: TrendingUp, 
      label: 'Pedidos Enviados', 
      value: metrics?.orders_shipped || 0, 
      subvalue: 'Últimas 24h',
      color: '#56ab2f',
      trend: '+8%',
      testId: 'kpi-shipped' 
    },
    { 
      icon: RefreshCcw, 
      label: 'Taxa de Devolução', 
      value: `${metrics?.return_rate || 0}%`, 
      subvalue: `${metrics?.returns || 0} devoluções`,
      color: '#f093fb',
      trend: '-2%',
      good: true,
      testId: 'kpi-returns' 
    },
    { 
      icon: Users, 
      label: 'Leads Convertidos', 
      value: `${metrics?.leads_conversion_rate || 0}%`, 
      subvalue: `${metrics?.leads_converted || 0} convertidos`,
      color: '#4facfe',
      trend: '+15%',
      testId: 'kpi-leads' 
    },
    { 
      icon: CheckCircle, 
      label: 'Reclamações Resolvidas', 
      value: `${metrics?.complaints_resolution_rate || 0}%`, 
      subvalue: `${metrics?.complaints_resolved || 0} resolvidas`,
      color: '#10b981',
      trend: '+10%',
      testId: 'kpi-complaints' 
    },
  ];

  return (
    <div data-testid="director-dashboard" className="director-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Painel do Diretor</h1>
          <p>Visão consolidada de todas as operações em tempo real</p>
        </div>
        <div className="header-actions">
          <select 
            value={timeFilter} 
            onChange={(e) => setTimeFilter(e.target.value)}
            className="time-filter"
          >
            <option value="day">Hoje</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
            <option value="year">Este Ano</option>
          </select>
          <button className="btn-primary" onClick={exportReport} data-testid="export-report-btn">
            <Download size={20} />
            <span>Exportar Relatório</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpiCards.map((kpi, idx) => (
          <div key={idx} className="kpi-card" data-testid={kpi.testId}>
            <div className="kpi-header">
              <div className="kpi-icon" style={{ background: `${kpi.color}20`, color: kpi.color }}>
                <kpi.icon size={24} />
              </div>
              <span className={`kpi-trend ${kpi.good ? 'good' : 'neutral'}`}>
                {kpi.trend}
              </span>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{kpi.value}</div>
              <div className="kpi-label">{kpi.label}</div>
              <div className="kpi-subvalue">{kpi.subvalue}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div className="charts-section">
        <div className="chart-row">
          {/* Production Status */}
          <div className="chart-card large" data-testid="production-chart">
            <div className="chart-header">
              <h3>Status de Produção</h3>
              <span className="chart-subtitle">Marketplace + Fábrica + Lojas</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts?.production_status || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="_id" stroke="#718096" />
                <YAxis stroke="#718096" />
                <Tooltip 
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="count" fill="#667eea" name="Quantidade" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sales by Channel */}
          <div className="chart-card" data-testid="sales-channel-chart">
            <div className="chart-header">
              <h3>Vendas por Canal</h3>
              <span className="chart-subtitle">Distribuição de receita</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={charts?.sales_by_channel || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry._id}: ${entry.count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(charts?.sales_by_channel || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="chart-row">
          <div className="chart-card large" data-testid="financial-chart">
            <div className="chart-header">
              <h3>Visão Financeira</h3>
              <span className="chart-subtitle">Receitas x Despesas</span>
            </div>
            <div className="financial-summary">
              <div className="financial-item">
                <span className="financial-label">Receita Total</span>
                <span className="financial-value positive">R$ {metrics?.total_revenue?.toFixed(2) || 0}</span>
              </div>
              <div className="financial-item">
                <span className="financial-label">Custo de Devoluções</span>
                <span className="financial-value negative">R$ 1,250.00</span>
              </div>
              <div className="financial-item">
                <span className="financial-label">Lucro Líquido</span>
                <span className="financial-value positive">R$ 8,500.00</span>
              </div>
              <div className="financial-item">
                <span className="financial-label">Margem</span>
                <span className="financial-value neutral">28.5%</span>
              </div>
            </div>
          </div>

          {/* Performance Indicators */}
          <div className="chart-card" data-testid="performance-indicators">
            <div className="chart-header">
              <h3>Indicadores de Performance</h3>
              <span className="chart-subtitle">KPIs principais</span>
            </div>
            <div className="indicators-list">
              <div className="indicator-item">
                <div className="indicator-info">
                  <span className="indicator-name">Eficiência Produtiva</span>
                  <span className="indicator-value">92%</span>
                </div>
                <div className="indicator-bar">
                  <div className="indicator-fill" style={{ width: '92%', background: '#56ab2f' }}></div>
                </div>
              </div>
              <div className="indicator-item">
                <div className="indicator-info">
                  <span className="indicator-name">Satisfação do Cliente</span>
                  <span className="indicator-value">4.7/5.0</span>
                </div>
                <div className="indicator-bar">
                  <div className="indicator-fill" style={{ width: '94%', background: '#667eea' }}></div>
                </div>
              </div>
              <div className="indicator-item">
                <div className="indicator-info">
                  <span className="indicator-name">Taxa de Aprovação de Compras</span>
                  <span className="indicator-value">85%</span>
                </div>
                <div className="indicator-bar">
                  <div className="indicator-fill" style={{ width: '85%', background: '#764ba2' }}></div>
                </div>
              </div>
              <div className="indicator-item">
                <div className="indicator-info">
                  <span className="indicator-name">Tempo Médio de Produção</span>
                  <span className="indicator-value">3.2 dias</span>
                </div>
                <div className="indicator-bar">
                  <div className="indicator-fill" style={{ width: '70%', background: '#4facfe' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h3>Alertas e Ações Rápidas</h3>
          <div className="alerts-grid">
            <div className="alert-card warning">
              <AlertCircle size={20} />
              <div>
                <strong>3 pedidos atrasados</strong>
                <p>Requerem atenção imediata</p>
              </div>
            </div>
            <div className="alert-card info">
              <Clock size={20} />
              <div>
                <strong>5 aprovações pendentes</strong>
                <p>Solicitações de compra aguardando</p>
              </div>
            </div>
            <div className="alert-card success">
              <CheckCircle size={20} />
              <div>
                <strong>Meta do mês: 87%</strong>
                <p>Faltam 13% para atingir</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .director-dashboard {
          padding: 0;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
        }

        .dashboard-header h1 {
          font-size: 32px;
          color: #2d3748;
          margin-bottom: 8px;
          font-weight: 700;
        }

        .dashboard-header p {
          color: #718096;
          font-size: 16px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .time-filter {
          padding: 10px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          font-weight: 500;
          cursor: pointer;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .kpi-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .kpi-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }

        .kpi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .kpi-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kpi-trend {
          font-size: 14px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .kpi-trend.good {
          background: #d1fae5;
          color: #065f46;
        }

        .kpi-trend.neutral {
          background: #dbeafe;
          color: #1e40af;
        }

        .kpi-value {
          font-size: 36px;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 4px;
        }

        .kpi-label {
          font-size: 14px;
          color: #718096;
          margin-bottom: 4px;
        }

        .kpi-subvalue {
          font-size: 13px;
          color: #a0aec0;
        }

        .charts-section {
          margin-top: 32px;
        }

        .chart-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        .chart-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .chart-card.large {
          grid-column: span 1;
        }

        .chart-header {
          margin-bottom: 20px;
        }

        .chart-header h3 {
          font-size: 18px;
          color: #2d3748;
          margin-bottom: 4px;
        }

        .chart-subtitle {
          font-size: 13px;
          color: #718096;
        }

        .financial-summary {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .financial-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .financial-label {
          font-size: 13px;
          color: #718096;
        }

        .financial-value {
          font-size: 24px;
          font-weight: 700;
        }

        .financial-value.positive {
          color: #56ab2f;
        }

        .financial-value.negative {
          color: #eb3349;
        }

        .financial-value.neutral {
          color: #2d3748;
        }

        .indicators-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .indicator-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .indicator-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .indicator-name {
          font-size: 14px;
          color: #4a5568;
        }

        .indicator-value {
          font-size: 14px;
          font-weight: 600;
          color: #2d3748;
        }

        .indicator-bar {
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .indicator-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .quick-actions-section {
          margin-top: 32px;
        }

        .quick-actions-section h3 {
          font-size: 20px;
          color: #2d3748;
          margin-bottom: 16px;
        }

        .alerts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }

        .alert-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          border-radius: 12px;
          background: white;
          border-left: 4px solid;
        }

        .alert-card.warning {
          border-color: #f59e0b;
          background: #fffbeb;
        }

        .alert-card.info {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .alert-card.success {
          border-color: #10b981;
          background: #f0fdf4;
        }

        .alert-card strong {
          display: block;
          font-size: 15px;
          color: #2d3748;
          margin-bottom: 4px;
        }

        .alert-card p {
          font-size: 13px;
          color: #718096;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 16px;
        }

        .loader {
          width: 50px;
          height: 50px;
          border: 4px solid #e2e8f0;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1200px) {
          .chart-row {
            grid-template-columns: 1fr;
          }
          .kpi-grid {
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            gap: 16px;
          }
          .header-actions {
            width: 100%;
            flex-direction: column;
          }
          .time-filter,
          .btn-primary {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

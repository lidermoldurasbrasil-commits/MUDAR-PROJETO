import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, TrendingUp, RefreshCcw, AlertCircle, DollarSign, ShoppingBag } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#667eea', '#764ba2', '#56ab2f', '#f093fb', '#4facfe'];

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [metricsRes, chartsRes] = await Promise.all([
        axios.get(`${API}/dashboard/metrics`),
        axios.get(`${API}/dashboard/charts`)
      ]);
      setMetrics(metricsRes.data);
      setCharts(chartsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20">Loading...</div>;
  }

  const statCards = [
    { icon: ShoppingBag, label: 'Total Sales', value: metrics?.total_sales || 0, color: '#667eea', testId: 'metric-total-sales' },
    { icon: DollarSign, label: 'Total Revenue', value: `$${metrics?.total_revenue?.toFixed(2) || 0}`, color: '#56ab2f', testId: 'metric-total-revenue' },
    { icon: Package, label: 'In Production', value: metrics?.orders_in_production || 0, color: '#764ba2', testId: 'metric-in-production' },
    { icon: TrendingUp, label: 'Shipped', value: metrics?.orders_shipped || 0, color: '#4facfe', testId: 'metric-shipped' },
    { icon: RefreshCcw, label: 'Returns', value: metrics?.returns || 0, color: '#f093fb', testId: 'metric-returns' },
    { icon: AlertCircle, label: 'Pending Complaints', value: metrics?.pending_complaints || 0, color: '#eb3349', testId: 'metric-complaints' },
  ];

  return (
    <div data-testid="dashboard-page">
      <div className="dashboard-header">
        <h1>Director Dashboard</h1>
        <p>Real-time overview of all operations</p>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {statCards.map((stat, idx) => (
          <div key={idx} className="stat-card" data-testid={stat.testId}>
            <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Sales by Channel */}
        <div className="chart-card" data-testid="sales-by-channel-chart">
          <h3>Sales by Channel</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={charts?.sales_by_channel || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#667eea" name="Orders" />
              <Bar dataKey="revenue" fill="#56ab2f" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Production Status */}
        <div className="chart-card" data-testid="production-status-chart">
          <h3>Production Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={charts?.production_status || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry._id}: ${entry.count}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {(charts?.production_status || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style jsx>{`
        .dashboard-header {
          margin-bottom: 32px;
        }

        .dashboard-header h1 {
          font-size: 32px;
          color: #2d3748;
          margin-bottom: 8px;
        }

        .dashboard-header p {
          color: #718096;
          font-size: 16px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          font-size: 14px;
          color: #718096;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #2d3748;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 24px;
        }

        .chart-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .chart-card h3 {
          font-size: 18px;
          color: #2d3748;
          margin-bottom: 16px;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
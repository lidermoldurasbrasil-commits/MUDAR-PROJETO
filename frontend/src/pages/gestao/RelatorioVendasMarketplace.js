import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { DollarSign, TrendingUp, ShoppingCart, Percent } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/gestao/marketplaces`;

export default function RelatorioVendasMarketplace() {
  const { lojaAtual = 'fabrica' } = useOutletContext() || {};
  
  const [relatorio, setRelatorio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    dataInicio: new Date(new Date().setDate(1)).toISOString().split('T')[0], // Primeiro dia do mês
    dataFim: new Date().toISOString().split('T')[0], // Hoje
    agruparPor: 'plataforma'
  });

  useEffect(() => {
    fetchRelatorio();
  }, []);

  const fetchRelatorio = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API}/relatorio-vendas`, {
        params: {
          data_inicio: filtros.dataInicio,
          data_fim: filtros.dataFim,
          agrupar_por: filtros.agruparPor
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRelatorio(response.data);
    } catch (error) {
      console.error('Erro ao buscar relatório:', error);
      toast.error('Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totais = relatorio?.totalizadores || {};
  const agrupados = relatorio?.agrupados || {};
  
  // Preparar dados para gráficos
  const dadosGrafico = Object.entries(agrupados).map(([chave, valores]) => ({
    nome: chave,
    valor_bruto: valores.valor_bruto,
    valor_liquido: valores.valor_liquido,
    valor_taxas: valores.valor_taxas,
    vendas: valores.total_vendas
  }));

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">💰 Relatório de Vendas - Marketplaces</h1>
          <p className="text-gray-400">Análise detalhada de vendas e taxas</p>
        </div>

        {/* Filtros */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Data Início</label>
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Data Fim</label>
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Agrupar Por</label>
              <select
                value={filtros.agruparPor}
                onChange={(e) => setFiltros({...filtros, agruparPor: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
              >
                <option value="plataforma">Plataforma</option>
                <option value="projeto">Projeto</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchRelatorio}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Gerar Relatório
              </button>
            </div>
          </div>
        </div>

        {/* Cards de Totalizadores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-sm text-gray-400 mb-1">Total de Vendas</p>
            <p className="text-2xl font-bold text-white">{totais.total_vendas || 0}</p>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-sm text-gray-400 mb-1">Valor Bruto</p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(totais.valor_total_bruto)}</p>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Percent className="w-8 h-8 text-orange-400" />
            </div>
            <p className="text-sm text-gray-400 mb-1">Total de Taxas</p>
            <p className="text-2xl font-bold text-orange-400">{formatCurrency(totais.valor_total_taxas)}</p>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-sm text-gray-400 mb-1">Valor Líquido</p>
            <p className="text-2xl font-bold text-purple-400">{formatCurrency(totais.valor_total_liquido)}</p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico de Barras */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">
              📊 Valores por {filtros.agruparPor === 'plataforma' ? 'Plataforma' : 'Projeto'}
            </h3>
            {dadosGrafico.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="nome" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#fff' }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="valor_bruto" fill="#10B981" name="Valor Bruto" />
                  <Bar dataKey="valor_taxas" fill="#EF4444" name="Taxas" />
                  <Bar dataKey="valor_liquido" fill="#8B5CF6" name="Valor Líquido" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>Sem dados para exibir</p>
              </div>
            )}
          </div>

          {/* Gráfico de Pizza */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">
              🥧 Distribuição de Vendas
            </h3>
            {dadosGrafico.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dadosGrafico}
                    dataKey="vendas"
                    nameKey="nome"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.nome}: ${entry.vendas}`}
                  >
                    {dadosGrafico.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>Sem dados para exibir</p>
              </div>
            )}
          </div>
        </div>

        {/* Tabela Detalhada */}
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-bold text-white">📋 Detalhamento por {filtros.agruparPor === 'plataforma' ? 'Plataforma' : 'Projeto'}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">{filtros.agruparPor === 'plataforma' ? 'Plataforma' : 'Projeto'}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Total Vendas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Valor Bruto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Taxas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Valor Líquido</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">% do Total</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {Object.entries(agrupados).map(([chave, valores]) => (
                  <tr key={chave} className="hover:bg-gray-700/30">
                    <td className="px-6 py-4 text-white font-medium">{chave}</td>
                    <td className="px-6 py-4 text-gray-300">{valores.total_vendas}</td>
                    <td className="px-6 py-4 text-green-400">{formatCurrency(valores.valor_bruto)}</td>
                    <td className="px-6 py-4 text-orange-400">{formatCurrency(valores.valor_taxas)}</td>
                    <td className="px-6 py-4 text-purple-400 font-semibold">{formatCurrency(valores.valor_liquido)}</td>
                    <td className="px-6 py-4 text-blue-400">
                      {((valores.valor_bruto / totais.valor_total_bruto) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-900 border-t border-gray-700">
                <tr>
                  <td className="px-6 py-4 text-white font-bold">TOTAL</td>
                  <td className="px-6 py-4 text-white font-bold">{totais.total_vendas}</td>
                  <td className="px-6 py-4 text-green-400 font-bold">{formatCurrency(totais.valor_total_bruto)}</td>
                  <td className="px-6 py-4 text-orange-400 font-bold">{formatCurrency(totais.valor_total_taxas)}</td>
                  <td className="px-6 py-4 text-purple-400 font-bold">{formatCurrency(totais.valor_total_liquido)}</td>
                  <td className="px-6 py-4 text-blue-400 font-bold">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

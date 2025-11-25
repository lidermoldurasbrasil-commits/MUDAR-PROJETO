import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { BarChart3, TrendingUp, Clock, CheckCircle, AlertCircle, Trophy, Target } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const STATUS_COLORS = {
  'A Fazer': '#94A3B8',
  'Em Andamento': '#F59E0B',
  'Concluído': '#10B981',
  'Atrasado': '#EF4444'
};

const CHART_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];

export default function DashboardMarketing() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/gestao/marketing/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboard(response.data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Preparar dados para o gráfico de pizza (distribuição por status)
  const dadosStatus = Object.entries(dashboard.distribuicao_status).map(([status, valor]) => ({
    name: status,
    value: valor,
    color: STATUS_COLORS[status]
  }));

  // Preparar dados para o gráfico de barras (produtividade por membro)
  const dadosProdutividade = dashboard.produtividade_membros.map(m => ({
    nome: m.membro_nome,
    concluidas: m.tarefas_concluidas,
    pontos: m.pontuacao
  }));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
          Dashboard de Marketing
        </h1>
        <p className="text-gray-600 mt-1">Métricas e desempenho da equipe</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              <span className="text-gray-600 text-sm">Total de Tarefas</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{dashboard.total_tarefas}</div>
          <p className="text-xs text-gray-500 mt-1">Todas as tarefas cadastradas</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-gray-600 text-sm">Concluídas Hoje</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-600">{dashboard.tarefas_concluidas_hoje}</div>
          <p className="text-xs text-gray-500 mt-1">Tarefas finalizadas hoje</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-gray-600 text-sm">Atrasadas</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-red-600">{dashboard.tarefas_atrasadas}</div>
          <p className="text-xs text-gray-500 mt-1">Tarefas fora do prazo</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-gray-600 text-sm">Taxa de Cumprimento</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600">{dashboard.taxa_cumprimento_prazos}%</div>
          <p className="text-xs text-gray-500 mt-1">Últimos 30 dias</p>
        </div>
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de Pizza - Distribuição por Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Distribuição por Status
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dadosStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {dadosStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 flex flex-wrap gap-3 justify-center">
            {Object.entries(dashboard.distribuicao_status).map(([status, valor]) => (
              <div key={status} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[status] }}
                ></div>
                <span className="text-sm text-gray-700">{status}: {valor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico de Barras - Tarefas Concluídas por Membro */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Tarefas Concluídas por Membro (30 dias)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosProdutividade}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="concluidas" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ranking de Pontuação */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          Ranking de Pontuação
        </h3>
        <div className="space-y-3">
          {dashboard.produtividade_membros.map((membro, index) => (
            <div
              key={membro.membro_id}
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:shadow-md transition-shadow"
            >
              {/* Posição */}
              <div className="flex-shrink-0">
                {index === 0 && (
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">1°</span>
                  </div>
                )}
                {index === 1 && (
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">2°</span>
                  </div>
                )}
                {index === 2 && (
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">3°</span>
                  </div>
                )}
                {index > 2 && (
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-700 font-bold">{index + 1}°</span>
                  </div>
                )}
              </div>

              {/* Nome */}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{membro.membro_nome}</h4>
                <p className="text-sm text-gray-600">{membro.tarefas_concluidas} tarefas concluídas</p>
              </div>

              {/* Pontuação */}
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <span className="text-2xl font-bold text-yellow-600">{membro.pontuacao}</span>
                <span className="text-sm text-gray-600">pontos</span>
              </div>

              {/* Barra de progresso relativa */}
              <div className="w-24">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600"
                    style={{
                      width: dashboard.produtividade_membros[0]
                        ? `${(membro.pontuacao / dashboard.produtividade_membros[0].pontuacao) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}

          {dashboard.produtividade_membros.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Nenhum dado de produtividade disponível</p>
            </div>
          )}
        </div>
      </div>

      {/* Gráfico de Barras - Pontuação por Membro */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          Pontuação Total por Membro
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dadosProdutividade}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="nome" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="pontos" fill="#F59E0B" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Informações Adicionais */}
      <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">💡 Sistema de Pontuação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="bg-white rounded-lg p-3">
            <div className="font-semibold text-green-600 mb-1">+15 pontos</div>
            <p className="text-gray-700">Tarefa concluída 1+ dia antes do prazo</p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="font-semibold text-blue-600 mb-1">+10 pontos</div>
            <p className="text-gray-700">Tarefa concluída no prazo</p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="font-semibold text-yellow-600 mb-1">+3 pontos</div>
            <p className="text-gray-700">Relatório diário enviado</p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="font-semibold text-red-600 mb-1">-5 pontos</div>
            <p className="text-gray-700">Tarefa concluída com atraso</p>
          </div>
        </div>
      </div>
    </div>
  );
}

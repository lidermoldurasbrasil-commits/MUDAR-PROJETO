import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Plus, TrendingUp, Package, Send, CheckCircle, AlertTriangle, DollarSign, Activity, Edit2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/gestao/marketplaces`;

export default function MarketplacesCentral() {
  const navigate = useNavigate();
  const { lojaAtual, user } = useOutletContext();
  const [projetos, setProjetos] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [mensagemDia, setMensagemDia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editandoMensagem, setEditandoMensagem] = useState(false);
  const [novaMensagem, setNovaMensagem] = useState('');

  const podeEditarMensagem = user?.role === 'director' || user?.role === 'manager';

  useEffect(() => {
    fetchDados();
  }, [lojaAtual]);

  const fetchDados = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [projetosRes, dashboardRes, mensagemRes] = await Promise.all([
        axios.get(`${API}/projetos`, { headers }),
        axios.get(`${API}/dashboard`, { headers }),
        axios.get(`${API}/mensagem-do-dia`, { headers })
      ]);

      setProjetos(projetosRes.data || []);
      setDashboard(dashboardRes.data || {});
      setMensagemDia(mensagemRes.data || {});
      setNovaMensagem(mensagemRes.data?.mensagem || '');
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados dos marketplaces');
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarMensagem = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/mensagem-do-dia`,
        { mensagem: novaMensagem },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Mensagem atualizada com sucesso!');
      setEditandoMensagem(false);
      fetchDados();
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
      toast.error(error.response?.data?.detail || 'Erro ao salvar mensagem');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Aguardando Impressão': '#94A3B8',
      'Sala de Impressão': '#60A5FA',
      'Em Produção': '#F59E0B',
      'Expedição': '#FBBF24',
      'Enviado': '#3B82F6',
      'Entregue': '#10B981'
    };
    return colors[status] || '#94A3B8';
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const handleProjetoClick = (projeto) => {
    // Navegar para página de detalhes do projeto (implementar na Fase 2)
    navigate(`/gestao/marketplaces/projeto/${projeto.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const indicadores = dashboard?.indicadores || {};

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📦 Central de Operações dos Marketplaces</h1>
        
        {/* Mensagem do Dia */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white mt-4">
          {editandoMensagem ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
                className="flex-1 px-3 py-2 rounded bg-white text-gray-900"
                placeholder="Digite a mensagem do dia..."
              />
              <button
                onClick={handleSalvarMensagem}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded font-medium"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setEditandoMensagem(false);
                  setNovaMensagem(mensagemDia?.mensagem || '');
                }}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded font-medium"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-lg font-medium">{mensagemDia?.mensagem || '🚀 Bem-vindo ao sistema de marketplaces!'}</p>
              {podeEditarMensagem && (
                <button
                  onClick={() => setEditandoMensagem(true)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Performance Geral</p>
              <p className="text-2xl font-bold text-gray-900">{indicadores.performance_geral || 0}%</p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Em Produção</p>
              <p className="text-2xl font-bold text-gray-900">{indicadores.pedidos_em_producao || 0}</p>
            </div>
            <Package className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pedidos Enviados</p>
              <p className="text-2xl font-bold text-gray-900">{indicadores.pedidos_enviados || 0}</p>
            </div>
            <Send className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pedidos Entregues</p>
              <p className="text-2xl font-bold text-gray-900">{indicadores.pedidos_entregues || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Atrasos</p>
              <p className="text-2xl font-bold text-gray-900">{indicadores.pedidos_atrasados || 0}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Valor Produzido Hoje */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">💰 Valor Produzido Hoje</p>
            <p className="text-3xl font-bold">{formatCurrency(indicadores.valor_produzido_hoje)}</p>
          </div>
          <DollarSign className="w-12 h-12 opacity-80" />
        </div>
      </div>

      {/* Seção de Projetos */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Projetos Marketplace</h2>
          <button
            onClick={() => toast.info('Funcionalidade de adicionar projeto será implementada na Fase 2')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Adicionar Projeto
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projetos.map((projeto) => (
            <div
              key={projeto.id}
              onClick={() => handleProjetoClick(projeto)}
              className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-t-4"
              style={{ borderTopColor: projeto.cor_primaria }}
            >
              <div className="p-6">
                {/* Cabeçalho do Card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{projeto.icone}</span>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{projeto.nome}</h3>
                      <p className="text-sm text-gray-600">{projeto.descricao}</p>
                    </div>
                  </div>
                  <span className="text-2xl">{projeto.performance_icone}</span>
                </div>

                {/* Barra de Progresso */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Progresso</span>
                    <span className="text-sm font-bold text-gray-900">{projeto.progresso_percentual}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${projeto.progresso_percentual}%`,
                        background: `linear-gradient(90deg, ${projeto.cor_primaria}, ${projeto.cor_primaria}dd)`
                      }}
                    ></div>
                  </div>
                </div>

                {/* Indicadores Rápidos */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-orange-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600">Em Produção</p>
                    <p className="text-xl font-bold text-orange-600">{projeto.pedidos_em_producao}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600">Enviados</p>
                    <p className="text-xl font-bold text-blue-600">{projeto.pedidos_enviados}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600">Entregues</p>
                    <p className="text-xl font-bold text-green-600">{projeto.pedidos_entregues}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600">Atrasados</p>
                    <p className="text-xl font-bold text-red-600">{projeto.pedidos_atrasados}</p>
                  </div>
                </div>
              </div>

              {/* Footer do Card */}
              <div className="bg-gray-50 px-6 py-3 border-t">
                <p className="text-xs text-gray-500">
                  Clique para ver detalhes e gerenciar pedidos
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Placeholder para Gráficos (Fase 2) */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Dashboards e Gráficos</h3>
        <p className="text-gray-600">Gráficos de desempenho serão implementados na Fase 2</p>
      </div>
    </div>
  );
}

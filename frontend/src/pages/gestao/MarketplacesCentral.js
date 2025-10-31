import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Plus, TrendingUp, Package, Send, CheckCircle, AlertTriangle, DollarSign, Activity, Edit2, Settings, Clock, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/gestao/marketplaces`;

// Frases motivacionais para o banner de boas-vindas
const frasesDoDia = [
  "Hoje é um ótimo dia para superar metas! 🚀",
  "Cada pedido processado é um cliente satisfeito! 😊",
  "Sua dedicação faz a diferença na operação! 💪",
  "Vamos transformar mais um dia em sucesso! ⭐",
  "A excelência está nos detalhes do seu trabalho! 🎯",
  "Juntos, fazemos a máquina funcionar perfeitamente! ⚙️",
  "Sua eficiência impulsiona todo o time! 🏆",
  "Cada processo otimizado é um passo à frente! 📈",
  "Você é peça fundamental desta operação! 🔧",
  "Vamos fazer deste dia ainda mais produtivo! 💼"
];

// Componente de Timer para countdown
function CountdownTimer({ targetTime, label, tipo }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const [hours, minutes] = targetTime.split(':').map(Number);
      const target = new Date();
      target.setHours(hours, minutes, 0, 0);
      
      // Se o horário já passou, considerar para amanhã
      if (now > target) {
        target.setDate(target.getDate() + 1);
      }
      
      const diff = target - now;
      const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
      const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setIsUrgent(hoursLeft < 1); // Vermelho se falta menos de 1 hora
      setTimeLeft(`${hoursLeft}h ${minutesLeft}m`);
    };
    
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Atualizar a cada minuto
    
    return () => clearInterval(interval);
  }, [targetTime]);
  
  const getColorClass = () => {
    if (isUrgent) return 'text-red-400 border-red-500';
    return 'text-blue-400 border-blue-500';
  };
  
  return (
    <div className={`flex items-center gap-1 px-2 py-1 border rounded ${getColorClass()} text-xs font-medium`}>
      <Clock className="w-3 h-3" />
      <span className="font-bold">{timeLeft}</span>
    </div>
  );
}

export default function MarketplacesCentral() {
  const navigate = useNavigate();
  
  // Tentar pegar context do Outlet (quando usado em /gestao/marketplaces)
  // Se não existir, usar valores padrão (quando usado em /marketplace/production)
  let outletContext;
  try {
    outletContext = useOutletContext();
  } catch (e) {
    outletContext = { lojaAtual: 'fabrica', user: null };
  }
  
  const { lojaAtual = 'fabrica', user = null } = outletContext || {};
  
  const [projetos, setProjetos] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [mensagemDia, setMensagemDia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editandoMensagem, setEditandoMensagem] = useState(false);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [editandoProjeto, setEditandoProjeto] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHorariosModal, setShowHorariosModal] = useState(false);
  const [projetoHorarios, setProjetoHorarios] = useState(null);
  const [horariosTemp, setHorariosTemp] = useState({});

  const podeEditarMensagem = user?.role === 'director' || user?.role === 'manager';
  const podeEditarHorarios = user?.role === 'director' || user?.role === 'manager';
  const isProduction = user?.role === 'production';
  const canViewFinanceiro = user?.role === 'director' || user?.role === 'manager';

  // Mensagens de boas-vindas personalizadas por colaborador
  const getMensagemBoasVindas = () => {
    const nome = user?.nome || user?.username;
    
    // Mensagens específicas para cada colaborador
    const mensagensPersonalizadas = {
      'Thalita': {
        saudacao: `Bem-vinda, Thalita! 📦`,
        mensagem: 'Hoje temos pedidos especiais para despachar! Vamos garantir que cada envio chegue com excelência! 🚀'
      },
      'Alex': {
        saudacao: `Bem-vindo, Alex! 🪞`,
        mensagem: 'Seus espelhos refletem perfeição! Continue criando obras de arte com qualidade impecável! ✨'
      },
      'Luiz': {
        saudacao: `Bem-vindo, Luiz! 🖼️`,
        mensagem: 'Cada moldura que você produz emoldura momentos especiais! Seu trabalho é arte pura! 🎨'
      },
      'Ronaldo': {
        saudacao: `Bem-vindo, Ronaldo! 🖼️💎`,
        mensagem: 'Molduras com vidro são sua especialidade! A proteção perfeita para memórias preciosas! 🌟'
      },
      'Ludmila': {
        saudacao: `Bem-vinda, Ludmila! 📦`,
        mensagem: 'Cada embalagem é o toque final de cuidado! Você garante que tudo chegue perfeito! 💝'
      },
      'Camila': {
        saudacao: `Bem-vinda, Camila! 🖨️`,
        mensagem: 'Suas impressões transformam ideias em realidade! Continue colorindo nossos projetos! 🎨'
      }
    };

    return mensagensPersonalizadas[nome] || {
      saudacao: `Bem-vindo(a), ${nome}! 👋`,
      mensagem: 'Seu trabalho faz toda a diferença na nossa equipe! Vamos juntos fazer um ótimo dia! 💪'
    };
  };

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
      'Aguardando Produção': '#94A3B8',
      'Em Produção': '#F59E0B',
      'Pronto': '#8B5CF6',
      'Embalagem': '#FBBF24',
      'Enviado': '#3B82F6',
      'Entregue': '#10B981'
    };
    return colors[status] || '#94A3B8';
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const handleEditProjeto = (e, projeto) => {
    e.stopPropagation(); // Impede navegação ao clicar no lápis
    setEditandoProjeto({ ...projeto });
    setShowEditModal(true);
  };

  const handleDeleteProjeto = async (e, projeto) => {
    e.stopPropagation(); // Impede navegação ao clicar na lixeira
    
    // Confirmar antes de deletar
    const confirmacao = window.confirm(
      `Tem certeza que deseja deletar o projeto "${projeto.nome}"?\n\n` +
      `⚠️ ATENÇÃO: Todos os pedidos deste projeto também serão deletados!\n\n` +
      `Esta ação não pode ser desfeita.`
    );
    
    if (!confirmacao) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API}/projetos/${projeto.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`Projeto "${projeto.nome}" deletado com sucesso!`);
      fetchDados(); // Recarregar lista de projetos
    } catch (error) {
      console.error('Erro ao deletar projeto:', error);
      toast.error('Erro ao deletar projeto: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEditHorarios = (e, projeto) => {
    e.stopPropagation();
    setProjetoHorarios(projeto);
    setHorariosTemp(projeto.horarios_postagem || {});
    setShowHorariosModal(true);
  };

  const handleSaveHorarios = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API}/projetos/${projetoHorarios.id}/horarios`,
        horariosTemp,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Horários atualizados com sucesso!');
      setShowHorariosModal(false);
      fetchDados();
    } catch (error) {
      console.error('Erro ao salvar horários:', error);
      toast.error('Erro ao salvar horários');
    }
  };

  const handleSaveProjeto = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/projetos/${editandoProjeto.id}`,
        editandoProjeto,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Projeto atualizado com sucesso!');
      setShowEditModal(false);
      setEditandoProjeto(null);
      fetchDados();
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      toast.error('Erro ao atualizar projeto');
    }
  };

  const handleProjetoClick = (projeto) => {
    // Navegar para página de detalhes do projeto
    navigate(`/marketplace/production/projeto/${projeto.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const indicadores = dashboard?.indicadores || {};
  const graficos = dashboard?.graficos || {};
  
  // Cores para os gráficos
  const COLORS_STATUS = {
    'Aguardando Produção': '#94A3B8',
    'Em Produção': '#F59E0B',
    'Pronto': '#8B5CF6',
    'Embalagem': '#FBBF24',
    'Enviado': '#3B82F6',
    'Entregue': '#10B981'
  };
  
  // Preparar dados do gráfico de pizza
  const statusData = Object.entries(graficos.status_atual || {}).map(([status, value]) => ({
    name: status,
    value: value
  }));
  
  const COLORS_PIE = Object.values(COLORS_STATUS);

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-white mb-2">📦 Central de Operações dos Marketplaces</h1>
        <p className="text-gray-400 text-lg">Plataforma para controlar a produção de diversos marketplaces em um só lugar</p>
        
        {/* Mensagem do Dia */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg p-4 text-white mt-4">
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

      {/* Banner de Boas-Vindas - Apenas para usuários production */}
      {isProduction && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 mb-6 border border-blue-500">
          <div className="flex items-center gap-4">
            <div className="text-5xl">👋</div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {getMensagemBoasVindas().saudacao}
              </h2>
              <p className="text-blue-100 mt-1">
                {getMensagemBoasVindas().mensagem}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Performance Geral</p>
              <p className="text-2xl font-bold text-white">{indicadores.performance_geral || 0}%</p>
            </div>
            <Activity className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Em Produção</p>
              <p className="text-2xl font-bold text-white">{indicadores.pedidos_em_producao || 0}</p>
            </div>
            <Package className="w-8 h-8 text-orange-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Pedidos Enviados</p>
              <p className="text-2xl font-bold text-white">{indicadores.pedidos_enviados || 0}</p>
            </div>
            <Send className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Pedidos Entregues</p>
              <p className="text-2xl font-bold text-white">{indicadores.pedidos_entregues || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Atrasos</p>
              <p className="text-2xl font-bold text-white">{indicadores.pedidos_atrasados || 0}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Valor Produzido Hoje - APENAS para admin */}
      {canViewFinanceiro && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-lg shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">💰 Valor Produzido Hoje</p>
              <p className="text-3xl font-bold">{formatCurrency(indicadores.valor_produzido_hoje)}</p>
            </div>
            <DollarSign className="w-12 h-12 opacity-80" />
          </div>
        </div>
      )}

      {/* Seção de Projetos - ESTILO GRID DE CARDS ESCURO */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Projetos Marketplace</h2>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/gestao/marketplaces/integrador-ml')}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 transition-colors font-semibold"
            >
              <Package className="w-5 h-5" />
              Integrador ML
            </button>
            <button
              onClick={() => navigate('/gestao/marketplaces/configuracoes-status')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Settings className="w-5 h-5" />
              Configurar Status
            </button>
            <button
              onClick={() => navigate('/gestao/marketplaces/relatorio-vendas')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <DollarSign className="w-5 h-5" />
              Relatório de Vendas
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projetos.map((projeto) => (
            <div
              key={projeto.id}
              onClick={() => handleProjetoClick(projeto)}
              className="bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-700 hover:border-blue-500"
            >
              <div className="p-6">
                {/* Cabeçalho do Card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{projeto.icone}</span>
                    <div>
                      <h3 className="text-lg font-bold text-white">{projeto.nome}</h3>
                      <p className="text-xs text-gray-400">{projeto.descricao}</p>
                    </div>
                  </div>
                </div>

                {/* Badge Recomendado (se houver) */}
                {projeto.performance_icone === '🚀' && (
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-full">
                      <span className="w-4 h-4 flex items-center justify-center">ℹ️</span>
                      Recomendado
                    </span>
                  </div>
                )}

                {/* Barra de Progresso */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-400">Progresso</span>
                    <span className="text-xs font-bold text-white">{projeto.progresso_percentual}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${projeto.progresso_percentual}%`,
                        backgroundColor: projeto.cor_primaria
                      }}
                    ></div>
                  </div>
                </div>

                {/* Indicadores Rápidos em Grid 3x2 */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                    <p className="text-xs text-gray-400">Envio Hoje</p>
                    <p className="text-lg font-bold text-yellow-400">{projeto.envio_hoje || 0}</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                    <p className="text-xs text-gray-400">Envio Amanhã</p>
                    <p className="text-lg font-bold text-cyan-400">{projeto.envio_amanha || 0}</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                    <p className="text-xs text-gray-400">Em Produção</p>
                    <p className="text-lg font-bold text-orange-400">{projeto.pedidos_em_producao}</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                    <p className="text-xs text-gray-400">Enviados</p>
                    <p className="text-lg font-bold text-blue-400">{projeto.pedidos_enviados}</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                    <p className="text-xs text-gray-400">Entregues</p>
                    <p className="text-lg font-bold text-green-400">{projeto.pedidos_entregues}</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                    <p className="text-xs text-gray-400">Atrasados</p>
                    <p className="text-lg font-bold text-red-400">{projeto.pedidos_atrasados}</p>
                  </div>
                </div>
                
                {/* Métricas de Envio por Tipo */}
                {projeto.tipos_envio && Object.keys(projeto.tipos_envio).length > 0 && (
                  <div className="mt-3 border-t border-gray-700 pt-3">
                    <p className="text-xs text-gray-400 mb-2 font-semibold">Tipos de Envio (Pendentes)</p>
                    <div className="grid grid-cols-2 gap-1 text-center">
                      {/* Shopee */}
                      {projeto.plataforma === 'shopee' && (
                        <>
                          {projeto.tipos_envio.flex_shopee !== undefined && (
                            <div className="bg-gray-900 rounded p-1.5 border border-gray-700">
                              <p className="text-[10px] text-gray-400">Flex Shopee</p>
                              <p className="text-sm font-bold text-purple-400">{projeto.tipos_envio.flex_shopee}</p>
                            </div>
                          )}
                          {projeto.tipos_envio.coleta !== undefined && (
                            <div className="bg-gray-900 rounded p-1.5 border border-gray-700">
                              <p className="text-[10px] text-gray-400">Coleta</p>
                              <p className="text-sm font-bold text-yellow-400">{projeto.tipos_envio.coleta}</p>
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Mercado Livre */}
                      {projeto.plataforma === 'mercadolivre' && (
                        <>
                          {projeto.tipos_envio.flex !== undefined && (
                            <div className="bg-gray-900 rounded p-1.5 border border-gray-700">
                              <p className="text-[10px] text-gray-400">Mercado Envios Flex</p>
                              <p className="text-sm font-bold text-purple-400">{projeto.tipos_envio.flex}</p>
                            </div>
                          )}
                          {projeto.tipos_envio.correios !== undefined && (
                            <div className="bg-gray-900 rounded p-1.5 border border-gray-700">
                              <p className="text-[10px] text-gray-400">Correios e Pontos</p>
                              <p className="text-sm font-bold text-yellow-400">{projeto.tipos_envio.correios}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Timers de Postagem */}
                {projeto.horarios_postagem && Object.keys(projeto.horarios_postagem).length > 0 && (
                  <div className="mt-3 border-t border-gray-700 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-400 font-semibold">Horários de Postagem</p>
                      {podeEditarHorarios && (
                        <button
                          onClick={(e) => handleEditHorarios(e, projeto)}
                          className="text-xs text-blue-400 hover:text-blue-300"
                          title="Editar horários"
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {/* Shopee: Flex Shopee e Coleta Shopee */}
                      {projeto.plataforma === 'shopee' && (
                        <>
                          {projeto.horarios_postagem.flex_shopee && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">Flex Shopee</span>
                              <CountdownTimer 
                                targetTime={projeto.horarios_postagem.flex_shopee} 
                                label="Flex Shopee"
                                tipo="flex_shopee"
                              />
                            </div>
                          )}
                          {projeto.horarios_postagem.coleta_shopee && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">Coleta Shopee</span>
                              <CountdownTimer 
                                targetTime={projeto.horarios_postagem.coleta_shopee} 
                                label="Coleta Shopee"
                                tipo="coleta_shopee"
                              />
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Mercado Livre: Flex ML e Agência ML */}
                      {projeto.plataforma === 'mercadolivre' && (
                        <>
                          {projeto.horarios_postagem.flex_mercadolivre && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">Flex ML</span>
                              <CountdownTimer 
                                targetTime={projeto.horarios_postagem.flex_mercadolivre} 
                                label="Flex ML"
                                tipo="flex_mercadolivre"
                              />
                            </div>
                          )}
                          {projeto.horarios_postagem.agencia_mercadolivre && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">Agência ML</span>
                              <CountdownTimer 
                                targetTime={projeto.horarios_postagem.agencia_mercadolivre} 
                                label="Agência ML"
                                tipo="agencia_mercadolivre"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer do Card */}
              <div className="bg-gray-900 px-6 py-3 border-t border-gray-700">
                <p className="text-xs text-gray-400">
                  Clique para ver detalhes e gerenciar pedidos
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico 1: Volume de Produção */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">📊 Volume de Produção (Últimos 7 Dias)</h3>
          {graficos.volume_producao && graficos.volume_producao.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={graficos.volume_producao}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="data" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="quantidade" fill="#3B82F6" name="Pedidos Produzidos" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p>Sem dados de produção nos últimos 7 dias</p>
            </div>
          )}
        </div>

        {/* Gráfico 2: Status Atual dos Pedidos */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">🔥 Status Atual dos Pedidos</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p>Sem pedidos no sistema</p>
            </div>
          )}
        </div>
      </div>

      {/* Gráfico 3: Desempenho por Plataforma */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">📈 Desempenho por Plataforma</h3>
        {graficos.desempenho_plataformas && graficos.desempenho_plataformas.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={graficos.desempenho_plataformas} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9CA3AF" />
              <YAxis dataKey="plataforma" type="category" width={100} stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="vendas" fill="#8B5CF6" name="Vendas" />
              <Bar dataKey="producao" fill="#F59E0B" name="Em Produção" />
              <Bar dataKey="entregas" fill="#10B981" name="Entregas" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p>Sem dados de desempenho por plataforma</p>
          </div>
        )}
      </div>

      {/* Modal de Edição de Projeto */}
      {showEditModal && editandoProjeto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Editar Projeto</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome</label>
                <input
                  type="text"
                  value={editandoProjeto.nome}
                  onChange={(e) => setEditandoProjeto({...editandoProjeto, nome: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                <textarea
                  value={editandoProjeto.descricao}
                  onChange={(e) => setEditandoProjeto({...editandoProjeto, descricao: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Plataforma</label>
                <select
                  value={editandoProjeto.plataforma}
                  onChange={(e) => setEditandoProjeto({...editandoProjeto, plataforma: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="shopee">Shopee</option>
                  <option value="mercado_livre">Mercado Livre</option>
                  <option value="tiktok">TikTok Shop</option>
                  <option value="amazon">Amazon</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Ícone (emoji)</label>
                <input
                  type="text"
                  value={editandoProjeto.icone}
                  onChange={(e) => setEditandoProjeto({...editandoProjeto, icone: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  maxLength="2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cor Primária</label>
                <input
                  type="color"
                  value={editandoProjeto.cor_primaria}
                  onChange={(e) => setEditandoProjeto({...editandoProjeto, cor_primaria: e.target.value})}
                  className="w-full h-10 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveProjeto}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditandoProjeto(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Horários */}
      {showHorariosModal && projetoHorarios && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowHorariosModal(false)}>
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">
              Horários de Postagem - {projetoHorarios.nome}
            </h3>
            
            <div className="space-y-4">
              {projetoHorarios.plataforma === 'shopee' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Flex Shopee
                    </label>
                    <input
                      type="time"
                      value={horariosTemp.flex_shopee || '16:00'}
                      onChange={(e) => setHorariosTemp({...horariosTemp, flex_shopee: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Coleta Shopee
                    </label>
                    <input
                      type="time"
                      value={horariosTemp.coleta_shopee || '18:00'}
                      onChange={(e) => setHorariosTemp({...horariosTemp, coleta_shopee: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
              
              {projetoHorarios.plataforma === 'mercadolivre' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Flex Mercado Livre
                    </label>
                    <input
                      type="time"
                      value={horariosTemp.flex_mercadolivre || '14:00'}
                      onChange={(e) => setHorariosTemp({...horariosTemp, flex_mercadolivre: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Agência Mercado Livre
                    </label>
                    <input
                      type="time"
                      value={horariosTemp.agencia_mercadolivre || '17:00'}
                      onChange={(e) => setHorariosTemp({...horariosTemp, agencia_mercadolivre: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowHorariosModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveHorarios}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

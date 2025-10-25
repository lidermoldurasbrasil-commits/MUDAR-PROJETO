import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Upload, Filter, Plus, MoreVertical, Clock, User, AlertCircle, CheckCircle2, Package as PackageIcon } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/gestao/marketplaces`;

const STATUS_OPTIONS = [
  { value: 'Aguardando Impressão', label: 'Aguardando Impressão', color: '#94A3B8' },
  { value: 'Sala de Impressão', label: 'Sala de Impressão', color: '#60A5FA' },
  { value: 'Em Produção', label: 'Em Produção', color: '#F59E0B' },
  { value: 'Expedição', label: 'Expedição', color: '#FBBF24' },
  { value: 'Enviado', label: 'Enviado', color: '#3B82F6' },
  { value: 'Entregue', label: 'Entregue', color: '#10B981' }
];

const PRIORIDADE_OPTIONS = ['Baixa', 'Normal', 'Alta', 'Urgente'];

export default function MarketplaceProjetoDetalhes() {
  const { projetoId } = useParams();
  const navigate = useNavigate();
  const { lojaAtual } = useOutletContext();
  
  const [projeto, setProjeto] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ status: '', atrasado: null });
  const [showFilters, setShowFilters] = useState(false);
  const [editingPedido, setEditingPedido] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' ou 'list'

  useEffect(() => {
    fetchDados();
  }, [projetoId, filtros]);

  const fetchDados = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Buscar projeto
      const projetosRes = await axios.get(`${API}/projetos`, { headers });
      const projetoEncontrado = projetosRes.data.find(p => p.id === projetoId);
      setProjeto(projetoEncontrado);

      // Buscar pedidos
      let url = `${API}/pedidos?projeto_id=${projetoId}`;
      if (filtros.status) url += `&status=${filtros.status}`;
      if (filtros.atrasado !== null) url += `&atrasado=${filtros.atrasado}`;
      
      const pedidosRes = await axios.get(url, { headers });
      setPedidos(pedidosRes.data || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados do projeto');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (pedidoId, novoStatus) => {
    try {
      const token = localStorage.getItem('token');
      const pedido = pedidos.find(p => p.id === pedidoId);
      
      await axios.put(
        `${API}/pedidos/${pedidoId}`,
        { ...pedido, status: novoStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Status atualizado!');
      fetchDados();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleUploadPlanilha = () => {
    toast.info('Funcionalidade de upload será implementada na Fase 3');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const getPrioridadeColor = (prioridade) => {
    const colors = {
      'Baixa': 'bg-gray-100 text-gray-800',
      'Normal': 'bg-blue-100 text-blue-800',
      'Alta': 'bg-orange-100 text-orange-800',
      'Urgente': 'bg-red-100 text-red-800'
    };
    return colors[prioridade] || 'bg-gray-100 text-gray-800';
  };

  // Agrupar pedidos por status para o Kanban
  const pedidosPorStatus = STATUS_OPTIONS.reduce((acc, status) => {
    acc[status.value] = pedidos.filter(p => p.status === status.value);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!projeto) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-xl text-gray-600 mb-4">Projeto não encontrado</p>
        <button onClick={() => navigate('/marketplace/production')} className="px-4 py-2 bg-blue-600 text-white rounded">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/marketplace/production')}
              className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-400" />
            </button>
            <div className="flex items-center gap-3">
              <span className="text-5xl">{projeto.icone}</span>
              <div>
                <h1 className="text-3xl font-bold text-white">{projeto.nome}</h1>
                <p className="text-sm text-gray-400">{projeto.descricao}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleUploadPlanilha}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Upload className="w-5 h-5" />
              Upload Planilha
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Filter className="w-5 h-5" />
              Filtros
            </button>
          </div>
        </div>

        {/* Indicadores Rápidos */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400">Em Produção</p>
            <p className="text-2xl font-bold text-orange-400">{projeto.pedidos_em_producao}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400">Enviados</p>
            <p className="text-2xl font-bold text-blue-400">{projeto.pedidos_enviados}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400">Entregues</p>
            <p className="text-2xl font-bold text-green-400">{projeto.pedidos_entregues}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400">Atrasados</p>
            <p className="text-2xl font-bold text-red-400">{projeto.pedidos_atrasados}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-6 border border-gray-700">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={filtros.status}
                onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg"
              >
                <option value="">Todos</option>
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Situação</label>
              <select
                value={filtros.atrasado === null ? '' : filtros.atrasado}
                onChange={(e) => setFiltros({ ...filtros, atrasado: e.target.value === '' ? null : e.target.value === 'true' })}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg"
              >
                <option value="">Todos</option>
                <option value="false">No Prazo</option>
                <option value="true">Atrasados</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFiltros({ status: '', atrasado: null })}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle View Mode */}
      <div className="flex justify-end mb-4">
        <div className="bg-gray-800 rounded-lg shadow-lg p-1 inline-flex border border-gray-700">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
          >
            Kanban
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
          >
            Lista
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-6 gap-4">
          {STATUS_OPTIONS.map(statusOption => (
            <div key={statusOption.value} className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: statusOption.color }}
                ></div>
                <h3 className="font-bold text-sm text-white">{statusOption.label}</h3>
                <span className="ml-auto bg-gray-700 px-2 py-1 rounded-full text-xs font-medium text-gray-300">
                  {pedidosPorStatus[statusOption.value]?.length || 0}
                </span>
              </div>

              <div className="space-y-3">
                {pedidosPorStatus[statusOption.value]?.map(pedido => (
                  <div
                    key={pedido.id}
                    className="bg-gray-900 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer border-l-4"
                    style={{ borderLeftColor: statusOption.color }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-sm text-white">{pedido.numero_pedido}</p>
                      {pedido.atrasado && (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{pedido.cliente_nome || 'Cliente não informado'}</p>
                    <p className="text-xs text-gray-500 mb-2">{pedido.produto_nome}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`px-2 py-1 rounded-full ${getPrioridadeColor(pedido.prioridade)}`}>
                        {pedido.prioridade}
                      </span>
                      <span className="text-gray-400">{formatDate(pedido.prazo_entrega)}</span>
                    </div>
                    
                    {/* Dropdown de mudança de status */}
                    <select
                      value={pedido.status}
                      onChange={(e) => handleStatusChange(pedido.id, e.target.value)}
                      className="w-full mt-2 px-2 py-1 text-xs border border-gray-600 bg-gray-800 text-white rounded"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
          {pedidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <PackageIcon className="w-16 h-16 mb-4 text-gray-600" />
              <p className="text-lg font-medium">Nenhum pedido encontrado</p>
              <p className="text-sm">Faça upload de uma planilha para adicionar pedidos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Nº Pedido</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Produto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Qtd</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Prioridade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Prazo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Responsável</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {pedidos.map(pedido => (
                    <tr key={pedido.id} className={pedido.atrasado ? 'bg-red-900/20' : 'hover:bg-gray-700/50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {pedido.numero_pedido}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {pedido.cliente_nome || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {pedido.produto_nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {pedido.quantidade}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {formatCurrency(pedido.valor_total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={pedido.status}
                          onChange={(e) => handleStatusChange(pedido.id, e.target.value)}
                          className="px-3 py-1 text-sm border border-gray-600 bg-gray-700 text-white rounded"
                          style={{ 
                            backgroundColor: STATUS_OPTIONS.find(s => s.value === pedido.status)?.color || '#94A3B8',
                            color: 'white'
                          }}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadeColor(pedido.prioridade)}`}>
                          {pedido.prioridade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(pedido.prazo_entrega)}
                          {pedido.atrasado && (
                            <span className="ml-2 text-red-400 font-bold">
                              ({pedido.dias_atraso}d)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {pedido.responsavel || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

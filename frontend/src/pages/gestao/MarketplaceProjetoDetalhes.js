import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Upload, Filter, Plus, MoreVertical, Clock, User, AlertCircle, CheckCircle2, Package as PackageIcon, X } from 'lucide-react';
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
  
  // Tentar pegar context do Outlet (quando usado em /gestao/marketplaces)
  // Se não existir, usar valores padrão (quando usado em /marketplace/production)
  let outletContext;
  try {
    outletContext = useOutletContext();
  } catch (e) {
    outletContext = { lojaAtual: 'fabrica' };
  }
  
  const { lojaAtual = 'fabrica' } = outletContext || {};
  
  const [projeto, setProjeto] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ status: '', atrasado: null });
  const [showFilters, setShowFilters] = useState(false);
  const [editingPedido, setEditingPedido] = useState(null);
  const [viewMode, setViewMode] = useState('monday'); // 'kanban', 'list', ou 'monday'
  const [showAddModal, setShowAddModal] = useState(false);
  const [novoPedido, setNovoPedido] = useState({
    numero_pedido: '',
    sku: '',
    cliente_nome: '',
    cliente_contato: '',
    produto_nome: '',
    quantidade: 1,
    valor_unitario: 0,
    valor_total: 0,
    status: 'Aguardando Impressão',
    prioridade: 'Normal',
    prazo_entrega: '',
    responsavel: '',
    observacoes: ''
  });

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

  const handleAddPedido = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Calcular valor total
      const valorTotal = novoPedido.quantidade * novoPedido.valor_unitario;
      
      // Converter data para ISO
      const prazoEntrega = novoPedido.prazo_entrega ? 
        new Date(novoPedido.prazo_entrega).toISOString() : 
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const pedidoData = {
        ...novoPedido,
        projeto_id: projetoId,
        plataforma: projeto.plataforma,
        valor_total: valorTotal,
        prazo_entrega: prazoEntrega,
        loja_id: lojaAtual
      };
      
      await axios.post(
        `${API}/pedidos`,
        pedidoData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Pedido criado com sucesso!');
      setShowAddModal(false);
      setNovoPedido({
        numero_pedido: '',
        sku: '',
        cliente_nome: '',
        cliente_contato: '',
        produto_nome: '',
        quantidade: 1,
        valor_unitario: 0,
        valor_total: 0,
        status: 'Aguardando Impressão',
        prioridade: 'Normal',
        prazo_entrega: '',
        responsavel: '',
        observacoes: ''
      });
      fetchDados();
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast.error('Erro ao criar pedido');
    }
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
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Adicionar Pedido
            </button>
            <button
              onClick={handleUploadPlanilha}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Upload className="w-5 h-5" />
              Upload Planilha
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
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
            onClick={() => setViewMode('monday')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'monday' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
          >
            Monday
          </button>
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

      {/* Monday View */}
      {viewMode === 'monday' && (
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase w-8">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Elemento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Quantidade</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Sala de Impressão</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Prazo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Responsável</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {pedidos.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-gray-700/50 group">
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <input
                          type="text"
                          defaultValue={pedido.numero_pedido}
                          className="bg-transparent text-white border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={pedido.status}
                        onChange={(e) => handleStatusChange(pedido.id, e.target.value)}
                        className="px-3 py-1.5 text-sm rounded font-medium border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        defaultValue={pedido.quantidade}
                        className="w-20 bg-transparent text-white border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-sm">{pedido.sku || '-'}</td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={pedido.cliente_nome}
                        placeholder="Nome do cliente"
                        className="bg-transparent text-white border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-3 py-1 bg-teal-600 text-white text-xs rounded">
                        {pedido.status === 'Sala de Impressão' ? 'Impresso' : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-sm">{formatDate(pedido.prazo_entrega)}</td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={pedido.responsavel}
                        placeholder="Responsável"
                        className="bg-transparent text-white border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1"
                      />
                    </td>
                  </tr>
                ))}
                
                {/* Linha de Adicionar */}
                <tr className="hover:bg-gray-700/50">
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3" colSpan="8">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Adicionar</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

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
      
      {/* Modal de Adicionar Pedido */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Adicionar Novo Pedido - {projeto.nome}</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Linha 1: Número do Pedido e SKU */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Número do Pedido *</label>
                  <input
                    type="text"
                    value={novoPedido.numero_pedido}
                    onChange={(e) => setNovoPedido({...novoPedido, numero_pedido: e.target.value})}
                    placeholder="Ex: ML-12345"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">SKU</label>
                  <input
                    type="text"
                    value={novoPedido.sku}
                    onChange={(e) => setNovoPedido({...novoPedido, sku: e.target.value})}
                    placeholder="Ex: PROD-001"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Linha 2: Cliente e Contato */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Cliente *</label>
                  <input
                    type="text"
                    value={novoPedido.cliente_nome}
                    onChange={(e) => setNovoPedido({...novoPedido, cliente_nome: e.target.value})}
                    placeholder="Nome completo"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Contato</label>
                  <input
                    type="text"
                    value={novoPedido.cliente_contato}
                    onChange={(e) => setNovoPedido({...novoPedido, cliente_contato: e.target.value})}
                    placeholder="Telefone ou email"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Linha 3: Produto */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Produto *</label>
                <input
                  type="text"
                  value={novoPedido.produto_nome}
                  onChange={(e) => setNovoPedido({...novoPedido, produto_nome: e.target.value})}
                  placeholder="Descrição do produto"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Linha 4: Quantidade e Valores */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Quantidade *</label>
                  <input
                    type="number"
                    min="1"
                    value={novoPedido.quantidade}
                    onChange={(e) => setNovoPedido({...novoPedido, quantidade: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Valor Unitário (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={novoPedido.valor_unitario}
                    onChange={(e) => setNovoPedido({...novoPedido, valor_unitario: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Valor Total (R$)</label>
                  <input
                    type="text"
                    value={formatCurrency(novoPedido.quantidade * novoPedido.valor_unitario)}
                    disabled
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-gray-400 rounded-lg"
                  />
                </div>
              </div>

              {/* Linha 5: Status e Prioridade */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status Inicial</label>
                  <select
                    value={novoPedido.status}
                    onChange={(e) => setNovoPedido({...novoPedido, status: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prioridade</label>
                  <select
                    value={novoPedido.prioridade}
                    onChange={(e) => setNovoPedido({...novoPedido, prioridade: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {PRIORIDADE_OPTIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Linha 6: Prazo e Responsável */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prazo de Entrega *</label>
                  <input
                    type="date"
                    value={novoPedido.prazo_entrega}
                    onChange={(e) => setNovoPedido({...novoPedido, prazo_entrega: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Responsável</label>
                  <input
                    type="text"
                    value={novoPedido.responsavel}
                    onChange={(e) => setNovoPedido({...novoPedido, responsavel: e.target.value})}
                    placeholder="Nome do responsável"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Linha 7: Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Observações</label>
                <textarea
                  value={novoPedido.observacoes}
                  onChange={(e) => setNovoPedido({...novoPedido, observacoes: e.target.value})}
                  rows={3}
                  placeholder="Detalhes adicionais sobre o pedido..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6 flex gap-3">
              <button
                onClick={handleAddPedido}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Criar Pedido
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

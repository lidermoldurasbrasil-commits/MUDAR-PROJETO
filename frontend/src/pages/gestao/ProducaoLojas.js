import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, X, Upload, Eye, Trash2, Edit, Filter, Calendar, User, Package } from 'lucide-react';
import GestaoLayout from '../../components/gestao/GestaoLayout';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/gestao/lojas`;

const LOJAS = [
  'São João Batista',
  'Mantiqueira',
  'Lagoa Santa',
  'Fábrica'
];

const STATUS_FLUXO = [
  { value: 'Aguardando Arte', label: 'Aguardando Arte', color: '#94A3B8', icon: '🎨' },
  { value: 'Arte em Desenvolvimento', label: 'Arte em Desenvolvimento', color: '#F59E0B', icon: '✏️' },
  { value: 'Aguardando Aprovação', label: 'Aguardando Aprovação', color: '#3B82F6', icon: '⏳' },
  { value: 'Aprovado', label: 'Aprovado - Em Produção', color: '#10B981', icon: '✅' },
  { value: 'Impressão', label: 'Impressão', color: '#8B5CF6', icon: '🖨️' },
  { value: 'Montagem', label: 'Montagem', color: '#EC4899', icon: '🔨' },
  { value: 'Finalizado', label: 'Finalizado', color: '#06B6D4', icon: '✔️' },
  { value: 'Entregue', label: 'Entregue', color: '#22C55E', icon: '📦' }
];

const PRIORIDADES = ['Baixa', 'Normal', 'Alta', 'Urgente'];

export default function ProducaoLojas() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [filtroLoja, setFiltroLoja] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  
  const [novoPedido, setNovoPedido] = useState({
    loja: 'São João Batista',
    cliente_nome: '',
    cliente_contato: '',
    produto_descricao: '',
    medidas_dimensoes: '',
    tipo_acabamento: '',
    vendedor_responsavel: '',
    valor_acordado: 0,
    forma_pagamento: '',
    prazo_entrega: '',
    observacoes: '',
    prioridade: 'Normal'
  });

  useEffect(() => {
    fetchPedidos();
  }, [filtroLoja, filtroStatus]);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = `${API}/pedidos`;
      const params = new URLSearchParams();
      if (filtroLoja) params.append('loja', filtroLoja);
      if (filtroStatus) params.append('status', filtroStatus);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPedidos(response.data.pedidos || []);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePedido = async () => {
    try {
      if (!novoPedido.cliente_nome || !novoPedido.produto_descricao) {
        toast.error('Preencha os campos obrigatórios: Cliente e Produto');
        return;
      }

      const token = localStorage.getItem('token');
      
      // Converter prazo_entrega para ISO
      const prazoEntrega = novoPedido.prazo_entrega ? 
        new Date(novoPedido.prazo_entrega).toISOString() : 
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const pedidoData = {
        ...novoPedido,
        prazo_entrega: prazoEntrega,
        valor_acordado: parseFloat(novoPedido.valor_acordado) || 0
      };
      
      await axios.post(
        `${API}/pedidos`,
        pedidoData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('✅ Pedido criado com sucesso!');
      setShowModal(false);
      resetForm();
      fetchPedidos();
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast.error(error.response?.data?.detail || 'Erro ao criar pedido');
    }
  };

  const handleUpdateStatus = async (pedidoId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${API}/pedidos/${pedidoId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Status atualizado!');
      fetchPedidos();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDeletePedido = async (pedidoId) => {
    if (!window.confirm('Tem certeza que deseja deletar este pedido?')) return;
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(
        `${API}/pedidos/${pedidoId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Pedido deletado!');
      fetchPedidos();
    } catch (error) {
      console.error('Erro ao deletar pedido:', error);
      toast.error('Erro ao deletar pedido');
    }
  };

  const resetForm = () => {
    setNovoPedido({
      loja: 'São João Batista',
      cliente_nome: '',
      cliente_contato: '',
      produto_descricao: '',
      medidas_dimensoes: '',
      tipo_acabamento: '',
      vendedor_responsavel: '',
      valor_acordado: 0,
      forma_pagamento: '',
      prazo_entrega: '',
      observacoes: '',
      prioridade: 'Normal'
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  // Agrupar pedidos por status
  const pedidosPorStatus = STATUS_FLUXO.reduce((acc, status) => {
    acc[status.value] = pedidos.filter(p => p.status === status.value);
    return acc;
  }, {});

  return (
    <GestaoLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Produção - Lojas Físicas</h1>
            <p className="text-gray-400 mt-1">Controle de pedidos das lojas São João Batista, Mantiqueira e Lagoa Santa</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Pedido
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-gray-300 font-medium">Filtros:</span>
            </div>
            
            <select
              value={filtroLoja}
              onChange={(e) => setFiltroLoja(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as Lojas</option>
              {LOJAS.map(loja => (
                <option key={loja} value={loja}>{loja}</option>
              ))}
            </select>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os Status</option>
              {STATUS_FLUXO.map(status => (
                <option key={status.value} value={status.value}>{status.icon} {status.label}</option>
              ))}
            </select>

            {(filtroLoja || filtroStatus) && (
              <button
                onClick={() => {
                  setFiltroLoja('');
                  setFiltroStatus('');
                }}
                className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        {/* Board Estilo Monday Work */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STATUS_FLUXO.map(status => (
              <div
                key={status.value}
                className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700 w-80 flex-shrink-0"
              >
                {/* Header do Status */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{status.icon}</span>
                    <div>
                      <h3 className="font-semibold text-white">{status.label}</h3>
                      <span className="text-sm text-gray-400">{pedidosPorStatus[status.value]?.length || 0} pedidos</span>
                    </div>
                  </div>
                </div>

                {/* Lista de Pedidos */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {pedidosPorStatus[status.value]?.map(pedido => (
                    <div
                      key={pedido.id}
                      className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedPedido(pedido);
                        setShowViewModal(true);
                      }}
                    >
                      {/* Número do Pedido e Loja */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-blue-400">{pedido.numero_pedido}</span>
                        <span className="text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded">
                          {pedido.loja}
                        </span>
                      </div>

                      {/* Cliente */}
                      <h4 className="font-semibold text-white mb-1">{pedido.cliente_nome}</h4>
                      <p className="text-sm text-gray-400 mb-2 line-clamp-2">{pedido.produto_descricao}</p>

                      {/* Vendedor e Valor */}
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                        <span>👤 {pedido.vendedor_responsavel || 'Sem vendedor'}</span>
                        <span className="font-semibold text-green-400">{formatCurrency(pedido.valor_acordado)}</span>
                      </div>

                      {/* Prazo */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Prazo: {formatDate(pedido.prazo_entrega)}</span>
                        {pedido.prioridade === 'Urgente' && (
                          <span className="px-2 py-1 bg-red-600 text-white rounded font-semibold">
                            URGENTE
                          </span>
                        )}
                        {pedido.prioridade === 'Alta' && (
                          <span className="px-2 py-1 bg-orange-600 text-white rounded font-semibold">
                            ALTA
                          </span>
                        )}
                      </div>

                      {/* Ações Rápidas */}
                      <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const currentIndex = STATUS_FLUXO.findIndex(s => s.value === pedido.status);
                            if (currentIndex < STATUS_FLUXO.length - 1) {
                              handleUpdateStatus(pedido.id, STATUS_FLUXO[currentIndex + 1].value);
                            }
                          }}
                          disabled={pedido.status === 'Entregue'}
                          className="flex-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Avançar →
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePedido(pedido.id);
                          }}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {pedidosPorStatus[status.value]?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum pedido
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Criar Pedido */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-700">
              <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between z-10">
                <h3 className="text-xl font-bold text-white">Novo Pedido de Loja</h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Loja */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Loja *</label>
                  <select
                    value={novoPedido.loja}
                    onChange={(e) => setNovoPedido({...novoPedido, loja: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {LOJAS.map(loja => (
                      <option key={loja} value={loja}>{loja}</option>
                    ))}
                  </select>
                </div>

                {/* Cliente e Contato */}
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
                    <label className="block text-sm font-medium text-gray-300 mb-2">Contato (WhatsApp/Telefone) *</label>
                    <input
                      type="text"
                      value={novoPedido.cliente_contato}
                      onChange={(e) => setNovoPedido({...novoPedido, cliente_contato: e.target.value})}
                      placeholder="(11) 98765-4321"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Produto */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Descrição do Produto/Serviço *</label>
                  <textarea
                    value={novoPedido.produto_descricao}
                    onChange={(e) => setNovoPedido({...novoPedido, produto_descricao: e.target.value})}
                    rows={3}
                    placeholder="Descreva o que o cliente deseja..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Medidas e Acabamento */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Medidas/Dimensões</label>
                    <input
                      type="text"
                      value={novoPedido.medidas_dimensoes}
                      onChange={(e) => setNovoPedido({...novoPedido, medidas_dimensoes: e.target.value})}
                      placeholder="Ex: 30x40cm"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Acabamento/Moldura</label>
                    <input
                      type="text"
                      value={novoPedido.tipo_acabamento}
                      onChange={(e) => setNovoPedido({...novoPedido, tipo_acabamento: e.target.value})}
                      placeholder="Ex: Moldura preta fosca"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Vendedor e Valor */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Vendedor Responsável</label>
                    <input
                      type="text"
                      value={novoPedido.vendedor_responsavel}
                      onChange={(e) => setNovoPedido({...novoPedido, vendedor_responsavel: e.target.value})}
                      placeholder="Nome do vendedor"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Valor Acordado (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={novoPedido.valor_acordado}
                      onChange={(e) => setNovoPedido({...novoPedido, valor_acordado: e.target.value})}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Forma de Pagamento e Prazo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Forma de Pagamento</label>
                    <select
                      value={novoPedido.forma_pagamento}
                      onChange={(e) => setNovoPedido({...novoPedido, forma_pagamento: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione...</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cartão Débito">Cartão Débito</option>
                      <option value="Cartão Crédito">Cartão Crédito</option>
                      <option value="PIX">PIX</option>
                      <option value="Parcelado">Parcelado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Prazo de Entrega</label>
                    <input
                      type="date"
                      value={novoPedido.prazo_entrega}
                      onChange={(e) => setNovoPedido({...novoPedido, prazo_entrega: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Prioridade */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prioridade</label>
                  <select
                    value={novoPedido.prioridade}
                    onChange={(e) => setNovoPedido({...novoPedido, prioridade: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {PRIORIDADES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Observações</label>
                  <textarea
                    value={novoPedido.observacoes}
                    onChange={(e) => setNovoPedido({...novoPedido, observacoes: e.target.value})}
                    rows={3}
                    placeholder="Informações adicionais..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6 flex gap-3 z-10">
                <button
                  onClick={handleCreatePedido}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Criar Pedido
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Visualizar Pedido */}
        {showViewModal && selectedPedido && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
              <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between z-10">
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedPedido.numero_pedido}</h3>
                  <p className="text-sm text-gray-400">{selectedPedido.loja}</p>
                </div>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedPedido(null);
                  }}
                  className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Cliente:</span>
                    <p className="text-white font-semibold">{selectedPedido.cliente_nome}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Contato:</span>
                    <p className="text-white font-semibold">{selectedPedido.cliente_contato}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Vendedor:</span>
                    <p className="text-white font-semibold">{selectedPedido.vendedor_responsavel || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Valor:</span>
                    <p className="text-white font-semibold">{formatCurrency(selectedPedido.valor_acordado)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Prazo:</span>
                    <p className="text-white font-semibold">{formatDate(selectedPedido.prazo_entrega)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Prioridade:</span>
                    <p className="text-white font-semibold">{selectedPedido.prioridade}</p>
                  </div>
                </div>

                <div>
                  <span className="text-gray-400">Produto:</span>
                  <p className="text-white mt-1">{selectedPedido.produto_descricao}</p>
                </div>

                {selectedPedido.medidas_dimensoes && (
                  <div>
                    <span className="text-gray-400">Medidas:</span>
                    <p className="text-white mt-1">{selectedPedido.medidas_dimensoes}</p>
                  </div>
                )}

                {selectedPedido.observacoes && (
                  <div>
                    <span className="text-gray-400">Observações:</span>
                    <p className="text-white mt-1">{selectedPedido.observacoes}</p>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedPedido(null);
                  }}
                  className="w-full px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </GestaoLayout>
  );
}

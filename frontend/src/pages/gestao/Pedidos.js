import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import PedidoForm from './PedidoForm';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/gestao`;

const STATUS_OPTIONS = [
  'Criado',
  'Em Análise',
  'Corte',
  'Montagem',
  'Acabamento',
  'Pronto',
  'Entregue',
  'Cancelado'
];

const STATUS_COLORS = {
  'Criado': '#FCD34D',
  'Em Análise': '#60A5FA',
  'Corte': '#F97316',
  'Montagem': '#A78BFA',
  'Acabamento': '#34D399',
  'Pronto': '#10B981',
  'Entregue': '#22C55E',
  'Cancelado': '#EF4444'
};

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [filteredPedidos, setFilteredPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  
  // NOVO: Estado para seleção múltipla
  const [selectedIds, setSelectedIds] = useState([]);
  
  // NOVO: Estado para visualização de orçamento
  const [showOrcamento, setShowOrcamento] = useState(false);
  const [pedidoOrcamento, setPedidoOrcamento] = useState(null);

  useEffect(() => {
    fetchPedidos();
  }, []);

  useEffect(() => {
    filterPedidos();
  }, [pedidos, searchTerm, statusFilter]);
  
  // NOVA: Limpar seleção ao filtrar
  useEffect(() => {
    setSelectedIds([]);
  }, [filteredPedidos]);

  const fetchPedidos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/pedidos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPedidos(response.data);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const filterPedidos = () => {
    let filtered = [...pedidos];

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.numero_pedido.toString().includes(searchTerm) ||
        p.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tipo_produto.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'Todos') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    setFilteredPedidos(filtered);
  };

  const handleAddPedido = () => {
    setSelectedPedido(null);
    setShowForm(true);
  };

  const handleEditPedido = (pedido) => {
    setSelectedPedido(pedido);
    setShowForm(true);
  };
  
  // NOVA: Visualizar orçamento
  const handleViewOrcamento = (pedido) => {
    setPedidoOrcamento(pedido);
    setShowOrcamento(true);
  };

  const handleDeletePedido = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este pedido?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/pedidos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Pedido excluído com sucesso!');
      fetchPedidos();
    } catch (error) {
      console.error('Erro ao excluir pedido:', error);
      toast.error('Erro ao excluir pedido');
    }
  };
  
  // NOVAS FUNÇÕES: Seleção múltipla
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = filteredPedidos.map(p => p.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error('Nenhum pedido selecionado');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir ${selectedIds.length} pedido(s)?`)) return;

    try {
      const token = localStorage.getItem('token');
      await Promise.all(
        selectedIds.map(id =>
          axios.delete(`${API}/pedidos/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      toast.success(`${selectedIds.length} pedido(s) excluído(s) com sucesso!`);
      setSelectedIds([]);
      fetchPedidos();
    } catch (error) {
      console.error('Erro ao excluir pedidos:', error);
      toast.error('Erro ao excluir pedidos');
    }
  };

  const handleStatusChange = async (pedidoId, novoStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/pedidos/${pedidoId}/status?novo_status=${novoStatus}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Status atualizado para ${novoStatus}`);
      fetchPedidos();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (showForm) {
    return (
      <PedidoForm
        pedido={selectedPedido}
        onClose={() => setShowForm(false)}
        onSave={() => {
          setShowForm(false);
          fetchPedidos();
        }}
      />
    );
  }

  return (
    <div className="pedidos-container">
      <div className="pedidos-header">
        <h1>Pedidos de Manufatura</h1>
        <button className="btn-add" onClick={handleAddPedido}>
          <Plus size={20} />
          Novo Pedido
        </button>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar por nº pedido, cliente ou tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="Todos">Todos os Status</option>
          {STATUS_OPTIONS.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        
        {/* NOVO: Botão de exclusão em lote */}
        {selectedIds.length > 0 && (
          <button 
            className="btn-delete-selected"
            onClick={handleDeleteSelected}
            style={{
              marginLeft: '10px',
              padding: '10px 20px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Trash2 size={18} />
            Excluir {selectedIds.length} selecionado(s)
          </button>
        )}
      </div>

      {/* Tabela de Pedidos */}
      <div className="pedidos-table-container">
        {loading ? (
          <div className="loading">Carregando pedidos...</div>
        ) : (
          <table className="pedidos-table">
            <thead>
              <tr>
                <th style={{width: '40px'}}>
                  <input 
                    type="checkbox"
                    checked={selectedIds.length === filteredPedidos.length && filteredPedidos.length > 0}
                    onChange={handleSelectAll}
                    style={{cursor: 'pointer', width: '18px', height: '18px'}}
                  />
                </th>
                <th>Nº Pedido</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Dimensões</th>
                <th>Status</th>
                <th>Total</th>
                <th>Custo</th>
                <th>Entrada</th>
                <th>Venda</th>
                <th>Margem</th>
                <th>Responsável</th>
                <th>Prazo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredPedidos.length === 0 ? (
                <tr>
                  <td colSpan="14" className="no-data">
                    Nenhum pedido encontrado
                  </td>
                </tr>
              ) : (
                filteredPedidos.map((pedido) => (
                  <tr key={pedido.id}>
                    <td>
                      <input 
                        type="checkbox"
                        checked={selectedIds.includes(pedido.id)}
                        onChange={() => handleSelectOne(pedido.id)}
                        style={{cursor: 'pointer', width: '18px', height: '18px'}}
                      />
                    </td>
                    <td className="pedido-numero">#{pedido.numero_pedido}</td>
                    <td>{pedido.cliente_nome}</td>
                    <td>{pedido.tipo_produto}</td>
                    <td>{pedido.altura}x{pedido.largura}cm</td>
                    <td>
                      <select
                        className="status-select"
                        value={pedido.status}
                        onChange={(e) => handleStatusChange(pedido.id, e.target.value)}
                        style={{ backgroundColor: STATUS_COLORS[pedido.status] }}
                      >
                        {STATUS_OPTIONS.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{fontWeight: '700', color: '#2563eb', fontSize: '15px'}}>
                      {formatCurrency(pedido.valor_final || pedido.preco_venda)}
                    </td>
                    <td>{formatCurrency(pedido.custo_total)}</td>
                    <td style={{fontWeight: '600', color: pedido.valor_entrada > 0 ? '#059669' : '#9ca3af'}}>
                      {formatCurrency(pedido.valor_entrada || 0)}
                    </td>
                    <td>{formatCurrency(pedido.preco_venda)}</td>
                    <td className="margem">{pedido.margem_percentual.toFixed(1)}%</td>
                    <td>{pedido.responsavel || '-'}</td>
                    <td>{formatDate(pedido.prazo_entrega)}</td>
                    <td className="actions">
                      <button
                        className="btn-icon btn-view"
                        onClick={() => handleViewOrcamento(pedido)}
                        title="Visualizar Orçamento"
                        style={{background: '#3b82f6', color: 'white'}}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEditPedido(pedido)}
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDeletePedido(pedido.id)}
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Visualização de Orçamento */}
      {showOrcamento && pedidoOrcamento && (
        <div className="modal-overlay" onClick={() => setShowOrcamento(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '900px', maxHeight: '90vh', overflow: 'auto'}}>
            <div className="modal-header">
              <h2>Orçamento - Pedido #{pedidoOrcamento.numero_pedido}</h2>
              <button className="btn-close" onClick={() => setShowOrcamento(false)}>×</button>
            </div>
            
            <div className="modal-body" style={{padding: '20px'}}>
              {/* Informações do Pedido */}
              <div style={{marginBottom: '20px', padding: '15px', background: '#f9fafb', borderRadius: '8px'}}>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px'}}>
                  <div>
                    <strong>Cliente:</strong> {pedidoOrcamento.cliente_nome}
                  </div>
                  <div>
                    <strong>Tipo:</strong> {pedidoOrcamento.tipo_produto}
                  </div>
                  <div>
                    <strong>Dimensões:</strong> {pedidoOrcamento.altura}cm × {pedidoOrcamento.largura}cm
                  </div>
                  <div>
                    <strong>Quantidade:</strong> {pedidoOrcamento.quantidade} un.
                  </div>
                  <div>
                    <strong>Status:</strong> <span style={{padding: '4px 12px', background: STATUS_COLORS[pedidoOrcamento.status], color: 'white', borderRadius: '4px', fontSize: '12px'}}>{pedidoOrcamento.status}</span>
                  </div>
                  <div>
                    <strong>Data:</strong> {formatDate(pedidoOrcamento.data_abertura)}
                  </div>
                </div>
              </div>

              {/* Composição do Orçamento */}
              <h3 style={{marginBottom: '15px', color: '#1f2937'}}>Composição</h3>
              <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '20px'}}>
                <thead>
                  <tr style={{background: '#f3f4f6'}}>
                    <th style={{padding: '12px', textAlign: 'left', border: '1px solid #e5e7eb'}}>Insumo</th>
                    <th style={{padding: '12px', textAlign: 'right', border: '1px solid #e5e7eb'}}>Qtd</th>
                    <th style={{padding: '12px', textAlign: 'left', border: '1px solid #e5e7eb'}}>Un.</th>
                    <th style={{padding: '12px', textAlign: 'right', border: '1px solid #e5e7eb'}}>Preço Unit.</th>
                    <th style={{padding: '12px', textAlign: 'right', border: '1px solid #e5e7eb'}}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidoOrcamento.itens && pedidoOrcamento.itens.length > 0 ? (
                    pedidoOrcamento.itens.map((item, index) => (
                      <tr key={index}>
                        <td style={{padding: '10px', border: '1px solid #e5e7eb'}}>{item.insumo_descricao}</td>
                        <td style={{padding: '10px', textAlign: 'right', border: '1px solid #e5e7eb'}}>{item.quantidade?.toFixed(2)}</td>
                        <td style={{padding: '10px', border: '1px solid #e5e7eb'}}>{item.unidade}</td>
                        <td style={{padding: '10px', textAlign: 'right', border: '1px solid #e5e7eb'}}>{formatCurrency(item.preco_unitario || 0)}</td>
                        <td style={{padding: '10px', textAlign: 'right', border: '1px solid #e5e7eb', fontWeight: '600'}}>{formatCurrency(item.subtotal_venda || 0)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{padding: '20px', textAlign: 'center', color: '#9ca3af'}}>Nenhum item cadastrado</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Totais */}
              <div style={{display: 'grid', gap: '10px', padding: '20px', background: '#f9fafb', borderRadius: '8px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '16px'}}>
                  <span>Custo Total:</span>
                  <span style={{fontWeight: '600'}}>{formatCurrency(pedidoOrcamento.custo_total)}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '16px'}}>
                  <span>Preço de Venda:</span>
                  <span style={{fontWeight: '600'}}>{formatCurrency(pedidoOrcamento.preco_venda)}</span>
                </div>
                {pedidoOrcamento.desconto_valor > 0 && (
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#dc2626'}}>
                    <span>Desconto:</span>
                    <span>- {formatCurrency(pedidoOrcamento.desconto_valor)}</span>
                  </div>
                )}
                {pedidoOrcamento.sobre_preco_valor > 0 && (
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#059669'}}>
                    <span>Sobre-preço:</span>
                    <span>+ {formatCurrency(pedidoOrcamento.sobre_preco_valor)}</span>
                  </div>
                )}
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '700', color: '#2563eb', borderTop: '2px solid #cbd5e1', paddingTop: '10px'}}>
                  <span>VALOR FINAL:</span>
                  <span>{formatCurrency(pedidoOrcamento.valor_final)}</span>
                </div>
                
                {/* Resumo de Pagamento */}
                {pedidoOrcamento.valor_entrada > 0 && (
                  <div style={{marginTop: '15px', padding: '15px', background: '#f0fdf4', borderRadius: '6px', border: '2px solid #86efac'}}>
                    <div style={{fontSize: '14px', fontWeight: '600', color: '#166534', marginBottom: '10px'}}>
                      💰 Pagamento
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                      <span style={{color: '#064e3b'}}>Entrada Paga:</span>
                      <span style={{color: '#059669', fontWeight: '700'}}>{formatCurrency(pedidoOrcamento.valor_entrada)}</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <span style={{color: '#064e3b'}}>Saldo Restante:</span>
                      <span style={{color: '#dc2626', fontWeight: '700'}}>{formatCurrency(pedidoOrcamento.valor_final - pedidoOrcamento.valor_entrada)}</span>
                    </div>
                  </div>
                )}
                
                {pedidoOrcamento.forma_pagamento && (
                  <div style={{marginTop: '10px', fontSize: '14px', color: '#6b7280'}}>
                    <strong>Forma de Pagamento:</strong> {pedidoOrcamento.forma_pagamento}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .pedidos-container {
          padding: 30px;
          max-width: 1800px;
          margin: 0 auto;
        }

        .pedidos-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .pedidos-header h1 {
          font-size: 28px;
          color: #2d3748;
          margin: 0;
        }

        .btn-add {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #5dceaa;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-add:hover {
          background: #4db89a;
          box-shadow: 0 4px 12px rgba(93, 206, 170, 0.3);
        }

        .filters-section {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }

        .search-box {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          padding: 10px 15px;
          border-radius: 8px;
          border: 1px solid #cbd5e0;
        }

        .search-box input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
        }

        .status-filter {
          padding: 10px 15px;
          border: 1px solid #cbd5e0;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          cursor: pointer;
        }

        .pedidos-table-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          overflow: hidden;
        }

        .pedidos-table {
          width: 100%;
          border-collapse: collapse;
        }

        .pedidos-table thead {
          background: #f7fafc;
        }

        .pedidos-table th {
          padding: 15px;
          text-align: left;
          font-size: 13px;
          font-weight: 600;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e2e8f0;
        }

        .pedidos-table td {
          padding: 15px;
          font-size: 14px;
          color: #2d3748;
          border-bottom: 1px solid #e2e8f0;
        }

        .pedidos-table tbody tr:hover {
          background: #f7fafc;
        }

        .pedido-numero {
          font-weight: 600;
          color: #5dceaa;
        }

        .status-select {
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          color: white;
        }

        .margem {
          font-weight: 600;
          color: #10b981;
        }

        .actions {
          display: flex;
          gap: 8px;
        }

        .btn-icon {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .btn-edit {
          color: #3b82f6;
        }

        .btn-edit:hover {
          background: #dbeafe;
        }

        .btn-delete {
          color: #ef4444;
        }

        .btn-delete:hover {
          background: #fee2e2;
        }

        .loading {
          padding: 60px;
          text-align: center;
          color: #718096;
        }

        .no-data {
          text-align: center;
          padding: 60px;
          color: #a0aec0;
        }
      `}</style>
    </div>
  );
}

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
                  <td colSpan="13" className="no-data">
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

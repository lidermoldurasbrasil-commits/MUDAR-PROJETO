import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit, Trash2, List, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_OPTIONS = [
  'Criação de Arte',
  'Aprovação do Cliente',
  'Impressão',
  'Produção',
  'Pronto',
  'Entregue'
];

export default function CustomProduction() {
  const { unit, unitId } = useParams(); // unit = 'factory' or 'store', unitId = store number
  const unitName = unit === 'factory' ? 'Fábrica' : `Loja ${unitId}`;
  const unitKey = unit === 'factory' ? 'Factory' : `Store ${unitId}`;

  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    store: unitKey,
    customer_name: '',
    order_id: '',
    project_name: '',
    responsible: '',
    delivery_deadline: '',
    status: 'Criação de Arte'
  });

  useEffect(() => {
    fetchItems();
  }, [unitKey]);

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API}/store-production?store=${unitKey}`);
      setItems(res.data);
    } catch (error) {
      toast.error('Erro ao carregar itens');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`${API}/store-production/${editingItem.id}`, formData);
        toast.success('Item atualizado');
      } else {
        await axios.post(`${API}/store-production`, formData);
        toast.success('Item criado');
      }
      fetchItems();
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error('Erro ao salvar item');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Excluir este item?')) {
      try {
        await axios.delete(`${API}/store-production/${id}`);
        toast.success('Item excluído');
        fetchItems();
      } catch (error) {
        toast.error('Erro ao excluir item');
      }
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      store: unitKey,
      customer_name: '',
      order_id: '',
      project_name: '',
      responsible: '',
      delivery_deadline: '',
      status: 'Criação de Arte'
    });
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Criação de Arte': '#f59e0b',
      'Aprovação do Cliente': '#3b82f6',
      'Impressão': '#8b5cf6',
      'Produção': '#ec4899',
      'Pronto': '#10b981',
      'Entregue': '#059669'
    };
    return colors[status] || '#6b7280';
  };

  const groupedByStatus = STATUS_OPTIONS.reduce((acc, status) => {
    acc[status] = items.filter(item => item.status === status);
    return acc;
  }, {});

  return (
    <div data-testid="custom-production-page">
      <div className="page-header">
        <div>
          <h2>Produção Personalizada - {unitName}</h2>
          <p>Gestão completa do processo de produção</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="view-toggle">
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
              title="Lista"
            >
              <List size={20} />
            </button>
            <button 
              className={viewMode === 'kanban' ? 'active' : ''}
              onClick={() => setViewMode('kanban')}
              title="Kanban"
            >
              <LayoutGrid size={20} />
            </button>
          </div>
          <button
            className="btn-primary"
            onClick={() => { resetForm(); setShowModal(true); }}
            data-testid="add-item-btn"
          >
            <Plus size={20} />
            <span>Novo Pedido</span>
          </button>
        </div>
      </div>

      <div className="card">
        {viewMode === 'list' ? (
          <div className="table-container">
            <table data-testid="production-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Pedido</th>
                  <th>Projeto</th>
                  <th>Responsável</th>
                  <th>Entrega</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>{item.customer_name}</td>
                    <td>{item.order_id}</td>
                    <td>{item.project_name || '-'}</td>
                    <td>{item.responsible || '-'}</td>
                    <td>{item.delivery_deadline}</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ 
                          background: `${getStatusColor(item.status)}20`,
                          color: getStatusColor(item.status)
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => openEditModal(item)} className="btn-icon">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="btn-icon btn-danger">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="kanban-board">
            {STATUS_OPTIONS.map(status => (
              <div key={status} className="kanban-column">
                <div className="kanban-header">
                  <h3>{status}</h3>
                  <span className="item-count" style={{ background: getStatusColor(status) }}>
                    {groupedByStatus[status]?.length || 0}
                  </span>
                </div>
                <div className="kanban-items">
                  {groupedByStatus[status]?.map(item => (
                    <div key={item.id} className="kanban-card">
                      <div className="kanban-card-header">
                        <h4>{item.customer_name}</h4>
                        <div className="card-actions">
                          <button onClick={() => openEditModal(item)} className="btn-icon-small">
                            <Edit size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="kanban-card-body">
                        <p><strong>Pedido:</strong> {item.order_id}</p>
                        {item.project_name && <p><strong>Projeto:</strong> {item.project_name}</p>}
                        {item.responsible && <p><strong>Responsável:</strong> {item.responsible}</p>}
                        <p><strong>Entrega:</strong> {item.delivery_deadline}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingItem ? 'Editar Pedido' : 'Novo Pedido Personalizado'}</h3>
              <button onClick={() => setShowModal(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nome do Cliente</label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>ID do Pedido</label>
                  <input
                    type="text"
                    value={formData.order_id}
                    onChange={(e) => setFormData({...formData, order_id: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nome do Projeto</label>
                  <input
                    type="text"
                    value={formData.project_name}
                    onChange={(e) => setFormData({...formData, project_name: e.target.value})}
                    placeholder="Opcional"
                  />
                </div>
                <div className="form-group">
                  <label>Responsável</label>
                  <input
                    type="text"
                    value={formData.responsible}
                    onChange={(e) => setFormData({...formData, responsible: e.target.value})}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Data de Entrega</label>
                  <input
                    type="date"
                    value={formData.delivery_deadline}
                    onChange={(e) => setFormData({...formData, delivery_deadline: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingItem ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .view-toggle {
          display: flex;
          background: white;
          border-radius: 8px;
          border: 2px solid #e2e8f0;
          overflow: hidden;
        }

        .view-toggle button {
          padding: 10px 16px;
          border: none;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          color: #718096;
        }

        .view-toggle button.active {
          background: #667eea;
          color: white;
        }

        .kanban-board {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px;
          padding: 16px 0;
          overflow-x: auto;
        }

        .kanban-column {
          background: #f7fafc;
          border-radius: 12px;
          padding: 16px;
          min-width: 250px;
        }

        .kanban-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e2e8f0;
        }

        .kanban-header h3 {
          font-size: 14px;
          font-weight: 600;
          color: #2d3748;
        }

        .item-count {
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .kanban-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .kanban-card {
          background: white;
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .kanban-card-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .kanban-card-header h4 {
          font-size: 14px;
          font-weight: 600;
          color: #2d3748;
        }

        .kanban-card-body p {
          font-size: 13px;
          color: #4a5568;
          margin: 6px 0;
        }

        @media (max-width: 1400px) {
          .kanban-board {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 1024px) {
          .kanban-board {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .kanban-board {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

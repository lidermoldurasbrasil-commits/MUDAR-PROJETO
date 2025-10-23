import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit, List, LayoutGrid, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_OPTIONS = ['Projetando', 'Imprimindo', 'Em Produção', 'Controle de Qualidade', 'Enviado'];
const PLATFORMS = ['Shopee', 'Mercado Livre', 'TikTok'];

export default function ProductionBoard() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const [formData, setFormData] = useState({
    project_name: '',
    order_number: '',
    sku: '',
    quantity: 0,
    client_name: '',
    frame_color: '',
    delivery_date: '',
    status: 'Projetando',
    platform: 'Shopee'
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API}/production`);
      setItems(res.data);
    } catch (error) {
      toast.error('Erro ao carregar itens');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`${API}/production/${editingItem.id}`, formData);
        toast.success('Item atualizado');
      } else {
        await axios.post(`${API}/production`, formData);
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
        await axios.delete(`${API}/production/${id}`);
        toast.success('Item excluído');
        fetchItems();
      } catch (error) {
        toast.error('Erro ao excluir item');
      }
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      project_name: '',
      order_number: '',
      sku: '',
      quantity: 0,
      client_name: '',
      frame_color: '',
      delivery_date: '',
      status: 'Projetando',
      platform: 'Shopee'
    });
  };

  const getStatusClass = (status) => {
    return `status-${status.toLowerCase().replace(' ', '-')}`;
  };

  const handleExport = () => {
    const csv = [
      ['Projeto', 'Pedido', 'SKU', 'Quantidade', 'Cliente', 'Cor da Moldura', 'Data de Entrega', 'Plataforma', 'Status'],
      ...items.map(item => [
        item.project_name,
        item.order_number || '',
        item.sku,
        item.quantity,
        item.client_name,
        item.frame_color,
        item.delivery_date,
        item.platform,
        item.status
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'producao_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
    toast.success('Planilha exportada com sucesso!');
  };

  const groupedByStatus = STATUS_OPTIONS.reduce((acc, status) => {
    acc[status] = items.filter(item => item.status === status);
    return acc;
  }, {});

  return (
    <div data-testid="production-board-page">
      <div className="page-header">
        <div>
          <h2>Quadro de Produção</h2>
          <p>Rastreamento de produção estilo Monday.com</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="view-toggle" data-testid="view-toggle">
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
              title="Visualização em Lista"
            >
              <List size={20} />
            </button>
            <button 
              className={viewMode === 'kanban' ? 'active' : ''}
              onClick={() => setViewMode('kanban')}
              title="Visualização Kanban"
            >
              <LayoutGrid size={20} />
            </button>
          </div>
          <button
            className="btn-secondary"
            onClick={handleExport}
            data-testid="export-btn"
          >
            <Download size={20} />
            <span>Exportar</span>
          </button>
          <button
            className="btn-primary"
            onClick={() => { resetForm(); setShowModal(true); }}
            data-testid="add-production-item-btn"
          >
            <Plus size={20} />
            <span>Adicionar Item</span>
          </button>
        </div>
      </div>

      <div className="card">
        {viewMode === 'list' ? (
          <div className="table-container">
            <table data-testid="production-items-table">
              <thead>
                <tr>
                  <th>Projeto</th>
                  <th>Pedido</th>
                  <th>SKU</th>
                  <th>Qtd</th>
                  <th>Cliente</th>
                  <th>Cor Moldura</th>
                  <th>Entrega</th>
                  <th>Plataforma</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} data-testid={`production-item-${item.id}`}>
                    <td>{item.project_name}</td>
                    <td>{item.order_number || '-'}</td>
                    <td>{item.sku}</td>
                    <td>{item.quantity}</td>
                    <td>{item.client_name}</td>
                    <td>{item.frame_color}</td>
                    <td>{item.delivery_date}</td>
                    <td>{item.platform}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => openEditModal(item)}
                          className="btn-icon"
                          data-testid={`edit-item-${item.id}`}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="btn-icon btn-danger"
                          data-testid={`delete-item-${item.id}`}
                        >
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
          <div className="kanban-board" data-testid="kanban-view">
            {STATUS_OPTIONS.map(status => (
              <div key={status} className="kanban-column">
                <div className="kanban-header">
                  <h3>{status}</h3>
                  <span className="item-count">{groupedByStatus[status]?.length || 0}</span>
                </div>
                <div className="kanban-items">
                  {groupedByStatus[status]?.map(item => (
                    <div key={item.id} className="kanban-card" data-testid={`kanban-card-${item.id}`}>
                      <div className="kanban-card-header">
                        <h4>{item.project_name}</h4>
                        <div className="card-actions">
                          <button onClick={() => openEditModal(item)} className="btn-icon-small">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="btn-icon-small">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="kanban-card-body">
                        <p><strong>Pedido:</strong> {item.order_number || '-'}</p>
                        <p><strong>Cliente:</strong> {item.client_name}</p>
                        <p><strong>SKU:</strong> {item.sku}</p>
                        <p><strong>Qtd:</strong> {item.quantity}</p>
                        <p><strong>Entrega:</strong> {item.delivery_date}</p>
                        <span className={`badge-small ${item.platform.toLowerCase()}`}>{item.platform}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" data-testid="production-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingItem ? 'Editar Item' : 'Novo Item de Produção'}</h3>
              <button onClick={() => setShowModal(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nome do Projeto</label>
                  <input
                    type="text"
                    value={formData.project_name}
                    onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                    required
                    data-testid="input-project-name"
                  />
                </div>
                <div className="form-group">
                  <label>Número do Pedido</label>
                  <input
                    type="text"
                    value={formData.order_number}
                    onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                    data-testid="input-order-number"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                    data-testid="input-sku"
                  />
                </div>
                <div className="form-group">
                  <label>Quantidade</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    required
                    data-testid="input-quantity"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nome do Cliente</label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    required
                    data-testid="input-client-name"
                  />
                </div>
                <div className="form-group">
                  <label>Cor da Moldura</label>
                  <input
                    type="text"
                    value={formData.frame_color}
                    onChange={(e) => setFormData({ ...formData, frame_color: e.target.value })}
                    required
                    data-testid="input-frame-color"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Data de Entrega</label>
                  <input
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                    required
                    data-testid="input-delivery-date"
                  />
                </div>
                <div className="form-group">
                  <label>Plataforma</label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    data-testid="select-platform"
                  >
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  data-testid="select-status"
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" data-testid="submit-production-form">
                  {editingItem ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .page-header h2 {
          font-size: 24px;
          color: #2d3748;
          margin-bottom: 4px;
        }

        .page-header p {
          color: #718096;
          font-size: 14px;
        }

        .page-header button {
          display: flex;
          align-items: center;
          gap: 8px;
        }

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

        .view-toggle button:hover {
          background: #f7fafc;
        }

        .view-toggle button.active {
          background: #667eea;
          color: white;
        }

        .table-container {
          overflow-x: auto;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .btn-icon {
          padding: 8px;
          border: none;
          background: #f7fafc;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-icon:hover {
          background: #e2e8f0;
        }

        .btn-icon.btn-danger:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .kanban-board {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          padding: 16px 0;
          overflow-x: auto;
        }

        .kanban-column {
          background: #f7fafc;
          border-radius: 12px;
          padding: 16px;
          min-width: 280px;
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
          font-size: 15px;
          font-weight: 600;
          color: #2d3748;
        }

        .item-count {
          background: #667eea;
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
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }

        .kanban-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .kanban-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .kanban-card-header h4 {
          font-size: 14px;
          font-weight: 600;
          color: #2d3748;
          flex: 1;
        }

        .card-actions {
          display: flex;
          gap: 4px;
        }

        .btn-icon-small {
          padding: 4px;
          border: none;
          background: #f7fafc;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
          color: #718096;
        }

        .btn-icon-small:hover {
          background: #e2e8f0;
          color: #2d3748;
        }

        .kanban-card-body {
          font-size: 13px;
          color: #4a5568;
        }

        .kanban-card-body p {
          margin: 6px 0;
        }

        .kanban-card-body strong {
          font-weight: 600;
          color: #2d3748;
        }

        .badge-small {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          margin-top: 8px;
        }

        .badge-small.shopee {
          background: #ee4d2d20;
          color: #ee4d2d;
        }

        .badge-small.mercado {
          background: #fff15920;
          color: #cc9900;
        }

        .badge-small.tiktok {
          background: #00000020;
          color: #000000;
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
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
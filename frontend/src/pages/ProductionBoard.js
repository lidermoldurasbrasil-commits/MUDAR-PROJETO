import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit } from 'lucide-react';
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
        <button
          className="btn-primary"
          onClick={() => { resetForm(); setShowModal(true); }}
          data-testid="add-production-item-btn"
        >
          <Plus size={20} />
          <span>Adicionar Item</span>
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table data-testid="production-items-table">
            <thead>
              <tr>
                <th>Nome do Projeto</th>
                <th>SKU</th>
                <th>Quantidade</th>
                <th>Cliente</th>
                <th>Cor da Moldura</th>
                <th>Data de Entrega</th>
                <th>Plataforma</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} data-testid={`production-item-${item.id}`}>
                  <td>{item.project_name}</td>
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
                  <label>SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                    data-testid="input-sku"
                  />
                </div>
              </div>

              <div className="form-row">
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
              </div>

              <div className="form-row">
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
              </div>

              <div className="form-row">
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

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          padding: 32px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .modal-header h3 {
          font-size: 20px;
          color: #2d3748;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 32px;
          color: #718096;
          cursor: pointer;
          line-height: 1;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
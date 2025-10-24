import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Filter, MoreHorizontal, ChevronDown, Settings, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_OPTIONS = ['Projetando', 'Imprimindo', 'Em Produção', 'Controle de Qualidade', 'Enviado'];
const PRIORITY_OPTIONS = ['Baixa', 'Média', 'Alta', 'Crítica'];
const PLATFORMS = ['Shopee', 'Mercado Livre', 'TikTok'];

export default function ProductionBoardMonday() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    project_name: '',
    order_number: '',
    sku: '',
    quantity: 0,
    client_name: '',
    frame_color: '',
    delivery_date: '',
    status: 'Projetando',
    priority: 'Média',
    platform: 'Shopee',
    assigned_to: '',
    budget: 0
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
      closeModal();
    } catch (error) {
      toast.error('Erro ao salvar item');
    }
  };

  const closeModal = () => {
    setShowModal(false);
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
      priority: 'Média',
      platform: 'Shopee',
      assigned_to: '',
      budget: 0
    });
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Projetando': '#fdab3d',
      'Imprimindo': '#00c875',
      'Em Produção': '#579bfc',
      'Controle de Qualidade': '#a25ddc',
      'Enviado': '#00d647'
    };
    return colors[status] || '#c4c4c4';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Baixa': '#579bfc',
      'Média': '#a25ddc',
      'Alta': '#e44258',
      'Crítica': '#333333'
    };
    return colors[priority] || '#c4c4c4';
  };

  const groupedByStatus = STATUS_OPTIONS.reduce((acc, status) => {
    acc[status] = items.filter(item => item.status === status);
    return acc;
  }, {});

  const totalBudget = items.reduce((sum, item) => sum + (item.budget || 0), 0);

  return (
    <div className="monday-board" data-testid="production-board-monday">
      {/* Header */}
      <div className="board-header">
        <div className="header-left">
          <h1>Quadro de Produção</h1>
          <ChevronDown size={20} />
        </div>
        <div className="header-right">
          <button className="btn-icon-header">
            <Settings size={20} />
          </button>
          <button className="btn-icon-header">
            <Users size={20} />
          </button>
          <button className="btn-primary-monday" onClick={() => setShowModal(true)} data-testid="add-item-btn">
            <Plus size={18} />
            Novo Item
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="board-toolbar">
        <button className="btn-toolbar active">
          Tabela Principal
        </button>
        <button className="btn-toolbar">
          Linha do Tempo
        </button>
        <button className="btn-toolbar">
          Quadros Pivô
        </button>
        <button className="btn-add-view">
          <Plus size={16} />
        </button>
      </div>

      {/* Actions Bar */}
      <div className="actions-bar">
        <button className="btn-action" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          Novo item
          <ChevronDown size={14} />
        </button>
        <button className="btn-action">
          <Search size={16} />
          Buscar
        </button>
        <button className="btn-action">
          <Users size={16} />
          Pessoa
        </button>
        <button className="btn-action">
          <Filter size={16} />
          Filtrar
          <ChevronDown size={14} />
        </button>
        <button className="btn-action" onClick={() => setShowSettings(!showSettings)}>
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Settings Menu */}
      {showSettings && (
        <div className="settings-menu" data-testid="settings-menu">
          <div className="settings-item highlighted">
            <span>⚡ Autofill with AI</span>
          </div>
          <div className="settings-item">
            <Filter size={16} />
            <span>Filter</span>
          </div>
          <div className="settings-item">
            <span>Sort</span>
          </div>
          <div className="settings-item">
            <span>Group by</span>
          </div>
        </div>
      )}

      {/* Board Groups */}
      <div className="board-groups">
        {/* In Progress Group */}
        <div className="board-group" data-testid="group-in-progress">
          <div className="group-header">
            <ChevronDown size={18} />
            <div className="group-color" style={{ background: '#fdab3d' }}></div>
            <h3>Em Andamento</h3>
            <span className="group-count">{items.length}</span>
          </div>

          {/* Table */}
          <div className="board-table">
            <table>
              <thead>
                <tr>
                  <th className="col-checkbox"></th>
                  <th className="col-item">Item</th>
                  <th className="col-status">Status</th>
                  <th className="col-priority">Prioridade</th>
                  <th className="col-people">Pessoa</th>
                  <th className="col-date">Data de Entrega</th>
                  <th className="col-budget">Orçamento</th>
                  <th className="col-actions"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} onClick={() => openEditModal(item)} data-testid={`item-${item.id}`}>
                    <td className="col-checkbox">
                      <input type="checkbox" onClick={(e) => e.stopPropagation()} />
                    </td>
                    <td className="col-item">
                      <div className="item-content">
                        <span className="item-icon">💬</span>
                        <span className="item-name">{item.project_name}</span>
                      </div>
                    </td>
                    <td className="col-status">
                      <div 
                        className="status-badge-monday" 
                        style={{ background: getStatusColor(item.status) }}
                      >
                        {item.status}
                      </div>
                    </td>
                    <td className="col-priority">
                      <div 
                        className="priority-badge-monday" 
                        style={{ background: getPriorityColor(item.priority || 'Média') }}
                      >
                        {item.priority || 'Média'}
                      </div>
                    </td>
                    <td className="col-people">
                      <div className="person-avatar">
                        {item.assigned_to ? item.assigned_to.charAt(0).toUpperCase() : '?'}
                      </div>
                    </td>
                    <td className="col-date">
                      <div className={`date-badge ${new Date(item.delivery_date) < new Date() ? 'overdue' : ''}`}>
                        {item.delivery_date ? new Date(item.delivery_date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }) : '-'}
                      </div>
                    </td>
                    <td className="col-budget">
                      ${item.budget || 0}
                    </td>
                    <td className="col-actions">
                      <button className="btn-row-action" onClick={(e) => { e.stopPropagation(); }}>
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="add-row">
                  <td colSpan="8">
                    <button className="btn-add-row" onClick={() => setShowModal(true)}>
                      <Plus size={16} />
                      Adicionar item
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary Row */}
          <div className="summary-row">
            <div className="summary-colors">
              {STATUS_OPTIONS.map(status => (
                <div 
                  key={status}
                  className="summary-color" 
                  style={{ background: getStatusColor(status) }}
                  title={status}
                ></div>
              ))}
            </div>
            <div className="summary-total">
              ${totalBudget.toLocaleString()}
              <span className="summary-label">total</span>
            </div>
          </div>
        </div>

        {/* Upcoming Projects Group */}
        <div className="board-group">
          <div className="group-header">
            <ChevronDown size={18} />
            <div className="group-color" style={{ background: '#a25ddc' }}></div>
            <h3>Projetos Futuros</h3>
            <span className="group-count">0</span>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay-monday" data-testid="item-modal">
          <div className="modal-content-monday">
            <div className="modal-header-monday">
              <h2>{editingItem ? 'Editar Item' : 'Novo Item de Produção'}</h2>
              <button className="btn-close-monday" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid-monday">
                <div className="form-group-monday">
                  <label>Nome do Projeto</label>
                  <input
                    type="text"
                    value={formData.project_name}
                    onChange={(e) => setFormData({...formData, project_name: e.target.value})}
                    required
                    data-testid="input-project-name"
                  />
                </div>
                <div className="form-group-monday">
                  <label>N° do Pedido</label>
                  <input
                    type="text"
                    value={formData.order_number}
                    onChange={(e) => setFormData({...formData, order_number: e.target.value})}
                    data-testid="input-order-number"
                  />
                </div>
                <div className="form-group-monday">
                  <label>Cliente</label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group-monday">
                  <label>Quantidade</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                    required
                  />
                </div>
                <div className="form-group-monday">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group-monday">
                  <label>Prioridade</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    {PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group-monday">
                  <label>Responsável</label>
                  <input
                    type="text"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                    placeholder="Nome"
                  />
                </div>
                <div className="form-group-monday">
                  <label>Data de Entrega</label>
                  <input
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({...formData, delivery_date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group-monday">
                  <label>Orçamento</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              <div className="modal-footer-monday">
                <button type="button" className="btn-cancel-monday" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save-monday">
                  {editingItem ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .monday-board {
          background: #f6f7fb;
          min-height: 100vh;
          padding: 0;
        }

        .board-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: white;
          border-bottom: 1px solid #e6e9ef;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-left h1 {
          font-size: 24px;
          color: #323338;
          font-weight: 400;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-icon-header {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          color: #676879;
        }

        .btn-icon-header:hover {
          background: #f6f7fb;
        }

        .btn-primary-monday {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #0073ea;
          color: white;
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-weight: 400;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-primary-monday:hover {
          background: #0060b9;
        }

        .board-toolbar {
          display: flex;
          gap: 4px;
          padding: 0 24px;
          background: white;
          border-bottom: 1px solid #e6e9ef;
        }

        .btn-toolbar {
          padding: 12px 16px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: #676879;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-toolbar:hover {
          color: #323338;
        }

        .btn-toolbar.active {
          color: #0073ea;
          border-bottom-color: #0073ea;
        }

        .btn-add-view {
          padding: 8px;
          background: transparent;
          border: none;
          color: #676879;
          cursor: pointer;
        }

        .actions-bar {
          display: flex;
          gap: 8px;
          padding: 16px 24px;
          background: white;
        }

        .btn-action {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: white;
          border: 1px solid #c3c6d4;
          border-radius: 4px;
          color: #323338;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-action:hover {
          background: #f6f7fb;
        }

        .settings-menu {
          position: absolute;
          right: 24px;
          top: 180px;
          background: white;
          border: 1px solid #e6e9ef;
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          min-width: 200px;
          z-index: 100;
        }

        .settings-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          cursor: pointer;
          font-size: 14px;
          color: #323338;
        }

        .settings-item:hover {
          background: #f6f7fb;
        }

        .settings-item.highlighted {
          background: #e5f4ff;
          color: #0073ea;
          font-weight: 500;
        }

        .board-groups {
          padding: 24px;
        }

        .board-group {
          background: white;
          border-radius: 8px;
          margin-bottom: 24px;
          overflow: hidden;
        }

        .group-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          background: #f6f7fb;
          cursor: pointer;
        }

        .group-color {
          width: 4px;
          height: 24px;
          border-radius: 2px;
        }

        .group-header h3 {
          font-size: 16px;
          color: #323338;
          font-weight: 400;
        }

        .group-count {
          color: #676879;
          font-size: 14px;
        }

        .board-table {
          overflow-x: auto;
        }

        .board-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .board-table thead th {
          padding: 12px 16px;
          text-align: left;
          font-size: 13px;
          font-weight: 400;
          color: #676879;
          border-bottom: 1px solid #e6e9ef;
          background: white;
        }

        .board-table tbody td {
          padding: 8px 16px;
          border-bottom: 1px solid #e6e9ef;
          vertical-align: middle;
        }

        .board-table tbody tr:hover {
          background: #f6f7fb;
        }

        .col-checkbox {
          width: 40px;
        }

        .col-item {
          min-width: 250px;
        }

        .col-status, .col-priority {
          width: 150px;
        }

        .col-people {
          width: 80px;
        }

        .col-date {
          width: 140px;
        }

        .col-budget {
          width: 120px;
        }

        .col-actions {
          width: 50px;
        }

        .item-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .item-icon {
          font-size: 18px;
        }

        .item-name {
          font-size: 14px;
          color: #323338;
        }

        .status-badge-monday {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 4px;
          color: white;
          font-size: 13px;
          font-weight: 400;
          text-align: center;
        }

        .priority-badge-monday {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 4px;
          color: white;
          font-size: 13px;
          font-weight: 400;
          text-align: center;
        }

        .person-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #0073ea;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 500;
        }

        .date-badge {
          padding: 4px 8px;
          border-radius: 4px;
          background: #323338;
          color: white;
          font-size: 13px;
          display: inline-block;
        }

        .date-badge.overdue {
          background: #e44258;
        }

        .btn-row-action {
          background: transparent;
          border: none;
          color: #676879;
          cursor: pointer;
          padding: 4px;
        }

        .add-row {
          background: transparent !important;
        }

        .btn-add-row {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px;
          background: transparent;
          border: none;
          color: #676879;
          font-size: 14px;
          cursor: pointer;
          width: 100%;
          text-align: left;
        }

        .btn-add-row:hover {
          color: #0073ea;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          background: #f6f7fb;
          border-top: 1px solid #e6e9ef;
        }

        .summary-colors {
          display: flex;
          gap: 4px;
        }

        .summary-color {
          width: 30px;
          height: 8px;
          border-radius: 2px;
        }

        .summary-total {
          font-size: 14px;
          color: #323338;
          font-weight: 500;
        }

        .summary-label {
          font-size: 12px;
          color: #676879;
          font-weight: 400;
          margin-left: 4px;
        }

        .modal-overlay-monday {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }

        .modal-content-monday {
          background: white;
          border-radius: 8px;
          width: 100%;
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header-monday {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e6e9ef;
        }

        .modal-header-monday h2 {
          font-size: 20px;
          color: #323338;
          font-weight: 400;
        }

        .btn-close-monday {
          background: transparent;
          border: none;
          font-size: 28px;
          color: #676879;
          cursor: pointer;
          line-height: 1;
        }

        .form-grid-monday {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          padding: 24px;
        }

        .form-group-monday {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group-monday label {
          font-size: 13px;
          color: #676879;
          font-weight: 400;
        }

        .form-group-monday input,
        .form-group-monday select {
          padding: 10px 12px;
          border: 1px solid #c3c6d4;
          border-radius: 4px;
          font-size: 14px;
          color: #323338;
        }

        .form-group-monday input:focus,
        .form-group-monday select:focus {
          outline: none;
          border-color: #0073ea;
        }

        .modal-footer-monday {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 24px;
          border-top: 1px solid #e6e9ef;
        }

        .btn-cancel-monday {
          padding: 8px 24px;
          background: white;
          border: 1px solid #c3c6d4;
          border-radius: 4px;
          color: #323338;
          font-size: 14px;
          cursor: pointer;
        }

        .btn-save-monday {
          padding: 8px 24px;
          background: #0073ea;
          border: none;
          border-radius: 4px;
          color: white;
          font-size: 14px;
          font-weight: 400;
          cursor: pointer;
        }

        .btn-save-monday:hover {
          background: #0060b9;
        }

        @media (max-width: 768px) {
          .form-grid-monday {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

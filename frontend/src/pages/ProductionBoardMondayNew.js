import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Filter, ChevronDown, ChevronRight, X, Eye, MoreHorizontal, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_OPTIONS = [
  { label: 'AGUARDANDO ARTE', color: '#ff6b6b' },
  { label: 'MÃO DE OBRA', color: '#fdab3d' },
  { label: 'PRONTO PARA IMPRIMIR', color: '#4ecdc4' },
  { label: 'IMPRESSO', color: '#00c875' },
  { label: 'AGUARDANDO RETIRADA', color: '#a25ddc' },
  { label: 'ENTREGUE', color: '#00d647' },
  { label: 'EM MONTAGEM', color: '#579bfc' },
  { label: 'MOLDURA', color: '#ff9f1c' },
  { label: 'CANVAS', color: '#784bd1' },
  { label: 'MANTIQUEIRA', color: '#66d9ef' },
  { label: 'MOLDURA CRV', color: '#fb8500' },
  { label: 'MDF CRU', color: '#a89c94' },
  { label: 'ESPELHO', color: '#91a3b0' },
  { label: 'CAIXA ALTA', color: '#ff006e' },
  { label: 'FEITO', color: '#06ffa5' }
];

const QUANTITY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 50, 100];
const BOX_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const GLASS_OPTIONS = ['Sim', 'Não', 'Fotos', 'Acrílico'];

export default function ProductionBoardMondayNew() {
  const [groups, setGroups] = useState([]);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [showDropdown, setShowDropdown] = useState(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await axios.get(`${API}/production/groups`);
      setGroups(res.data || []);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      // Se não existir endpoint de grupos, criar estrutura inicial
      setGroups([
        { id: 'group-1', name: 'FULL', color: '#00d647', items: [] },
        { id: 'group-2', name: 'MERCADO LIVRE', color: '#fdab3d', items: [] },
        { id: 'group-3', name: 'SHOPEE', color: '#579bfc', items: [] },
        { id: 'group-4', name: 'TIK TOK', color: '#ff6b6b', items: [] }
      ]);
    }
  };

  const addGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Digite um nome para o grupo');
      return;
    }

    const newGroup = {
      id: `group-${Date.now()}`,
      name: newGroupName,
      color: '#579bfc',
      items: []
    };

    try {
      // Tentar salvar no backend
      await axios.post(`${API}/production/groups`, newGroup);
      setGroups([...groups, newGroup]);
      toast.success('Grupo criado!');
      setShowGroupModal(false);
      setNewGroupName('');
    } catch (error) {
      // Se falhar, adicionar localmente
      setGroups([...groups, newGroup]);
      toast.success('Grupo criado localmente!');
      setShowGroupModal(false);
      setNewGroupName('');
    }
  };

  const addItem = async (groupId) => {
    const newItem = {
      id: `item-${Date.now()}`,
      element: 1,
      status: 'AGUARDANDO ARTE',
      quantity: 1,
      sku: '',
      order_id: '',
      box: 1,
      text: '',
      glass: 'Não',
      date: new Date().toISOString().split('T')[0]
    };

    const updatedGroups = groups.map(group => {
      if (group.id === groupId) {
        return { ...group, items: [...group.items, newItem] };
      }
      return group;
    });

    setGroups(updatedGroups);
    toast.success('Elemento criado!');
  };

  const updateItemField = (groupId, itemId, field, value) => {
    const updatedGroups = groups.map(group => {
      if (group.id === groupId) {
        const updatedItems = group.items.map(item => {
          if (item.id === itemId) {
            return { ...item, [field]: value };
          }
          return item;
        });
        return { ...group, items: updatedItems };
      }
      return group;
    });

    setGroups(updatedGroups);
    setEditingCell(null);
    setShowDropdown(null);
  };

  const toggleGroup = (groupId) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const getStatusOption = (label) => {
    return STATUS_OPTIONS.find(opt => opt.label === label) || STATUS_OPTIONS[0];
  };

  return (
    <div className="production-board-monday-new">
      {/* Header */}
      <div className="board-header-monday">
        <div className="header-left">
          <h1 className="board-title">PEDIDOS</h1>
        </div>
        <div className="header-actions">
          <button className="btn-icon"><Search size={18} /></button>
          <button className="btn-icon"><Filter size={18} /></button>
          <button className="btn-icon"><Eye size={18} /></button>
          <button className="btn-create" onClick={() => setShowGroupModal(true)}>
            <Plus size={16} />
            Adicionar novo grupo
          </button>
        </div>
      </div>

      {/* Board Container */}
      <div className="board-container-monday">
        {/* Table Header */}
        <div className="table-header-monday">
          <div className="column-header col-element">Elemento</div>
          <div className="column-header col-status">Status</div>
          <div className="column-header col-quantity">Quantit</div>
          <div className="column-header col-sku">SKU</div>
          <div className="column-header col-order-id">ID do pedido</div>
          <div className="column-header col-box">Caixa</div>
          <div className="column-header col-text">Texto</div>
          <div className="column-header col-glass">Vidro</div>
          <div className="column-header col-date">Data</div>
        </div>

        {/* Groups */}
        <div className="groups-container">
          {groups.map(group => (
            <div key={group.id} className="group-section">
              {/* Group Header */}
              <div className="group-header-monday" style={{ borderLeftColor: group.color }}>
                <button 
                  className="group-toggle"
                  onClick={() => toggleGroup(group.id)}
                >
                  {collapsedGroups[group.id] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                </button>
                <div className="group-color-indicator" style={{ backgroundColor: group.color }} />
                <span className="group-name">{group.name}</span>
                <span className="group-count">({group.items.length})</span>
                <button 
                  className="btn-add-item-inline"
                  onClick={() => addItem(group.id)}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Group Items */}
              {!collapsedGroups[group.id] && (
                <div className="group-items">
                  {group.items.map(item => (
                    <div key={item.id} className="item-row-monday">
                      {/* Element */}
                      <div className="cell col-element">
                        <GripVertical size={14} className="drag-handle" />
                        <input
                          type="number"
                          value={item.element}
                          onChange={(e) => updateItemField(group.id, item.id, 'element', parseInt(e.target.value))}
                          className="cell-input"
                        />
                      </div>

                      {/* Status */}
                      <div className="cell col-status">
                        <div
                          className="status-badge"
                          style={{ backgroundColor: getStatusOption(item.status).color }}
                          onClick={() => setShowDropdown({ type: 'status', groupId: group.id, itemId: item.id })}
                        >
                          {item.status}
                        </div>
                        {showDropdown?.type === 'status' && showDropdown?.itemId === item.id && (
                          <div className="dropdown-menu status-dropdown">
                            {STATUS_OPTIONS.map(option => (
                              <div
                                key={option.label}
                                className="dropdown-item"
                                onClick={() => updateItemField(group.id, item.id, 'status', option.label)}
                              >
                                <div className="status-badge-small" style={{ backgroundColor: option.color }} />
                                {option.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="cell col-quantity">
                        <div 
                          className="cell-value clickable"
                          onClick={() => setShowDropdown({ type: 'quantity', groupId: group.id, itemId: item.id })}
                        >
                          {item.quantity}
                        </div>
                        {showDropdown?.type === 'quantity' && showDropdown?.itemId === item.id && (
                          <div className="dropdown-menu">
                            {QUANTITY_OPTIONS.map(qty => (
                              <div
                                key={qty}
                                className="dropdown-item"
                                onClick={() => updateItemField(group.id, item.id, 'quantity', qty)}
                              >
                                {qty}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* SKU */}
                      <div className="cell col-sku">
                        <input
                          type="text"
                          value={item.sku}
                          onChange={(e) => updateItemField(group.id, item.id, 'sku', e.target.value)}
                          className="cell-input"
                          placeholder="-"
                        />
                      </div>

                      {/* Order ID */}
                      <div className="cell col-order-id">
                        <input
                          type="text"
                          value={item.order_id}
                          onChange={(e) => updateItemField(group.id, item.id, 'order_id', e.target.value)}
                          className="cell-input"
                          placeholder="-"
                        />
                      </div>

                      {/* Box */}
                      <div className="cell col-box">
                        <div 
                          className="cell-value clickable"
                          onClick={() => setShowDropdown({ type: 'box', groupId: group.id, itemId: item.id })}
                        >
                          {item.box}
                        </div>
                        {showDropdown?.type === 'box' && showDropdown?.itemId === item.id && (
                          <div className="dropdown-menu">
                            {BOX_OPTIONS.map(box => (
                              <div
                                key={box}
                                className="dropdown-item"
                                onClick={() => updateItemField(group.id, item.id, 'box', box)}
                              >
                                {box}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Text */}
                      <div className="cell col-text">
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => updateItemField(group.id, item.id, 'text', e.target.value)}
                          className="cell-input"
                          placeholder="-"
                        />
                      </div>

                      {/* Glass */}
                      <div className="cell col-glass">
                        <div 
                          className="cell-value clickable"
                          onClick={() => setShowDropdown({ type: 'glass', groupId: group.id, itemId: item.id })}
                        >
                          {item.glass}
                        </div>
                        {showDropdown?.type === 'glass' && showDropdown?.itemId === item.id && (
                          <div className="dropdown-menu">
                            {GLASS_OPTIONS.map(glass => (
                              <div
                                key={glass}
                                className="dropdown-item"
                                onClick={() => updateItemField(group.id, item.id, 'glass', glass)}
                              >
                                {glass}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Date */}
                      <div className="cell col-date">
                        <input
                          type="date"
                          value={item.date}
                          onChange={(e) => updateItemField(group.id, item.id, 'date', e.target.value)}
                          className="cell-input"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Add Item Row */}
                  <div className="add-item-row" onClick={() => addItem(group.id)}>
                    <Plus size={16} />
                    <span>Criar elemento</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Group Modal */}
      {showGroupModal && (
        <div className="modal-overlay" onClick={() => setShowGroupModal(false)}>
          <div className="modal-content-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Adicionar Novo Grupo</h3>
              <button onClick={() => setShowGroupModal(false)} className="btn-close">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Nome do grupo (ex: Shopee)"
                className="input-full"
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowGroupModal(false)} className="btn-cancel">
                Cancelar
              </button>
              <button onClick={addGroup} className="btn-primary">
                Adicionar Grupo
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .production-board-monday-new {
          background: #f6f7fb;
          min-height: 100vh;
          padding: 20px;
        }

        .board-header-monday {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 0 10px;
        }

        .board-title {
          font-size: 28px;
          font-weight: 600;
          color: #323338;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .btn-icon {
          background: white;
          border: 1px solid #e6e9ef;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          color: #676879;
          transition: all 0.2s;
        }

        .btn-icon:hover {
          background: #f6f7fb;
        }

        .btn-create {
          background: #0073ea;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .btn-create:hover {
          background: #0060b9;
        }

        .board-container-monday {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
        }

        .table-header-monday {
          display: grid;
          grid-template-columns: 120px 180px 100px 140px 140px 100px 150px 120px 140px;
          background: #f6f7fb;
          border-bottom: 2px solid #e6e9ef;
          padding: 0 10px;
          height: 40px;
          align-items: center;
          font-size: 12px;
          font-weight: 600;
          color: #676879;
          text-transform: uppercase;
        }

        .column-header {
          padding: 0 8px;
        }

        .groups-container {
          padding: 0;
        }

        .group-section {
          border-bottom: 1px solid #e6e9ef;
        }

        .group-header-monday {
          display: flex;
          align-items: center;
          padding: 12px 10px;
          background: white;
          border-left: 4px solid;
          gap: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .group-header-monday:hover {
          background: #f6f7fb;
        }

        .group-toggle {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          color: #676879;
          padding: 0;
        }

        .group-color-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .group-name {
          font-size: 14px;
          font-weight: 600;
          color: #323338;
          flex: 1;
        }

        .group-count {
          color: #676879;
          font-size: 13px;
        }

        .btn-add-item-inline {
          background: none;
          border: none;
          cursor: pointer;
          color: #676879;
          padding: 4px;
          display: flex;
          align-items: center;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .group-header-monday:hover .btn-add-item-inline {
          opacity: 1;
        }

        .btn-add-item-inline:hover {
          color: #0073ea;
        }

        .group-items {
          background: white;
        }

        .item-row-monday {
          display: grid;
          grid-template-columns: 120px 180px 100px 140px 140px 100px 150px 120px 140px;
          border-bottom: 1px solid #f0f0f0;
          min-height: 48px;
          align-items: center;
          padding: 0 10px;
          transition: background 0.1s;
          position: relative;
        }

        .item-row-monday:hover {
          background: #f6f7fb;
        }

        .cell {
          padding: 4px 8px;
          display: flex;
          align-items: center;
          gap: 4px;
          position: relative;
        }

        .drag-handle {
          color: #d0d4e4;
          cursor: grab;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .item-row-monday:hover .drag-handle {
          opacity: 1;
        }

        .cell-input {
          border: none;
          background: transparent;
          width: 100%;
          padding: 6px 8px;
          font-size: 14px;
          color: #323338;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .cell-input:hover {
          background: #f0f3ff;
        }

        .cell-input:focus {
          outline: 2px solid #0073ea;
          background: white;
        }

        .cell-value {
          padding: 6px 8px;
          font-size: 14px;
          color: #323338;
          width: 100%;
        }

        .cell-value.clickable {
          cursor: pointer;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .cell-value.clickable:hover {
          background: #f0f3ff;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          color: white;
          cursor: pointer;
          white-space: nowrap;
          transition: opacity 0.2s;
        }

        .status-badge:hover {
          opacity: 0.9;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          background: white;
          border: 1px solid #e6e9ef;
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 1000;
          min-width: 200px;
          max-height: 300px;
          overflow-y: auto;
          margin-top: 4px;
        }

        .status-dropdown {
          min-width: 220px;
        }

        .dropdown-item {
          padding: 10px 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #323338;
          transition: background 0.1s;
        }

        .dropdown-item:hover {
          background: #f6f7fb;
        }

        .status-badge-small {
          width: 20px;
          height: 20px;
          border-radius: 3px;
        }

        .add-item-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          color: #676879;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .add-item-row:hover {
          background: #f6f7fb;
          color: #0073ea;
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
          z-index: 2000;
        }

        .modal-content-small {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e6e9ef;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 20px;
          color: #323338;
        }

        .btn-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #676879;
          padding: 4px;
          display: flex;
          align-items: center;
        }

        .btn-close:hover {
          color: #323338;
        }

        .modal-body {
          padding: 24px;
        }

        .input-full {
          width: 100%;
          padding: 12px;
          border: 1px solid #e6e9ef;
          border-radius: 4px;
          font-size: 14px;
          color: #323338;
        }

        .input-full:focus {
          outline: none;
          border-color: #0073ea;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 24px;
          border-top: 1px solid #e6e9ef;
        }

        .btn-cancel {
          background: white;
          border: 1px solid #e6e9ef;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          color: #323338;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-cancel:hover {
          background: #f6f7fb;
        }

        .btn-primary {
          background: #0073ea;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: #0060b9;
        }
      `}</style>
    </div>
  );
}

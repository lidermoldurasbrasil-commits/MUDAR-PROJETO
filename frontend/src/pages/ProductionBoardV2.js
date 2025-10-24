import { useState, useEffect } from 'react';
import { Plus, Search, Filter, ChevronDown, ChevronRight, X, Eye, GripVertical, Edit2, Trash2, User, Calendar, Hash, AtSign, FileText } from 'lucide-react';
import { toast } from 'sonner';

// Tipos de colunas disponíveis
const COLUMN_TYPES = {
  essencial: [
    { id: 'text', label: 'Texto', icon: '📝', color: '#fdab3d' },
    { id: 'number', label: 'Números', icon: '🔢', color: '#fdab3d' },
    { id: 'status', label: 'Status', icon: '▪️', color: '#00c875' },
    { id: 'email', label: 'E-mail', icon: '@', color: '#fdab3d' }
  ],
  superUtil: [
    { id: 'date', label: 'Data', icon: '📅', color: '#a25ddc' },
    { id: 'people', label: 'Pessoas', icon: '👤', color: '#579bfc' },
    { id: 'dropdown', label: 'Lista suspensa', icon: '⬇️', color: '#00c875' }
  ]
};

const QUANTITY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 50, 100];
const GLASS_OPTIONS = ['Sim', 'Não', 'Fotos', 'Acrílico'];

export default function ProductionBoardV2() {
  // Estados principais
  const [groups, setGroups] = useState([]);
  const [statusList, setStatusList] = useState([
    { id: 's1', label: 'AGUARDANDO ARTE', color: '#ff6b6b' },
    { id: 's2', label: 'MÃO DE OBRA', color: '#fdab3d' },
    { id: 's3', label: 'PRONTO PARA IMPRIMIR', color: '#4ecdc4' },
    { id: 's4', label: 'IMPRESSO', color: '#00c875' },
    { id: 's5', label: 'AGUARDANDO RETIRADA', color: '#a25ddc' },
    { id: 's6', label: 'ENTREGUE', color: '#00d647' },
    { id: 's7', label: 'EM MONTAGEM', color: '#579bfc' },
    { id: 's8', label: 'MOLDURA', color: '#ff9f1c' },
    { id: 's9', label: 'CANVAS', color: '#784bd1' },
    { id: 's10', label: 'FEITO', color: '#06ffa5' }
  ]);
  const [productionStatusList, setProductionStatusList] = useState([
    { id: 'ps1', label: 'AGUARDANDO IMPRESSÃO', color: '#fdab3d' },
    { id: 'ps2', label: 'IMPRESSO', color: '#00c875' },
    { id: 'ps3', label: 'EXPEDIÇÃO', color: '#579bfc' },
    { id: 'ps4', label: 'ENVIADO', color: '#00d647' }
  ]);
  const [customColumns, setCustomColumns] = useState([
    { id: 'qty', label: 'Quantit', type: 'dropdown', required: true },
    { id: 'sku', label: 'SKU', type: 'text', required: true },
    { id: 'text', label: 'Texto', type: 'text', required: true },
    { id: 'production_status', label: 'Status de Produção', type: 'production_status', required: true }
  ]);

  // Estados de UI
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showDropdown, setShowDropdown] = useState(null);
  const [editingStatus, setEditingStatus] = useState(null);
  const [columnSearch, setColumnSearch] = useState('');

  useEffect(() => {
    // Inicializar grupos padrão
    setGroups([
      { id: 'g1', name: 'FULL', color: '#00d647', items: [] },
      { id: 'g2', name: 'MERCADO LIVRE', color: '#fdab3d', items: [] },
      { id: 'g3', name: 'SHOPEE', color: '#579bfc', items: [] },
      { id: 'g4', name: 'TIK TOK', color: '#ff6b6b', items: [] }
    ]);
  }, []);

  // Função para adicionar grupo
  const addGroup = () => {
    if (!newGroupName.trim()) {
      toast.error('Digite um nome para o grupo');
      return;
    }

    const newGroup = {
      id: `g${Date.now()}`,
      name: newGroupName,
      color: '#579bfc',
      items: []
    };

    setGroups([...groups, newGroup]);
    toast.success('Grupo criado!');
    setShowGroupModal(false);
    setNewGroupName('');
  };

  // Função para adicionar elemento com numeração automática
  const addItem = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    const newElement = group.items.length + 1;

    const newItem = {
      id: `i${Date.now()}`,
      element: newElement,
      status: statusList[0].id,
      // Inicializar campos customizados
      customFields: customColumns.reduce((acc, col) => {
        if (col.id === 'qty') acc[col.id] = 1;
        else if (col.id === 'production_status') acc[col.id] = productionStatusList[0].id;
        else acc[col.id] = '';
        return acc;
      }, {})
    };

    const updatedGroups = groups.map(g => {
      if (g.id === groupId) {
        return { ...g, items: [...g.items, newItem] };
      }
      return g;
    });

    setGroups(updatedGroups);
    toast.success('Elemento criado!');
  };

  // Atualizar campo de item
  const updateItemField = (groupId, itemId, field, value) => {
    const updatedGroups = groups.map(group => {
      if (group.id === groupId) {
        const updatedItems = group.items.map(item => {
          if (item.id === itemId) {
            if (field.startsWith('custom_')) {
              const customField = field.replace('custom_', '');
              return {
                ...item,
                customFields: { ...item.customFields, [customField]: value }
              };
            }
            return { ...item, [field]: value };
          }
          return item;
        });
        return { ...group, items: updatedItems };
      }
      return group;
    });

    setGroups(updatedGroups);
    setShowDropdown(null);
  };

  // Gerenciar status
  const addStatus = () => {
    const newStatus = {
      id: `s${Date.now()}`,
      label: 'Novo Status',
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    };
    setStatusList([...statusList, newStatus]);
    toast.success('Status criado!');
  };

  const editStatus = (statusId, newLabel) => {
    setStatusList(statusList.map(s => 
      s.id === statusId ? { ...s, label: newLabel } : s
    ));
    setEditingStatus(null);
    toast.success('Status atualizado!');
  };

  const deleteStatus = (statusId) => {
    if (statusList.length <= 1) {
      toast.error('Deve ter pelo menos um status');
      return;
    }
    setStatusList(statusList.filter(s => s.id !== statusId));
    toast.success('Status removido!');
  };

  // Gerenciar colunas customizadas
  const addCustomColumn = (columnType) => {
    const newColumn = {
      id: `col${Date.now()}`,
      label: `Nova ${columnType.label}`,
      type: columnType.id,
      required: false
    };
    setCustomColumns([...customColumns, newColumn]);
    toast.success(`Coluna "${columnType.label}" adicionada!`);
    setShowColumnModal(false);
  };

  const deleteColumn = (columnId) => {
    const column = customColumns.find(c => c.id === columnId);
    if (column.required) {
      toast.error('Esta coluna não pode ser removida');
      return;
    }
    setCustomColumns(customColumns.filter(c => c.id !== columnId));
    toast.success('Coluna removida!');
  };

  const toggleGroup = (groupId) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const getStatusById = (statusId) => {
    return statusList.find(s => s.id === statusId) || statusList[0];
  };

  const getProductionStatusById = (statusId) => {
    return productionStatusList.find(s => s.id === statusId) || productionStatusList[0];
  };

  // Calcular largura da grid dinamicamente
  const gridColumns = `120px 180px ${customColumns.map(() => '150px').join(' ')}`;

  return (
    <div className="production-board-v2">
      {/* Header */}
      <div className="board-header-v2">
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
      <div className="board-container-v2">
        {/* Table Header */}
        <div className="table-header-v2" style={{ gridTemplateColumns: gridColumns }}>
          <div className="column-header">Elemento</div>
          <div className="column-header">
            Status
            <button className="btn-edit-col" onClick={() => setShowStatusModal(true)}>
              <Edit2 size={12} />
            </button>
          </div>
          {customColumns.map(col => (
            <div key={col.id} className="column-header">
              {col.label}
              {!col.required && (
                <button className="btn-delete-col" onClick={() => deleteColumn(col.id)}>
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
          <div className="column-header">
            <button className="btn-add-col" onClick={() => setShowColumnModal(true)}>
              <Plus size={14} /> Coluna
            </button>
          </div>
        </div>

        {/* Groups */}
        <div className="groups-container">
          {groups.map(group => (
            <div key={group.id} className="group-section">
              {/* Group Header */}
              <div className="group-header-v2" style={{ borderLeftColor: group.color }}>
                <button className="group-toggle" onClick={() => toggleGroup(group.id)}>
                  {collapsedGroups[group.id] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                </button>
                <div className="group-color-indicator" style={{ backgroundColor: group.color }} />
                <span className="group-name">{group.name}</span>
                <span className="group-count">({group.items.length})</span>
                <button className="btn-add-item-inline" onClick={() => addItem(group.id)}>
                  <Plus size={14} />
                </button>
              </div>

              {/* Group Items */}
              {!collapsedGroups[group.id] && (
                <div className="group-items">
                  {group.items.map(item => (
                    <div key={item.id} className="item-row-v2" style={{ gridTemplateColumns: gridColumns }}>
                      {/* Elemento (auto-numerado) */}
                      <div className="cell">
                        <GripVertical size={14} className="drag-handle" />
                        <span className="element-number">{item.element}</span>
                      </div>

                      {/* Status */}
                      <div className="cell">
                        <div
                          className="status-badge"
                          style={{ backgroundColor: getStatusById(item.status).color }}
                          onClick={() => setShowDropdown({ type: 'status', groupId: group.id, itemId: item.id })}
                        >
                          {getStatusById(item.status).label}
                        </div>
                        {showDropdown?.type === 'status' && showDropdown?.itemId === item.id && (
                          <div className="dropdown-menu status-dropdown">
                            {statusList.map(status => (
                              <div
                                key={status.id}
                                className="dropdown-item"
                                onClick={() => updateItemField(group.id, item.id, 'status', status.id)}
                              >
                                <div className="status-badge-small" style={{ backgroundColor: status.color }} />
                                {status.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Campos Customizados */}
                      {customColumns.map(col => (
                        <div key={col.id} className="cell">
                          {col.type === 'text' && (
                            <input
                              type="text"
                              value={item.customFields[col.id] || ''}
                              onChange={(e) => updateItemField(group.id, item.id, `custom_${col.id}`, e.target.value)}
                              className="cell-input"
                              placeholder="-"
                            />
                          )}
                          {col.type === 'number' && (
                            <input
                              type="number"
                              value={item.customFields[col.id] || ''}
                              onChange={(e) => updateItemField(group.id, item.id, `custom_${col.id}`, e.target.value)}
                              className="cell-input"
                              placeholder="0"
                            />
                          )}
                          {col.type === 'dropdown' && col.id === 'qty' && (
                            <div 
                              className="cell-value clickable"
                              onClick={() => setShowDropdown({ type: `custom_${col.id}`, groupId: group.id, itemId: item.id })}
                            >
                              {item.customFields[col.id]}
                              {showDropdown?.type === `custom_${col.id}` && showDropdown?.itemId === item.id && (
                                <div className="dropdown-menu">
                                  {QUANTITY_OPTIONS.map(qty => (
                                    <div
                                      key={qty}
                                      className="dropdown-item"
                                      onClick={() => updateItemField(group.id, item.id, `custom_${col.id}`, qty)}
                                    >
                                      {qty}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          {col.type === 'production_status' && (
                            <div className="cell">
                              <div
                                className="status-badge"
                                style={{ backgroundColor: getProductionStatusById(item.customFields[col.id]).color }}
                                onClick={() => setShowDropdown({ type: `custom_${col.id}`, groupId: group.id, itemId: item.id })}
                              >
                                {getProductionStatusById(item.customFields[col.id]).label}
                              </div>
                              {showDropdown?.type === `custom_${col.id}` && showDropdown?.itemId === item.id && (
                                <div className="dropdown-menu status-dropdown">
                                  {productionStatusList.map(prodStatus => (
                                    <div
                                      key={prodStatus.id}
                                      className="dropdown-item"
                                      onClick={() => updateItemField(group.id, item.id, `custom_${col.id}`, prodStatus.id)}
                                    >
                                      <div className="status-badge-small" style={{ backgroundColor: prodStatus.color }} />
                                      {prodStatus.label}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          {col.type === 'email' && (
                            <input
                              type="email"
                              value={item.customFields[col.id] || ''}
                              onChange={(e) => updateItemField(group.id, item.id, `custom_${col.id}`, e.target.value)}
                              className="cell-input"
                              placeholder="email@exemplo.com"
                            />
                          )}
                          {col.type === 'people' && (
                            <input
                              type="text"
                              value={item.customFields[col.id] || ''}
                              onChange={(e) => updateItemField(group.id, item.id, `custom_${col.id}`, e.target.value)}
                              className="cell-input"
                              placeholder="Nome"
                            />
                          )}
                        </div>
                      ))}
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

      {/* Modal: Adicionar Grupo */}
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

      {/* Modal: Gerenciar Status */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content-medium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Etiquetas de Status</h3>
              <button onClick={() => setShowStatusModal(false)} className="btn-close">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="status-list">
                {statusList.map(status => (
                  <div key={status.id} className="status-item">
                    {editingStatus === status.id ? (
                      <input
                        type="text"
                        value={status.label}
                        onChange={(e) => editStatus(status.id, e.target.value)}
                        onBlur={() => setEditingStatus(null)}
                        className="status-edit-input"
                        autoFocus
                      />
                    ) : (
                      <>
                        <div className="status-badge-edit" style={{ backgroundColor: status.color }}>
                          {status.label}
                        </div>
                        <button className="btn-icon-small" onClick={() => setEditingStatus(status.id)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn-icon-small" onClick={() => deleteStatus(status.id)}>
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <button className="btn-add-status" onClick={addStatus}>
                + Criar nova etiqueta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Coluna */}
      {showColumnModal && (
        <div className="modal-overlay" onClick={() => setShowColumnModal(false)}>
          <div className="modal-content-medium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Adicionar Coluna</h3>
              <button onClick={() => setShowColumnModal(false)} className="btn-close">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                placeholder="Pesquise ou descreva sua coluna"
                value={columnSearch}
                onChange={(e) => setColumnSearch(e.target.value)}
                className="input-search"
              />
              
              <div className="column-types-section">
                <h4>Essenciais</h4>
                <div className="column-types-grid">
                  {COLUMN_TYPES.essencial.map(type => (
                    <div
                      key={type.id}
                      className="column-type-card"
                      onClick={() => addCustomColumn(type)}
                    >
                      <span className="column-type-icon">{type.icon}</span>
                      <span className="column-type-label">{type.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="column-types-section">
                <h4>Super úteis</h4>
                <div className="column-types-grid">
                  {COLUMN_TYPES.superUtil.map(type => (
                    <div
                      key={type.id}
                      className="column-type-card"
                      onClick={() => addCustomColumn(type)}
                    >
                      <span className="column-type-icon">{type.icon}</span>
                      <span className="column-type-label">{type.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .production-board-v2 {
          background: #f6f7fb;
          min-height: 100vh;
          padding: 20px;
        }

        .board-header-v2 {
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

        .board-container-v2 {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
        }

        .table-header-v2 {
          display: grid;
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
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-edit-col, .btn-delete-col {
          background: none;
          border: none;
          cursor: pointer;
          color: #676879;
          padding: 2px;
          display: none;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .column-header:hover .btn-edit-col,
        .column-header:hover .btn-delete-col {
          display: block;
          opacity: 1;
        }

        .btn-edit-col:hover {
          color: #0073ea;
        }

        .btn-delete-col:hover {
          color: #e44258;
        }

        .btn-add-col {
          background: none;
          border: none;
          cursor: pointer;
          color: #0073ea;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .btn-add-col:hover {
          background: #f0f3ff;
        }

        .groups-container {
          padding: 0;
        }

        .group-section {
          border-bottom: 1px solid #e6e9ef;
        }

        .group-header-v2 {
          display: flex;
          align-items: center;
          padding: 12px 10px;
          background: white;
          border-left: 4px solid;
          gap: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .group-header-v2:hover {
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

        .group-header-v2:hover .btn-add-item-inline {
          opacity: 1;
        }

        .btn-add-item-inline:hover {
          color: #0073ea;
        }

        .group-items {
          background: white;
        }

        .item-row-v2 {
          display: grid;
          border-bottom: 1px solid #f0f0f0;
          min-height: 48px;
          align-items: center;
          padding: 0 10px;
          transition: background 0.1s;
          position: relative;
        }

        .item-row-v2:hover {
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

        .item-row-v2:hover .drag-handle {
          opacity: 1;
        }

        .element-number {
          font-size: 14px;
          font-weight: 500;
          color: #323338;
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

        .modal-content-small, .modal-content-medium {
          background: white;
          border-radius: 8px;
          width: 90%;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .modal-content-small {
          max-width: 500px;
        }

        .modal-content-medium {
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
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

        .input-full, .input-search {
          width: 100%;
          padding: 12px;
          border: 1px solid #e6e9ef;
          border-radius: 4px;
          font-size: 14px;
          color: #323338;
          margin-bottom: 16px;
        }

        .input-full:focus, .input-search:focus {
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

        .status-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .status-item:hover {
          background: #f6f7fb;
        }

        .status-badge-edit {
          flex: 1;
          padding: 8px 12px;
          border-radius: 4px;
          color: white;
          font-size: 13px;
          font-weight: 500;
        }

        .status-edit-input {
          flex: 1;
          padding: 8px 12px;
          border: 2px solid #0073ea;
          border-radius: 4px;
          font-size: 13px;
        }

        .btn-icon-small {
          background: none;
          border: none;
          cursor: pointer;
          color: #676879;
          padding: 4px;
          display: flex;
          align-items: center;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .btn-icon-small:hover {
          background: #e6e9ef;
          color: #323338;
        }

        .btn-add-status {
          width: 100%;
          padding: 12px;
          background: #f6f7fb;
          border: 1px dashed #c4c4c4;
          border-radius: 4px;
          color: #676879;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-add-status:hover {
          background: #e6e9ef;
          border-color: #0073ea;
          color: #0073ea;
        }

        .column-types-section {
          margin-bottom: 24px;
        }

        .column-types-section h4 {
          font-size: 14px;
          color: #676879;
          margin-bottom: 12px;
        }

        .column-types-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .column-type-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #f6f7fb;
          border: 1px solid #e6e9ef;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .column-type-card:hover {
          background: #f0f3ff;
          border-color: #0073ea;
        }

        .column-type-icon {
          font-size: 24px;
        }

        .column-type-label {
          font-size: 14px;
          font-weight: 500;
          color: #323338;
        }
      `}</style>
    </div>
  );
}

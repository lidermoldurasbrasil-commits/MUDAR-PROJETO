import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Filter, X, Upload, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PLATFORMS = ['Todas', 'Shopee', 'Mercado Livre', 'TikTok'];
const RETURN_REASONS = [
  'Todos',
  'Produto errado enviado',
  'Produto danificado',
  'Não atende expectativas',
  'Arrependimento',
  'Defeito de fabricação',
  'Tamanho incorreto',
  'Outros'
];
const TAGS = [
  { name: 'Resolver Urgente', color: '#ef4444' },
  { name: 'Resolvido', color: '#10b981' },
  { name: 'Em Análise', color: '#f59e0b' },
  { name: 'Aguardando Cliente', color: '#3b82f6' }
];

export default function ReturnsManagement() {
  const [activeTab, setActiveTab] = useState('list');
  const [returns, setReturns] = useState([]);
  const [filteredReturns, setFilteredReturns] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('Todas');
  const [filterReason, setFilterReason] = useState('Todos');
  const [filterTag, setFilterTag] = useState('Todas');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    platform: '',
    product: '',
    order_id: '',
    return_date: '',
    return_reason: '',
    freight_cost: 0,
    replacement_cost: 0,
    other_costs: 0,
    photos: [],
    photo_url: '',
    tags: [],
    observations: ''
  });

  useEffect(() => {
    fetchReturns();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [returns, searchTerm, filterPlatform, filterReason, filterTag, startDate, endDate]);

  const fetchReturns = async () => {
    try {
      const res = await axios.get(`${API}/returns`);
      setReturns(res.data);
    } catch (error) {
      toast.error('Erro ao carregar devoluções');
    }
  };

  const applyFilters = () => {
    let filtered = [...returns];

    if (searchTerm) {
      filtered = filtered.filter(ret => 
        ret.product?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ret.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ret.return_reason?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterPlatform !== 'Todas') {
      filtered = filtered.filter(ret => ret.platform === filterPlatform);
    }

    if (filterReason !== 'Todos') {
      filtered = filtered.filter(ret => ret.return_reason === filterReason);
    }

    if (startDate) {
      filtered = filtered.filter(ret => new Date(ret.created_at) >= new Date(startDate));
    }

    if (endDate) {
      filtered = filtered.filter(ret => new Date(ret.created_at) <= new Date(endDate));
    }

    setFilteredReturns(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/returns`, {
        order_id: formData.order_id,
        platform: formData.platform,
        product: formData.product,
        return_reason: formData.return_reason,
        cost: parseFloat(formData.freight_cost) + parseFloat(formData.replacement_cost) + parseFloat(formData.other_costs),
        responsible_department: 'Logística',
        resolution_status: 'Pendente'
      });
      toast.success('Devolução registrada com sucesso!');
      fetchReturns();
      closeModal();
    } catch (error) {
      toast.error('Erro ao registrar devolução');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      platform: '',
      product: '',
      order_id: '',
      return_date: '',
      return_reason: '',
      freight_cost: 0,
      replacement_cost: 0,
      other_costs: 0,
      photos: [],
      photo_url: '',
      tags: [],
      observations: ''
    });
  };

  const calculateTotalCost = () => {
    return (
      parseFloat(formData.freight_cost || 0) +
      parseFloat(formData.replacement_cost || 0) +
      parseFloat(formData.other_costs || 0)
    ).toFixed(2);
  };

  const toggleTag = (tagName) => {
    if (formData.tags.includes(tagName)) {
      setFormData({...formData, tags: formData.tags.filter(t => t !== tagName)});
    } else {
      setFormData({...formData, tags: [...formData.tags, tagName]});
    }
  };

  const addPhotoUrl = () => {
    if (formData.photo_url) {
      setFormData({
        ...formData,
        photos: [...formData.photos, formData.photo_url],
        photo_url: ''
      });
      toast.success('Foto adicionada');
    }
  };

  // Calculate metrics
  const totalReturns = filteredReturns.length;
  const totalCost = filteredReturns.reduce((sum, ret) => sum + (ret.cost || 0), 0);
  const returnsByPlatform = PLATFORMS.slice(1).map(platform => ({
    platform,
    count: returns.filter(r => r.platform === platform).length,
    percentage: returns.length > 0 ? ((returns.filter(r => r.platform === platform).length / returns.length) * 100).toFixed(1) : 0
  }));
  const returnsByReason = {};
  returns.forEach(ret => {
    returnsByReason[ret.return_reason] = (returnsByReason[ret.return_reason] || 0) + 1;
  });

  return (
    <div className="returns-management" data-testid="returns-management">
      {/* Header */}
      <div className="returns-header">
        <div>
          <h1>Devoluções</h1>
          <p>Gerencie suas devoluções, importe dados e acompanhe métricas</p>
        </div>
        <button className="btn-add-return" onClick={() => setShowModal(true)} data-testid="add-return-btn">
          <Plus size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs-section">
        <button 
          className={`tab-btn-returns ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
          data-testid="tab-list"
        >
          ☰ Lista
        </button>
        <button 
          className={`tab-btn-returns ${activeTab === 'import' ? 'active' : ''}`}
          onClick={() => setActiveTab('import')}
          data-testid="tab-import"
        >
          📄 Importar
        </button>
        <button 
          className={`tab-btn-returns ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => { setActiveTab('metrics'); setShowMetrics(true); }}
          data-testid="tab-metrics"
        >
          📊 Métricas
        </button>
      </div>

      {/* List View */}
      {activeTab === 'list' && (
        <>
          <div className="history-section">
            <h2>Histórico de Devoluções</h2>
          </div>

          {/* Filters */}
          <div className="filters-box">
            <div className="filter-header">
              <Filter size={18} />
              <span>Filtros</span>
            </div>

            <div className="filter-grid">
              <div className="filter-item-returns">
                <label>Buscar</label>
                <div className="search-input-returns">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Pedido, produto, motivo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="search-returns"
                  />
                </div>
              </div>

              <div className="filter-item-returns">
                <label>Plataforma</label>
                <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)}>
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="filter-item-returns">
                <label>Motivo</label>
                <select value={filterReason} onChange={(e) => setFilterReason(e.target.value)}>
                  {RETURN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="filter-item-returns">
                <label>Etiqueta</label>
                <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
                  <option value="Todas">Todas</option>
                  {TAGS.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>
              </div>

              <div className="filter-item-returns">
                <label>Data Inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="dd/mm/aaaa"
                />
              </div>

              <div className="filter-item-returns">
                <label>Data Final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="dd/mm/aaaa"
                />
              </div>
            </div>

            <div className="filter-result">
              Mostrando <strong>{filteredReturns.length}</strong> de <strong>{returns.length}</strong> devoluções
            </div>
          </div>

          {/* Table */}
          <div className="returns-table-container">
            <table className="returns-table" data-testid="returns-table">
              <thead>
                <tr>
                  <th>
                    <div className="th-content">
                      <input type="checkbox" />
                      STATUS
                    </div>
                  </th>
                  <th>DATA</th>
                  <th>PLATAFORMA</th>
                  <th>PRODUTO</th>
                  <th>PEDIDO</th>
                  <th>MOTIVO</th>
                  <th>ETIQUETAS</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.map(returnItem => (
                  <tr key={returnItem.id} data-testid={`return-${returnItem.id}`}>
                    <td>
                      <div className="status-cell">
                        <input type="checkbox" />
                        <span className="status-icon">⚠</span>
                      </div>
                    </td>
                    <td>{new Date(returnItem.created_at).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <span className="platform-badge" style={{ 
                        background: returnItem.platform === 'Mercado Livre' ? '#fff159' : 
                                   returnItem.platform === 'Shopee' ? '#ee4d2d' : '#000'
                      }}>
                        {returnItem.platform}
                      </span>
                    </td>
                    <td>
                      <div className="product-cell">
                        <span className="product-name">{returnItem.product}</span>
                        <span className="product-code">#{returnItem.order_id?.substring(0, 6)}</span>
                      </div>
                    </td>
                    <td>{returnItem.order_id}</td>
                    <td>{returnItem.return_reason}</td>
                    <td>
                      <span className="tag-badge urgent">Resolver Urgente</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Import View */}
      {activeTab === 'import' && (
        <div className="import-section">
          <div className="upload-zone-returns">
            <Upload size={48} />
            <h3>Importar Devoluções</h3>
            <p>Arraste e solte um arquivo CSV ou clique para selecionar</p>
            <button className="btn-upload">Selecionar Arquivo</button>
          </div>
        </div>
      )}

      {/* Metrics View */}
      {activeTab === 'metrics' && (
        <div className="metrics-section" data-testid="metrics-section">
          <h2>Métricas de Devoluções</h2>
          
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Total de Devoluções</h3>
              <div className="metric-value">{totalReturns}</div>
              <span className="metric-subtitle">últimos 30 dias</span>
            </div>

            <div className="metric-card">
              <h3>Custo Total</h3>
              <div className="metric-value">R$ {totalCost.toFixed(2)}</div>
              <span className="metric-subtitle">em devoluções</span>
            </div>

            <div className="metric-card">
              <h3>Taxa de Devolução</h3>
              <div className="metric-value">
                {returns.length > 0 ? ((returns.length / 100) * 100).toFixed(1) : 0}%
              </div>
              <span className="metric-subtitle">do total de vendas</span>
            </div>
          </div>

          <div className="charts-grid-returns">
            <div className="chart-card-returns">
              <h3>Devoluções por Plataforma</h3>
              <div className="platform-bars">
                {returnsByPlatform.map(item => (
                  <div key={item.platform} className="platform-bar-item">
                    <span className="platform-label">{item.platform}</span>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <span className="platform-count">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-card-returns">
              <h3>Motivos Principais</h3>
              <div className="reasons-list">
                {Object.entries(returnsByReason).map(([reason, count]) => (
                  <div key={reason} className="reason-item">
                    <span className="reason-name">{reason}</span>
                    <span className="reason-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay-returns" data-testid="return-modal">
          <div className="modal-content-returns">
            <div className="modal-header-returns">
              <div className="modal-title-returns">
                <span className="modal-icon">📦</span>
                <h2>Registrar Devolução</h2>
              </div>
              <button className="btn-close-returns" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-section-returns">
                <div className="form-row-returns">
                  <div className="form-group-returns">
                    <label>Plataforma <span className="required">*</span></label>
                    <select
                      value={formData.platform}
                      onChange={(e) => setFormData({...formData, platform: e.target.value})}
                      required
                      data-testid="select-platform"
                    >
                      <option value="">Selecione...</option>
                      {PLATFORMS.slice(1).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div className="form-group-returns">
                    <label>Produto <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="Buscar por nome ou SKU..."
                      value={formData.product}
                      onChange={(e) => setFormData({...formData, product: e.target.value})}
                      required
                      data-testid="input-product"
                    />
                  </div>
                </div>

                <div className="form-row-returns">
                  <div className="form-group-returns">
                    <label>Número do Pedido <span className="required">*</span></label>
                    <input
                      type="text"
                      value={formData.order_id}
                      onChange={(e) => setFormData({...formData, order_id: e.target.value})}
                      required
                      data-testid="input-order-id"
                    />
                  </div>

                  <div className="form-group-returns">
                    <label>Data da Devolução <span className="required">*</span></label>
                    <input
                      type="date"
                      value={formData.return_date}
                      onChange={(e) => setFormData({...formData, return_date: e.target.value})}
                      required
                      data-testid="input-return-date"
                    />
                  </div>
                </div>

                <div className="form-group-returns full">
                  <label>Motivo da Devolução <span className="required">*</span></label>
                  <select
                    value={formData.return_reason}
                    onChange={(e) => setFormData({...formData, return_reason: e.target.value})}
                    required
                    data-testid="select-reason"
                  >
                    <option value="">Selecione...</option>
                    {RETURN_REASONS.slice(1).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {/* Costs Section */}
              <div className="costs-section">
                <h3>Custos da Devolução</h3>
                <div className="costs-grid">
                  <div className="form-group-returns">
                    <label>Custo de Frete (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.freight_cost}
                      onChange={(e) => setFormData({...formData, freight_cost: e.target.value})}
                      data-testid="input-freight-cost"
                    />
                  </div>
                  <div className="form-group-returns">
                    <label>Custo de Reposição (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.replacement_cost}
                      onChange={(e) => setFormData({...formData, replacement_cost: e.target.value})}
                      data-testid="input-replacement-cost"
                    />
                  </div>
                  <div className="form-group-returns">
                    <label>Outros Custos (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.other_costs}
                      onChange={(e) => setFormData({...formData, other_costs: e.target.value})}
                      data-testid="input-other-costs"
                    />
                  </div>
                </div>
                <div className="total-cost-box">
                  <span>Custo Total:</span>
                  <span className="total-value">R$ {calculateTotalCost()}</span>
                </div>
              </div>

              {/* Photos Section */}
              <div className="photos-section">
                <h3>📷 Fotos da Devolução</h3>
                <button type="button" className="btn-upload-photo">
                  <Upload size={20} />
                  Carregar Foto(s)
                </button>
                <div className="divider-returns">ou</div>
                <div className="url-input-group">
                  <input
                    type="text"
                    placeholder="Cole a URL da foto (ex: https://exemplo.com/foto.jpg)"
                    value={formData.photo_url}
                    onChange={(e) => setFormData({...formData, photo_url: e.target.value})}
                  />
                  <button type="button" className="btn-add-url" onClick={addPhotoUrl}>
                    <Upload size={16} />
                    Adicionar URL
                  </button>
                </div>
                {formData.photos.length > 0 && (
                  <div className="photos-list">
                    {formData.photos.map((photo, idx) => (
                      <div key={idx} className="photo-item">
                        <img src={photo} alt={`Foto ${idx + 1}`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags Section */}
              <div className="tags-section">
                <div className="tags-header">
                  <h3>🏷 Etiquetas</h3>
                  <button type="button" className="btn-manage-tags">⚙ Gerenciar Etiquetas</button>
                </div>
                <div className="tags-list">
                  {TAGS.map(tag => (
                    <button
                      key={tag.name}
                      type="button"
                      className={`tag-button ${formData.tags.includes(tag.name) ? 'active' : ''}`}
                      style={{ 
                        background: formData.tags.includes(tag.name) ? tag.color : 'transparent',
                        border: `2px solid ${tag.color}`,
                        color: formData.tags.includes(tag.name) ? 'white' : tag.color
                      }}
                      onClick={() => toggleTag(tag.name)}
                      data-testid={`tag-${tag.name}`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Observations */}
              <div className="observations-section">
                <h3>Observações</h3>
                <textarea
                  placeholder="Informações adicionais sobre a devolução..."
                  value={formData.observations}
                  onChange={(e) => setFormData({...formData, observations: e.target.value})}
                  rows={4}
                  data-testid="textarea-observations"
                />
              </div>

              {/* Footer */}
              <div className="modal-footer-returns">
                <button type="button" className="btn-cancel-returns" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-submit-returns" data-testid="submit-return">
                  Registrar Devolução
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .returns-management {
          background: #f8f9fa;
          min-height: 100vh;
          padding: 24px;
        }

        .returns-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .returns-header h1 {
          font-size: 32px;
          color: #1a1a1a;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .returns-header p {
          color: #6b7280;
          font-size: 14px;
        }

        .btn-add-return {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #3b82f6;
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          transition: transform 0.2s;
        }

        .btn-add-return:hover {
          transform: scale(1.05);
        }

        .tabs-section {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .tab-btn-returns {
          padding: 12px 24px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: #6b7280;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-btn-returns.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .history-section {
          margin-bottom: 24px;
        }

        .history-section h2 {
          font-size: 24px;
          color: #1a1a1a;
          font-weight: 600;
        }

        .filters-box {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .filter-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .filter-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }

        .filter-item-returns {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-item-returns label {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
        }

        .search-input-returns {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
        }

        .search-input-returns input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
        }

        .filter-item-returns select,
        .filter-item-returns input[type="date"] {
          padding: 10px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          background: white;
        }

        .filter-result {
          padding: 12px;
          background: #f3f4f6;
          border-radius: 8px;
          font-size: 14px;
          color: #4b5563;
        }

        .returns-table-container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .returns-table {
          width: 100%;
          border-collapse: collapse;
        }

        .returns-table thead {
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .returns-table th {
          padding: 14px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .th-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .returns-table td {
          padding: 16px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 14px;
          color: #1a1a1a;
        }

        .returns-table tbody tr:hover {
          background: #f9fafb;
        }

        .status-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-icon {
          font-size: 18px;
        }

        .platform-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .product-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .product-name {
          font-weight: 500;
        }

        .product-code {
          font-size: 12px;
          color: #6b7280;
        }

        .tag-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .tag-badge.urgent {
          background: #fef2f2;
          color: #dc2626;
        }

        .import-section,
        .metrics-section {
          padding: 40px;
        }

        .upload-zone-returns {
          background: white;
          border: 2px dashed #d1d5db;
          border-radius: 16px;
          padding: 60px;
          text-align: center;
          color: #6b7280;
        }

        .upload-zone-returns h3 {
          margin: 16px 0 8px;
          color: #1a1a1a;
        }

        .btn-upload {
          margin-top: 16px;
          padding: 10px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        .metrics-section h2 {
          font-size: 28px;
          color: #1a1a1a;
          margin-bottom: 24px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 32px;
        }

        .metric-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .metric-card h3 {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 12px;
        }

        .metric-value {
          font-size: 36px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .metric-subtitle {
          font-size: 12px;
          color: #9ca3af;
        }

        .charts-grid-returns {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .chart-card-returns {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .chart-card-returns h3 {
          font-size: 16px;
          color: #1a1a1a;
          margin-bottom: 20px;
        }

        .platform-bars {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .platform-bar-item {
          display: grid;
          grid-template-columns: 120px 1fr 40px;
          gap: 12px;
          align-items: center;
        }

        .platform-label {
          font-size: 14px;
          color: #4b5563;
        }

        .bar-container {
          height: 24px;
          background: #f3f4f6;
          border-radius: 4px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          transition: width 0.3s;
        }

        .platform-count {
          font-weight: 600;
          color: #1a1a1a;
        }

        .reasons-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .reason-item {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .reason-name {
          font-size: 14px;
          color: #4b5563;
        }

        .reason-count {
          font-weight: 600;
          color: #1a1a1a;
        }

        .modal-overlay-returns {
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

        .modal-content-returns {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header-returns {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-title-returns {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-icon {
          font-size: 24px;
        }

        .modal-title-returns h2 {
          font-size: 20px;
          color: #1a1a1a;
          font-weight: 600;
        }

        .btn-close-returns {
          background: transparent;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
        }

        .form-section-returns {
          padding: 24px;
        }

        .form-row-returns {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }

        .form-group-returns {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group-returns.full {
          grid-column: span 2;
        }

        .form-group-returns label {
          font-size: 13px;
          color: #4b5563;
          font-weight: 500;
        }

        .required {
          color: #ef4444;
        }

        .form-group-returns input,
        .form-group-returns select {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
        }

        .costs-section,
        .photos-section,
        .tags-section,
        .observations-section {
          padding: 24px;
          border-top: 1px solid #e5e7eb;
        }

        .costs-section h3,
        .photos-section h3,
        .tags-section h3,
        .observations-section h3 {
          font-size: 16px;
          color: #1a1a1a;
          margin-bottom: 16px;
        }

        .costs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }

        .total-cost-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #eff6ff;
          border-radius: 8px;
          margin-top: 16px;
        }

        .total-value {
          font-size: 24px;
          font-weight: 700;
          color: #3b82f6;
        }

        .btn-upload-photo {
          width: 100%;
          padding: 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .divider-returns {
          text-align: center;
          color: #9ca3af;
          margin: 16px 0;
        }

        .url-input-group {
          display: flex;
          gap: 8px;
        }

        .url-input-group input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
        }

        .btn-add-url {
          padding: 10px 20px;
          background: #4b5563;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .photos-list {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-top: 16px;
        }

        .photo-item img {
          width: 100%;
          height: 100px;
          object-fit: cover;
          border-radius: 8px;
        }

        .tags-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .btn-manage-tags {
          background: transparent;
          border: none;
          color: #3b82f6;
          font-size: 13px;
          cursor: pointer;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tag-button {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tag-button:hover {
          opacity: 0.8;
        }

        .observations-section textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          resize: vertical;
        }

        .modal-footer-returns {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 24px;
          border-top: 1px solid #e5e7eb;
        }

        .btn-cancel-returns {
          padding: 10px 24px;
          background: #f3f4f6;
          color: #4b5563;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
        }

        .btn-submit-returns {
          padding: 10px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .filter-grid {
            grid-template-columns: 1fr;
          }
          .form-row-returns,
          .costs-grid {
            grid-template-columns: 1fr;
          }
          .metrics-grid,
          .charts-grid-returns {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

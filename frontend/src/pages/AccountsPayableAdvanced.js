import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Filter, X, Calendar, Upload, Download, Trash2, Edit, FileText } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PAYMENT_FORMS = ['Dinheiro', 'PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Boleto', 'Transferência Bancária'];
const FINANCIAL_ACCOUNTS = ['Caixa Principal', 'Banco Itaú', 'Banco Bradesco', 'Banco Santander', 'Nubank'];
const CATEGORIES = ['Aluguel', 'Salários', 'Fornecedores', 'Impostos', 'Marketing', 'Manutenção', 'Outros'];
const STATUS_OPTIONS = ['Pendente', 'Pago', 'Atrasado', 'Cancelado'];

export default function AccountsPayableAdvanced() {
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('payment'); // payment, occurrence, attachments
  const [editingAccount, setEditingAccount] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    supplier: '',
    value: 0,
    emission_date: '',
    competence_date: '',
    due_date: '',
    payment_form: '',
    financial_account: '',
    category: '',
    document_number: '',
    history: '',
    monthly_interest: 0,
    fine: 0,
    occurrence_type: 'Única',
    attachments: [],
    status: 'Pendente',
    entity: 'Marketplace'
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [accounts, searchTerm, filterStatus, filterCategory]);

  const fetchAccounts = async () => {
    try {
      const res = await axios.get(`${API}/accounts-payable`);
      setAccounts(res.data);
    } catch (error) {
      toast.error('Erro ao carregar contas');
    }
  };

  const applyFilters = () => {
    let filtered = [...accounts];

    if (searchTerm) {
      filtered = filtered.filter(acc => 
        acc.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.cost_center?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus) {
      filtered = filtered.filter(acc => acc.status === filterStatus);
    }

    if (filterCategory) {
      filtered = filtered.filter(acc => acc.cost_center === filterCategory);
    }

    setFilteredAccounts(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        supplier: formData.supplier,
        invoice_number: formData.document_number,
        due_date: formData.due_date,
        value: parseFloat(formData.value),
        cost_center: formData.category,
        status: formData.status,
        entity: formData.entity
      };

      if (editingAccount) {
        await axios.put(`${API}/accounts-payable/${editingAccount.id}`, dataToSend);
        toast.success('Conta atualizada com sucesso!');
      } else {
        await axios.post(`${API}/accounts-payable`, dataToSend);
        toast.success('Conta criada com sucesso!');
      }
      
      fetchAccounts();
      closeModal();
    } catch (error) {
      toast.error('Erro ao salvar conta');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja realmente excluir esta conta?')) {
      try {
        await axios.delete(`${API}/accounts-payable/${id}`);
        toast.success('Conta excluída');
        fetchAccounts();
      } catch (error) {
        toast.error('Erro ao excluir conta');
      }
    }
  };

  const openEditModal = (account) => {
    setEditingAccount(account);
    setFormData({
      supplier: account.supplier,
      value: account.value,
      emission_date: '',
      competence_date: '',
      due_date: account.due_date,
      payment_form: '',
      financial_account: '',
      category: account.cost_center,
      document_number: account.invoice_number,
      history: '',
      monthly_interest: 0,
      fine: 0,
      occurrence_type: 'Única',
      attachments: [],
      status: account.status,
      entity: account.entity
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAccount(null);
    setActiveTab('payment');
    setFormData({
      supplier: '',
      value: 0,
      emission_date: '',
      competence_date: '',
      due_date: '',
      payment_form: '',
      financial_account: '',
      category: '',
      document_number: '',
      history: '',
      monthly_interest: 0,
      fine: 0,
      occurrence_type: 'Única',
      attachments: [],
      status: 'Pendente',
      entity: 'Marketplace'
    });
  };

  const calculateTotalValue = () => {
    const value = parseFloat(formData.value) || 0;
    const interest = (value * (parseFloat(formData.monthly_interest) || 0)) / 100;
    const fine = (value * (parseFloat(formData.fine) || 0)) / 100;
    return value + interest + fine;
  };

  const getTotalInfo = () => {
    const total = filteredAccounts.reduce((sum, acc) => sum + acc.value, 0);
    const count = filteredAccounts.length;
    return { total, count };
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pendente': '#f59e0b',
      'Pago': '#10b981',
      'Atrasado': '#ef4444',
      'Cancelado': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const { total, count } = getTotalInfo();

  return (
    <div className="accounts-payable-advanced" data-testid="accounts-payable-advanced">
      {/* Header */}
      <div className="page-header-advanced">
        <div className="header-title">
          <h1>Contas a pagar</h1>
          <p className="header-subtitle">Todas as contas financeiras</p>
        </div>
        <button className="btn-add" onClick={() => setShowModal(true)} data-testid="add-account-btn">
          <Plus size={20} />
          Incluir conta
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="search-filter-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Pesquise por nome, e-mail, CPF/CNPJ ou histórico"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="search-input"
          />
        </div>
        <button 
          className="btn-filter" 
          onClick={() => setShowFilters(!showFilters)}
          data-testid="filter-toggle"
        >
          <Filter size={20} />
          Filtrar
        </button>
        <button className="btn-secondary" data-testid="download-btn">
          <Download size={20} />
          Baixar selecionados
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-row">
            <div className="filter-item">
              <label>Opção</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">Em aberto</option>
                <option value="Pendente">Pendente</option>
                <option value="Pago">Pago</option>
                <option value="Atrasado">Atrasado</option>
              </select>
            </div>
            <div className="filter-item">
              <label>Categoria</label>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="">Todas categorias</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <button className="btn-clear-filters" onClick={() => { setFilterStatus(''); setFilterCategory(''); }}>
              <X size={16} />
              Limpar filtros
            </button>
          </div>
        </div>
      )}

      {/* Info Bar */}
      <div className="info-bar">
        <div className="info-item">
          <span className="info-label">Quantidade de contas a pagar</span>
          <span className="info-value">{count}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Valor total</span>
          <span className="info-value total-value">R$ {total.toFixed(2)}</span>
        </div>
      </div>

      {/* Table */}
      <div className="table-container-advanced">
        <table className="table-advanced" data-testid="accounts-table">
          <thead>
            <tr>
              <th>
                <input type="checkbox" />
              </th>
              <th>Fornecedor</th>
              <th>Histórico</th>
              <th>Forma de pagamento</th>
              <th>Vencimento</th>
              <th>Valor</th>
              <th>Situação</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map(account => (
              <tr key={account.id} data-testid={`account-row-${account.id}`}>
                <td>
                  <input type="checkbox" />
                </td>
                <td className="supplier-cell">{account.supplier}</td>
                <td className="history-cell">{account.cost_center}</td>
                <td>Conta a receber/pagar</td>
                <td>{account.due_date}</td>
                <td className="value-cell">R$ {account.value.toFixed(2)}</td>
                <td>
                  <span 
                    className="status-pill" 
                    style={{ 
                      background: `${getStatusColor(account.status)}20`,
                      color: getStatusColor(account.status)
                    }}
                  >
                    {account.status}
                  </span>
                </td>
                <td>
                  <div className="action-menu">
                    <button onClick={() => openEditModal(account)} data-testid={`edit-${account.id}`}>
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(account.id)} data-testid={`delete-${account.id}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay-advanced" data-testid="account-modal">
          <div className="modal-content-advanced">
            <div className="modal-header-advanced">
              <h2>Conta a pagar</h2>
              <button className="btn-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Top Form Fields */}
              <div className="form-top-section">
                <div className="form-row-advanced">
                  <div className="form-group-advanced half">
                    <label>
                      Fornecedor <span className="required">*</span>
                      <button type="button" className="btn-info">i</button>
                    </label>
                    <div className="input-with-actions">
                      <input
                        type="text"
                        value={formData.supplier}
                        onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                        placeholder="Nome do fornecedor"
                        required
                        data-testid="input-supplier"
                      />
                      <button type="button" className="btn-search">
                        <Search size={16} />
                      </button>
                      <button type="button" className="btn-add-inline">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="form-group-advanced quarter">
                    <label>
                      Valor (R$) <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({...formData, value: e.target.value})}
                      required
                      data-testid="input-value"
                    />
                  </div>
                </div>

                <div className="form-row-advanced">
                  <div className="form-group-advanced">
                    <label>
                      Emissão <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.emission_date}
                      onChange={(e) => setFormData({...formData, emission_date: e.target.value})}
                      data-testid="input-emission"
                    />
                  </div>
                  <div className="form-group-advanced">
                    <label>
                      Competência <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.competence_date}
                      onChange={(e) => setFormData({...formData, competence_date: e.target.value})}
                      data-testid="input-competence"
                    />
                  </div>
                  <div className="form-group-advanced">
                    <label>
                      Vencimento <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                      required
                      data-testid="input-due-date"
                    />
                  </div>
                </div>

                <div className="form-group-advanced full">
                  <label>Histórico</label>
                  <textarea
                    value={formData.history}
                    onChange={(e) => setFormData({...formData, history: e.target.value})}
                    rows={3}
                    data-testid="input-history"
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="tabs-container">
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`}
                  onClick={() => setActiveTab('payment')}
                  data-testid="tab-payment"
                >
                  <FileText size={18} />
                  Pagamento
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'occurrence' ? 'active' : ''}`}
                  onClick={() => setActiveTab('occurrence')}
                  data-testid="tab-occurrence"
                >
                  <Calendar size={18} />
                  Ocorrência
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'attachments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('attachments')}
                  data-testid="tab-attachments"
                >
                  <Upload size={18} />
                  Anexos
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === 'payment' && (
                  <div className="payment-tab" data-testid="payment-content">
                    <div className="form-row-advanced">
                      <div className="form-group-advanced">
                        <label>Forma de Pagamento</label>
                        <select
                          value={formData.payment_form}
                          onChange={(e) => setFormData({...formData, payment_form: e.target.value})}
                          data-testid="select-payment-form"
                        >
                          <option value="">Selecione</option>
                          {PAYMENT_FORMS.map(form => <option key={form} value={form}>{form}</option>)}
                        </select>
                      </div>
                      <div className="form-group-advanced">
                        <label>Conta Financeira</label>
                        <select
                          value={formData.financial_account}
                          onChange={(e) => setFormData({...formData, financial_account: e.target.value})}
                          data-testid="select-financial-account"
                        >
                          <option value="">Selecione</option>
                          {FINANCIAL_ACCOUNTS.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="form-row-advanced">
                      <div className="form-group-advanced">
                        <label>Categoria</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          data-testid="select-category"
                        >
                          <option value="">Sem categoria</option>
                          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div className="form-group-advanced">
                        <label>N° documento</label>
                        <input
                          type="text"
                          value={formData.document_number}
                          onChange={(e) => setFormData({...formData, document_number: e.target.value})}
                          data-testid="input-document"
                        />
                      </div>
                    </div>

                    <div className="form-row-advanced">
                      <div className="form-group-advanced">
                        <label>
                          Juros mensal (%)
                          <button type="button" className="btn-info">i</button>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.monthly_interest}
                          onChange={(e) => setFormData({...formData, monthly_interest: e.target.value})}
                          data-testid="input-interest"
                        />
                      </div>
                      <div className="form-group-advanced">
                        <label>
                          Multa (%)
                          <button type="button" className="btn-info">i</button>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.fine}
                          onChange={(e) => setFormData({...formData, fine: e.target.value})}
                          data-testid="input-fine"
                        />
                      </div>
                    </div>

                    <div className="summary-box">
                      <div className="summary-row">
                        <span>Vencimento original</span>
                        <span>-</span>
                      </div>
                      <div className="summary-row">
                        <span>Valor original</span>
                        <span>R$ {parseFloat(formData.value || 0).toFixed(2)}</span>
                      </div>
                      <div className="summary-row">
                        <span>Juros</span>
                        <span>R$ {((parseFloat(formData.value || 0) * parseFloat(formData.monthly_interest || 0)) / 100).toFixed(2)}</span>
                      </div>
                      <div className="summary-row">
                        <span>Multa</span>
                        <span>R$ {((parseFloat(formData.value || 0) * parseFloat(formData.fine || 0)) / 100).toFixed(2)}</span>
                      </div>
                      <div className="summary-row total">
                        <span>Valor total</span>
                        <span>R$ {calculateTotalValue().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'occurrence' && (
                  <div className="occurrence-tab" data-testid="occurrence-content">
                    <div className="form-group-advanced">
                      <label>
                        Ocorrência
                        <button type="button" className="btn-info">i</button>
                      </label>
                    <div className="form-group-advanced">
                      <label>
                        Ocorrência
                        <button type="button" className="btn-info">i</button>
                      </label>
                      <select
                        value={formData.occurrence_type}
                        onChange={(e) => setFormData({...formData, occurrence_type: e.target.value})}
                        data-testid="select-occurrence"
                      >
                        <option value="Única">Única</option>
                        <option value="Semanal">Semanal</option>
                        <option value="Quinzenal">Quinzenal</option>
                        <option value="Mensal">Mensal</option>
                        <option value="Anual">Anual</option>
                      </select>
                    </div>
                    </div>

                    <div className="occurrence-summary">
                      <div className="occurrence-row">
                        <span>Vencimento original</span>
                        <span>Valor original</span>
                        <span>Juros</span>
                        <span>Multa</span>
                        <span>Valor total</span>
                      </div>
                      <div className="occurrence-row values">
                        <span>-</span>
                        <span>R$ {parseFloat(formData.value || 0).toFixed(2)}</span>
                        <span>R$ 0,00</span>
                        <span>R$ 0,00</span>
                        <span>R$ {parseFloat(formData.value || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'attachments' && (
                  <div className="attachments-tab" data-testid="attachments-content">
                    <div className="upload-zone">
                      <Upload size={48} />
                      <p>Solte seus arquivos aqui</p>
                      <p className="upload-hint">ou clique para adicionar</p>
                      <input type="file" multiple style={{ display: 'none' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="modal-footer-advanced">
                <button type="button" className="btn-cancel" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="button" className="btn-save-low" data-testid="save-low-btn">
                  Salvar e dar baixa
                </button>
                <button type="submit" className="btn-save" data-testid="save-btn">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .accounts-payable-advanced {
          background: #1a1d23;
          min-height: 100vh;
          padding: 24px;
          color: #e5e7eb;
        }

        .page-header-advanced {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .header-title h1 {
          font-size: 28px;
          color: #f9fafb;
          margin-bottom: 4px;
        }

        .header-subtitle {
          color: #10b981;
          font-size: 14px;
        }

        .btn-add {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #10b981;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-add:hover {
          background: #059669;
        }

        .search-filter-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .search-box {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          background: #2a2e35;
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid #374151;
        }

        .search-box input {
          flex: 1;
          background: transparent;
          border: none;
          color: #e5e7eb;
          outline: none;
        }

        .search-box input::placeholder {
          color: #6b7280;
        }

        .btn-filter, .btn-secondary {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #2a2e35;
          color: #e5e7eb;
          padding: 12px 20px;
          border: 1px solid #374151;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-filter:hover, .btn-secondary:hover {
          background: #374151;
        }

        .filters-panel {
          background: #2a2e35;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 16px;
          border: 1px solid #374151;
        }

        .filter-row {
          display: flex;
          gap: 16px;
          align-items: flex-end;
        }

        .filter-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-item label {
          font-size: 13px;
          color: #9ca3af;
        }

        .filter-item select {
          background: #1a1d23;
          border: 1px solid #374151;
          color: #e5e7eb;
          padding: 10px;
          border-radius: 6px;
        }

        .btn-clear-filters {
          display: flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          color: #10b981;
          border: 1px solid #10b981;
          padding: 10px 16px;
          border-radius: 6px;
          cursor: pointer;
        }

        .info-bar {
          display: flex;
          gap: 24px;
          background: #2a2e35;
          padding: 16px 20px;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .info-label {
          font-size: 13px;
          color: #9ca3af;
        }

        .info-value {
          font-size: 16px;
          font-weight: 600;
          color: #f9fafb;
        }

        .info-value.total-value {
          color: #10b981;
          font-size: 18px;
        }

        .table-container-advanced {
          background: #2a2e35;
          border-radius: 8px;
          overflow: hidden;
        }

        .table-advanced {
          width: 100%;
          border-collapse: collapse;
        }

        .table-advanced thead {
          background: #1a1d23;
        }

        .table-advanced th {
          padding: 14px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .table-advanced td {
          padding: 14px 16px;
          border-bottom: 1px solid #374151;
          font-size: 14px;
          color: #e5e7eb;
        }

        .table-advanced tbody tr:hover {
          background: #1f2937;
        }

        .supplier-cell {
          font-weight: 600;
        }

        .value-cell {
          font-weight: 600;
          color: #f9fafb;
        }

        .status-pill {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          display: inline-block;
        }

        .action-menu {
          display: flex;
          gap: 8px;
        }

        .action-menu button {
          padding: 6px;
          background: transparent;
          border: 1px solid #374151;
          border-radius: 4px;
          color: #9ca3af;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-menu button:hover {
          border-color: #10b981;
          color: #10b981;
        }

        .modal-overlay-advanced {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }

        .modal-content-advanced {
          background: #1a1d23;
          border-radius: 12px;
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          overflow-y: auto;
          color: #e5e7eb;
        }

        .modal-header-advanced {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #374151;
        }

        .modal-header-advanced h2 {
          font-size: 20px;
          color: #f9fafb;
        }

        .btn-close {
          background: transparent;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
        }

        .form-top-section {
          padding: 24px;
          border-bottom: 1px solid #374151;
        }

        .form-row-advanced {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }

        .form-row-advanced .half {
          grid-column: span 2;
        }

        .form-row-advanced .quarter {
          grid-column: span 1;
        }

        .form-group-advanced {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group-advanced.full {
          grid-column: span 3;
        }

        .form-group-advanced label {
          font-size: 13px;
          color: #9ca3af;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .required {
          color: #ef4444;
        }

        .btn-info {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          font-size: 10px;
          cursor: pointer;
        }

        .form-group-advanced input,
        .form-group-advanced select,
        .form-group-advanced textarea {
          background: #2a2e35;
          border: 1px solid #374151;
          color: #e5e7eb;
          padding: 10px 12px;
          border-radius: 6px;
          font-size: 14px;
        }

        .form-group-advanced input:focus,
        .form-group-advanced select:focus,
        .form-group-advanced textarea:focus {
          outline: none;
          border-color: #10b981;
        }

        .input-with-actions {
          display: flex;
          gap: 8px;
        }

        .input-with-actions input {
          flex: 1;
        }

        .btn-search, .btn-add-inline {
          background: #2a2e35;
          border: 1px solid #10b981;
          color: #10b981;
          padding: 10px;
          border-radius: 6px;
          cursor: pointer;
        }

        .tabs-container {
          display: flex;
          border-bottom: 1px solid #374151;
        }

        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          background: transparent;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .tab-btn.active {
          color: #10b981;
          border-bottom-color: #10b981;
        }

        .tab-content {
          padding: 24px;
          min-height: 300px;
        }

        .summary-box {
          background: #2a2e35;
          padding: 20px;
          border-radius: 8px;
          margin-top: 20px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #374151;
        }

        .summary-row.total {
          border-bottom: none;
          font-weight: 700;
          color: #f9fafb;
          font-size: 16px;
          padding-top: 16px;
        }

        .occurrence-summary {
          background: #2a2e35;
          padding: 20px;
          border-radius: 8px;
          margin-top: 16px;
        }

        .occurrence-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          padding: 12px 0;
        }

        .occurrence-row.values {
          font-weight: 600;
          color: #f9fafb;
        }

        .upload-zone {
          border: 2px dashed #374151;
          border-radius: 8px;
          padding: 60px;
          text-align: center;
          color: #9ca3af;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .upload-zone:hover {
          border-color: #10b981;
        }

        .upload-hint {
          font-size: 13px;
          margin-top: 8px;
        }

        .modal-footer-advanced {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 24px;
          border-top: 1px solid #374151;
        }

        .btn-cancel {
          padding: 10px 24px;
          background: transparent;
          border: 1px solid #374151;
          color: #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
        }

        .btn-save-low {
          padding: 10px 24px;
          background: transparent;
          border: 1px solid #10b981;
          color: #10b981;
          border-radius: 6px;
          cursor: pointer;
        }

        .btn-save {
          padding: 10px 24px;
          background: #10b981;
          border: none;
          color: white;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .form-row-advanced {
            grid-template-columns: 1fr;
          }
          .form-row-advanced .half,
          .form-row-advanced .quarter {
            grid-column: span 1;
          }
        }
      `}</style>
    </div>
  );
}

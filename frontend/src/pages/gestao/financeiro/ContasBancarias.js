import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Edit2, Trash2, Check, X, Filter, FilterX, ChevronDown, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/gestao/financeiro`;

const TIPOS_CONTA = [
  'Corrente',
  'Poupança',
  'Caixa',
  'Mercado Pago',
  'Shopee',
  'PagSeguro',
  'Stone',
  'Picpay'
];

const BANCOS_DISPONIVEIS = [
  'Itaú',
  'Bradesco',
  'Banco do Brasil',
  'Caixa Econômica',
  'Santander',
  'Inter',
  'Nubank',
  'C6 Bank',
  'Original',
  'Mercado Pago',
  'PagSeguro',
  'Stone',
  'Shopee'
];

export default function ContasBancarias() {
  const { lojaAtual } = useOutletContext();
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [formasPagamento, setFormasPagamento] = useState({});
  const [editingFormaId, setEditingFormaId] = useState(null);
  const [isAddingForma, setIsAddingForma] = useState(false);
  const [filtros, setFiltros] = useState({
    banco: '',
    status: ''
  });

  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'Corrente',
    banco: '',
    agencia: '',
    conta: '',
    saldo_inicial: 0,
    cnpj_titular: '',
    status: 'Ativo',
    loja_id: lojaAtual
  });

  const [formaData, setFormaData] = useState({
    forma_pagamento: 'Cartão Crédito',
    tipo: 'C',
    tef: false,
    pagamento_sefaz: false,
    bandeira: '',
    numero_parcelas: 1,
    espaco_parcelas_dias: 30,
    taxa_banco_percentual: 0,
    ativa: true
  });

  useEffect(() => {
    fetchContas();
  }, [lojaAtual, filtros]);

  const fetchContas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = `${API}/contas-bancarias?loja=${lojaAtual}`;
      
      if (filtros.banco) url += `&banco=${filtros.banco}`;
      if (filtros.status) url += `&status=${filtros.status}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContas(response.data);
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      toast.error('Erro ao carregar contas bancárias');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setFormData({
      nome: '',
      tipo: 'Corrente',
      banco: '',
      agencia: '',
      conta: '',
      saldo_inicial: 0,
      cnpj_titular: '',
      status: 'Ativo',
      loja_id: lojaAtual
    });
  };

  const handleEdit = (conta) => {
    setEditingId(conta.id);
    setFormData({ ...conta });
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      nome: '',
      tipo: 'Corrente',
      banco: '',
      agencia: '',
      conta: '',
      saldo_inicial: 0,
      cnpj_titular: '',
      status: 'Ativo',
      loja_id: lojaAtual
    });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');

      if (isAdding) {
        await axios.post(`${API}/contas-bancarias`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Conta criada com sucesso!');
      } else if (editingId) {
        await axios.put(`${API}/contas-bancarias/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Conta atualizada com sucesso!');
      }

      handleCancel();
      fetchContas();
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      toast.error('Erro ao salvar conta bancária');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta conta?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/contas-bancarias/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Conta excluída com sucesso!');
      fetchContas();
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      toast.error('Erro ao excluir conta');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const limparFiltros = () => {
    setFiltros({ banco: '', status: '' });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="contas-bancarias-container">
      <div className="page-header">
        <div>
          <h1>Cadastrar Contas Bancárias</h1>
          <p>Gerencie suas contas bancárias</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="filtros-section">
        <div className="filtro-group">
          <label>Banco</label>
          <select
            value={filtros.banco}
            onChange={(e) => setFiltros(prev => ({ ...prev, banco: e.target.value }))}
          >
            <option value="">Todos os bancos</option>
            {BANCOS_DISPONIVEIS.map(banco => (
              <option key={banco} value={banco}>{banco}</option>
            ))}
          </select>
        </div>

        <div className="filtro-group">
          <label>Status</label>
          <select
            value={filtros.status}
            onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">Todos</option>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>
        </div>

        <button className="btn-filtrar" onClick={fetchContas}>
          <Filter size={18} />
          Filtrar
        </button>

        <button className="btn-limpar" onClick={limparFiltros}>
          <FilterX size={18} />
          Limpar Filtros
        </button>
      </div>

      {/* Tabela */}
      <div className="table-container">
        <table className="contas-table">
          <thead>
            <tr>
              <th style={{width: '60px'}}>Ações</th>
              <th>Nome da Conta</th>
              <th>Tipo</th>
              <th>Banco</th>
              <th>Agência</th>
              <th>Conta</th>
              <th>Saldo Inicial</th>
              <th>Saldo Atual</th>
              <th>CNPJ/Titular</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {/* Linha de adição */}
            {isAdding && (
              <tr className="editing-row">
                <td>
                  <div className="actions">
                    <button className="btn-icon success" onClick={handleSave} title="Salvar">
                      <Check size={16} />
                    </button>
                    <button className="btn-icon danger" onClick={handleCancel} title="Cancelar">
                      <X size={16} />
                    </button>
                  </div>
                </td>
                <td>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    placeholder="Ex: Itaú Fábrica"
                    autoFocus
                  />
                </td>
                <td>
                  <select
                    value={formData.tipo}
                    onChange={(e) => handleInputChange('tipo', e.target.value)}
                  >
                    {TIPOS_CONTA.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={formData.banco}
                    onChange={(e) => handleInputChange('banco', e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {BANCOS_DISPONIVEIS.map(banco => (
                      <option key={banco} value={banco}>{banco}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    value={formData.agencia}
                    onChange={(e) => handleInputChange('agencia', e.target.value)}
                    placeholder="Ex: 1234"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={formData.conta}
                    onChange={(e) => handleInputChange('conta', e.target.value)}
                    placeholder="Ex: 12345-6"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.saldo_inicial}
                    onChange={(e) => handleInputChange('saldo_inicial', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td>
                  <span className="saldo-readonly">{formatCurrency(formData.saldo_inicial)}</span>
                </td>
                <td>
                  <input
                    type="text"
                    value={formData.cnpj_titular}
                    onChange={(e) => handleInputChange('cnpj_titular', e.target.value)}
                    placeholder="CNPJ ou Nome"
                  />
                </td>
                <td>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </td>
              </tr>
            )}

            {/* Linhas existentes */}
            {contas.map(conta => (
              <tr key={conta.id} className={editingId === conta.id ? 'editing-row' : ''}>
                <td>
                  {editingId === conta.id ? (
                    <div className="actions">
                      <button className="btn-icon success" onClick={handleSave} title="Salvar">
                        <Check size={16} />
                      </button>
                      <button className="btn-icon danger" onClick={handleCancel} title="Cancelar">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="actions">
                      <button className="btn-icon" onClick={() => handleEdit(conta)} title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button className="btn-icon danger" onClick={() => handleDelete(conta.id)} title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </td>
                <td>
                  {editingId === conta.id ? (
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => handleInputChange('nome', e.target.value)}
                    />
                  ) : (
                    conta.nome
                  )}
                </td>
                <td>
                  {editingId === conta.id ? (
                    <select
                      value={formData.tipo}
                      onChange={(e) => handleInputChange('tipo', e.target.value)}
                    >
                      {TIPOS_CONTA.map(tipo => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  ) : (
                    conta.tipo
                  )}
                </td>
                <td>
                  {editingId === conta.id ? (
                    <select
                      value={formData.banco}
                      onChange={(e) => handleInputChange('banco', e.target.value)}
                    >
                      {BANCOS_DISPONIVEIS.map(banco => (
                        <option key={banco} value={banco}>{banco}</option>
                      ))}
                    </select>
                  ) : (
                    conta.banco
                  )}
                </td>
                <td>
                  {editingId === conta.id ? (
                    <input
                      type="text"
                      value={formData.agencia}
                      onChange={(e) => handleInputChange('agencia', e.target.value)}
                    />
                  ) : (
                    conta.agencia
                  )}
                </td>
                <td>
                  {editingId === conta.id ? (
                    <input
                      type="text"
                      value={formData.conta}
                      onChange={(e) => handleInputChange('conta', e.target.value)}
                    />
                  ) : (
                    conta.conta
                  )}
                </td>
                <td>{formatCurrency(conta.saldo_inicial)}</td>
                <td className="saldo-atual">
                  <strong>{formatCurrency(conta.saldo_atual)}</strong>
                </td>
                <td>
                  {editingId === conta.id ? (
                    <input
                      type="text"
                      value={formData.cnpj_titular}
                      onChange={(e) => handleInputChange('cnpj_titular', e.target.value)}
                    />
                  ) : (
                    conta.cnpj_titular
                  )}
                </td>
                <td>
                  {editingId === conta.id ? (
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  ) : (
                    <span className={`status-badge ${conta.status.toLowerCase()}`}>
                      {conta.status}
                    </span>
                  )}
                </td>
              </tr>
            ))}

            {contas.length === 0 && !isAdding && (
              <tr>
                <td colSpan="10" className="empty-state">
                  Nenhuma conta bancária cadastrada
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Botão Adicionar */}
        {!isAdding && (
          <button className="btn-add-table" onClick={handleAddNew}>
            <Plus size={20} />
            Adicionar Conta Bancária
          </button>
        )}
      </div>

      <style jsx>{`
        .contas-bancarias-container {
          padding: 20px;
        }

        .page-header {
          margin-bottom: 25px;
        }

        .page-header h1 {
          font-size: 28px;
          color: #2d3748;
          margin: 0 0 8px 0;
        }

        .page-header p {
          color: #718096;
          margin: 0;
        }

        .filtros-section {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          gap: 15px;
          align-items: flex-end;
          box-shadow: 0 2px 4px rgba(0,0,0,0.08);
        }

        .filtro-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filtro-group label {
          font-size: 14px;
          font-weight: 500;
          color: #4a5568;
        }

        .filtro-group select {
          padding: 8px 12px;
          border: 2px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
          min-width: 180px;
          outline: none;
        }

        .filtro-group select:focus {
          border-color: #5dceaa;
        }

        .btn-filtrar, .btn-limpar {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .btn-filtrar {
          background: #5dceaa;
          color: white;
        }

        .btn-filtrar:hover {
          background: #4db89a;
        }

        .btn-limpar {
          background: #f7fafc;
          color: #718096;
          border: 2px solid #e2e8f0;
        }

        .btn-limpar:hover {
          background: #edf2f7;
        }

        .table-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.08);
        }

        .contas-table {
          width: 100%;
          border-collapse: collapse;
        }

        .contas-table thead {
          background: linear-gradient(135deg, #5dceaa 0%, #4db89a 100%);
        }

        .contas-table thead th {
          padding: 14px 12px;
          text-align: left;
          color: white;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .contas-table tbody tr {
          border-bottom: 1px solid #e2e8f0;
          transition: background 0.2s;
        }

        .contas-table tbody tr:hover {
          background: #f7fafc;
        }

        .contas-table tbody tr.editing-row {
          background: #f0fdf9;
        }

        .contas-table tbody td {
          padding: 12px;
          font-size: 14px;
          color: #2d3748;
        }

        .contas-table input,
        .contas-table select {
          width: 100%;
          padding: 6px 10px;
          border: 2px solid #e2e8f0;
          border-radius: 4px;
          font-size: 14px;
          outline: none;
        }

        .contas-table input:focus,
        .contas-table select:focus {
          border-color: #5dceaa;
        }

        .actions {
          display: flex;
          gap: 6px;
        }

        .btn-icon {
          padding: 6px;
          border: none;
          background: #f7fafc;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          color: #4a5568;
          transition: all 0.2s;
        }

        .btn-icon:hover {
          background: #edf2f7;
          transform: scale(1.1);
        }

        .btn-icon.success {
          background: #10b981;
          color: white;
        }

        .btn-icon.success:hover {
          background: #059669;
        }

        .btn-icon.danger {
          color: #ef4444;
        }

        .btn-icon.danger:hover {
          background: #fee2e2;
        }

        .saldo-atual {
          color: #10b981;
          font-weight: 600;
        }

        .saldo-readonly {
          color: #718096;
          font-size: 13px;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.ativo {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.inativo {
          background: #fee2e2;
          color: #991b1b;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #718096;
        }

        .btn-add-table {
          width: 100%;
          padding: 12px;
          background: #f0fdf9;
          border: 2px dashed #5dceaa;
          color: #5dceaa;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .btn-add-table:hover {
          background: #5dceaa;
          color: white;
          border-style: solid;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #718096;
        }
      `}</style>
    </div>
  );
}

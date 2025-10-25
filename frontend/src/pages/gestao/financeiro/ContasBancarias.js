import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Edit2, Trash2, Check, X, Filter, FilterX, ChevronDown, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/gestao/financeiro`;

const TIPOS_CONTA = ['Corrente', 'Poupança', 'Caixa', 'Mercado Pago', 'Shopee', 'PagSeguro', 'Stone', 'Picpay'];
const BANCOS_DISPONIVEIS = ['Itaú', 'Bradesco', 'Banco do Brasil', 'Caixa Econômica', 'Santander', 'Inter', 'Nubank', 'C6 Bank', 'Original', 'Mercado Pago', 'PagSeguro', 'Stone', 'Shopee'];
const FORMAS_PAGAMENTO = ['Cartão Crédito', 'Cartão Débito', 'PIX', 'PIX - Dinâmico', 'Boleto', 'Transferência', 'Dinheiro', 'Outros'];
const BANDEIRAS = ['Visa', 'Mastercard', 'Elo', 'American Express', 'Hipercard', 'Diners'];

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
  const [filtros, setFiltros] = useState({ banco: '', status: '' });

  const [formData, setFormData] = useState({
    nome: '', tipo: 'Corrente', banco: '', agencia: '', conta: '', saldo_inicial: 0, cnpj_titular: '', status: 'Ativo', loja_id: lojaAtual
  });

  const [formaData, setFormaData] = useState({
    forma_pagamento: 'Cartão Crédito', tipo: 'C', tef: false, pagamento_sefaz: false, bandeira: '', numero_parcelas: 1, espaco_parcelas_dias: 30, taxa_banco_percentual: 0, ativa: true
  });

  useEffect(() => { fetchContas(); }, [lojaAtual, filtros]);

  const fetchContas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = `${API}/contas-bancarias?loja=${lojaAtual}`;
      if (filtros.banco) url += `&banco=${filtros.banco}`;
      if (filtros.status) url += `&status=${filtros.status}`;
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
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
    setFormData({ nome: '', tipo: 'Corrente', banco: '', agencia: '', conta: '', saldo_inicial: 0, cnpj_titular: '', status: 'Ativo', loja_id: lojaAtual });
  };

  const handleEdit = (conta) => {
    setEditingId(conta.id);
    setFormData({ ...conta });
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ nome: '', tipo: 'Corrente', banco: '', agencia: '', conta: '', saldo_inicial: 0, cnpj_titular: '', status: 'Ativo', loja_id: lojaAtual });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (isAdding) {
        await axios.post(`${API}/contas-bancarias`, formData, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Conta criada com sucesso!');
      } else if (editingId) {
        await axios.put(`${API}/contas-bancarias/${editingId}`, formData, { headers: { Authorization: `Bearer ${token}` } });
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
      await axios.delete(`${API}/contas-bancarias/${id}`, { headers: { Authorization: `Bearer ${token}` } });
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

  const toggleExpand = async (contaId) => {
    if (expandedId === contaId) {
      setExpandedId(null);
    } else {
      setExpandedId(contaId);
      if (!formasPagamento[contaId]) {
        await fetchFormasPagamento(contaId);
      }
    }
  };

  const fetchFormasPagamento = async (contaId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/contas-bancarias/${contaId}/formas-pagamento`, { headers: { Authorization: `Bearer ${token}` } });
      setFormasPagamento(prev => ({ ...prev, [contaId]: response.data }));
    } catch (error) {
      console.error('Erro ao buscar formas de pagamento:', error);
    }
  };

  const handleAddForma = (contaId) => {
    setIsAddingForma(contaId);
    setFormaData({ forma_pagamento: 'Cartão Crédito', tipo: 'C', tef: false, pagamento_sefaz: false, bandeira: '', numero_parcelas: 1, espaco_parcelas_dias: 30, taxa_banco_percentual: 0, ativa: true });
  };

  const handleEditForma = (forma) => {
    setEditingFormaId(forma.id);
    setFormaData({ ...forma });
  };

  const handleCancelForma = () => {
    setIsAddingForma(false);
    setEditingFormaId(null);
  };

  const handleSaveForma = async (contaId) => {
    try {
      const token = localStorage.getItem('token');
      if (isAddingForma) {
        await axios.post(`${API}/contas-bancarias/${contaId}/formas-pagamento`, formaData, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Forma de pagamento criada!');
      } else if (editingFormaId) {
        await axios.put(`${API}/formas-pagamento/${editingFormaId}`, formaData, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Forma de pagamento atualizada!');
      }
      handleCancelForma();
      await fetchFormasPagamento(contaId);
    } catch (error) {
      console.error('Erro ao salvar forma:', error);
      toast.error('Erro ao salvar forma de pagamento');
    }
  };

  const handleDeleteForma = async (formaId, contaId) => {
    if (!window.confirm('Excluir esta forma de pagamento?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/formas-pagamento/${formaId}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Forma excluída!');
      await fetchFormasPagamento(contaId);
    } catch (error) {
      console.error('Erro ao excluir forma:', error);
      toast.error('Erro ao excluir forma');
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div className="contas-bancarias-container">
      <div className="page-header">
        <div>
          <h1>Cadastrar Contas Bancárias</h1>
          <p>Gerencie suas contas e formas de pagamento</p>
        </div>
      </div>

      <div className="filtros-section">
        <div className="filtro-group">
          <label>Banco</label>
          <select value={filtros.banco} onChange={(e) => setFiltros(prev => ({ ...prev, banco: e.target.value }))}>
            <option value="">Todos os bancos</option>
            {BANCOS_DISPONIVEIS.map(banco => <option key={banco} value={banco}>{banco}</option>)}
          </select>
        </div>
        <div className="filtro-group">
          <label>Status</label>
          <select value={filtros.status} onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}>
            <option value="">Todos</option>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>
        </div>
        <button className="btn-filtrar" onClick={fetchContas}><Filter size={18} />Filtrar</button>
        <button className="btn-limpar" onClick={() => setFiltros({ banco: '', status: '' })}><FilterX size={18} />Limpar</button>
      </div>

      <div className="table-container">
        <table className="contas-table">
          <thead>
            <tr>
              <th style={{width: '40px'}}></th>
              <th style={{width: '80px'}}>Ações</th>
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

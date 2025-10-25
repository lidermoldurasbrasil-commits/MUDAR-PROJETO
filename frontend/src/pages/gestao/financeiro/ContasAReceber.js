import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { DollarSign, Filter, FilterX, Check, X, Calendar, Building2, CreditCard, User, FileText } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/gestao/financeiro`;

const STATUS_OPTIONS = ['Pendente', 'Recebido', 'Atrasado', 'Cancelado'];
const BANCOS_DISPONIVEIS = ['Itaú', 'Bradesco', 'Banco do Brasil', 'Caixa Econômica', 'Santander', 'Inter', 'Nubank', 'C6 Bank', 'Original', 'Mercado Pago', 'PagSeguro', 'Stone', 'Shopee'];

export default function ContasAReceber() {
  const { lojaAtual } = useOutletContext();
  const [contas, setContas] = useState([]);
  const [totais, setTotais] = useState({});
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedConta, setSelectedConta] = useState(null);
  const [showBaixaModal, setShowBaixaModal] = useState(false);
  const [contasBancarias, setContasBancarias] = useState([]);
  
  const [filtros, setFiltros] = useState({
    status: '',
    cliente: '',
    data_venc_inicio: '',
    data_venc_fim: '',
    forma_pagamento: '',
    conta_bancaria: '',
    documento: ''
  });

  const [baixaData, setBaixaData] = useState({
    data_baixa: new Date().toISOString().split('T')[0],
    valor_recebido: 0,
    observacoes: ''
  });

  const fetchContas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Construir URL com filtros
      let url = `${API}/contas-receber?loja=${lojaAtual}`;
      if (filtros.status) url += `&status=${filtros.status}`;
      if (filtros.cliente) url += `&cliente=${filtros.cliente}`;
      if (filtros.data_venc_inicio) url += `&data_venc_inicio=${filtros.data_venc_inicio}`;
      if (filtros.data_venc_fim) url += `&data_venc_fim=${filtros.data_venc_fim}`;
      if (filtros.forma_pagamento) url += `&forma_pagamento=${filtros.forma_pagamento}`;
      if (filtros.conta_bancaria) url += `&conta_bancaria=${filtros.conta_bancaria}`;
      if (filtros.documento) url += `&documento=${filtros.documento}`;
      
      const response = await axios.get(url, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      setContas(response.data.contas || []);
      setTotais(response.data.totais || {});
    } catch (error) {
      console.error('Erro ao buscar contas a receber:', error);
      toast.error('Erro ao carregar contas a receber');
    } finally {
      setLoading(false);
    }
  };

  const fetchContasBancarias = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/contas-bancarias?loja=${lojaAtual}&status=Ativo`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setContasBancarias(response.data || []);
    } catch (error) {
      console.error('Erro ao buscar contas bancárias:', error);
    }
  };

  useEffect(() => {
    fetchContas();
    fetchContasBancarias();
  }, [lojaAtual]);

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const aplicarFiltros = () => {
    fetchContas();
  };

  const limparFiltros = () => {
    setFiltros({
      status: '',
      cliente: '',
      data_venc_inicio: '',
      data_venc_fim: '',
      forma_pagamento: '',
      conta_bancaria: '',
      documento: ''
    });
    setTimeout(() => fetchContas(), 100);
  };

  const handleBaixar = (conta) => {
    setSelectedConta(conta);
    setBaixaData({
      data_baixa: new Date().toISOString().split('T')[0],
      valor_recebido: conta.valor_liquido || conta.valor || 0,
      observacoes: ''
    });
    setShowBaixaModal(true);
  };

  const confirmarBaixa = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/contas-receber/${selectedConta.id}/baixa`,
        baixaData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Baixa realizada com sucesso!');
      setShowBaixaModal(false);
      fetchContas();
    } catch (error) {
      console.error('Erro ao realizar baixa:', error);
      toast.error(error.response?.data?.detail || 'Erro ao realizar baixa');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Recebido': return 'bg-green-100 text-green-800';
      case 'Pendente': return 'bg-yellow-100 text-yellow-800';
      case 'Atrasado': return 'bg-red-100 text-red-800';
      case 'Cancelado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contas a Receber</h1>
          <p className="text-sm text-gray-600 mt-1">Gestão de recebimentos e receitas</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showFilters ? <FilterX className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
          {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Valor Bruto Total</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totais.valor_bruto)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Valor Líquido Total</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totais.valor_liquido)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600">Contas Pendentes</p>
          <p className="text-2xl font-bold text-gray-900">{totais.total_pendentes || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <p className="text-sm text-gray-600">Total de Registros</p>
          <p className="text-2xl font-bold text-gray-900">{totais.total_registros || 0}</p>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filtros.status}
                onChange={(e) => handleFiltroChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <input
                type="text"
                value={filtros.cliente}
                onChange={(e) => handleFiltroChange('cliente', e.target.value)}
                placeholder="Nome do cliente"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Documento</label>
              <input
                type="text"
                value={filtros.documento}
                onChange={(e) => handleFiltroChange('documento', e.target.value)}
                placeholder="Pedido_123-1/2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
              <input
                type="text"
                value={filtros.forma_pagamento}
                onChange={(e) => handleFiltroChange('forma_pagamento', e.target.value)}
                placeholder="Ex: Crédito"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conta Bancária</label>
              <select
                value={filtros.conta_bancaria}
                onChange={(e) => handleFiltroChange('conta_bancaria', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas</option>
                {contasBancarias.map(conta => (
                  <option key={conta.id} value={conta.id}>{conta.nome} - {conta.banco}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Vencimento (De)</label>
              <input
                type="date"
                value={filtros.data_venc_inicio}
                onChange={(e) => handleFiltroChange('data_venc_inicio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Vencimento (Até)</label>
              <input
                type="date"
                value={filtros.data_venc_fim}
                onChange={(e) => handleFiltroChange('data_venc_fim', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={aplicarFiltros}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Aplicar Filtros
            </button>
            <button
              onClick={limparFiltros}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
            >
              <FilterX className="w-4 h-4" />
              Limpar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Tabela de Contas a Receber */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : contas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <DollarSign className="w-16 h-16 mb-4 text-gray-400" />
            <p className="text-lg font-medium">Nenhuma conta a receber encontrada</p>
            <p className="text-sm">As contas serão criadas automaticamente quando pedidos forem finalizados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parcela</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forma Pagamento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Bruto</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Taxa %</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Líquido</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contas.map((conta) => (
                  <tr key={conta.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        {conta.documento || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {conta.cliente_origem || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {conta.numero_parcela}/{conta.total_parcelas}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        {conta.forma_pagamento_nome || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(conta.data_vencimento)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                      {formatCurrency(conta.valor_bruto)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">
                      {conta.taxa_percentual?.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                      {formatCurrency(conta.valor_liquido)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(conta.status)}`}>
                        {conta.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {conta.status === 'Pendente' ? (
                        <button
                          onClick={() => handleBaixar(conta)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                          Baixar
                        </button>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {conta.status === 'Recebido' && formatDate(conta.data_recebimento)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Baixa */}
      {showBaixaModal && selectedConta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirmar Recebimento</h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Documento: <span className="font-medium text-gray-900">{selectedConta.documento}</span></p>
                <p className="text-sm text-gray-600">Cliente: <span className="font-medium text-gray-900">{selectedConta.cliente_origem}</span></p>
                <p className="text-sm text-gray-600">Parcela: <span className="font-medium text-gray-900">{selectedConta.numero_parcela}/{selectedConta.total_parcelas}</span></p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data do Recebimento</label>
                <input
                  type="date"
                  value={baixaData.data_baixa}
                  onChange={(e) => setBaixaData(prev => ({ ...prev, data_baixa: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Recebido</label>
                <input
                  type="number"
                  step="0.01"
                  value={baixaData.valor_recebido}
                  onChange={(e) => setBaixaData(prev => ({ ...prev, valor_recebido: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Valor líquido esperado: {formatCurrency(selectedConta.valor_liquido)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={baixaData.observacoes}
                  onChange={(e) => setBaixaData(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows={3}
                  placeholder="Observações sobre o recebimento..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={confirmarBaixa}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Confirmar Recebimento
              </button>
              <button
                onClick={() => setShowBaixaModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

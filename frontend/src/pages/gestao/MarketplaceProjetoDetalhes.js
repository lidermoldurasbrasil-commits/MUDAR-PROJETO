import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Upload, Filter, Plus, MoreVertical, Clock, User, AlertCircle, CheckCircle2, Package as PackageIcon, X, ChevronUp, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/gestao/marketplaces`;

const STATUS_OPTIONS = [
  { value: 'Aguardando Produção', label: 'Aguardando Produção', color: '#94A3B8' },
  { value: 'Em Produção', label: 'Em Produção', color: '#F59E0B' },
  { value: 'Pronto', label: 'Pronto', color: '#8B5CF6' },
  { value: 'Embalagem', label: 'Embalagem', color: '#FBBF24' },
  { value: 'Enviado', label: 'Enviado', color: '#3B82F6' },
  { value: 'Entregue', label: 'Entregue', color: '#10B981' }
];

const STATUS_IMPRESSAO_OPTIONS = [
  { value: 'Aguardando Impressão', label: 'Aguardando Impressão', color: '#94A3B8' },
  { value: 'Imprimindo', label: 'Imprimindo', color: '#F59E0B' },
  { value: 'Impresso', label: 'Impresso', color: '#10B981' }
];

const PRIORIDADE_OPTIONS = ['Baixa', 'Normal', 'Alta', 'Urgente'];

export default function MarketplaceProjetoDetalhes() {
  const { projetoId } = useParams();
  const navigate = useNavigate();
  
  // States
  const [statusOptions, setStatusOptions] = useState([]);
  const [statusImpressaoOptions, setStatusImpressaoOptions] = useState([]);
  
  // Tentar pegar context do Outlet (quando usado em /gestao/marketplaces)
  // Se não existir, usar valores padrão (quando usado em /marketplace/production)
  let outletContext;
  try {
    outletContext = useOutletContext();
  } catch (e) {
    outletContext = { lojaAtual: 'fabrica', user: null };
  }
  
  const { lojaAtual = 'fabrica', user = null } = outletContext || {};
  
  // Verificar se usuário é admin (director ou manager)
  const isAdmin = user?.role === 'director' || user?.role === 'manager';
  
  const [projeto, setProjeto] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ 
    status: '', 
    atrasado: null, 
    sku: '', 
    prazoEnvio: '',
    dataInicio: '',
    dataFim: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [editingPedido, setEditingPedido] = useState(null);
  const [viewMode, setViewMode] = useState(isAdmin ? 'monday' : 'producao'); // 'kanban', 'list', 'monday' ou 'producao'
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFormato, setUploadFormato] = useState('shopee'); // 'shopee' ou 'mercadolivre'
  const [uploadProgress, setUploadProgress] = useState(false);
  const [selectedPedidos, setSelectedPedidos] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [ordenacaoData, setOrdenacaoData] = useState('asc'); // 'asc' = próxima primeiro, 'desc' = distante primeiro
  const [agruparPor, setAgruparPor] = useState(''); // '', 'sku', 'status'
  const [filtroTipoEnvio, setFiltroTipoEnvio] = useState('todos'); // 'todos', 'flex', 'correios_pontos', 'coleta'
  const [batchStatusValue, setBatchStatusValue] = useState('');
  const [batchImpressaoValue, setBatchImpressaoValue] = useState('');
  const [novaLinhaInline, setNovaLinhaInline] = useState({
    numero_pedido: '',
    produto_nome: '',
    quantidade: 1,
    sku: '',
    nome_variacao: '',
    preco_acordado: 0,
    opcao_envio: '',
    data_prevista_envio: '',
    cliente_nome: '',
    cliente_contato: '',
    status: 'Aguardando Produção',
    prioridade: 'Normal'
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [novoPedido, setNovoPedido] = useState({
    numero_pedido: '',
    sku: '',
    cliente_nome: '',
    cliente_contato: '',
    produto_nome: '',
    quantidade: 1,
    valor_unitario: 0,
    valor_total: 0,
    status: 'Aguardando Produção',
    prioridade: 'Normal',
    prazo_entrega: '',
    responsavel: '',
    observacoes: ''
  });

  useEffect(() => {
    fetchDados();
    fetchStatusCustomizados();
  }, [projetoId, filtros]);

  const fetchStatusCustomizados = async () => {
    try {
      const token = localStorage.getItem('token');
      const [geralRes, impressaoRes] = await Promise.all([
        axios.get(`${API}/status?tipo=geral`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/status?tipo=impressao`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      // Converter para formato esperado
      const geralFormatado = geralRes.data.map(s => ({
        value: s.label,
        label: s.label,
        color: s.cor
      }));
      
      const impressaoFormatado = impressaoRes.data.map(s => ({
        value: s.label,
        label: s.label,
        color: s.cor
      }));
      
      setStatusOptions(geralFormatado);
      setStatusImpressaoOptions(impressaoFormatado);
    } catch (error) {
      console.error('Erro ao buscar status customizados:', error);
    }
  };

  const fetchDados = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Buscar projeto
      const projetosRes = await axios.get(`${API}/projetos`, { headers });
      const projetoEncontrado = projetosRes.data.find(p => p.id === projetoId);
      setProjeto(projetoEncontrado);

      // Buscar pedidos
      let url = `${API}/pedidos?projeto_id=${projetoId}`;
      if (filtros.status) url += `&status=${filtros.status}`;
      if (filtros.atrasado !== null) url += `&atrasado=${filtros.atrasado}`;
      
      const pedidosRes = await axios.get(url, { headers });
      setPedidos(pedidosRes.data || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados do projeto');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (pedidoId, novoStatus) => {
    try {
      const token = localStorage.getItem('token');
      const pedido = pedidos.find(p => p.id === pedidoId);
      
      await axios.put(
        `${API}/pedidos/${pedidoId}`,
        { ...pedido, status: novoStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Status atualizado!');
      fetchDados();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleUploadPlanilha = () => {
    setShowUploadModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      const allowedTypes = ['.xlsx', '.xls', '.csv'];
      const fileExt = '.' + file.name.split('.').pop().toLowerCase();
      
      if (!allowedTypes.includes(fileExt)) {
        toast.error('Formato de arquivo inválido. Use Excel (.xlsx, .xls) ou CSV (.csv)');
        return;
      }
      
      setUploadFile(file);
    }
  };

  const handleConfirmarUpload = async () => {
    if (!uploadFile) {
      toast.error('Selecione um arquivo primeiro');
      return;
    }
    
    try {
      setUploadProgress(true);
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('file', uploadFile);
      
      const response = await axios.post(
        `${API}/pedidos/upload-planilha?projeto_id=${projetoId}&formato=${uploadFormato}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Mensagem de sucesso com info sobre duplicados
      const data = response.data;
      toast.success(data.message);
      
      if (data.total_duplicados > 0) {
        toast.info(`${data.total_duplicados} pedidos duplicados foram ignorados`, {
          duration: 5000
        });
      }
      
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadFormato('shopee'); // Resetar para padrão
      
      // Limpar pedidos antes de recarregar para evitar conflitos de keys
      setPedidos([]);
      
      // Aguardar um pouco antes de recarregar dados
      setTimeout(() => {
        fetchDados();
      }, 100);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error(error.response?.data?.detail || 'Erro ao processar planilha');
    } finally {
      setUploadProgress(false);
    }
  };

  const handleAddPedido = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Calcular valor total
      const valorTotal = novoPedido.quantidade * novoPedido.valor_unitario;
      
      // Converter data para ISO
      const prazoEntrega = novoPedido.prazo_entrega ? 
        new Date(novoPedido.prazo_entrega).toISOString() : 
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const pedidoData = {
        ...novoPedido,
        projeto_id: projetoId,
        plataforma: projeto.plataforma,
        valor_total: valorTotal,
        prazo_entrega: prazoEntrega,
        loja_id: lojaAtual
      };
      
      await axios.post(
        `${API}/pedidos`,
        pedidoData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Pedido criado com sucesso!');
      setShowAddModal(false);
      setNovoPedido({
        numero_pedido: '',
        sku: '',
        cliente_nome: '',
        cliente_contato: '',
        produto_nome: '',
        quantidade: 1,
        valor_unitario: 0,
        valor_total: 0,
        status: 'Aguardando Produção',
        prioridade: 'Normal',
        prazo_entrega: '',
        responsavel: '',
        observacoes: ''
      });
      fetchDados();
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast.error('Erro ao criar pedido');
    }
  };

  const handleUpdatePedido = async (pedidoId, campo, valor) => {
    try {
      const token = localStorage.getItem('token');
      const pedido = pedidos.find(p => p.id === pedidoId);
      
      if (!pedido) return;
      
      const pedidoAtualizado = {
        ...pedido,
        [campo]: valor,
        updated_at: new Date().toISOString()
      };
      
      await axios.put(
        `${API}/pedidos/${pedidoId}`,
        pedidoAtualizado,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Atualizar local
      setPedidos(pedidos.map(p => p.id === pedidoId ? pedidoAtualizado : p));
      
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      toast.error('Erro ao atualizar pedido');
    }
  };

  const handleAddInline = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Validar campos obrigatórios
      if (!novaLinhaInline.numero_pedido) {
        toast.error('Número do pedido é obrigatório');
        return;
      }
      
      // Converter data para ISO se fornecida
      const dataPrevistaEnvio = novaLinhaInline.data_prevista_envio ? 
        new Date(novaLinhaInline.data_prevista_envio).toISOString() : 
        null;
      
      const prazoEntrega = novaLinhaInline.data_prevista_envio ? 
        new Date(novaLinhaInline.data_prevista_envio).toISOString() : 
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const pedidoData = {
        numero_pedido: novaLinhaInline.numero_pedido,
        sku: novaLinhaInline.sku,
        nome_variacao: novaLinhaInline.nome_variacao,
        produto_nome: novaLinhaInline.produto_nome || novaLinhaInline.numero_pedido,
        cliente_nome: novaLinhaInline.cliente_nome,
        cliente_contato: novaLinhaInline.cliente_contato,
        quantidade: novaLinhaInline.quantidade,
        preco_acordado: novaLinhaInline.preco_acordado || 0,
        valor_unitario: novaLinhaInline.preco_acordado || 0,
        valor_total: (novaLinhaInline.preco_acordado || 0) * novaLinhaInline.quantidade,
        opcao_envio: novaLinhaInline.opcao_envio,
        data_prevista_envio: dataPrevistaEnvio,
        status: novaLinhaInline.status,
        prioridade: novaLinhaInline.prioridade,
        prazo_entrega: prazoEntrega,
        projeto_id: projetoId,
        plataforma: projeto.plataforma,
        loja_id: lojaAtual
      };
      
      await axios.post(
        `${API}/pedidos`,
        pedidoData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Pedido adicionado!');
      setShowInlineAdd(false);
      setNovaLinhaInline({
        numero_pedido: '',
        produto_nome: '',
        quantidade: 1,
        sku: '',
        nome_variacao: '',
        preco_acordado: 0,
        opcao_envio: '',
        data_prevista_envio: '',
        cliente_nome: '',
        cliente_contato: '',
        status: 'Aguardando Produção',
        prioridade: 'Normal'
      });
      fetchDados();
    } catch (error) {
      console.error('Erro ao adicionar pedido:', error);
      toast.error('Erro ao adicionar pedido');
    }
  };

  // Funções de Checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPedidos([]);
    } else {
      setSelectedPedidos(pedidos.map(p => p.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectPedido = (pedidoId) => {
    if (selectedPedidos.includes(pedidoId)) {
      setSelectedPedidos(selectedPedidos.filter(id => id !== pedidoId));
      setSelectAll(false);
    } else {
      const newSelected = [...selectedPedidos, pedidoId];
      setSelectedPedidos(newSelected);
      setSelectAll(newSelected.length === pedidos.length);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedPedidos.length === 0) {
      toast.error('Selecione pelo menos um pedido para deletar');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir ${selectedPedidos.length} pedido(s)?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/pedidos/delete-many`,
        selectedPedidos,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`${selectedPedidos.length} pedido(s) excluído(s) com sucesso!`);
      setSelectedPedidos([]);
      setSelectAll(false);
      fetchDados();
    } catch (error) {
      console.error('Erro ao deletar pedidos:', error);
      toast.error('Erro ao deletar pedidos');
    }
  };

  // Atualizar status em lote
  const handleUpdateStatusBatch = async (campo, valor) => {
    if (selectedPedidos.length === 0) {
      toast.error('Selecione pelo menos um pedido');
      return;
    }

    if (!valor) {
      toast.error('Selecione um valor para atualizar');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      console.log(`Atualizando ${selectedPedidos.length} pedidos - ${campo}: ${valor}`);
      
      // Atualizar cada pedido selecionado
      await Promise.all(
        selectedPedidos.map(async (pedidoId) => {
          // Buscar o pedido completo primeiro
          const response = await axios.get(`${API}/pedidos/${pedidoId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const pedido = response.data;
          
          // Atualizar o campo específico
          pedido[campo] = valor;
          
          // Enviar atualização completa
          return axios.put(
            `${API}/pedidos/${pedidoId}`,
            pedido,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        })
      );

      toast.success(`${selectedPedidos.length} pedido(s) atualizado(s) com sucesso!`);
      
      // Resetar estados
      setSelectedPedidos([]);
      setSelectAll(false);
      setBatchStatusValue('');
      setBatchImpressaoValue('');
      
      fetchDados();
    } catch (error) {
      console.error('Erro ao atualizar pedidos:', error);
      
      // Tratar erro de forma segura
      let errorMessage = 'Erro ao atualizar pedidos';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          if (typeof error.response.data.detail === 'string') {
            errorMessage = error.response.data.detail;
          } else if (Array.isArray(error.response.data.detail)) {
            errorMessage = error.response.data.detail.map(e => e.msg || JSON.stringify(e)).join(', ');
          } else {
            errorMessage = JSON.stringify(error.response.data.detail);
          }
        }
      }
      
      toast.error(errorMessage);
    }
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const getPrioridadeColor = (prioridade) => {
    const colors = {
      'Baixa': 'bg-gray-100 text-gray-800',
      'Normal': 'bg-blue-100 text-blue-800',
      'Alta': 'bg-orange-100 text-orange-800',
      'Urgente': 'bg-red-100 text-red-800'
    };
    return colors[prioridade] || 'bg-gray-100 text-gray-800';
  };

  // Função de filtragem de pedidos
  const pedidosFiltrados = pedidos.filter(pedido => {
    // Filtro de Status
    if (filtros.status && pedido.status !== filtros.status) {
      return false;
    }
    
    // Filtro de Atrasado
    if (filtros.atrasado !== null) {
      const isAtrasado = pedido.atrasado === true;
      if (filtros.atrasado !== isAtrasado) {
        return false;
      }
    }
    
    // Filtro de Tipo de Envio
    if (filtroTipoEnvio !== 'todos') {
      const tipoEnvio = pedido.tipo_envio || '';
      if (filtroTipoEnvio === 'flex') {
        if (!tipoEnvio.toLowerCase().includes('flex')) {
          return false;
        }
      } else if (filtroTipoEnvio === 'correios_pontos') {
        // Inclui tanto Correios quanto Agência
        const temCorreios = tipoEnvio.toLowerCase().includes('correios');
        const temAgencia = tipoEnvio.toLowerCase().includes('agência') || tipoEnvio.toLowerCase().includes('agencia');
        if (!temCorreios && !temAgencia) {
          return false;
        }
      } else if (filtroTipoEnvio === 'coleta') {
        if (!tipoEnvio.toLowerCase().includes('coleta')) {
          return false;
        }
      }
    }
    
    // Filtro de SKU
    if (filtros.sku && pedido.sku) {
      if (!pedido.sku.toLowerCase().includes(filtros.sku.toLowerCase())) {
        return false;
      }
    }
    
    // Filtro de Prazo de Envio
    if (filtros.prazoEnvio && pedido.data_prevista_envio) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);
      
      const fimSemana = new Date(hoje);
      fimSemana.setDate(fimSemana.getDate() + 7);
      
      const dataPrevista = new Date(pedido.data_prevista_envio);
      dataPrevista.setHours(0, 0, 0, 0);
      
      if (filtros.prazoEnvio === 'hoje') {
        if (dataPrevista.getTime() !== hoje.getTime()) {
          return false;
        }
      } else if (filtros.prazoEnvio === 'amanha') {
        if (dataPrevista.getTime() !== amanha.getTime()) {
          return false;
        }
      } else if (filtros.prazoEnvio === 'semana') {
        if (dataPrevista < hoje || dataPrevista > fimSemana) {
          return false;
        }
      } else if (filtros.prazoEnvio === 'personalizado') {
        // Filtro de data personalizada
        if (filtros.dataInicio) {
          const dataInicio = new Date(filtros.dataInicio);
          dataInicio.setHours(0, 0, 0, 0);
          if (dataPrevista < dataInicio) {
            return false;
          }
        }
        if (filtros.dataFim) {
          const dataFim = new Date(filtros.dataFim);
          dataFim.setHours(23, 59, 59, 999);
          if (dataPrevista > dataFim) {
            return false;
          }
        }
      }
    }
    
    return true;
  }).sort((a, b) => {
    // Ordenação por data prevista de envio
    const dataA = a.data_prevista_envio ? new Date(a.data_prevista_envio) : null;
    const dataB = b.data_prevista_envio ? new Date(b.data_prevista_envio) : null;
    
    // Pedidos sem data vão para o final
    if (!dataA && !dataB) return 0;
    if (!dataA) return 1;
    if (!dataB) return -1;
    
    // Ordenação ascendente (mais próxima primeiro) ou descendente (mais distante primeiro)
    if (ordenacaoData === 'asc') {
      return dataA - dataB;
    } else {
      return dataB - dataA;
    }
  });

  // Função de agrupamento
  const pedidosAgrupados = () => {
    if (!agruparPor) {
      return { 'Todos': pedidosFiltrados };
    }
    
    if (agruparPor === 'sku') {
      const grupos = {};
      pedidosFiltrados.forEach(pedido => {
        const chave = pedido.sku || 'Sem SKU';
        if (!grupos[chave]) {
          grupos[chave] = [];
        }
        grupos[chave].push(pedido);
      });
      return grupos;
    }
    
    if (agruparPor === 'status') {
      const grupos = {};
      pedidosFiltrados.forEach(pedido => {
        const chave = pedido.status || 'Sem Status';
        if (!grupos[chave]) {
          grupos[chave] = [];
        }
        grupos[chave].push(pedido);
      });
      return grupos;
    }
    
    return { 'Todos': pedidosFiltrados };
  };

  // Agrupar pedidos por status para o Kanban
  const pedidosPorStatus = STATUS_OPTIONS.reduce((acc, status) => {
    acc[status.value] = pedidosFiltrados.filter(p => p.status === status.value);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!projeto) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-xl text-gray-600 mb-4">Projeto não encontrado</p>
        <button onClick={() => navigate('/marketplace/production')} className="px-4 py-2 bg-blue-600 text-white rounded">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/marketplace/production')}
              className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-400" />
            </button>
            <div className="flex items-center gap-3">
              <span className="text-5xl">{projeto.icone}</span>
              <div>
                <h1 className="text-3xl font-bold text-white">{projeto.nome}</h1>
                <p className="text-sm text-gray-400">{projeto.descricao}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Adicionar Pedido
            </button>
            <button
              onClick={handleUploadPlanilha}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Upload className="w-5 h-5" />
              Upload Planilha
            </button>
            {selectedPedidos.length > 0 && (
              <>
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <X className="w-5 h-5" />
                  Deletar {selectedPedidos.length}
                </button>
                
                {/* Dropdown para Status Geral */}
                <div className="relative">
                  <select
                    value={batchStatusValue}
                    onChange={(e) => {
                      const valor = e.target.value;
                      if (valor) {
                        setBatchStatusValue(valor);
                        handleUpdateStatusBatch('status', valor);
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    <option value="">Mudar Status ({selectedPedidos.length})</option>
                    {statusOptions.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                
                {/* Dropdown para Status Impressão */}
                <div className="relative">
                  <select
                    value={batchImpressaoValue}
                    onChange={(e) => {
                      const valor = e.target.value;
                      if (valor) {
                        setBatchImpressaoValue(valor);
                        handleUpdateStatusBatch('status_impressao', valor);
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer"
                  >
                    <option value="">Mudar Impressão ({selectedPedidos.length})</option>
                    {statusImpressaoOptions.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              <Filter className="w-5 h-5" />
              Filtros
            </button>
          </div>
        </div>

        {/* Indicadores Rápidos */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400">Em Produção</p>
            <p className="text-2xl font-bold text-orange-400">{projeto.pedidos_em_producao}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400">Enviados</p>
            <p className="text-2xl font-bold text-blue-400">{projeto.pedidos_enviados}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400">Entregues</p>
            <p className="text-2xl font-bold text-green-400">{projeto.pedidos_entregues}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400">Atrasados</p>
            <p className="text-2xl font-bold text-red-400">{projeto.pedidos_atrasados}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={filtros.status}
                onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg"
              >
                <option value="">Todos</option>
                {statusOptions.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Situação</label>
              <select
                value={filtros.atrasado === null ? '' : filtros.atrasado}
                onChange={(e) => setFiltros({ ...filtros, atrasado: e.target.value === '' ? null : e.target.value === 'true' })}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg"
              >
                <option value="">Todos</option>
                <option value="false">No Prazo</option>
                <option value="true">Atrasados</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">SKU</label>
              <input
                type="text"
                value={filtros.sku}
                onChange={(e) => setFiltros({ ...filtros, sku: e.target.value })}
                placeholder="Buscar por SKU..."
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">🔽 Ordenar por Data</label>
              <select
                value={ordenacaoData}
                onChange={(e) => setOrdenacaoData(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg"
              >
                <option value="asc">⬆️ Mais Próxima Primeiro</option>
                <option value="desc">⬇️ Mais Distante Primeiro</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">📊 Agrupar por</label>
              <select
                value={agruparPor}
                onChange={(e) => setAgruparPor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg"
              >
                <option value="">Sem Agrupamento</option>
                <option value="sku">🏷️ Agrupar por SKU</option>
                <option value="status">🔵 Agrupar por Status</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Prazo de Envio</label>
              <select
                value={filtros.prazoEnvio}
                onChange={(e) => {
                  setFiltros({ ...filtros, prazoEnvio: e.target.value });
                  if (e.target.value !== 'personalizado') {
                    setFiltros(prev => ({ ...prev, dataInicio: '', dataFim: '' }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg"
              >
                <option value="">Todos</option>
                <option value="hoje">📦 Enviar Hoje</option>
                <option value="amanha">📅 Enviar Amanhã</option>
                <option value="semana">📆 Enviar Esta Semana</option>
                <option value="personalizado">🗓️ Data Personalizada</option>
              </select>
            </div>
            
            {/* Campos de Data Personalizada */}
            {filtros.prazoEnvio === 'personalizado' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Data Início</label>
                  <input
                    type="date"
                    value={filtros.dataInicio}
                    onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Data Fim</label>
                  <input
                    type="date"
                    value={filtros.dataFim}
                    onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
            
            <div className={`flex items-end ${filtros.prazoEnvio !== 'personalizado' ? 'md:col-span-2' : ''}`}>
              <button
                onClick={() => {
                  setFiltros({ status: '', atrasado: null, sku: '', prazoEnvio: '', dataInicio: '', dataFim: '' });
                  setOrdenacaoData('asc');
                  setAgruparPor('');
                }}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle View Mode */}
      <div className="flex justify-end mb-4">
        <div className="bg-gray-800 rounded-lg shadow-lg p-1 inline-flex border border-gray-700">
          {isAdmin && (
            <button
              onClick={() => setViewMode('monday')}
              className={`px-4 py-2 rounded-lg ${viewMode === 'monday' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
            >
              Monday
            </button>
          )}
          <button
            onClick={() => setViewMode('producao')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'producao' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
          >
            Produção
          </button>
          {/* Aba Financeiro apenas para Shopee */}
          {projeto?.plataforma === 'shopee' && (
            <button
              onClick={() => setViewMode('financeiro')}
              className={`px-4 py-2 rounded-lg ${viewMode === 'financeiro' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
            >
              Financeiro
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 rounded-lg ${viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
            >
              Kanban
            </button>
          )}
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
          >
            Lista
          </button>
        </div>
      </div>

      {/* Monday View */}
      {viewMode === 'monday' && (
        <div className="space-y-6">
          {Object.entries(pedidosAgrupados()).map(([grupo, pedidosDoGrupo]) => (
            <div key={`grupo-${grupo}`} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
              {agruparPor && (
                <div className="bg-gray-900 px-6 py-3 border-b border-gray-700">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    {agruparPor === 'sku' && '🏷️'}
                    {agruparPor === 'status' && '🔵'}
                    {grupo} 
                    <span className="text-sm text-gray-400">({pedidosDoGrupo.length} pedidos)</span>
                  </h3>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-900 border-b border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase w-8">
                        <input 
                          type="checkbox" 
                          className="rounded cursor-pointer" 
                          checked={selectAll}
                          onChange={handleSelectAll}
                        />
                      </th>
                      
                      {/* Colunas específicas para MERCADO LIVRE */}
                      {projeto?.plataforma === 'mercadolivre' ? (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[150px]">N.º de Venda</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Data da Venda</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Estado</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[180px]">Descrição do Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[80px]">Unidades</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">SKU</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Variação</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[150px]">Forma de Entrega</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[150px]">Comprador</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Receita Produtos</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Tarifa Venda</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Tarifa Envio</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Cancelamentos</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[100px]">Total</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[200px]">Endereço</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Cidade</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[100px]">Estado</th>
                        </>
                      ) : (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[150px]">ID do Pedido</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[150px]">Nome do Produto</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">SKU</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Nome Variação</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[80px]">Quantidade</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[100px]">Preço Acordado</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[100px]">Taxa Comissão</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[100px]">Taxa Serviço</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[100px]">Valor Líquido</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Opção de Envio</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">
                            <button 
                              onClick={() => setOrdenacaoData(ordenacaoData === 'asc' ? 'desc' : 'asc')}
                              className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                            >
                              Data Prevista Envio
                              {ordenacaoData === 'asc' ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[150px]">Cliente</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Telefone</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {pedidosDoGrupo.map((pedido) => (
                  <tr key={`pedido-${pedido.id}`} className="hover:bg-gray-700/30 group">
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        className="rounded cursor-pointer" 
                        checked={selectedPedidos.includes(pedido.id)}
                        onChange={() => handleSelectPedido(pedido.id)}
                      />
                    </td>
                    
                    {/* RENDERIZAÇÃO CONDICIONAL POR PLATAFORMA */}
                    {projeto?.plataforma === 'mercadolivre' ? (
                      {/* ===== MERCADO LIVRE - 17 CAMPOS ===== */}
                      <>
                        {/* 1. N.º de Venda */}
                        <td className="px-4 py-3">
                          <span className="text-white font-medium">{pedido.numero_pedido || '-'}</span>
                        </td>
                        
                        {/* 2. Data da Venda */}
                        <td className="px-4 py-3">
                          <span className="text-gray-300 text-sm">{pedido.data_venda || '-'}</span>
                        </td>
                        
                        {/* 3. Estado */}
                        <td className="px-4 py-3">
                          <select
                            value={pedido.status}
                            onChange={(e) => {
                              handleStatusChange(pedido.id, e.target.value);
                              handleUpdatePedido(pedido.id, 'status', e.target.value);
                            }}
                            className="px-3 py-1.5 text-sm rounded font-medium border-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            style={{
                              backgroundColor: STATUS_OPTIONS.find(s => s.value === pedido.status)?.color || '#94A3B8',
                              color: 'white'
                            }}
                          >
                            {statusOptions.map(s => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </td>
                        
                        {/* 4. Descrição do Status */}
                        <td className="px-4 py-3">
                          <span className="text-gray-300 text-xs">{pedido.descricao_status || '-'}</span>
                        </td>
                        
                        {/* 5. Unidades */}
                        <td className="px-4 py-3">
                          <span className="text-white font-medium text-center block">{pedido.quantidade || 1}</span>
                        </td>
                        
                        {/* 6. SKU */}
                        <td className="px-4 py-3">
                          <span className="text-gray-300 text-sm">{pedido.sku || '-'}</span>
                        </td>
                        
                        {/* 7. Variação */}
                        <td className="px-4 py-3">
                          <span className="text-gray-300 text-sm">{pedido.nome_variacao || '-'}</span>
                        </td>
                        
                        {/* 8. Forma de Entrega */}
                        <td className="px-4 py-3">
                          <span className="text-gray-300 text-sm">{pedido.opcao_envio || '-'}</span>
                        </td>
                        
                        {/* 9. Comprador */}
                        <td className="px-4 py-3">
                          <span className="text-white text-sm">{pedido.cliente_nome || '-'}</span>
                        </td>
                        
                        {/* 10. Receita por Produtos */}
                        <td className="px-4 py-3">
                          <span className="text-green-400 text-sm font-medium">
                            R$ {pedido.preco_acordado?.toFixed(2) || '0.00'}
                          </span>
                        </td>
                        
                        {/* 11. Tarifa de Venda e Impostos */}
                        <td className="px-4 py-3">
                          <span className="text-red-400 text-sm">
                            R$ {pedido.valor_taxa_comissao?.toFixed(2) || '0.00'}
                          </span>
                        </td>
                        
                        {/* 12. Tarifas de Envio */}
                        <td className="px-4 py-3">
                          <span className="text-orange-400 text-sm">
                            R$ {pedido.valor_taxa_servico?.toFixed(2) || '0.00'}
                          </span>
                        </td>
                        
                        {/* 13. Cancelamentos e Reembolsos */}
                        <td className="px-4 py-3">
                          <span className="text-red-400 text-sm">
                            R$ {pedido.cancelamentos_reembolsos?.toFixed(2) || '0.00'}
                          </span>
                        </td>
                        
                        {/* 14. Total */}
                        <td className="px-4 py-3">
                          <span className="text-green-400 text-sm font-bold">
                            R$ {pedido.valor_total?.toFixed(2) || '0.00'}
                          </span>
                        </td>
                        
                        {/* 15. Endereço */}
                        <td className="px-4 py-3">
                          <span className="text-gray-300 text-xs">{pedido.endereco || '-'}</span>
                        </td>
                        
                        {/* 16. Cidade */}
                        <td className="px-4 py-3">
                          <span className="text-gray-300 text-sm">{pedido.cidade || '-'}</span>
                        </td>
                        
                        {/* 17. Estado */}
                        <td className="px-4 py-3">
                          <span className="text-gray-300 text-sm">{pedido.estado_endereco || '-'}</span>
                        </td>
                      </>
                    ) : (
                      {/* ===== SHOPEE - CAMPOS ORIGINAIS ===== */}
                      <>
                    {/* ID do Pedido - Editável */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <input
                          type="text"
                          defaultValue={pedido.numero_pedido}
                          onBlur={(e) => handleUpdatePedido(pedido.id, 'numero_pedido', e.target.value)}
                          className="bg-transparent text-white border-none focus:outline-none focus:bg-gray-700 rounded px-2 py-1 w-full"
                        />
                      </div>
                    </td>
                    
                    {/* Status - Dropdown */}
                    <td className="px-4 py-3">
                      <select
                        value={pedido.status}
                        onChange={(e) => {
                          handleStatusChange(pedido.id, e.target.value);
                          handleUpdatePedido(pedido.id, 'status', e.target.value);
                        }}
                        className="px-3 py-1.5 text-sm rounded font-medium border-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        style={{
                          backgroundColor: STATUS_OPTIONS.find(s => s.value === pedido.status)?.color || '#94A3B8',
                          color: 'white'
                        }}
                      >
                        {statusOptions.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                    
                    {/* Nome do Produto - Editável */}
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={pedido.produto_nome}
                        onBlur={(e) => handleUpdatePedido(pedido.id, 'produto_nome', e.target.value)}
                        placeholder="Nome do produto"
                        className="bg-transparent text-gray-300 text-sm border-none focus:outline-none focus:bg-gray-700 rounded px-2 py-1 w-full"
                      />
                    </td>
                    
                    {/* SKU - Editável */}
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={pedido.sku}
                        onBlur={(e) => handleUpdatePedido(pedido.id, 'sku', e.target.value)}
                        placeholder="SKU"
                        className="bg-transparent text-gray-300 text-sm border-none focus:outline-none focus:bg-gray-700 rounded px-2 py-1 w-full"
                      />
                    </td>
                    
                    {/* Nome Variação - Editável */}
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={pedido.nome_variacao}
                        onBlur={(e) => handleUpdatePedido(pedido.id, 'nome_variacao', e.target.value)}
                        placeholder="Variação"
                        className="bg-transparent text-gray-300 text-sm border-none focus:outline-none focus:bg-gray-700 rounded px-2 py-1 w-full"
                      />
                    </td>
                    
                    {/* Quantidade - Editável */}
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        defaultValue={pedido.quantidade}
                        onBlur={(e) => handleUpdatePedido(pedido.id, 'quantidade', parseInt(e.target.value))}
                        className="w-20 bg-transparent text-white text-center border-none focus:outline-none focus:bg-gray-700 rounded px-2 py-1"
                      />
                    </td>
                    
                    {/* Preço Acordado - Editável */}
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={pedido.preco_acordado}
                        onBlur={(e) => handleUpdatePedido(pedido.id, 'preco_acordado', parseFloat(e.target.value))}
                        placeholder="0.00"
                        className="w-24 bg-transparent text-green-400 text-sm border-none focus:outline-none focus:bg-gray-700 rounded px-2 py-1"
                      />
                    </td>
                    
                    {/* Taxa Comissão - Somente Leitura */}
                    <td className="px-4 py-3">
                      <span className="text-orange-400 text-sm">
                        R$ {pedido.valor_taxa_comissao?.toFixed(2) || '0.00'}
                      </span>
                    </td>
                    
                    {/* Taxa Serviço - Somente Leitura */}
                    <td className="px-4 py-3">
                      <span className="text-orange-400 text-sm">
                        R$ {pedido.valor_taxa_servico?.toFixed(2) || '0.00'}
                      </span>
                    </td>
                    
                    {/* Valor Líquido - Somente Leitura */}
                    <td className="px-4 py-3">
                      <span className="text-green-400 text-sm font-medium">
                        R$ {pedido.valor_liquido?.toFixed(2) || '0.00'}
                      </span>
                    </td>
                    
                    {/* Opção de Envio - Editável */}
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={pedido.opcao_envio}
                        onBlur={(e) => handleUpdatePedido(pedido.id, 'opcao_envio', e.target.value)}
                        placeholder="Ex: Normal"
                        className="bg-transparent text-gray-300 text-sm border-none focus:outline-none focus:bg-gray-700 rounded px-2 py-1 w-full"
                      />
                    </td>
                    
                    {/* Data Prevista Envio - Editável */}
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        defaultValue={pedido.data_prevista_envio ? new Date(pedido.data_prevista_envio).toISOString().split('T')[0] : ''}
                        onBlur={(e) => handleUpdatePedido(pedido.id, 'data_prevista_envio', e.target.value)}
                        className="bg-transparent text-gray-300 text-sm border-none focus:outline-none focus:bg-gray-700 rounded px-2 py-1"
                      />
                    </td>
                    
                    {/* Cliente - Editável */}
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={pedido.cliente_nome}
                        onBlur={(e) => handleUpdatePedido(pedido.id, 'cliente_nome', e.target.value)}
                        placeholder="Nome do cliente"
                        className="bg-transparent text-white text-sm border-none focus:outline-none focus:bg-gray-700 rounded px-2 py-1 w-full"
                      />
                    </td>
                    
                    {/* Telefone - Editável */}
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={pedido.cliente_contato}
                        onBlur={(e) => handleUpdatePedido(pedido.id, 'cliente_contato', e.target.value)}
                        placeholder="Telefone"
                        className="bg-transparent text-gray-300 text-sm border-none focus:outline-none focus:bg-gray-700 rounded px-2 py-1 w-full"
                      />
                    </td>
                      </>
                    )}
                  </tr>
                ))}
                
                {/* Linha de Adicionar Inline - HORIZONTAL */}
                {showInlineAdd ? (
                  <tr className="bg-gray-900/80 border-t-2 border-blue-500">
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded" disabled />
                    </td>
                    
                    {/* ID do Pedido */}
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={novaLinhaInline.numero_pedido}
                        onChange={(e) => setNovaLinhaInline({...novaLinhaInline, numero_pedido: e.target.value})}
                        placeholder="ID do pedido..."
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                    </td>
                    
                    {/* Status */}
                    <td className="px-4 py-3">
                      <select
                        value={novaLinhaInline.status}
                        onChange={(e) => setNovaLinhaInline({...novaLinhaInline, status: e.target.value})}
                        className="w-full px-3 py-2 rounded font-medium text-white focus:ring-2 focus:ring-blue-500"
                        style={{
                          backgroundColor: STATUS_OPTIONS.find(s => s.value === novaLinhaInline.status)?.color || '#94A3B8'
                        }}
                      >
                        {statusOptions.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                    
                    {/* Nome do Produto */}
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={novaLinhaInline.produto_nome}
                        onChange={(e) => setNovaLinhaInline({...novaLinhaInline, produto_nome: e.target.value})}
                        placeholder="Nome do produto"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    
                    {/* SKU */}
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={novaLinhaInline.sku}
                        onChange={(e) => setNovaLinhaInline({...novaLinhaInline, sku: e.target.value})}
                        placeholder="SKU"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    
                    {/* Nome Variação */}
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={novaLinhaInline.nome_variacao}
                        onChange={(e) => setNovaLinhaInline({...novaLinhaInline, nome_variacao: e.target.value})}
                        placeholder="Nome variação"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    
                    {/* Quantidade */}
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="1"
                        value={novaLinhaInline.quantidade}
                        onChange={(e) => setNovaLinhaInline({...novaLinhaInline, quantidade: parseInt(e.target.value) || 1})}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white text-center rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    
                    {/* Preço Acordado */}
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={novaLinhaInline.preco_acordado}
                        onChange={(e) => setNovaLinhaInline({...novaLinhaInline, preco_acordado: parseFloat(e.target.value) || 0})}
                        placeholder="0.00"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    
                    {/* Taxa Comissão - Somente exibição */}
                    <td className="px-4 py-3">
                      <span className="text-orange-400 text-sm">R$ 0.00</span>
                    </td>
                    
                    {/* Taxa Serviço - Somente exibição */}
                    <td className="px-4 py-3">
                      <span className="text-orange-400 text-sm">R$ 0.00</span>
                    </td>
                    
                    {/* Valor Líquido - Somente exibição */}
                    <td className="px-4 py-3">
                      <span className="text-green-400 text-sm">R$ 0.00</span>
                    </td>
                    
                    {/* Opção de Envio */}
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={novaLinhaInline.opcao_envio}
                        onChange={(e) => setNovaLinhaInline({...novaLinhaInline, opcao_envio: e.target.value})}
                        placeholder="Ex: Normal"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    
                    {/* Data Prevista Envio */}
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={novaLinhaInline.data_prevista_envio}
                        onChange={(e) => setNovaLinhaInline({...novaLinhaInline, data_prevista_envio: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    
                    {/* Cliente */}
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={novaLinhaInline.cliente_nome}
                        onChange={(e) => setNovaLinhaInline({...novaLinhaInline, cliente_nome: e.target.value})}
                        placeholder="Nome do cliente"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    
                    {/* Telefone com Botões */}
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={novaLinhaInline.cliente_contato}
                          onChange={(e) => setNovaLinhaInline({...novaLinhaInline, cliente_contato: e.target.value})}
                          placeholder="Telefone"
                          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={handleAddInline}
                          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                          title="Salvar"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setShowInlineAdd(false);
                            setNovaLinhaInline({
                              numero_pedido: '',
                              quantidade: 1,
                              sku: '',
                              cliente_nome: '',
                              sala_impressao: 'Aguardando Impressão',
                              status: 'Aguardando Produção',
                              prioridade: 'Normal',
                              prazo_entrega: '',
                              responsavel: ''
                            });
                          }}
                          className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr className="hover:bg-gray-700/50">
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3" colSpan="8">
                      <button
                        onClick={() => setShowInlineAdd(true)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm">Adicionar</span>
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )}

      {/* Produção View - Visão Simplificada sem Preços */}
      {viewMode === 'producao' && (
        <div className="space-y-6">
          {/* Filtros de Tipo de Envio */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-gray-400">Filtrar por tipo de envio:</span>
              <button
                onClick={() => setFiltroTipoEnvio('todos')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filtroTipoEnvio === 'todos'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Todos
              </button>
              
              {/* Filtros específicos por plataforma */}
              {projeto?.plataforma === 'shopee' && (
                <>
                  {/* Flex Shopee */}
                  <button
                    onClick={() => setFiltroTipoEnvio('flex')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filtroTipoEnvio === 'flex'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    📦 Flex Shopee
                  </button>
                  
                  {/* Coleta */}
                  <button
                    onClick={() => setFiltroTipoEnvio('coleta')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filtroTipoEnvio === 'coleta'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    🚗 Coleta
                  </button>
                </>
              )}
              
              {projeto?.plataforma === 'mercadolivre' && (
                <>
                  {/* Mercado Envios Flex */}
                  <button
                    onClick={() => setFiltroTipoEnvio('flex')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filtroTipoEnvio === 'flex'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    📦 Mercado Envios Flex
                  </button>
                  
                  {/* Correios e pontos de envio */}
                  <button
                    onClick={() => setFiltroTipoEnvio('correios_pontos')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filtroTipoEnvio === 'correios_pontos'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    📮 Correios e pontos de envio
                  </button>
                </>
              )}
              
              {/* Contador de pedidos filtrados */}
              <span className="ml-auto text-sm text-gray-400">
                {pedidosFiltrados.length} pedido(s) {filtroTipoEnvio !== 'todos' && `(${
                  filtroTipoEnvio === 'flex' ? (projeto?.plataforma === 'shopee' ? 'Flex Shopee' : 'Mercado Envios Flex') : 
                  filtroTipoEnvio === 'correios_pontos' ? 'Correios e pontos de envio' : 
                  filtroTipoEnvio === 'coleta' ? 'Coleta' : ''
                })`}
              </span>
            </div>
          </div>
          
          {Object.entries(pedidosAgrupados()).map(([grupo, pedidosDoGrupo]) => (
            <div key={`grupo-${grupo}`} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
              {agruparPor && (
                <div className="bg-gray-900 px-6 py-3 border-b border-gray-700">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    {agruparPor === 'sku' && '🏷️'}
                    {agruparPor === 'status' && '🔵'}
                    {grupo} 
                    <span className="text-sm text-gray-400">({pedidosDoGrupo.length} pedidos)</span>
                  </h3>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-900 border-b border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase w-8">
                        <input 
                          type="checkbox" 
                          className="rounded cursor-pointer" 
                          checked={selectAll}
                          onChange={handleSelectAll}
                        />
                      </th>
                      
                      {/* Cabeçalhos condicionais por plataforma */}
                      {projeto?.plataforma === 'mercadolivre' ? (
                        {/* === MERCADO LIVRE - 17 CAMPOS === */}
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[150px]">N.º de Venda</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Data da Venda</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Estado</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[180px]">Descrição do Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[80px]">Unidades</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">SKU</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[150px]">Variação</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[150px]">Forma de Entrega</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[150px]">Comprador</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Receita por Produtos</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Tarifa de Venda</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Tarifas de Envio</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Cancelamentos</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[100px]">Total</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[200px]">Endereço</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Cidade</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[100px]">Estado</th>
                        </>
                      ) : (
                        {/* === SHOPEE PRODUÇÃO - 6 CAMPOS OPERACIONAIS === */}
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[150px]">ID do pedido</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[150px]">Opção de envio</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[140px]">Data prevista de envio</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[150px]">Número de referência SKU</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[150px]">Nome da variação</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[80px]">Quantidade</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {pedidosDoGrupo.map((pedido) => (
                  <tr key={`pedido-${pedido.id}`} className="hover:bg-gray-700/30 group">
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        className="rounded cursor-pointer" 
                        checked={selectedPedidos.includes(pedido.id)}
                        onChange={() => handleSelectPedido(pedido.id)}
                      />
                    </td>
                    
                    {/* Renderização condicional por plataforma */}
                    {projeto?.plataforma === 'mercadolivre' ? (
                      {/* === MERCADO LIVRE - 17 CAMPOS === */}
                      <>
                        {/* TODO: Adicionar campos ML se necessário */}
                        <td className="px-4 py-3" colSpan="17">
                          <span className="text-gray-400 text-sm">Mercado Livre - Em desenvolvimento</span>
                        </td>
                      </>
                    ) : (
                      {/* === SHOPEE PRODUÇÃO - APENAS 6 CAMPOS OPERACIONAIS === */}
                      <>
                        {/* 1. ID do pedido */}
                        <td className="px-4 py-3">
                          <span className="text-white font-medium">{pedido.numero_pedido || '-'}</span>
                        </td>
                        
                        {/* 2. Opção de envio */}
                        <td className="px-4 py-3">
                          <span className="text-gray-300 text-sm">{pedido.opcao_envio || '-'}</span>
                        </td>
                        
                        {/* 3. Data prevista de envio */}
                        <td className="px-4 py-3">
                          <span className="text-gray-300 text-sm">
                            {pedido.data_prevista_envio ? new Date(pedido.data_prevista_envio).toLocaleDateString('pt-BR') : '-'}
                          </span>
                        </td>
                        
                        {/* 4. Número de referência SKU */}
                        <td className="px-4 py-3">
                          <span className="text-gray-300 text-sm">{pedido.numero_referencia_sku || pedido.sku || '-'}</span>
                        </td>
                        
                        {/* 5. Nome da variação */}
                        <td className="px-4 py-3">
                          <span className="text-gray-300 text-sm">{pedido.nome_variacao || '-'}</span>
                        </td>
                        
                        {/* 6. Quantidade */}
                        <td className="px-4 py-3">
                          <span className="text-white font-medium text-center block">{pedido.quantidade || 0}</span>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-6 gap-4">
          {statusOptions.map(statusOption => (
            <div key={statusOption.value} className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: statusOption.color }}
                ></div>
                <h3 className="font-bold text-sm text-white">{statusOption.label}</h3>
                <span className="ml-auto bg-gray-700 px-2 py-1 rounded-full text-xs font-medium text-gray-300">
                  {pedidosPorStatus[statusOption.value]?.length || 0}
                </span>
              </div>

              <div className="space-y-3">
                {pedidosPorStatus[statusOption.value]?.map(pedido => (
                  <div
                    key={`kanban-pedido-${pedido.id}`}
                    className="bg-gray-900 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer border-l-4"
                    style={{ borderLeftColor: statusOption.color }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-sm text-white">{pedido.numero_pedido}</p>
                      {pedido.atrasado && (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{pedido.cliente_nome || 'Cliente não informado'}</p>
                    <p className="text-xs text-gray-500 mb-2">{pedido.produto_nome}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`px-2 py-1 rounded-full ${getPrioridadeColor(pedido.prioridade)}`}>
                        {pedido.prioridade}
                      </span>
                      <span className="text-gray-400">{formatDate(pedido.prazo_entrega)}</span>
                    </div>
                    
                    {/* Dropdown de mudança de status */}
                    <select
                      value={pedido.status}
                      onChange={(e) => handleStatusChange(pedido.id, e.target.value)}
                      className="w-full mt-2 px-2 py-1 text-xs border border-gray-600 bg-gray-800 text-white rounded"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {statusOptions.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
          {pedidosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <PackageIcon className="w-16 h-16 mb-4 text-gray-600" />
              <p className="text-lg font-medium">Nenhum pedido encontrado</p>
              <p className="text-sm">Faça upload de uma planilha para adicionar pedidos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Nº Pedido</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Produto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Qtd</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Prioridade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Prazo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Responsável</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {pedidosFiltrados.map(pedido => (
                    <tr key={`relatorio-pedido-${pedido.id}`} className={pedido.atrasado ? 'bg-red-900/20' : 'hover:bg-gray-700/50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {pedido.numero_pedido}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {pedido.cliente_nome || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {pedido.produto_nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {pedido.quantidade}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {formatCurrency(pedido.valor_total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={pedido.status}
                          onChange={(e) => handleStatusChange(pedido.id, e.target.value)}
                          className="px-3 py-1 text-sm border border-gray-600 bg-gray-700 text-white rounded"
                          style={{ 
                            backgroundColor: STATUS_OPTIONS.find(s => s.value === pedido.status)?.color || '#94A3B8',
                            color: 'white'
                          }}
                        >
                          {statusOptions.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadeColor(pedido.prioridade)}`}>
                          {pedido.prioridade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(pedido.prazo_entrega)}
                          {pedido.atrasado && (
                            <span className="ml-2 text-red-400 font-bold">
                              ({pedido.dias_atraso}d)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {pedido.responsavel || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Financeiro View - Apenas para Shopee com todos os 17 campos */}
      {viewMode === 'financeiro' && projeto?.plataforma === 'shopee' && (
        <div className="space-y-6">
          {Object.entries(pedidosAgrupados()).map(([grupo, pedidosDoGrupo]) => (
            <div key={`grupo-${grupo}`} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
              {agruparPor && (
                <div className="bg-gray-900 px-6 py-3 border-b border-gray-700">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    {agruparPor === 'sku' && '🏷️'}
                    {agruparPor === 'status' && '🔵'}
                    {grupo} 
                    <span className="text-sm text-gray-400">({pedidosDoGrupo.length} pedidos)</span>
                  </h3>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-900 border-b border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase w-8">
                        <input 
                          type="checkbox" 
                          className="rounded cursor-pointer" 
                          checked={selectAll}
                          onChange={handleSelectAll}
                        />
                      </th>
                      {/* Todos os 17 campos da planilha Shopee */}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[150px]">ID do Pedido</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Status do Pedido</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[150px]">Opção de Envio</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[140px]">Data Prevista Envio</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[150px]">Número Referência SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[80px]">Quantidade</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[150px]">Nome da Variação</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Preço Original</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Preço Acordado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Valor Total Pedido</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Taxa Comissão</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Taxa Serviço</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[150px]">Nome Comprador</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[150px]">Nome Destinatário</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[200px]">Endereço Entrega</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[120px]">Cidade</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase min-w-[80px]">UF</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {pedidosDoGrupo.map((pedido) => (
                      <tr key={`pedido-${pedido.id}`} className="hover:bg-gray-700/30 group">
                        <td className="px-4 py-3">
                          <input 
                            type="checkbox" 
                            className="rounded cursor-pointer" 
                            checked={selectedPedidos.includes(pedido.id)}
                            onChange={() => handleSelectPedido(pedido.id)}
                          />
                        </td>
                        
                        {/* 1. ID do pedido */}
                        <td className="px-4 py-3">
                          <span className="text-white font-medium">{pedido.numero_pedido || '-'}</span>
                        </td>
                        
                        {/* 2. Status do pedido */}
                        <td className="px-4 py-3">
                          <span className="text-blue-400 text-sm">{pedido.status_pedido || '-'}</span>
                        </td>
                        
                        {/* 3. Opção de envio */}
                        <td className="px-4 py-3">
                          <span className="text-gray-300 text-sm">{pedido.opcao_envio || '-'}</span>
                        </td>
                        
                        {/* 4. Data prevista de envio */}
                        <td className="px-4 py-3">
                          <span className="text-gray-300 text-sm">
                            {pedido.data_prevista_envio ? new Date(pedido.data_prevista_envio).toLocaleDateString('pt-BR') : '-'}
                          </span>
                        </td>
                        
                        {/* 5. Número de referência SKU */}
                        <td className="px-4 py-3">
                          <span className="text-gray-300 text-sm">{pedido.numero_referencia_sku || pedido.sku || '-'}</span>
                        </td>
                        
                        {/* 6. Quantidade */}
                        <td className="px-4 py-3">
                          <span className="text-white font-medium text-center block">{pedido.quantidade || 0}</span>
                        </td>
                        
                        {/* 7. Nome da variação */}
                        <td className="px-4 py-3">
                          <span className="text-gray-300 text-sm">{pedido.nome_variacao || '-'}</span>
                        </td>
                        
                        {/* 8. Preço original */}
                        <td className="px-4 py-3">
                          <span className="text-gray-400 text-sm">
                            R$ {(pedido.preco_original || 0).toFixed(2)}
                          </span>
                        </td>
                        
                        {/* 9. Preço acordado */}
                        <td className="px-4 py-3">
                          <span className="text-green-400 text-sm font-medium">
                            R$ {(pedido.preco_acordado || 0).toFixed(2)}
                          </span>
                        </td>
                        
                        {/* 10. Valor Total */}
                        <td className="px-4 py-3">
                          <span className="text-green-400 text-sm font-bold">
                            R$ {(pedido.valor_total_pedido || pedido.valor_total || 0).toFixed(2)}
                          </span>
                        </td>
                        
                        {/* 11. Taxa de comissão */}
                        <td className="px-4 py-3">
                          <span className="text-red-400 text-sm">
                            R$ {(pedido.valor_taxa_comissao || 0).toFixed(2)}
                          </span>
                        </td>
                        
                        {/* 12. Taxa de serviço */}
                        <td className="px-4 py-3">
                          <span className="text-orange-400 text-sm">
                            R$ {(pedido.valor_taxa_servico || 0).toFixed(2)}
                          </span>
                        </td>
                        
                        {/* 13. Nome de usuário (comprador) */}
                        <td className="px-4 py-3">
                          <span className="text-gray-300 text-sm">{pedido.nome_usuario_comprador || '-'}</span>
                        </td>
                        
                        {/* 14. Nome do destinatário */}
                        <td className="px-4 py-3">
                          <span className="text-white text-sm">{pedido.cliente_nome || '-'}</span>
                        </td>
                        
                        {/* 15. Endereço de entrega */}
                        <td className="px-4 py-3">
                          <span className="text-gray-300 text-xs">{pedido.endereco_entrega || pedido.endereco || '-'}</span>
                        </td>
                        
                        {/* 16. Cidade */}
                        <td className="px-4 py-3">
                          <span className="text-gray-300 text-sm">{pedido.cidade || '-'}</span>
                        </td>
                        
                        {/* 17. UF */}
                        <td className="px-4 py-3">
                          <span className="text-gray-300 text-sm">{pedido.uf || pedido.estado_endereco || '-'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal de Adicionar Pedido */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Adicionar Novo Pedido - {projeto.nome}</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Linha 1: Número do Pedido e SKU */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Número do Pedido *</label>
                  <input
                    type="text"
                    value={novoPedido.numero_pedido}
                    onChange={(e) => setNovoPedido({...novoPedido, numero_pedido: e.target.value})}
                    placeholder="Ex: ML-12345"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">SKU</label>
                  <input
                    type="text"
                    value={novoPedido.sku}
                    onChange={(e) => setNovoPedido({...novoPedido, sku: e.target.value})}
                    placeholder="Ex: PROD-001"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Linha 2: Cliente e Contato */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Cliente *</label>
                  <input
                    type="text"
                    value={novoPedido.cliente_nome}
                    onChange={(e) => setNovoPedido({...novoPedido, cliente_nome: e.target.value})}
                    placeholder="Nome completo"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Contato</label>
                  <input
                    type="text"
                    value={novoPedido.cliente_contato}
                    onChange={(e) => setNovoPedido({...novoPedido, cliente_contato: e.target.value})}
                    placeholder="Telefone ou email"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Linha 3: Produto */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Produto *</label>
                <input
                  type="text"
                  value={novoPedido.produto_nome}
                  onChange={(e) => setNovoPedido({...novoPedido, produto_nome: e.target.value})}
                  placeholder="Descrição do produto"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Linha 4: Quantidade e Valores */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Quantidade *</label>
                  <input
                    type="number"
                    min="1"
                    value={novoPedido.quantidade}
                    onChange={(e) => setNovoPedido({...novoPedido, quantidade: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Valor Unitário (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={novoPedido.valor_unitario}
                    onChange={(e) => setNovoPedido({...novoPedido, valor_unitario: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Valor Total (R$)</label>
                  <input
                    type="text"
                    value={formatCurrency(novoPedido.quantidade * novoPedido.valor_unitario)}
                    disabled
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-gray-400 rounded-lg"
                  />
                </div>
              </div>

              {/* Linha 5: Status e Prioridade */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status Inicial</label>
                  <select
                    value={novoPedido.status}
                    onChange={(e) => setNovoPedido({...novoPedido, status: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {statusOptions.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prioridade</label>
                  <select
                    value={novoPedido.prioridade}
                    onChange={(e) => setNovoPedido({...novoPedido, prioridade: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {PRIORIDADE_OPTIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Linha 6: Prazo e Responsável */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prazo de Entrega *</label>
                  <input
                    type="date"
                    value={novoPedido.prazo_entrega}
                    onChange={(e) => setNovoPedido({...novoPedido, prazo_entrega: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Responsável</label>
                  <input
                    type="text"
                    value={novoPedido.responsavel}
                    onChange={(e) => setNovoPedido({...novoPedido, responsavel: e.target.value})}
                    placeholder="Nome do responsável"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Linha 7: Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Observações</label>
                <textarea
                  value={novoPedido.observacoes}
                  onChange={(e) => setNovoPedido({...novoPedido, observacoes: e.target.value})}
                  rows={3}
                  placeholder="Detalhes adicionais sobre o pedido..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6 flex gap-3">
              <button
                onClick={handleAddPedido}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Criar Pedido
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Upload de Planilha */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Upload de Planilha de Pedidos</h3>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                  }}
                  className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Seletor de Formato */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Formato da Planilha
                </label>
                <select
                  value={uploadFormato}
                  onChange={(e) => setUploadFormato(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="shopee">Shopee</option>
                  <option value="mercadolivre">Mercado Livre</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Selecione o marketplace de origem da planilha
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-4">
                  Faça upload da planilha de pedidos exportada do {projeto?.nome}. 
                  Formatos aceitos: Excel (.xlsx, .xls) ou CSV (.csv)
                </p>
                
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-white font-medium mb-2">
                      {uploadFile ? uploadFile.name : 'Clique para selecionar arquivo'}
                    </p>
                    <p className="text-sm text-gray-400">
                      ou arraste e solte aqui
                    </p>
                  </label>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-2">Colunas esperadas na planilha:</h4>
                {uploadFormato === 'shopee' ? (
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• ID do Pedido (obrigatório)</li>
                    <li>• Número de Referência SKU</li>
                    <li>• Nome da Variação</li>
                    <li>• Nome do Produto</li>
                    <li>• Quantidade</li>
                    <li>• Preço Acordado</li>
                    <li>• Taxa de Comissão</li>
                    <li>• Taxa de Serviço</li>
                    <li>• Opção de Envio</li>
                    <li>• Data Prevista de Envio</li>
                  </ul>
                ) : (
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• N.º de venda (obrigatório)</li>
                    <li>• Estado</li>
                    <li>• Unidades</li>
                    <li>• SKU</li>
                    <li>• Variação</li>
                    <li>• Comprador</li>
                    <li>• Forma de entrega</li>
                    <li>• Receita por produtos (BRL)</li>
                    <li>• Tarifa de venda e impostos (BRL)</li>
                    <li>• Tarifas de envio (BRL)</li>
                    <li>• Total (BRL)</li>
                  </ul>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex gap-3">
              <button
                onClick={handleConfirmarUpload}
                disabled={!uploadFile || uploadProgress}
                className={`flex-1 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${
                  uploadFile && !uploadProgress
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {uploadProgress ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Importar Pedidos
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                }}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

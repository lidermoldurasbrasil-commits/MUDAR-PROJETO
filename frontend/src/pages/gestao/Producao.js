import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Filter, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import ProducaoForm from './ProducaoForm';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api/gestao`;

const STATUS_OPTIONS = [
  'Armazenado na Loja',
  'Aguardando Arte',
  'Armazenado Fábrica',
  'Pronto para Impressão',
  'Impresso',
  'Produção',
  'Acabamento',
  'Pronto',
  'Entregue',
  'Reparo'
];

const RESPONSAVEL_OPTIONS = [
  'Vendedor',
  'Arte',
  'Subgerente Fábrica',
  'Molduraria',
  'Acabamento',
  'Qualidade',
  'Embalagem',
  'Expedição',
  'Reparo'
];

const LOJA_OPTIONS = [
  { value: 'fabrica', label: 'Fábrica' },
  { value: 'mantiqueira', label: 'Mantiqueira' },
  { value: 'lagoa_santa', label: 'Lagoa Santa' },
  { value: 'sao_joao_batista', label: 'São João Batista' }
];

const STATUS_COLORS = {
  'Aguardando Arte': '#f59e0b',
  'Armazenado Fábrica': '#6366f1',
  'Produção': '#3b82f6',
  'Acabamento': '#8b5cf6',
  'Pronto': '#10b981',
  'Entregue': '#059669',
  'Reparo': '#dc2626'
};

export default function Producao() {
  const [ordens, setOrdens] = useState([]);
  const [filteredOrdens, setFilteredOrdens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedOrdem, setSelectedOrdem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lojaFilter, setLojaFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [responsavelFilter, setResponsavelFilter] = useState('Todos');
  const [showAtrasados, setShowAtrasados] = useState(false);
  const [stats, setStats] = useState({
    por_status: {},
    por_loja: {},
    total: 0,
    atrasados: 0,
    em_reparo: 0
  });
  const [ordensPendentes, setOrdensPendentes] = useState([]);
  const [showPendentes, setShowPendentes] = useState(false);
  const [showAprovarModal, setShowAprovarModal] = useState(false);
  const [ordemParaAprovar, setOrdemParaAprovar] = useState(null);
  
  // Estados para controlar menus recolhíveis
  const [showGraficoStatus, setShowGraficoStatus] = useState(true);
  const [showGraficoLojas, setShowGraficoLojas] = useState(true);
  const [showFiltros, setShowFiltros] = useState(true);

  useEffect(() => {
    fetchOrdens();
    fetchStats();
    fetchOrdensPendentes();
  }, []);

  useEffect(() => {
    filterOrdens();
  }, [ordens, searchTerm, lojaFilter, statusFilter, responsavelFilter, showAtrasados]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/producao/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const fetchOrdensPendentes = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const nome = user.nome || user.username;
      
      const response = await axios.get(`${API}/producao/pendentes-aprovacao?responsavel=${nome}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setOrdensPendentes(response.data.ordens || []);
    } catch (error) {
      console.error('Erro ao buscar ordens pendentes:', error);
    }
  };

  const handleAprovarOrdem = async (ordem, observacao = '') => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/producao/${ordem.id}/aprovar`,
        { observacao },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('✅ Ordem aprovada! Você assumiu a responsabilidade.');
      setShowAprovarModal(false);
      setOrdemParaAprovar(null);
      fetchOrdens();
      fetchOrdensPendentes();
    } catch (error) {
      console.error('Erro ao aprovar ordem:', error);
      toast.error(error.response?.data?.detail || 'Erro ao aprovar ordem');
    }
  };

  const handleRejeitarOrdem = async (ordem, motivo) => {
    if (!motivo) {
      toast.error('Informe o motivo da rejeição');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/producao/${ordem.id}/rejeitar`,
        { motivo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Ordem rejeitada e devolvida');
      setShowAprovarModal(false);
      setOrdemParaAprovar(null);
      fetchOrdens();
      fetchOrdensPendentes();
    } catch (error) {
      console.error('Erro ao rejeitar ordem:', error);
      toast.error('Erro ao rejeitar ordem');
    }
  };

  const handleTransferirOrdem = async (ordemId, novoResponsavel) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/producao/${ordemId}/transferir`,
        { novo_responsavel: novoResponsavel },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`✅ Ordem transferida para ${novoResponsavel}. Aguardando aprovação.`);
      fetchOrdens();
      fetchOrdensPendentes();
    } catch (error) {
      console.error('Erro ao transferir ordem:', error);
      toast.error('Erro ao transferir ordem');
    }
  };

  const fetchOrdens = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/producao`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrdens(response.data);
    } catch (error) {
      console.error('Erro ao buscar ordens:', error);
      toast.error('Erro ao carregar ordens de produção');
    } finally {
      setLoading(false);
    }
  };

  const filterOrdens = () => {
    let filtered = [...ordens];

    // Busca por texto
    if (searchTerm) {
      filtered = filtered.filter(ordem =>
        ordem.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ordem.numero_ordem?.toString().includes(searchTerm) ||
        ordem.descricao_itens?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por loja
    if (lojaFilter !== 'Todos') {
      filtered = filtered.filter(ordem => ordem.loja_origem === lojaFilter);
    }

    // Filtro por status
    if (statusFilter !== 'Todos') {
      filtered = filtered.filter(ordem => ordem.status_interno === statusFilter);
    }

    // Filtro por responsável
    if (responsavelFilter !== 'Todos') {
      filtered = filtered.filter(ordem => ordem.responsavel_atual === responsavelFilter);
    }

    // Filtro de atrasados
    if (showAtrasados) {
      const hoje = new Date();
      filtered = filtered.filter(ordem => {
        if (!ordem.data_entrega_prometida || ordem.status_interno === 'Entregue') return false;
        const dataEntrega = new Date(ordem.data_entrega_prometida);
        return dataEntrega < hoje;
      });
    }

    setFilteredOrdens(filtered);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const getSLAStatus = (ordem) => {
    if (!ordem.data_entrega_prometida || ordem.status_interno === 'Entregue') return 'green';
    
    const hoje = new Date();
    const dataEntrega = new Date(ordem.data_entrega_prometida);
    const diffTime = dataEntrega - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'red'; // Atrasado
    if (diffDays <= 1) return 'yellow'; // Menos de 24h
    return 'green'; // No prazo
  };

  const getDiasEmProducao = (dataOrder) => {
    const hoje = new Date();
    const dataPedido = new Date(dataPedido);
    const diffTime = hoje - dataPedido;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleNewOrdem = () => {
    setSelectedOrdem(null);
    setShowForm(true);
  };

  const handleEditOrdem = (ordem) => {
    setSelectedOrdem(ordem);
    setShowForm(true);
  };

  const handleDeleteOrdem = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta ordem?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/producao/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Ordem excluída com sucesso!');
      fetchOrdens();
    } catch (error) {
      console.error('Erro ao excluir ordem:', error);
      toast.error('Erro ao excluir ordem');
    }
  };

  if (showForm) {
    return (
      <ProducaoForm
        ordem={selectedOrdem}
        onClose={() => setShowForm(false)}
        onSave={() => {
          setShowForm(false);
          fetchOrdens();
        }}
      />
    );
  }

  return (
    <div className="producao-container">
      <div className="header">
        <div>
          <h1>Gestão de Produção da Fábrica</h1>
          <p className="subtitle">Controle completo das ordens de produção</p>
        </div>
        <div style={{display: 'flex', gap: '10px'}}>
          {ordensPendentes.length > 0 && (
            <button 
              className="btn-warning" 
              onClick={() => setShowPendentes(!showPendentes)}
              style={{position: 'relative'}}
            >
              <AlertCircle size={20} />
              Pendentes de Aprovação
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {ordensPendentes.length}
              </span>
            </button>
          )}
          <button className="btn-primary" onClick={handleNewOrdem}>
            <Plus size={20} />
            Nova Ordem de Produção
          </button>
        </div>
      </div>

      {/* Seção de Ordens Pendentes de Aprovação */}
      {showPendentes && ordensPendentes.length > 0 && (
        <div style={{
          backgroundColor: '#fef3c7',
          border: '2px solid #f59e0b',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <h3 style={{marginBottom: '15px', color: '#92400e', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <AlertCircle size={24} />
            Ordens Aguardando Sua Aprovação ({ordensPendentes.length})
          </h3>
          <p style={{color: '#78350f', marginBottom: '20px', fontSize: '14px'}}>
            ⚠️ Estas ordens foram transferidas para você. Revise o processo anterior e aprove para assumir a responsabilidade.
          </p>
          
          <div style={{display: 'grid', gap: '15px'}}>
            {ordensPendentes.map(ordem => (
              <div key={ordem.id} style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '15px',
                border: '1px solid #fbbf24',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{flex: 1}}>
                  <div style={{fontWeight: 'bold', fontSize: '16px', marginBottom: '5px'}}>
                    Ordem #{ordem.numero_ordem} - {ordem.cliente_nome}
                  </div>
                  <div style={{fontSize: '14px', color: '#6b7280', marginBottom: '5px'}}>
                    📦 {ordem.descricao_itens?.substring(0, 100)}...
                  </div>
                  <div style={{fontSize: '12px', color: '#9ca3af'}}>
                    Transferido de: {ordem.responsavel_atual} → Status: {ordem.status_interno}
                  </div>
                </div>
                
                <div style={{display: 'flex', gap: '10px'}}>
                  <button
                    onClick={() => {
                      setOrdemParaAprovar(ordem);
                      setShowAprovarModal(true);
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    ✓ Aprovar e Assumir
                  </button>
                  <button
                    onClick={() => {
                      setOrdemParaAprovar(ordem);
                      const motivo = prompt('Motivo da rejeição:');
                      if (motivo) handleRejeitarOrdem(ordem, motivo);
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    × Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Seção de Estatísticas e Gráficos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* Card Total de Ordens */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '10px',
          padding: '20px',
          color: 'white',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{fontSize: '14px', opacity: 0.9, marginBottom: '8px'}}>Total de Ordens</div>
          <div style={{fontSize: '32px', fontWeight: 'bold'}}>{stats.total}</div>
        </div>

        {/* Card Atrasados */}
        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '10px',
          padding: '20px',
          color: 'white',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{fontSize: '14px', opacity: 0.9, marginBottom: '8px'}}>⚠️ Atrasados</div>
          <div style={{fontSize: '32px', fontWeight: 'bold'}}>{stats.atrasados}</div>
        </div>

        {/* Card Em Reparo */}
        <div style={{
          background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          borderRadius: '10px',
          padding: '20px',
          color: 'white',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{fontSize: '14px', opacity: 0.9, marginBottom: '8px'}}>🔧 Em Reparo</div>
          <div style={{fontSize: '32px', fontWeight: 'bold'}}>{stats.em_reparo}</div>
        </div>

        {/* Card Em Produção */}
        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          borderRadius: '10px',
          padding: '20px',
          color: 'white',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{fontSize: '14px', opacity: 0.9, marginBottom: '8px'}}>🏭 Em Produção</div>
          <div style={{fontSize: '32px', fontWeight: 'bold'}}>
            {stats.por_status?.['Produção'] || 0}
          </div>
        </div>
      </div>

      {/* Gráfico de Status */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '25px',
        marginBottom: '30px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <div 
          onClick={() => setShowGraficoStatus(!showGraficoStatus)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            marginBottom: showGraficoStatus ? '20px' : '0'
          }}
        >
          <h3 style={{color: '#1f2937', margin: 0}}>📊 Ordens por Status</h3>
          <button style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center'
          }}>
            {showGraficoStatus ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </button>
        </div>
        
        {showGraficoStatus && (
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '15px'}}>
            {Object.entries(stats.por_status || {}).map(([status, count]) => (
              <div key={status} style={{
                flex: '1 1 200px',
                padding: '15px',
                borderRadius: '8px',
                background: '#f3f4f6',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{fontSize: '12px', color: '#6b7280', marginBottom: '5px'}}>{status}</div>
                <div style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937'}}>{count}</div>
                <div style={{
                  marginTop: '8px',
                  height: '4px',
                  borderRadius: '2px',
                  background: '#e5e7eb'
                }}>
                  <div style={{
                    height: '100%',
                    borderRadius: '2px',
                    background: '#3b82f6',
                    width: `${(count / stats.total) * 100}%`,
                    transition: 'width 0.3s'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gráfico de Lojas */}
      {Object.keys(stats.por_loja || {}).length > 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '25px',
          marginBottom: '30px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <div 
            onClick={() => setShowGraficoLojas(!showGraficoLojas)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              marginBottom: showGraficoLojas ? '20px' : '0'
            }}
          >
            <h3 style={{color: '#1f2937', margin: 0}}>🏪 Ordens por Loja</h3>
            <button style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center'
            }}>
              {showGraficoLojas ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>
          </div>
          
          {showGraficoLojas && (
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '15px'}}>
              {Object.entries(stats.por_loja || {}).map(([loja, count]) => (
                <div key={loja} style={{
                  flex: '1 1 200px',
                  padding: '15px',
                  borderRadius: '8px',
                  background: '#ecfdf5',
                  border: '1px solid #10b981'
                }}>
                  <div style={{fontSize: '12px', color: '#065f46', marginBottom: '5px'}}>{loja}</div>
                  <div style={{fontSize: '24px', fontWeight: 'bold', color: '#065f46'}}>{count}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      {/* Filtros */}
      <div className="filters-section" style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '20px',
        marginBottom: '30px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <div 
          onClick={() => setShowFiltros(!showFiltros)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            marginBottom: showFiltros ? '20px' : '0'
          }}
        >
          <h3 style={{color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '10px'}}>
            <Filter size={20} />
            Filtros de Pesquisa
          </h3>
          <button style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center'
          }}>
            {showFiltros ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </button>
        </div>
        
        {showFiltros && (
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center'}}>
            <div className="search-box" style={{flex: '1 1 300px'}}>
              <Search size={20} />
              <input
                type="text"
                placeholder="Buscar por cliente, nº ordem ou itens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select value={lojaFilter} onChange={(e) => setLojaFilter(e.target.value)} style={{flex: '0 1 200px'}}>
              <option value="Todos">Todas as Lojas</option>
              {LOJA_OPTIONS.map(loja => (
                <option key={loja.value} value={loja.value}>{loja.label}</option>
              ))}
            </select>

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{flex: '0 1 200px'}}>
              <option value="Todos">Todos os Status</option>
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <select value={responsavelFilter} onChange={(e) => setResponsavelFilter(e.target.value)} style={{flex: '0 1 200px'}}>
              <option value="Todos">Todos Responsáveis</option>
              {RESPONSAVEL_OPTIONS.map(resp => (
                <option key={resp} value={resp}>{resp}</option>
              ))}
            </select>

            <button
              className={`btn-filter ${showAtrasados ? 'active' : ''}`}
              onClick={() => setShowAtrasados(!showAtrasados)}
              style={{flex: '0 0 auto'}}
            >
              <AlertCircle size={18} />
              {showAtrasados ? 'Mostrar Todos' : 'Apenas Atrasados'}
            </button>
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="table-container">
        {loading ? (
          <div className="loading">Carregando...</div>
        ) : (
          <table className="producao-table">
            <thead>
              <tr>
                <th>SLA</th>
                <th>Nº Ordem</th>
                <th>Cliente</th>
                <th>Loja</th>
                <th>Itens</th>
                <th>Data Entrega</th>
                <th>Status</th>
                <th>Responsável</th>
                <th>Prioridade</th>
                <th>Valor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrdens.length === 0 ? (
                <tr>
                  <td colSpan="11" className="no-data">
                    Nenhuma ordem encontrada
                  </td>
                </tr>
              ) : (
                filteredOrdens.map((ordem) => (
                  <tr key={ordem.id}>
                    <td>
                      <div 
                        className="sla-indicator"
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: getSLAStatus(ordem) === 'green' ? '#10b981' : getSLAStatus(ordem) === 'yellow' ? '#f59e0b' : '#dc2626'
                        }}
                        title={getSLAStatus(ordem) === 'green' ? 'No prazo' : getSLAStatus(ordem) === 'yellow' ? 'Urgente (24h)' : 'Atrasado'}
                      />
                    </td>
                    <td className="ordem-numero">#{ordem.numero_ordem}</td>
                    <td>{ordem.cliente_nome}</td>
                    <td>
                      {LOJA_OPTIONS.find(l => l.value === ordem.loja_origem)?.label || ordem.loja_origem}
                    </td>
                    <td style={{maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                      {ordem.descricao_itens || '-'}
                    </td>
                    <td>{formatDate(ordem.data_entrega_prometida)}</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{
                          backgroundColor: STATUS_COLORS[ordem.status_interno],
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        {ordem.status_interno}
                      </span>
                    </td>
                    <td>{ordem.responsavel_atual}</td>
                    <td>
                      <span 
                        style={{
                          color: ordem.prioridade === 'Urgente' ? '#dc2626' : ordem.prioridade === 'Reentrega' ? '#f59e0b' : '#6b7280',
                          fontWeight: ordem.prioridade !== 'Normal' ? '700' : '400'
                        }}
                      >
                        {ordem.prioridade}
                      </span>
                    </td>
                    <td>{formatCurrency(ordem.valor_total)}</td>
                    <td className="actions">
                      <button
                        className="btn-icon btn-view"
                        onClick={() => handleEditOrdem(ordem)}
                        title="Ver/Editar"
                        style={{background: '#3b82f6', color: 'white'}}
                      >
                        <Eye size={16} />
                      </button>
                      {!ordem.aguardando_aprovacao && (
                        <button
                          className="btn-icon"
                          onClick={() => {
                            const novoResp = prompt(`Transferir para qual responsável?\n\nOpções:\n${RESPONSAVEL_OPTIONS.join('\n')}`);
                            if (novoResp && RESPONSAVEL_OPTIONS.includes(novoResp)) {
                              handleTransferirOrdem(ordem.id, novoResp);
                            } else if (novoResp) {
                              toast.error('Responsável inválido');
                            }
                          }}
                          title="Transferir para próximo responsável"
                          style={{background: '#f59e0b', color: 'white'}}
                        >
                          ➜
                        </button>
                      )}
                      {ordem.aguardando_aprovacao && (
                        <span style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          background: '#fef3c7',
                          color: '#92400e',
                          borderRadius: '3px',
                          fontWeight: 'bold'
                        }}>
                          ⏳ Aguardando
                        </span>
                      )}
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDeleteOrdem(ordem.id)}
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <style jsx>{`
        .producao-container {
          padding: 30px;
          max-width: 1600px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .header h1 {
          margin: 0;
          font-size: 28px;
          color: #1f2937;
        }

        .subtitle {
          color: #6b7280;
          margin-top: 4px;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #2d7a5e;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
        }

        .btn-primary:hover {
          background: #246350;
        }

        .filters-section {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 300px;
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-box svg {
          position: absolute;
          left: 12px;
          color: #9ca3af;
        }

        .search-box input {
          width: 100%;
          padding: 10px 10px 10px 40px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
        }

        select {
          padding: 10px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          cursor: pointer;
        }

        .btn-filter {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .btn-filter.active {
          background: #fee2e2;
          border-color: #dc2626;
          color: #dc2626;
        }

        .table-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .producao-table {
          width: 100%;
          border-collapse: collapse;
        }

        .producao-table th {
          background: #f9fafb;
          padding: 14px 16px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
        }

        .producao-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 14px;
        }

        .producao-table tbody tr:hover {
          background: #f9fafb;
        }

        .ordem-numero {
          font-weight: 700;
          color: #2563eb;
        }

        .actions {
          display: flex;
          gap: 8px;
        }

        .btn-icon {
          padding: 8px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .btn-view {
          background: #dbeafe;
          color: #1e40af;
        }

        .btn-view:hover {
          background: #bfdbfe;
        }

        .btn-delete {
          background: #fee2e2;
          color: #dc2626;
        }

        .btn-delete:hover {
          background: #fecaca;
        }

        .loading {
          padding: 60px;
          text-align: center;
          color: #6b7280;
        }

        .no-data {
          text-align: center;
          padding: 60px;
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}

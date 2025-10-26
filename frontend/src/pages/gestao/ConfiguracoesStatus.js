import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/gestao/marketplaces`;

export default function ConfiguracoesStatus() {
  const navigate = useNavigate();
  const [statusGeral, setStatusGeral] = useState([]);
  const [statusImpressao, setStatusImpressao] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [novoStatus, setNovoStatus] = useState(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [geralRes, impressaoRes] = await Promise.all([
        axios.get(`${API}/status?tipo=geral`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/status?tipo=impressao`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setStatusGeral(geralRes.data || []);
      setStatusImpressao(impressaoRes.data || []);
    } catch (error) {
      console.error('Erro ao buscar status:', error);
      toast.error('Erro ao carregar status');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (status) => {
    try {
      const token = localStorage.getItem('token');
      
      if (status.id && status.id !== 'novo') {
        // Atualizar existente
        await axios.put(
          `${API}/status/${status.id}`,
          status,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Status atualizado!');
      } else {
        // Criar novo
        await axios.post(
          `${API}/status`,
          { ...status, id: undefined },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Status criado!');
      }
      
      setEditando(null);
      setNovoStatus(null);
      fetchStatus();
    } catch (error) {
      console.error('Erro ao salvar status:', error);
      toast.error(error.response?.data?.detail || 'Erro ao salvar status');
    }
  };

  const handleDelete = async (statusId) => {
    if (!window.confirm('Tem certeza que deseja deletar este status?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/status/${statusId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Status deletado!');
      fetchStatus();
    } catch (error) {
      console.error('Erro ao deletar status:', error);
      toast.error(error.response?.data?.detail || 'Erro ao deletar status');
    }
  };

  const handleAddNew = (tipo) => {
    const ordem = tipo === 'geral' 
      ? statusGeral.length 
      : statusImpressao.length;
    
    setNovoStatus({
      id: 'novo',
      tipo: tipo,
      label: '',
      valor: '',
      cor: '#94A3B8',
      ordem: ordem,
      ativo: true
    });
  };

  const StatusCard = ({ status, isEditing, onEdit, onSave, onCancel, onDelete, onChange }) => {
    return (
      <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nome do Status</label>
              <input
                type="text"
                value={status.label || ''}
                onChange={(e) => {
                  e.preventDefault();
                  const newLabel = e.target.value;
                  const newValor = newLabel.toLowerCase().replace(/\s+/g, '_');
                  onChange({ ...status, label: newLabel, valor: newValor });
                }}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Em Produção"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Cor</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={status.cor}
                  onChange={(e) => onChange({ ...status, cor: e.target.value })}
                  className="w-12 h-10 bg-gray-800 border border-gray-600 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={status.cor}
                  onChange={(e) => onChange({ ...status, cor: e.target.value })}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg text-sm"
                  placeholder="#94A3B8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onSave(status)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                <Save className="w-4 h-4" />
                Salvar
              </button>
              <button
                onClick={onCancel}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 text-sm"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: status.cor }}
                />
                <span className="text-white font-medium">{status.label}</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => onEdit(status)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(status.id)}
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded transition-colors"
                  title="Deletar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div
              className="px-3 py-1.5 rounded text-sm font-medium text-center"
              style={{ backgroundColor: status.cor, color: 'white' }}
            >
              {status.label}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/gestao/marketplaces')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para Marketplaces
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">⚙️ Configurações de Status</h1>
          <p className="text-gray-400">Personalize os status usados nos pedidos marketplace</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Geral */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">🔵 Status Geral</h2>
              <button
                onClick={() => handleAddNew('geral')}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </div>

            <div className="space-y-3">
              {statusGeral.map((status) => (
                <StatusCard
                  key={status.id}
                  status={status}
                  isEditing={editando?.id === status.id}
                  onEdit={(s) => setEditando(s)}
                  onSave={handleSave}
                  onCancel={() => setEditando(null)}
                  onDelete={handleDelete}
                  onChange={(s) => setEditando(s)}
                />
              ))}

              {/* Novo Status */}
              {novoStatus && novoStatus.tipo === 'geral' && (
                <StatusCard
                  status={novoStatus}
                  isEditing={true}
                  onEdit={() => {}}
                  onSave={handleSave}
                  onCancel={() => setNovoStatus(null)}
                  onDelete={() => {}}
                  onChange={(s) => setNovoStatus(s)}
                />
              )}
            </div>
          </div>

          {/* Status Impressão */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">🖨️ Status Impressão</h2>
              <button
                onClick={() => handleAddNew('impressao')}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </div>

            <div className="space-y-3">
              {statusImpressao.map((status) => (
                <StatusCard
                  key={status.id}
                  status={status}
                  isEditing={editando?.id === status.id}
                  onEdit={(s) => setEditando(s)}
                  onSave={handleSave}
                  onCancel={() => setEditando(null)}
                  onDelete={handleDelete}
                  onChange={(s) => setEditando(s)}
                />
              ))}

              {/* Novo Status */}
              {novoStatus && novoStatus.tipo === 'impressao' && (
                <StatusCard
                  status={novoStatus}
                  isEditing={true}
                  onEdit={() => {}}
                  onSave={handleSave}
                  onCancel={() => setNovoStatus(null)}
                  onDelete={() => {}}
                  onChange={(s) => setNovoStatus(s)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Informações */}
        <div className="mt-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h3 className="text-blue-400 font-semibold mb-2">ℹ️ Informações</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Os status personalizados serão usados em todos os pedidos marketplace</li>
            <li>• Você pode adicionar, editar ou remover status conforme necessário</li>
            <li>• As cores dos status ajudam na identificação visual rápida</li>
            <li>• Apenas Director e Manager podem editar os status</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

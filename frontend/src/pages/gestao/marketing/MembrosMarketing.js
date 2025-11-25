import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Users, Plus, Edit2, Trash2, Trophy, TrendingUp, Clock, FileText } from 'lucide-react';
import ModalRelatorioDiario from '../../components/marketing/ModalRelatorioDiario';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export default function MembrosMarketing() {
  const [membros, setMembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [membroSelecionado, setMembroSelecionado] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    funcao: '',
    foto_url: ''
  });

  useEffect(() => {
    fetchMembros();
  }, []);

  const fetchMembros = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/gestao/marketing/membros`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembros(response.data);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
      toast.error('Erro ao carregar membros da equipe');
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirModal = (membro = null) => {
    if (membro) {
      setMembroSelecionado(membro);
      setFormData({
        nome: membro.nome,
        funcao: membro.funcao,
        foto_url: membro.foto_url || ''
      });
    } else {
      setMembroSelecionado(null);
      setFormData({ nome: '', funcao: '', foto_url: '' });
    }
    setModalAberto(true);
  };

  const handleFecharModal = () => {
    setModalAberto(false);
    setMembroSelecionado(null);
    setFormData({ nome: '', funcao: '', foto_url: '' });
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.funcao) {
      toast.error('Nome e função são obrigatórios');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (membroSelecionado) {
        // Atualizar
        await axios.put(
          `${BACKEND_URL}/api/gestao/marketing/membros/${membroSelecionado.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Membro atualizado com sucesso!');
      } else {
        // Criar
        await axios.post(
          `${BACKEND_URL}/api/gestao/marketing/membros`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Membro criado com sucesso!');
      }
      
      handleFecharModal();
      fetchMembros();
    } catch (error) {
      console.error('Erro ao salvar membro:', error);
      toast.error(error.response?.data?.detail || 'Erro ao salvar membro');
    }
  };

  const handleDeletar = async (membro) => {
    if (!window.confirm(`Tem certeza que deseja deletar ${membro.nome}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${BACKEND_URL}/api/gestao/marketing/membros/${membro.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Membro deletado com sucesso!');
      fetchMembros();
    } catch (error) {
      console.error('Erro ao deletar membro:', error);
      toast.error(error.response?.data?.detail || 'Erro ao deletar membro');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-600" />
            Equipe de Marketing
          </h1>
          <p className="text-gray-600 mt-1">Gerencie os membros da equipe e acompanhe o desempenho</p>
        </div>
        <button
          onClick={() => handleAbrirModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Adicionar Membro
        </button>
      </div>

      {/* Grid de Membros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {membros.map((membro) => (
          <div
            key={membro.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            {/* Foto e Nome */}
            <div className="flex flex-col items-center mb-4">
              {membro.foto_url ? (
                <img
                  src={membro.foto_url}
                  alt={membro.nome}
                  className="w-24 h-24 rounded-full object-cover mb-3 border-4 border-indigo-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center mb-3 border-4 border-indigo-200">
                  <Users className="w-12 h-12 text-indigo-600" />
                </div>
              )}
              <h3 className="text-lg font-semibold text-gray-900 text-center">{membro.nome}</h3>
              <p className="text-sm text-gray-600 text-center">{membro.funcao}</p>
            </div>

            {/* Estatísticas */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-gray-700">Pontuação</span>
                </div>
                <span className="text-sm font-bold text-yellow-600">{membro.pontuacao || 0}</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">Concluídas</span>
                </div>
                <span className="text-sm font-bold text-green-600">{membro.tarefas_concluidas || 0}</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">Em Andamento</span>
                </div>
                <span className="text-sm font-bold text-blue-600">{membro.tarefas_em_andamento || 0}</span>
              </div>

              {membro.tarefas_atrasadas > 0 && (
                <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-gray-700">Atrasadas</span>
                  </div>
                  <span className="text-sm font-bold text-red-600">{membro.tarefas_atrasadas}</span>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex gap-2">
              <button
                onClick={() => handleAbrirModal(membro)}
                className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => handleDeletar(membro)}
                className="bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {membros.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum membro cadastrado</h3>
          <p className="text-gray-600 mb-4">Comece adicionando membros à equipe de marketing</p>
          <button
            onClick={() => handleAbrirModal()}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Adicionar Primeiro Membro
          </button>
        </div>
      )}

      {/* Modal de Criar/Editar */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {membroSelecionado ? 'Editar Membro' : 'Novo Membro'}
            </h2>

            <form onSubmit={handleSalvar}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Função *
                  </label>
                  <input
                    type="text"
                    value={formData.funcao}
                    onChange={(e) => setFormData({ ...formData, funcao: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Ex: Designer Gráfico, Copywriter, Social Media..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL da Foto
                  </label>
                  <input
                    type="url"
                    value={formData.foto_url}
                    onChange={(e) => setFormData({ ...formData, foto_url: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="https://exemplo.com/foto.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Dica: Use <a href="https://i.pravatar.cc/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">pravatar.cc</a> para fotos de exemplo
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleFecharModal}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  {membroSelecionado ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

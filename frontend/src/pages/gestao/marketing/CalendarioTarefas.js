import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, CheckCircle, Clock, AlertCircle, List, CheckSquare, MessageSquare, Paperclip } from 'lucide-react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const STATUS_COLORS = {
  'A Fazer': '#94A3B8',
  'Em Andamento': '#F59E0B',
  'Concluído': '#10B981',
  'Atrasado': '#EF4444'
};

const PRIORIDADE_COLORS = {
  'Alta': '#DC2626',
  'Média': '#F59E0B',
  'Baixa': '#3B82F6'
};

export default function CalendarioTarefas() {
  const [membros, setMembros] = useState([]);
  const [membroSelecionado, setMembroSelecionado] = useState(null);
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [modalAberto, setModalAberto] = useState(false);
  const [tarefaSelecionada, setTarefaSelecionada] = useState(null);
  const [modoVisualizacao, setModoVisualizacao] = useState(false);
  const [user, setUser] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data_hora: '',
    status: 'A Fazer',
    prioridade: 'Média',
    tags: []
  });

  const [novaTag, setNovaTag] = useState('');
  const [novoItemChecklist, setNovoItemChecklist] = useState('');
  const [novoComentario, setNovoComentario] = useState('');
  const [abaSelecionada, setAbaSelecionada] = useState('detalhes'); // detalhes, checklist, comentarios

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    fetchMembros();
  }, []);

  useEffect(() => {
    if (membroSelecionado) {
      fetchTarefas();
    }
  }, [membroSelecionado]);

  const fetchMembros = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/gestao/marketing/membros`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const membrosAtivos = response.data.filter(m => m.ativo);
      setMembros(membrosAtivos);
      
      if (membrosAtivos.length > 0 && !membroSelecionado) {
        setMembroSelecionado(membrosAtivos[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
      toast.error('Erro ao carregar membros');
    } finally {
      setLoading(false);
    }
  };

  const fetchTarefas = async () => {
    if (!membroSelecionado) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${BACKEND_URL}/api/gestao/marketing/tarefas?membro_id=${membroSelecionado.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTarefas(response.data);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      toast.error('Erro ao carregar tarefas');
    }
  };

  const events = useMemo(() => {
    return tarefas.map(tarefa => ({
      id: tarefa.id,
      title: tarefa.titulo,
      start: new Date(tarefa.data_hora),
      end: new Date(tarefa.data_hora),
      resource: tarefa
    }));
  }, [tarefas]);

  const eventStyleGetter = (event) => {
    const tarefa = event.resource;
    const backgroundColor = STATUS_COLORS[tarefa.status] || '#94A3B8';
    
    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.85rem',
        padding: '2px 5px'
      }
    };
  };

  const handleSelectEvent = (event) => {
    const tarefa = event.resource;
    setTarefaSelecionada(tarefa);
    setModoVisualizacao(true);
    setModalAberto(true);
  };

  const handleSelectSlot = (slotInfo) => {
    // Apenas ADM pode criar tarefas (drag and drop implica criação)
    if (user?.role !== 'director') {
      toast.error('Apenas administradores podem criar tarefas arrastando no calendário');
      return;
    }
    
    handleAbrirModalCriar(slotInfo.start);
  };

  const handleAbrirModalCriar = (dataInicial = null) => {
    if (!membroSelecionado) {
      toast.error('Selecione um membro primeiro');
      return;
    }

    setTarefaSelecionada(null);
    setModoVisualizacao(false);
    
    const dataHora = dataInicial || new Date();
    setFormData({
      titulo: '',
      descricao: '',
      data_hora: format(dataHora, "yyyy-MM-dd'T'HH:mm"),
      status: 'A Fazer',
      prioridade: 'Média',
      tags: []
    });
    
    setModalAberto(true);
  };

  const handleEditarTarefa = () => {
    setFormData({
      titulo: tarefaSelecionada.titulo,
      descricao: tarefaSelecionada.descricao || '',
      data_hora: format(new Date(tarefaSelecionada.data_hora), "yyyy-MM-dd'T'HH:mm"),
      status: tarefaSelecionada.status,
      prioridade: tarefaSelecionada.prioridade,
      tags: tarefaSelecionada.tags || []
    });
    setModoVisualizacao(false);
  };

  const handleFecharModal = () => {
    setModalAberto(false);
    setTarefaSelecionada(null);
    setModoVisualizacao(false);
    setFormData({
      titulo: '',
      descricao: '',
      data_hora: '',
      status: 'A Fazer',
      prioridade: 'Média',
      tags: []
    });
  };

  const handleSalvarTarefa = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.data_hora) {
      toast.error('Título e data/hora são obrigatórios');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const tarefaData = {
        ...formData,
        membro_id: membroSelecionado.id,
        data_hora: new Date(formData.data_hora).toISOString(),
        checklist: tarefaSelecionada?.checklist || [],
        comentarios: tarefaSelecionada?.comentarios || [],
        arquivos: tarefaSelecionada?.arquivos || []
      };

      if (tarefaSelecionada) {
        // Atualizar
        await axios.put(
          `${BACKEND_URL}/api/gestao/marketing/tarefas/${tarefaSelecionada.id}`,
          tarefaData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Tarefa atualizada com sucesso!');
      } else {
        // Criar
        await axios.post(
          `${BACKEND_URL}/api/gestao/marketing/tarefas`,
          tarefaData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Tarefa criada com sucesso!');
      }

      handleFecharModal();
      fetchTarefas();
      fetchMembros(); // Atualizar estatísticas
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      toast.error(error.response?.data?.detail || 'Erro ao salvar tarefa');
    }
  };

  const handleDeletarTarefa = async () => {
    if (!window.confirm('Tem certeza que deseja deletar esta tarefa?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${BACKEND_URL}/api/gestao/marketing/tarefas/${tarefaSelecionada.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Tarefa deletada com sucesso!');
      handleFecharModal();
      fetchTarefas();
      fetchMembros();
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
      toast.error(error.response?.data?.detail || 'Erro ao deletar tarefa');
    }
  };

  const handleAdicionarTag = () => {
    if (novaTag.trim() && !formData.tags.includes(novaTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, novaTag.trim()]
      });
      setNovaTag('');
    }
  };

  const handleRemoverTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const handleAdicionarItemChecklist = async () => {
    if (!novoItemChecklist.trim() || !tarefaSelecionada) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${BACKEND_URL}/api/gestao/marketing/tarefas/${tarefaSelecionada.id}/checklist`,
        { texto: novoItemChecklist.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNovoItemChecklist('');
      toast.success('Item adicionado ao checklist');
      
      // Recarregar tarefa
      const response = await axios.get(
        `${BACKEND_URL}/api/gestao/marketing/tarefas?membro_id=${membroSelecionado.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const tarefaAtualizada = response.data.find(t => t.id === tarefaSelecionada.id);
      setTarefaSelecionada(tarefaAtualizada);
      fetchTarefas();
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      toast.error('Erro ao adicionar item ao checklist');
    }
  };

  const handleToggleItemChecklist = async (itemId, concluido) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${BACKEND_URL}/api/gestao/marketing/tarefas/${tarefaSelecionada.id}/checklist/${itemId}`,
        { concluido: !concluido },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Recarregar tarefa
      const response = await axios.get(
        `${BACKEND_URL}/api/gestao/marketing/tarefas?membro_id=${membroSelecionado.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const tarefaAtualizada = response.data.find(t => t.id === tarefaSelecionada.id);
      setTarefaSelecionada(tarefaAtualizada);
      fetchTarefas();
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
    }
  };

  const handleAdicionarComentario = async () => {
    if (!novoComentario.trim() || !tarefaSelecionada) return;

    try {
      const token = localStorage.getItem('token');
      const userName = user?.nome || user?.username || 'Usuário';
      
      await axios.post(
        `${BACKEND_URL}/api/gestao/marketing/tarefas/${tarefaSelecionada.id}/comentario`,
        { 
          autor: userName,
          texto: novoComentario.trim() 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNovoComentario('');
      toast.success('Comentário adicionado');
      
      // Recarregar tarefa
      const response = await axios.get(
        `${BACKEND_URL}/api/gestao/marketing/tarefas?membro_id=${membroSelecionado.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const tarefaAtualizada = response.data.find(t => t.id === tarefaSelecionada.id);
      setTarefaSelecionada(tarefaAtualizada);
      fetchTarefas();
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      toast.error('Erro ao adicionar comentário');
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
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="w-8 h-8 text-indigo-600" />
              Calendário de Tarefas
            </h1>
            <p className="text-gray-600 mt-1">Gerencie tarefas da equipe de marketing</p>
          </div>
          <button
            onClick={() => handleAbrirModalCriar()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nova Tarefa
          </button>
        </div>

        {/* Seletor de Membro */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Visualizar tarefas de:
          </label>
          <div className="flex gap-2 flex-wrap">
            {membros.map((membro) => (
              <button
                key={membro.id}
                onClick={() => setMembroSelecionado(membro)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  membroSelecionado?.id === membro.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {membro.foto_url && (
                  <img src={membro.foto_url} alt={membro.nome} className="w-6 h-6 rounded-full" />
                )}
                <span>{membro.nome}</span>
                {membro.tarefas_atrasadas > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {membro.tarefas_atrasadas}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Info do membro selecionado */}
        {membroSelecionado && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {membroSelecionado.foto_url && (
                  <img
                    src={membroSelecionado.foto_url}
                    alt={membroSelecionado.nome}
                    className="w-12 h-12 rounded-full border-2 border-white shadow"
                  />
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{membroSelecionado.nome}</h3>
                  <p className="text-sm text-gray-600">{membroSelecionado.funcao}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{membroSelecionado.pontuacao || 0}</div>
                  <div className="text-xs text-gray-600">Pontos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{membroSelecionado.tarefas_concluidas || 0}</div>
                  <div className="text-xs text-gray-600">Concluídas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{membroSelecionado.tarefas_em_andamento || 0}</div>
                  <div className="text-xs text-gray-600">Em Andamento</div>
                </div>
                {membroSelecionado.tarefas_atrasadas > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{membroSelecionado.tarefas_atrasadas}</div>
                    <div className="text-xs text-gray-600">Atrasadas</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calendário */}
      <div className="bg-white rounded-lg shadow p-4" style={{ height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable={user?.role === 'director'}
          eventPropGetter={eventStyleGetter}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          messages={{
            next: 'Próximo',
            previous: 'Anterior',
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
            agenda: 'Agenda',
            date: 'Data',
            time: 'Hora',
            event: 'Tarefa',
            noEventsInRange: 'Não há tarefas neste período',
          }}
          culture="pt-BR"
        />
      </div>

      {/* Modal de Tarefa */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full my-8">
            {/* Header do Modal */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {modoVisualizacao ? 'Detalhes da Tarefa' : (tarefaSelecionada ? 'Editar Tarefa' : 'Nova Tarefa')}
              </h2>
              <button onClick={handleFecharModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {modoVisualizacao ? (
                // Modo Visualização
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{tarefaSelecionada.titulo}</h3>
                    <div className="flex gap-2 flex-wrap">
                      <span 
                        className="px-3 py-1 rounded-full text-white text-sm"
                        style={{ backgroundColor: STATUS_COLORS[tarefaSelecionada.status] }}
                      >
                        {tarefaSelecionada.status}
                      </span>
                      <span 
                        className="px-3 py-1 rounded-full text-white text-sm"
                        style={{ backgroundColor: PRIORIDADE_COLORS[tarefaSelecionada.prioridade] }}
                      >
                        Prioridade {tarefaSelecionada.prioridade}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-gray-700 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Data e Hora:</span>
                    </div>
                    <p className="text-gray-900">
                      {format(new Date(tarefaSelecionada.data_hora), "dd/MM/yyyy 'às' HH:mm")}
                    </p>
                  </div>

                  {tarefaSelecionada.descricao && (
                    <div>
                      <div className="flex items-center gap-2 text-gray-700 mb-1">
                        <List className="w-4 h-4" />
                        <span className="font-medium">Descrição:</span>
                      </div>
                      <p className="text-gray-900 whitespace-pre-wrap">{tarefaSelecionada.descricao}</p>
                    </div>
                  )}

                  {tarefaSelecionada.tags && tarefaSelecionada.tags.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-gray-700 mb-2">
                        <span className="font-medium">Tags:</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {tarefaSelecionada.tags.map((tag, index) => (
                          <span key={index} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Checklist */}
                  <div>
                    <div className="flex items-center gap-2 text-gray-700 mb-2">
                      <CheckSquare className="w-4 h-4" />
                      <span className="font-medium">Checklist:</span>
                    </div>
                    {tarefaSelecionada.checklist && tarefaSelecionada.checklist.length > 0 ? (
                      <div className="space-y-2">
                        {tarefaSelecionada.checklist.map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={item.concluido}
                              onChange={() => handleToggleItemChecklist(item.id, item.concluido)}
                              className="w-4 h-4"
                            />
                            <span className={item.concluido ? 'line-through text-gray-500' : ''}>
                              {item.texto}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Nenhum item no checklist</p>
                    )}
                    
                    {/* Adicionar item ao checklist */}
                    <div className="flex gap-2 mt-3">
                      <input
                        type="text"
                        value={novoItemChecklist}
                        onChange={(e) => setNovoItemChecklist(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAdicionarItemChecklist()}
                        placeholder="Adicionar item..."
                        className="flex-1 border border-gray-300 rounded px-3 py-1 text-sm"
                      />
                      <button
                        onClick={handleAdicionarItemChecklist}
                        className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>

                  {tarefaSelecionada.pontos_ganhos !== null && tarefaSelecionada.pontos_ganhos !== undefined && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <span className="font-medium">Pontos ganhos:</span>
                        <span className="text-lg font-bold">{tarefaSelecionada.pontos_ganhos > 0 ? '+' : ''}{tarefaSelecionada.pontos_ganhos}</span>
                      </div>
                    </div>
                  )}

                  {/* Botões */}
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={handleEditarTarefa}
                      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                    >
                      Editar Tarefa
                    </button>
                    <button
                      onClick={handleDeletarTarefa}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              ) : (
                // Modo Edição/Criação
                <form onSubmit={handleSalvarTarefa} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título *
                    </label>
                    <input
                      type="text"
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      rows="3"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data e Hora *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.data_hora}
                        onChange={(e) => setFormData({ ...formData, data_hora: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="A Fazer">A Fazer</option>
                        <option value="Em Andamento">Em Andamento</option>
                        <option value="Concluído">Concluído</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridade
                    </label>
                    <select
                      value={formData.prioridade}
                      onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="Alta">Alta</option>
                      <option value="Média">Média</option>
                      <option value="Baixa">Baixa</option>
                    </select>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags
                    </label>
                    <div className="flex gap-2 mb-2 flex-wrap">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => handleRemoverTag(tag)}
                            className="text-indigo-500 hover:text-indigo-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={novaTag}
                        onChange={(e) => setNovaTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdicionarTag())}
                        placeholder="Adicionar tag..."
                        className="flex-1 border border-gray-300 rounded px-3 py-1 text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAdicionarTag}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3 pt-4 border-t">
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
                      {tarefaSelecionada ? 'Atualizar' : 'Criar Tarefa'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

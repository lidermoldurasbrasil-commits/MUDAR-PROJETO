import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { X, FileText, CheckCircle, Send } from 'lucide-react';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export default function ModalRelatorioDiario({ membro, onFechar, onEnviado }) {
  const [progresso, setProgresso] = useState('');
  const [tarefasConcluidas, setTarefasConcluidas] = useState([]);
  const [tarefasHoje, setTarefasHoje] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (membro) {
      fetchTarefasHoje();
      verificarRelatorioExistente();
    }
  }, [membro]);

  const verificarRelatorioExistente = async () => {
    try {
      const token = localStorage.getItem('token');
      const hoje = format(new Date(), 'yyyy-MM-dd');
      
      const response = await axios.get(
        `${BACKEND_URL}/api/gestao/marketing/relatorios?membro_id=${membro.id}&data_inicio=${hoje}&data_fim=${hoje}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.length > 0) {
        toast.info('Você já enviou o relatório de hoje!');
        onFechar();
      }
    } catch (error) {
      console.error('Erro ao verificar relatório:', error);
    }
  };

  const fetchTarefasHoje = async () => {
    try {
      const token = localStorage.getItem('token');
      const hoje = format(new Date(), 'yyyy-MM-dd');
      
      const response = await axios.get(
        `${BACKEND_URL}/api/gestao/marketing/tarefas?membro_id=${membro.id}&data_inicio=${hoje}T00:00:00&data_fim=${hoje}T23:59:59`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setTarefasHoje(response.data);
      // Pré-selecionar tarefas concluídas
      const concluidasIds = response.data
        .filter(t => t.status === 'Concluído')
        .map(t => t.id);
      setTarefasConcluidas(concluidasIds);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      toast.error('Erro ao carregar tarefas do dia');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTarefa = (tarefaId) => {
    if (tarefasConcluidas.includes(tarefaId)) {
      setTarefasConcluidas(tarefasConcluidas.filter(id => id !== tarefaId));
    } else {
      setTarefasConcluidas([...tarefasConcluidas, tarefaId]);
    }
  };

  const handleEnviar = async () => {
    if (!progresso.trim()) {
      toast.error('Por favor, descreva o progresso do dia');
      return;
    }

    setEnviando(true);
    try {
      const token = localStorage.getItem('token');
      const hoje = format(new Date(), 'yyyy-MM-dd');
      
      await axios.post(
        `${BACKEND_URL}/api/gestao/marketing/relatorios`,
        {
          membro_id: membro.id,
          membro_nome: membro.nome,
          data: hoje,
          progresso_texto: progresso,
          tarefas_concluidas: tarefasConcluidas
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Relatório enviado com sucesso! +3 pontos 🎉');
      onEnviado && onEnviado();
      onFechar();
    } catch (error) {
      console.error('Erro ao enviar relatório:', error);
      toast.error(error.response?.data?.detail || 'Erro ao enviar relatório');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              Relatório Diário de Progresso
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {membro.nome} • {format(new Date(), "dd/MM/yyyy")}
            </p>
          </div>
          <button 
            onClick={onFechar} 
            className="text-gray-500 hover:text-gray-700"
            disabled={enviando}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Progresso do Dia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descreva o progresso do dia *
                </label>
                <textarea
                  value={progresso}
                  onChange={(e) => setProgresso(e.target.value)}
                  placeholder="O que você realizou hoje? Quais foram os principais desafios e conquistas?"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[120px]"
                  disabled={enviando}
                />
              </div>

              {/* Tarefas do Dia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tarefas concluídas hoje
                </label>
                {tarefasHoje.length > 0 ? (
                  <div className="space-y-2 bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                    {tarefasHoje.map((tarefa) => (
                      <div
                        key={tarefa.id}
                        className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={tarefasConcluidas.includes(tarefa.id)}
                          onChange={() => handleToggleTarefa(tarefa.id)}
                          disabled={enviando}
                          className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{tarefa.titulo}</div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(tarefa.data_hora), "HH:mm")} • {tarefa.status}
                          </div>
                        </div>
                        {tarefa.status === 'Concluído' && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Nenhuma tarefa agendada para hoje</p>
                  </div>
                )}
              </div>

              {/* Info de Pontos */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <div className="font-semibold">Ganhe +3 pontos!</div>
                    <div className="text-sm">Por enviar o relatório diário</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onFechar}
            disabled={enviando}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleEnviar}
            disabled={enviando || !progresso.trim()}
            className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {enviando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar Relatório
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

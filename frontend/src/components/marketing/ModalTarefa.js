import React from 'react';
import { X, Clock, List, CheckSquare, MessageSquare, Send, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

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

export default function ModalTarefa({
  modalAberto,
  modoVisualizacao,
  tarefaSelecionada,
  formData,
  setFormData,
  novaTag,
  setNovaTag,
  novoItemChecklist,
  setNovoItemChecklist,
  novoComentario,
  setNovoComentario,
  abaSelecionada,
  setAbaSelecionada,
  onFechar,
  onSalvar,
  onEditar,
  onDeletar,
  onAdicionarTag,
  onRemoverTag,
  onAdicionarItemChecklist,
  onToggleItemChecklist,
  onAdicionarComentario
}) {
  if (!modalAberto) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-3xl w-full my-8">
        {/* Header do Modal */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {modoVisualizacao ? 'Detalhes da Tarefa' : (tarefaSelecionada ? 'Editar Tarefa' : 'Nova Tarefa')}
          </h2>
          <button onClick={onFechar} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Conteúdo do Modal */}
        <div className="max-h-[70vh] overflow-y-auto">
          {modoVisualizacao ? (
            // Modo Visualização com Abas
            <>
              {/* Tabs */}
              <div className="flex border-b px-6 pt-4">
                <button
                  onClick={() => setAbaSelecionada('detalhes')}
                  className={`px-4 py-2 font-medium transition-all ${
                    abaSelecionada === 'detalhes'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <List className="w-4 h-4" />
                    Detalhes
                  </div>
                </button>
                <button
                  onClick={() => setAbaSelecionada('checklist')}
                  className={`px-4 py-2 font-medium transition-all ${
                    abaSelecionada === 'checklist'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    Checklist ({tarefaSelecionada.checklist?.length || 0})
                  </div>
                </button>
                <button
                  onClick={() => setAbaSelecionada('comentarios')}
                  className={`px-4 py-2 font-medium transition-all ${
                    abaSelecionada === 'comentarios'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Comentários ({tarefaSelecionada.comentarios?.length || 0})
                  </div>
                </button>
              </div>

              {/* Conteúdo das Abas */}
              <div className="p-6">
                {abaSelecionada === 'detalhes' && (
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
                        <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                          {tarefaSelecionada.descricao}
                        </p>
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

                    {tarefaSelecionada.pontos_ganhos !== null && tarefaSelecionada.pontos_ganhos !== undefined && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <span className="font-medium">Pontos ganhos:</span>
                          <span className="text-lg font-bold">{tarefaSelecionada.pontos_ganhos > 0 ? '+' : ''}{tarefaSelecionada.pontos_ganhos}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {abaSelecionada === 'checklist' && (
                  <div className="space-y-3">
                    {tarefaSelecionada.checklist && tarefaSelecionada.checklist.length > 0 ? (
                      <div className="space-y-2">
                        {tarefaSelecionada.checklist.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <input
                              type="checkbox"
                              checked={item.concluido}
                              onChange={() => onToggleItemChecklist(item.id, item.concluido)}
                              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <span className={`flex-1 ${item.concluido ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {item.texto}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Nenhum item no checklist</p>
                    )}
                    
                    {/* Adicionar item ao checklist */}
                    <div className="flex gap-2 pt-3 border-t">
                      <input
                        type="text"
                        value={novoItemChecklist}
                        onChange={(e) => setNovoItemChecklist(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && onAdicionarItemChecklist()}
                        placeholder="Adicionar novo item..."
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                      />
                      <button
                        onClick={onAdicionarItemChecklist}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                      >
                        <CheckSquare className="w-4 h-4" />
                        Adicionar
                      </button>
                    </div>
                  </div>
                )}

                {abaSelecionada === 'comentarios' && (
                  <div className="space-y-4">
                    {/* Lista de Comentários */}
                    {tarefaSelecionada.comentarios && tarefaSelecionada.comentarios.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {tarefaSelecionada.comentarios.map((comentario) => (
                          <div key={comentario.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-900">{comentario.autor}</span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(comentario.created_at), "dd/MM/yyyy HH:mm")}
                              </span>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap">{comentario.texto}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Nenhum comentário ainda</p>
                    )}
                    
                    {/* Adicionar Comentário */}
                    <div className="pt-3 border-t">
                      <textarea
                        value={novoComentario}
                        onChange={(e) => setNovoComentario(e.target.value)}
                        placeholder="Escreva um comentário..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 min-h-[80px]"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            onAdicionarComentario();
                          }
                        }}
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Ctrl + Enter para enviar</span>
                        <button
                          onClick={onAdicionarComentario}
                          disabled={!novoComentario.trim()}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Enviar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3 p-6 border-t bg-gray-50">
                <button
                  onClick={onEditar}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  Editar Tarefa
                </button>
                <button
                  onClick={onDeletar}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Deletar
                </button>
              </div>
            </>
          ) : (
            // Modo Edição/Criação
            <form onSubmit={onSalvar} className="p-6">
              <div className="space-y-4">
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
                          onClick={() => onRemoverTag(tag)}
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
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), onAdicionarTag())}
                      placeholder="Adicionar tag..."
                      className="flex-1 border border-gray-300 rounded px-3 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={onAdicionarTag}
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
                    onClick={onFechar}
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
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

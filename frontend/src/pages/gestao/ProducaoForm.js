import { useState, useEffect } from 'react';
import { X, Save, Clock } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

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

const PRIORIDADE_OPTIONS = ['Normal', 'Urgente', 'Reentrega'];

export default function ProducaoForm({ ordem, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dados');
  const [fotosEntradaMaterial, setFotosEntradaMaterial] = useState(ordem?.fotos_entrada_material || []);
  const [fotosTrabalhoPronto, setFotosTrabalhoPronto] = useState(ordem?.fotos_trabalho_pronto || []);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  
  const [formData, setFormData] = useState({
    pedido_id: ordem?.pedido_id || '',
    numero_pedido: ordem?.numero_pedido || 0,
    cliente_nome: ordem?.cliente_nome || '',
    loja_origem: ordem?.loja_origem || 'fabrica',
    data_pedido: ordem?.data_pedido ? ordem.data_pedido.split('T')[0] : new Date().toISOString().split('T')[0],
    data_pagamento: ordem?.data_pagamento ? ordem.data_pagamento.split('T')[0] : '',
    data_entrega_prometida: ordem?.data_entrega_prometida ? ordem.data_entrega_prometida.split('T')[0] : '',
    descricao_itens: ordem?.descricao_itens || '',
    responsavel_atual: ordem?.responsavel_atual || 'Vendedor',
    status_interno: ordem?.status_interno || 'Armazenado na Loja',
    prioridade: ordem?.prioridade || 'Normal',
    observacoes_internas: ordem?.observacoes_internas || '',
    checklist: ordem?.checklist || {
      arte_aprovada: false,
      insumos_conferidos: false,
      pagamento_confirmado: false,
      qualidade_concluida: false,
      embalado: false
    },
    timeline: ordem?.timeline || []
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleChecklistChange = (field) => {
    setFormData(prev => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [field]: !prev.checklist[field]
      }
    }));
  };

  const handleUploadFoto = async (e, tipoFoto) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande! Máximo 5MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas');
      return;
    }

    try {
      setUploadingFoto(true);
      
      // Converter para base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        
        if (tipoFoto === 'entrada_material') {
          setFotosEntradaMaterial(prev => [...prev, base64]);
          toast.success('Foto de entrada adicionada!');
        } else {
          setFotosTrabalhoPronto(prev => [...prev, base64]);
          toast.success('Foto do trabalho pronto adicionada!');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao adicionar foto');
    } finally {
      setUploadingFoto(false);
      e.target.value = ''; // Limpar input
    }
  };

  const handleRemoveFoto = (index, tipoFoto) => {
    if (tipoFoto === 'entrada_material') {
      setFotosEntradaMaterial(prev => prev.filter((_, i) => i !== index));
    } else {
      setFotosTrabalhoPronto(prev => prev.filter((_, i) => i !== index));
    }
    toast.success('Foto removida');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Converter datas para ISO
      const dadosEnvio = {
        ...formData,
        data_pedido: new Date(formData.data_pedido).toISOString(),
        data_pagamento: formData.data_pagamento ? new Date(formData.data_pagamento).toISOString() : null,
        data_entrega_prometida: formData.data_entrega_prometida ? new Date(formData.data_entrega_prometida).toISOString() : null,
        fotos_entrada_material: fotosEntradaMaterial,
        fotos_trabalho_pronto: fotosTrabalhoPronto
      };

      if (ordem?.id) {
        await axios.put(`${API}/producao/${ordem.id}`, dadosEnvio, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Ordem atualizada!');
      } else {
        await axios.post(`${API}/producao`, dadosEnvio, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Ordem criada com sucesso!');
      }
      
      onSave();
    } catch (error) {
      console.error('Erro ao salvar ordem:', error);
      toast.error('Erro ao salvar ordem: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{maxWidth: '1000px', maxHeight: '90vh', overflow: 'auto'}}>
        <div className="modal-header">
          <h2>{ordem ? `Ordem #${ordem.numero_ordem}` : 'Nova Ordem de Produção'}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'dados' ? 'active' : ''}`}
            onClick={() => setActiveTab('dados')}
          >
            Dados da Ordem
          </button>
          <button 
            className={`tab ${activeTab === 'fotos' ? 'active' : ''}`}
            onClick={() => setActiveTab('fotos')}
          >
            📸 Fotos
          </button>
          <button 
            className={`tab ${activeTab === 'checklist' ? 'active' : ''}`}
            onClick={() => setActiveTab('checklist')}
          >
            Checklist
          </button>
          <button 
            className={`tab ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            Timeline
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            {/* Aba: Dados da Ordem */}
            {activeTab === 'dados' && (
              <div>
                <h3>Informações Básicas</h3>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Cliente *</label>
                    <input 
                      type="text" 
                      name="cliente_nome"
                      value={formData.cliente_nome}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Loja de Origem *</label>
                    <select name="loja_origem" value={formData.loja_origem} onChange={handleChange} required>
                      {LOJA_OPTIONS.map(loja => (
                        <option key={loja.value} value={loja.value}>{loja.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label>ID do Pedido Original</label>
                    <input 
                      type="text" 
                      name="pedido_id"
                      value={formData.pedido_id}
                      onChange={handleChange}
                      placeholder="ID do pedido de venda"
                    />
                  </div>
                </div>

                <h3 style={{marginTop: '30px'}}>Datas</h3>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Data do Pedido</label>
                    <input 
                      type="date" 
                      name="data_pedido"
                      value={formData.data_pedido}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="input-group">
                    <label>DATA DE PAGAMENTO</label>
                    <input 
                      type="date" 
                      name="data_pagamento"
                      value={formData.data_pagamento}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="input-group">
                    <label>Data Prometida de Entrega</label>
                    <input 
                      type="date" 
                      name="data_entrega_prometida"
                      value={formData.data_entrega_prometida}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <h3 style={{marginTop: '30px'}}>Controle de Produção</h3>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Status Interno *</label>
                    <select name="status_interno" value={formData.status_interno} onChange={handleChange} required>
                      {STATUS_OPTIONS.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Responsável Atual *</label>
                    <select name="responsavel_atual" value={formData.responsavel_atual} onChange={handleChange} required>
                      {RESPONSAVEL_OPTIONS.map(resp => (
                        <option key={resp} value={resp}>{resp}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Prioridade</label>
                    <select name="prioridade" value={formData.prioridade} onChange={handleChange}>
                      {PRIORIDADE_OPTIONS.map(prior => (
                        <option key={prior} value={prior}>{prior}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <h3 style={{marginTop: '30px'}}>Descrição dos Itens</h3>
                <div className="input-group">
                  <textarea 
                    name="descricao_itens"
                    value={formData.descricao_itens}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Resumo dos produtos/itens do pedido"
                  />
                </div>

                <h3 style={{marginTop: '30px'}}>Observações Internas</h3>
                <div className="input-group">
                  <textarea 
                    name="observacoes_internas"
                    value={formData.observacoes_internas}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Observações para uso interno da fábrica (não mostrar ao cliente)"
                  />
                </div>
              </div>
            )}


            {/* Aba: Fotos */}
            {activeTab === 'fotos' && (
              <div>
                <h3>📸 Fotos da Ordem de Produção</h3>
                <p style={{color: '#6b7280', marginBottom: '30px'}}>
                  Adicione fotos dos materiais recebidos e do trabalho finalizado
                </p>

                {/* Fotos Entrada de Material */}
                <div style={{marginBottom: '40px'}}>
                  <h4 style={{marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <span style={{fontSize: '24px'}}>📦</span>
                    Fotos - Entrada de Material
                  </h4>
                  <p style={{color: '#6b7280', fontSize: '14px', marginBottom: '15px'}}>
                    Fotografe os objetos/materiais que o cliente deixou para emoldurar
                  </p>

                  <div style={{marginBottom: '15px'}}>
                    <label style={{
                      display: 'inline-block',
                      padding: '10px 20px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      borderRadius: '5px',
                      cursor: uploadingFoto ? 'not-allowed' : 'pointer',
                      opacity: uploadingFoto ? 0.6 : 1
                    }}>
                      {uploadingFoto ? 'Adicionando...' : '+ Adicionar Foto de Entrada'}
                      <input
                        type="file"
                        accept="image/*"
                        style={{display: 'none'}}
                        onChange={(e) => handleUploadFoto(e, 'entrada_material')}
                        disabled={uploadingFoto}
                      />
                    </label>
                    <span style={{marginLeft: '10px', fontSize: '12px', color: '#6b7280'}}>
                      Máx 5MB por foto
                    </span>
                  </div>

                  {/* Grid de Fotos Entrada */}
                  {fotosEntradaMaterial.length > 0 ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                      gap: '15px',
                      marginTop: '15px'
                    }}>
                      {fotosEntradaMaterial.map((foto, index) => (
                        <div key={index} style={{
                          position: 'relative',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}>
                          <img 
                            src={foto} 
                            alt={`Entrada ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '150px',
                              objectFit: 'cover'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveFoto(index, 'entrada_material')}
                            style={{
                              position: 'absolute',
                              top: '5px',
                              right: '5px',
                              background: 'rgba(239, 68, 68, 0.9)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '28px',
                              height: '28px',
                              cursor: 'pointer',
                              fontSize: '18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      padding: '40px',
                      border: '2px dashed #d1d5db',
                      borderRadius: '8px',
                      textAlign: 'center',
                      color: '#9ca3af'
                    }}>
                      Nenhuma foto de entrada adicionada ainda
                    </div>
                  )}
                </div>

                {/* Fotos Trabalho Pronto */}
                <div>
                  <h4 style={{marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <span style={{fontSize: '24px'}}>✅</span>
                    Fotos - Trabalho Pronto
                  </h4>
                  <p style={{color: '#6b7280', fontSize: '14px', marginBottom: '15px'}}>
                    Fotografe o trabalho finalizado antes de embalar para documentação
                  </p>

                  <div style={{marginBottom: '15px'}}>
                    <label style={{
                      display: 'inline-block',
                      padding: '10px 20px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      borderRadius: '5px',
                      cursor: uploadingFoto ? 'not-allowed' : 'pointer',
                      opacity: uploadingFoto ? 0.6 : 1
                    }}>
                      {uploadingFoto ? 'Adicionando...' : '+ Adicionar Foto do Trabalho Pronto'}
                      <input
                        type="file"
                        accept="image/*"
                        style={{display: 'none'}}
                        onChange={(e) => handleUploadFoto(e, 'trabalho_pronto')}
                        disabled={uploadingFoto}
                      />
                    </label>
                    <span style={{marginLeft: '10px', fontSize: '12px', color: '#6b7280'}}>
                      Máx 5MB por foto
                    </span>
                  </div>

                  {/* Grid de Fotos Trabalho Pronto */}
                  {fotosTrabalhoPronto.length > 0 ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                      gap: '15px',
                      marginTop: '15px'
                    }}>
                      {fotosTrabalhoPronto.map((foto, index) => (
                        <div key={index} style={{
                          position: 'relative',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}>
                          <img 
                            src={foto} 
                            alt={`Trabalho Pronto ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '150px',
                              objectFit: 'cover'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveFoto(index, 'trabalho_pronto')}
                            style={{
                              position: 'absolute',
                              top: '5px',
                              right: '5px',
                              background: 'rgba(239, 68, 68, 0.9)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '28px',
                              height: '28px',
                              cursor: 'pointer',
                              fontSize: '18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      padding: '40px',
                      border: '2px dashed #d1d5db',
                      borderRadius: '8px',
                      textAlign: 'center',
                      color: '#9ca3af'
                    }}>
                      Nenhuma foto do trabalho pronto adicionada ainda
                    </div>
                  )}
                </div>

                <div style={{
                  marginTop: '30px',
                  padding: '15px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#4b5563'
                }}>
                  <strong>💡 Dica:</strong> As fotos serão salvas automaticamente ao criar/salvar a ordem de produção.
                </div>
              </div>
            )}

            {/* Aba: Checklist */}
            {activeTab === 'checklist' && (
              <div>
                <h3>Checklist de Etapas Técnicas</h3>
                <p style={{color: '#6b7280', marginBottom: '20px'}}>
                  Marque as etapas conforme forem concluídas
                </p>

                <div className="checklist-container">
                  <label className="checkbox-item">
                    <input 
                      type="checkbox"
                      checked={formData.checklist.arte_aprovada}
                      onChange={() => handleChecklistChange('arte_aprovada')}
                    />
                    <span>Arte aprovada pelo cliente?</span>
                  </label>

                  <label className="checkbox-item">
                    <input 
                      type="checkbox"
                      checked={formData.checklist.insumos_conferidos}
                      onChange={() => handleChecklistChange('insumos_conferidos')}
                    />
                    <span>Insumos conferidos pelo subgerente?</span>
                  </label>

                  <label className="checkbox-item">
                    <input 
                      type="checkbox"
                      checked={formData.checklist.pagamento_confirmado}
                      onChange={() => handleChecklistChange('pagamento_confirmado')}
                    />
                    <span>Pagamento confirmado?</span>
                  </label>

                  <label className="checkbox-item">
                    <input 
                      type="checkbox"
                      checked={formData.checklist.qualidade_concluida}
                      onChange={() => handleChecklistChange('qualidade_concluida')}
                    />
                    <span>Conferência de qualidade concluída?</span>
                  </label>

                  <label className="checkbox-item">
                    <input 
                      type="checkbox"
                      checked={formData.checklist.embalado}
                      onChange={() => handleChecklistChange('embalado')}
                    />
                    <span>Embalado para envio/retirada?</span>
                  </label>
                </div>
              </div>
            )}

            {/* Aba: Timeline */}
            {activeTab === 'timeline' && (
              <div>
                <h3>Histórico de Andamento</h3>
                <p style={{color: '#6b7280', marginBottom: '20px'}}>
                  Registro automático de todas as mudanças
                </p>

                {formData.timeline && formData.timeline.length > 0 ? (
                  <div className="timeline-container">
                    {formData.timeline.map((entry, index) => (
                      <div key={index} className="timeline-entry">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="timeline-date">
                              <Clock size={14} />
                              {formatDateTime(entry.data_hora)}
                            </span>
                            <span className="timeline-user">{entry.usuario}</span>
                          </div>
                          <div className="timeline-change">{entry.mudanca}</div>
                          {entry.comentario && (
                            <div className="timeline-comment">{entry.comentario}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{padding: '40px', textAlign: 'center', color: '#9ca3af'}}>
                    Nenhum histórico ainda. O histórico será criado automaticamente ao salvar mudanças.
                  </div>
                )}
              </div>
            )}

          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Save size={18} />
              {loading ? 'Salvando...' : 'Salvar Ordem'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          width: 90%;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 25px;
          border-bottom: 2px solid #e5e7eb;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          color: #1f2937;
        }

        .btn-close {
          background: none;
          border: none;
          font-size: 32px;
          cursor: pointer;
          color: #9ca3af;
          line-height: 1;
          padding: 0;
          width: 32px;
          height: 32px;
        }

        .btn-close:hover {
          color: #374151;
        }

        .tabs {
          display: flex;
          border-bottom: 2px solid #e5e7eb;
          background: #f9fafb;
        }

        .tab {
          padding: 16px 24px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
        }

        .tab:hover {
          color: #2d7a5e;
        }

        .tab.active {
          color: #2d7a5e;
          border-bottom-color: #2d7a5e;
        }

        .modal-body {
          padding: 25px;
        }

        h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 16px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
        }

        .input-group label {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
        }

        .input-group input,
        .input-group select,
        .input-group textarea {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .input-group textarea {
          resize: vertical;
          font-family: inherit;
        }

        .checklist-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .checkbox-item:hover {
          border-color: #2d7a5e;
          background: #f0fdf4;
        }

        .checkbox-item input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .checkbox-item span {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .timeline-container {
          position: relative;
          padding-left: 30px;
        }

        .timeline-entry {
          position: relative;
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-left: 2px solid #e5e7eb;
        }

        .timeline-entry:last-child {
          border-left-color: transparent;
        }

        .timeline-dot {
          position: absolute;
          left: -6px;
          top: 6px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #2d7a5e;
          border: 2px solid white;
          box-shadow: 0 0 0 2px #2d7a5e;
        }

        .timeline-content {
          margin-left: 20px;
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .timeline-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #6b7280;
        }

        .timeline-user {
          font-size: 12px;
          font-weight: 600;
          color: #2d7a5e;
        }

        .timeline-change {
          font-size: 14px;
          font-weight: 500;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .timeline-comment {
          font-size: 13px;
          color: #6b7280;
          font-style: italic;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 25px;
          border-top: 2px solid #e5e7eb;
        }

        .btn-secondary {
          padding: 10px 20px;
          border: 2px solid #d1d5db;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .btn-secondary:hover {
          background: #f9fafb;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
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

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Upload, Download } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/gestao`;

const TIPOS_INSUMO = [
  'Moldura',
  'Vidro',
  'MDF',
  'Espelho',
  'Papel',
  'Adesivo',
  'Acessório',
  'Passe-partout'
];

const UNIDADES = ['cm', 'm²', 'unidade'];

export default function Insumos() {
  const { lojaAtual } = useOutletContext();
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');

  const [formData, setFormData] = useState({
    codigo: '',
    tipo_insumo: 'Moldura',
    descricao: '',
    unidade_medida: 'cm',
    custo_unitario: '',
    barra_padrao: 270,
    fornecedor: '',
    ativo: true,
    loja_id: lojaAtual
  });

  useEffect(() => {
    fetchInsumos();
  }, [lojaAtual, tipoFilter]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, loja_id: lojaAtual }));
  }, [lojaAtual]);

  const fetchInsumos = async () => {
    try {
      setLoading(true);
      const params = { loja: lojaAtual };
      if (tipoFilter) params.tipo = tipoFilter;
      
      const res = await axios.get(`${API}/insumos`, { params });
      setInsumos(res.data || []);
    } catch (error) {
      console.error('Erro ao carregar insumos:', error);
      setInsumos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingInsumo) {
        await axios.put(`${API}/insumos/${editingInsumo.id}`, formData);
        toast.success('Insumo atualizado!');
      } else {
        await axios.post(`${API}/insumos`, formData);
        toast.success('Insumo cadastrado!');
      }
      
      setShowForm(false);
      setEditingInsumo(null);
      resetForm();
      fetchInsumos();
    } catch (error) {
      toast.error('Erro ao salvar insumo');
    }
  };

  const handleEdit = (insumo) => {
    setEditingInsumo(insumo);
    setFormData(insumo);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este insumo?')) return;
    
    try {
      await axios.delete(`${API}/insumos/${id}`);
      toast.success('Insumo excluído!');
      fetchInsumos();
    } catch (error) {
      toast.error('Erro ao excluir insumo');
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      tipo_insumo: 'Moldura',
      descricao: '',
      unidade_medida: 'cm',
      custo_unitario: '',
      barra_padrao: 270,
      fornecedor: '',
      ativo: true,
      loja_id: lojaAtual
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const filteredInsumos = insumos.filter(i => {
    const matchSearch = !searchTerm || 
      i.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="insumos-page">
      <div className="page-header">
        <h2>Cadastro de Insumos</h2>
        <div className="header-actions">
          <button className="btn-secondary">
            <Upload size={18} />
            Importar CSV
          </button>
          <button className="btn-secondary">
            <Download size={18} />
            Exportar CSV
          </button>
          <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus size={18} />
            Novo Insumo
          </button>
        </div>
      </div>

      {!showForm ? (
        <>
          {/* Filtros */}
          <div className="filtros-section">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar por código ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select 
              className="filter-select"
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
            >
              <option value="">Todos os Tipos</option>
              {TIPOS_INSUMO.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Tabela de Insumos */}
          <div className="table-container">
            {loading ? (
              <div className="loading">Carregando...</div>
            ) : filteredInsumos.length === 0 ? (
              <div className="empty-state">
                <p>Nenhum insumo cadastrado</p>
                <button className="btn-secondary" onClick={() => { resetForm(); setShowForm(true); }}>
                  Cadastrar Primeiro Insumo
                </button>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Tipo</th>
                    <th>Descrição</th>
                    <th>Unidade</th>
                    <th>Custo Unitário</th>
                    <th>Barra Padrão</th>
                    <th>Fornecedor</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInsumos.map(insumo => (
                    <tr key={insumo.id}>
                      <td>{insumo.codigo}</td>
                      <td><span className="badge-tipo">{insumo.tipo_insumo}</span></td>
                      <td>{insumo.descricao}</td>
                      <td>{insumo.unidade_medida}</td>
                      <td className="text-right">R$ {Number(insumo.custo_unitario).toFixed(2)}</td>
                      <td className="text-center">
                        {insumo.tipo_insumo === 'Moldura' ? `${insumo.barra_padrao} cm` : '-'}
                      </td>
                      <td>{insumo.fornecedor || '-'}</td>
                      <td>
                        <span className={`status-badge ${insumo.ativo ? 'ativo' : 'inativo'}`}>
                          {insumo.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <button onClick={() => handleEdit(insumo)} className="btn-icon">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(insumo.id)} className="btn-icon btn-danger">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        /* Formulário */
        <div className="form-container">
          <div className="form-header">
            <h3>{editingInsumo ? 'Editar Insumo' : 'Novo Insumo'}</h3>
            <button onClick={() => { setShowForm(false); setEditingInsumo(null); resetForm(); }} className="btn-close">
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="insumo-form">
            <div className="form-grid-3">
              <div className="form-group">
                <label>Código / Referência: *</label>
                <input
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Tipo de Insumo: *</label>
                <select
                  name="tipo_insumo"
                  value={formData.tipo_insumo}
                  onChange={handleChange}
                  required
                >
                  {TIPOS_INSUMO.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Unidade de Medida: *</label>
                <select
                  name="unidade_medida"
                  value={formData.unidade_medida}
                  onChange={handleChange}
                  required
                >
                  {UNIDADES.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label>Descrição: *</label>
                <input
                  type="text"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Custo Unitário: *</label>
                <input
                  type="number"
                  step="0.01"
                  name="custo_unitario"
                  value={formData.custo_unitario}
                  onChange={handleChange}
                  required
                />
              </div>

              {formData.tipo_insumo === 'Moldura' && (
                <div className="form-group">
                  <label>Barra Padrão (cm):</label>
                  <input
                    type="number"
                    step="0.01"
                    name="barra_padrao"
                    value={formData.barra_padrao}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Fornecedor:</label>
                <input
                  type="text"
                  name="fornecedor"
                  value={formData.fornecedor}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="ativo"
                    checked={formData.ativo}
                    onChange={handleChange}
                  />
                  <span>Ativo</span>
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => { setShowForm(false); setEditingInsumo(null); resetForm(); }} className="btn-cancel">
                Cancelar
              </button>
              <button type="submit" className="btn-save">
                Salvar Insumo
              </button>
            </div>
          </form>
        </div>
      )}

      <style jsx>{`
        .insumos-page {
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }

        .page-header h2 {
          font-size: 26px;
          color: #2d3748;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .btn-primary, .btn-secondary {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          border: none;
        }

        .btn-primary {
          background: #5dceaa;
          color: white;
        }

        .btn-primary:hover {
          background: #4db89a;
        }

        .btn-secondary {
          background: white;
          color: #2d3748;
          border: 1px solid #e2e8f0;
        }

        .btn-secondary:hover {
          background: #f7fafc;
        }

        .filtros-section {
          background: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 25px;
          display: flex;
          gap: 15px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        .search-box {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }

        .search-box input {
          flex: 1;
          border: none;
          background: none;
          font-size: 14px;
          outline: none;
        }

        .filter-select {
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          background: #f7fafc;
          cursor: pointer;
          min-width: 200px;
        }

        .table-container {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th {
          text-align: left;
          padding: 12px;
          background: #f7fafc;
          color: #4a5568;
          font-size: 13px;
          font-weight: 600;
          border-bottom: 2px solid #e2e8f0;
        }

        .data-table td {
          padding: 14px 12px;
          border-bottom: 1px solid #f0f0f0;
          font-size: 14px;
          color: #2d3748;
        }

        .text-right {
          text-align: right;
        }

        .text-center {
          text-align: center;
        }

        .badge-tipo {
          background: #edf2f7;
          color: #2d3748;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge.ativo {
          background: #c6f6d5;
          color: #22543d;
        }

        .status-badge.inativo {
          background: #fed7d7;
          color: #742a2a;
        }

        .actions {
          display: flex;
          gap: 8px;
        }

        .btn-icon {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 6px 8px;
          cursor: pointer;
          color: #4a5568;
          transition: all 0.2s;
          display: flex;
          align-items: center;
        }

        .btn-icon:hover {
          background: #edf2f7;
        }

        .btn-icon.btn-danger:hover {
          background: #fff5f5;
          border-color: #fc8181;
          color: #e53e3e;
        }

        .loading, .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #718096;
        }

        .form-container {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e2e8f0;
        }

        .form-header h3 {
          margin: 0;
          font-size: 20px;
          color: #2d3748;
        }

        .btn-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #718096;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }

        .form-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 25px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group.checkbox-group {
          flex-direction: row;
          align-items: center;
        }

        .form-group.checkbox-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          margin: 0;
        }

        .form-group.checkbox-group input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .form-group label {
          font-size: 14px;
          color: #4a5568;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .form-group input,
        .form-group select {
          padding: 10px 12px;
          border: 1px solid #cbd5e0;
          border-radius: 6px;
          font-size: 14px;
          color: #2d3748;
          transition: all 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #5dceaa;
          box-shadow: 0 0 0 3px rgba(93, 206, 170, 0.1);
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .btn-save, .btn-cancel {
          padding: 12px 32px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .btn-save {
          background: #5dceaa;
          color: white;
        }

        .btn-save:hover {
          background: #4db89a;
        }

        .btn-cancel {
          background: #e2e8f0;
          color: #2d3748;
        }

        .btn-cancel:hover {
          background: #cbd5e0;
        }
      `}</style>
    </div>
  );
}

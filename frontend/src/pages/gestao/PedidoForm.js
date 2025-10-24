import { useState, useEffect } from 'react';
import { X, Save, Calculator } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/gestao`;

const TIPOS_PRODUTO = ['Quadro', 'Espelho', 'Moldura avulsa', 'Fine-Art'];

export default function PedidoForm({ pedido, lojaAtual, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('basico');
  const [loading, setLoading] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [insumos, setInsumos] = useState([]);
  
  const [formData, setFormData] = useState({
    cliente_nome: pedido?.cliente_nome || '',
    tipo_produto: pedido?.tipo_produto || 'Quadro',
    quantidade: pedido?.quantidade || 1,
    altura: pedido?.altura || '',
    largura: pedido?.largura || '',
    
    // Insumos
    moldura_id: pedido?.moldura_id || '',
    usar_vidro: pedido?.usar_vidro || false,
    vidro_id: pedido?.vidro_id || '',
    usar_mdf: pedido?.usar_mdf || false,
    mdf_id: pedido?.mdf_id || '',
    usar_papel: pedido?.usar_papel || false,
    papel_id: pedido?.papel_id || '',
    usar_passepartout: pedido?.usar_passepartout || false,
    passepartout_id: pedido?.passepartout_id || '',
    usar_acessorios: pedido?.usar_acessorios || false,
    acessorios_ids: pedido?.acessorios_ids || [],
    
    // Controle
    responsavel: pedido?.responsavel || '',
    prazo_entrega: pedido?.prazo_entrega || '',
    observacoes: pedido?.observacoes || '',
    
    // Cálculos (calculados)
    area: pedido?.area || 0,
    perimetro: pedido?.perimetro || 0,
    barras_necessarias: pedido?.barras_necessarias || 0,
    sobra: pedido?.sobra || 0,
    custo_perda: pedido?.custo_perda || 0,
    itens: pedido?.itens || [],
    custo_total: pedido?.custo_total || 0,
    markup: pedido?.markup || 3.0,
    preco_venda: pedido?.preco_venda || 0,
    margem_percentual: pedido?.margem_percentual || 0,
    
    loja_id: lojaAtual || 'fabrica'
  });

  useEffect(() => {
    fetchProdutosEInsumos();
  }, []);

  const fetchProdutosEInsumos = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Buscar produtos (molduras, vidros, etc.)
      const produtosRes = await axios.get(`${API}/produtos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProdutos(produtosRes.data);
      
      // Buscar insumos cadastrados
      const insumosRes = await axios.get(`${API}/insumos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInsumos(insumosRes.data);
    } catch (error) {
      console.error('Erro ao buscar produtos/insumos:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCalcular = async () => {
    if (!formData.altura || !formData.largura) {
      toast.error('Preencha altura e largura');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/pedidos/calcular`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFormData(prev => ({
        ...prev,
        ...response.data
      }));
      
      toast.success('Cálculo realizado com sucesso!');
      setActiveTab('calculo');
    } catch (error) {
      console.error('Erro ao calcular:', error);
      toast.error('Erro ao calcular orçamento');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.cliente_nome || !formData.altura || !formData.largura) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      if (pedido?.id) {
        await axios.put(`${API}/pedidos/${pedido.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Pedido atualizado com sucesso!');
      } else {
        await axios.post(`${API}/pedidos`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Pedido criado com sucesso!');
      }
      
      onSave();
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      toast.error('Erro ao salvar pedido');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Filtrar produtos por família
  const molduras = produtos.filter(p => p.familia && p.familia.includes('Moldura'));
  const vidros = produtos.filter(p => p.familia && p.familia.includes('Vidro'));
  const mdfs = produtos.filter(p => p.familia && (p.familia.includes('Substrato') || p.familia.includes('MDF')));
  const papeis = produtos.filter(p => p.familia && (p.familia.includes('Papel') || p.familia.includes('Adesivo')));
  const passepartouts = produtos.filter(p => p.familia && p.familia.includes('PasseParTout'));
  const acessorios = produtos.filter(p => p.familia && p.familia.includes('Acessório'));

  return (
    <div className="pedido-form-container">
      <div className="form-header">
        <h2>{pedido ? 'Editar Pedido' : 'Novo Pedido de Manufatura'}</h2>
        <button className="btn-close" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'basico' ? 'active' : ''}`}
          onClick={() => setActiveTab('basico')}
        >
          Dados Básicos
        </button>
        <button
          className={`tab ${activeTab === 'composicao' ? 'active' : ''}`}
          onClick={() => setActiveTab('composicao')}
        >
          Composição
        </button>
        <button
          className={`tab ${activeTab === 'calculo' ? 'active' : ''}`}
          onClick={() => setActiveTab('calculo')}
        >
          Cálculo Técnico
        </button>
      </div>

      <form onSubmit={handleSubmit} className="pedido-form">
        {/* TAB 1: Dados Básicos */}
        {activeTab === 'basico' && (
          <div className="tab-content">
            <h3>Informações do Pedido</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Cliente: *</label>
                <input
                  type="text"
                  name="cliente_nome"
                  value={formData.cliente_nome}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tipo de Produto: *</label>
                <select
                  name="tipo_produto"
                  value={formData.tipo_produto}
                  onChange={handleChange}
                >
                  {TIPOS_PRODUTO.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Altura (cm): *</label>
                <input
                  type="number"
                  step="0.01"
                  name="altura"
                  value={formData.altura}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Largura (cm): *</label>
                <input
                  type="number"
                  step="0.01"
                  name="largura"
                  value={formData.largura}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Quantidade:</label>
                <input
                  type="number"
                  name="quantidade"
                  value={formData.quantidade}
                  onChange={handleChange}
                  min="1"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Responsável:</label>
                <input
                  type="text"
                  name="responsavel"
                  value={formData.responsavel}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Prazo de Entrega:</label>
                <input
                  type="date"
                  name="prazo_entrega"
                  value={formData.prazo_entrega}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Observações:</label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                rows="3"
              />
            </div>
          </div>
        )}

        {/* TAB 2: Composição */}
        {activeTab === 'composicao' && (
          <div className="tab-content">
            <h3>Seleção de Insumos</h3>

            <div className="form-group">
              <label>Moldura:</label>
              <select
                name="moldura_id"
                value={formData.moldura_id}
                onChange={handleChange}
              >
                <option value="">Selecione...</option>
                {molduras.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.referencia} - {m.descricao}
                  </option>
                ))}
              </select>
            </div>

            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="usar_vidro"
                  checked={formData.usar_vidro}
                  onChange={handleChange}
                />
                Usar Vidro
              </label>
            </div>

            {formData.usar_vidro && (
              <div className="form-group">
                <label>Tipo de Vidro:</label>
                <select
                  name="vidro_id"
                  value={formData.vidro_id}
                  onChange={handleChange}
                >
                  <option value="">Selecione...</option>
                  {vidros.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.referencia} - {v.descricao}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="usar_mdf"
                  checked={formData.usar_mdf}
                  onChange={handleChange}
                />
                Usar MDF/Substrato
              </label>
            </div>

            {formData.usar_mdf && (
              <div className="form-group">
                <label>Tipo de MDF/Substrato:</label>
                <select
                  name="mdf_id"
                  value={formData.mdf_id}
                  onChange={handleChange}
                >
                  <option value="">Selecione...</option>
                  {mdfs.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.referencia} - {m.descricao}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="usar_papel"
                  checked={formData.usar_papel}
                  onChange={handleChange}
                />
                Usar Papel/Adesivo
              </label>
            </div>

            {formData.usar_papel && (
              <div className="form-group">
                <label>Tipo de Papel/Adesivo:</label>
                <select
                  name="papel_id"
                  value={formData.papel_id}
                  onChange={handleChange}
                >
                  <option value="">Selecione...</option>
                  {papeis.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.referencia} - {p.descricao}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="usar_passepartout"
                  checked={formData.usar_passepartout}
                  onChange={handleChange}
                />
                Usar Passe-partout
              </label>
            </div>

            {formData.usar_passepartout && (
              <div className="form-group">
                <label>Tipo de Passe-partout:</label>
                <select
                  name="passepartout_id"
                  value={formData.passepartout_id}
                  onChange={handleChange}
                >
                  <option value="">Selecione...</option>
                  {passepartouts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.referencia} - {p.descricao}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button type="button" className="btn-calculate" onClick={handleCalcular}>
              <Calculator size={18} />
              Calcular Custos
            </button>
          </div>
        )}

        {/* TAB 3: Cálculo Técnico */}
        {activeTab === 'calculo' && (
          <div className="tab-content">
            <h3>Ficha Técnica</h3>

            <div className="calculo-grid">
              <div className="calculo-card">
                <label>Área (m²)</label>
                <div className="valor">{formData.area.toFixed(4)}</div>
              </div>
              <div className="calculo-card">
                <label>Perímetro (cm)</label>
                <div className="valor">{formData.perimetro.toFixed(2)}</div>
              </div>
              <div className="calculo-card">
                <label>Barras Necessárias</label>
                <div className="valor">{formData.barras_necessarias}</div>
              </div>
              <div className="calculo-card">
                <label>Sobra (cm)</label>
                <div className="valor">{formData.sobra.toFixed(2)}</div>
              </div>
            </div>

            {formData.sobra < 100 && formData.sobra > 0 && (
              <div className="alerta-perda">
                ⚠️ Perda técnica cobrada: {formatCurrency(formData.custo_perda)}
              </div>
            )}

            <h4>Composição de Custos</h4>
            <table className="composicao-table">
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Quantidade</th>
                  <th>Unidade</th>
                  <th>Custo Unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {formData.itens.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.insumo_descricao}</td>
                    <td>{item.quantidade.toFixed(2)}</td>
                    <td>{item.unidade}</td>
                    <td>{formatCurrency(item.custo_unitario)}</td>
                    <td>{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="totais">
              <div className="total-item">
                <span>Custo Total:</span>
                <strong>{formatCurrency(formData.custo_total)}</strong>
              </div>
              <div className="total-item">
                <span>Markup:</span>
                <strong>{formData.markup.toFixed(2)}x ({((formData.markup - 1) * 100).toFixed(1)}%)</strong>
              </div>
              <div className="total-item destaque">
                <span>Preço de Venda:</span>
                <strong>{formatCurrency(formData.preco_venda)}</strong>
              </div>
              <div className="total-item">
                <span>Margem:</span>
                <strong>{formData.margem_percentual.toFixed(1)}%</strong>
              </div>
              <div className="markup-info">
                <small>💡 Markup calculado automaticamente baseado no prazo de pagamento selecionado em cada produto</small>
              </div>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-save" disabled={loading}>
            <Save size={18} />
            {loading ? 'Salvando...' : 'Salvar Pedido'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .pedido-form-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .form-header h2 {
          font-size: 24px;
          color: #2d3748;
          margin: 0;
        }

        .btn-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #718096;
          padding: 8px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .btn-close:hover {
          background: #f7fafc;
          color: #2d3748;
        }

        .tabs {
          display: flex;
          gap: 5px;
          margin-bottom: 20px;
          border-bottom: 2px solid #e2e8f0;
        }

        .tab {
          padding: 12px 24px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-size: 15px;
          font-weight: 500;
          color: #718096;
          transition: all 0.2s;
        }

        .tab.active {
          color: #5dceaa;
          border-bottom-color: #5dceaa;
        }

        .tab:hover {
          color: #5dceaa;
        }

        .pedido-form {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        .tab-content h3 {
          font-size: 18px;
          color: #2d3748;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
        }

        .tab-content h4 {
          font-size: 16px;
          color: #2d3748;
          margin: 20px 0 15px 0;
        }

        .form-row {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
        }

        .form-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          margin-bottom: 15px;
        }

        .form-group label {
          font-size: 14px;
          color: #4a5568;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 10px 12px;
          border: 1px solid #cbd5e0;
          border-radius: 6px;
          font-size: 14px;
          color: #2d3748;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #5dceaa;
          box-shadow: 0 0 0 3px rgba(93, 206, 170, 0.1);
        }

        .checkbox-group {
          margin: 15px 0;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #2d3748;
          cursor: pointer;
        }

        .checkbox-group input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .btn-calculate {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #3b82f6;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          margin-top: 20px;
          transition: all 0.2s;
        }

        .btn-calculate:hover {
          background: #2563eb;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .calculo-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }

        .calculo-card {
          background: #f7fafc;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
        }

        .calculo-card label {
          font-size: 12px;
          color: #718096;
          display: block;
          margin-bottom: 8px;
        }

        .calculo-card .valor {
          font-size: 20px;
          font-weight: 600;
          color: #2d3748;
        }

        .alerta-perda {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          color: #92400e;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .composicao-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }

        .composicao-table th {
          background: #f7fafc;
          padding: 12px;
          text-align: left;
          font-size: 13px;
          font-weight: 600;
          color: #4a5568;
          border-bottom: 2px solid #e2e8f0;
        }

        .composicao-table td {
          padding: 12px;
          font-size: 14px;
          color: #2d3748;
          border-bottom: 1px solid #e2e8f0;
        }

        .totais {
          background: #f7fafc;
          padding: 20px;
          border-radius: 8px;
        }

        .total-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 15px;
        }

        .total-item.destaque {
          font-size: 18px;
          padding-top: 12px;
          margin-top: 12px;
          border-top: 2px solid #e2e8f0;
          color: #5dceaa;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .btn-save,
        .btn-cancel {
          padding: 12px 32px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          border: none;
        }

        .btn-save {
          background: #5dceaa;
          color: white;
        }

        .btn-save:hover:not(:disabled) {
          background: #4db89a;
          box-shadow: 0 4px 12px rgba(93, 206, 170, 0.3);
        }

        .btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-cancel {
          background: #e2e8f0;
          color: #4a5568;
        }

        .btn-cancel:hover {
          background: #cbd5e0;
        }
      `}</style>
    </div>
  );
}

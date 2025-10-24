import { useState } from 'react';
import { X, Save, Copy } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/gestao`;

const FAMILIAS = [
  '1-Molduras',
  '2-Acessórios',
  '3-Vidros, Espelhos e Acrílicos',
  '4-Substratos',
  '5-Tintas e Vernizes',
  '6-Gravuras',
  '7-Bases (Eucatex, Foamboard)',
  '8-Ferragens',
  '9-PasseParTouts',
  '10-Embalagens',
  '11-Sarrafos',
  '12-Acessórios'
];

export default function ProdutoForm({ produto, lojaAtual, onClose, onSave }) {
  const [formData, setFormData] = useState({
    // Características do Produto
    referencia: produto?.referencia || '',
    descricao: produto?.descricao || '',
    codigo: produto?.codigo || '',
    fornecedor: produto?.fornecedor || '',
    localizacao: produto?.localizacao || '',
    familia: produto?.familia || 'Molduras',
    tipo_produto: produto?.tipo_produto || '',
    ref_loja: produto?.ref_loja || '',
    largura: produto?.largura || '2.00',
    comprimento: produto?.comprimento || '270.00',
    espessura: produto?.espessura || '1.00',
    ncm: produto?.ncm || '',
    cfop: produto?.cfop || '',
    saldo_estoque: produto?.saldo_estoque || '',
    ponto_compra: produto?.ponto_compra || '',
    ativo: produto?.ativo !== undefined ? produto.ativo : true,
    
    // Precificação
    custo_vista: produto?.custo_vista || '',
    custo_30dias: produto?.custo_30dias || '',
    custo_60dias: produto?.custo_60dias || '',
    custo_90dias: produto?.custo_90dias || '',
    custo_120dias: produto?.custo_120dias || '',
    custo_150dias: produto?.custo_150dias || '',
    desconto_lista: produto?.desconto_lista || '',
    custo_base: produto?.custo_base || '',
    preco_manufatura: produto?.preco_manufatura || '',
    preco_varejo: produto?.preco_varejo || '',
    markup_manufatura: produto?.markup_manufatura || '',
    markup_varejo: produto?.markup_varejo || '',
    
    loja_id: lojaAtual
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.referencia || !formData.descricao) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      if (produto?.id) {
        // Atualizar produto existente
        await axios.put(`${API}/produtos/${produto.id}`, formData);
        toast.success('Produto atualizado com sucesso!');
      } else {
        // Criar novo produto
        await axios.post(`${API}/produtos`, formData);
        toast.success('Produto cadastrado com sucesso!');
      }
      onSave();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error('Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="produto-form-container">
      <div className="form-header">
        <div className="breadcrumb">
          <span>Home</span>
          <span>›</span>
          <span>Produtos</span>
          <span>›</span>
          <span>{produto ? 'Editar Produto' : 'Cadastrar Novo Produto'}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="produto-form">
        {/* Layout de Duas Colunas */}
        <div className="form-two-columns">
          {/* Coluna Esquerda - Características do Produto */}
          <div className="form-column">
            <h3 className="section-title">Características do Produto</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Referência:</label>
                <input
                  type="text"
                  name="referencia"
                  value={formData.referencia}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descrição:</label>
                <input
                  type="text"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Código Produto:</label>
                <input
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Fornecedor:</label>
                <input
                  type="text"
                  name="fornecedor"
                  value={formData.fornecedor}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Localização:</label>
                <input
                  type="text"
                  name="localizacao"
                  value={formData.localizacao}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Família:</label>
                <select
                  name="familia"
                  value={formData.familia}
                  onChange={handleChange}
                >
                  {FAMILIAS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tipo Produto:</label>
                <input
                  type="text"
                  name="tipo_produto"
                  value={formData.tipo_produto}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Referência Loja:</label>
                <input
                  type="text"
                  name="ref_loja"
                  value={formData.ref_loja}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Largura (cm):</label>
                <input
                  type="number"
                  step="0.01"
                  name="largura"
                  value={formData.largura}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Comprimento (cm):</label>
                <input
                  type="number"
                  step="0.01"
                  name="comprimento"
                  value={formData.comprimento}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>NCM:</label>
                <input
                  type="text"
                  name="ncm"
                  value={formData.ncm}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Espessura (cm):</label>
                <input
                  type="number"
                  step="0.01"
                  name="espessura"
                  value={formData.espessura}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Saldo Estoque:</label>
                <input
                  type="number"
                  step="0.01"
                  name="saldo_estoque"
                  value={formData.saldo_estoque}
                  onChange={handleChange}
                  className="field-readonly"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>CFOP:</label>
                <input
                  type="text"
                  name="cfop"
                  value={formData.cfop}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Ponto Compra:</label>
                <input
                  type="text"
                  name="ponto_compra"
                  value={formData.ponto_compra}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group checkbox-group-inline">
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
          </div>

          {/* Coluna Direita - Precificação */}
          <div className="form-column">
            <h3 className="section-title">Precificação do Produto</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Custo à Vista:</label>
                <input
                  type="number"
                  step="0.01"
                  name="custo_vista"
                  value={formData.custo_vista}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group-checkbox">
                <input type="checkbox" disabled />
              </div>
              <div className="form-group">
                <label>Desconto Lista (%):</label>
                <input
                  type="number"
                  step="0.01"
                  name="desconto_lista"
                  value={formData.desconto_lista}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>30 dias:</label>
                <input
                  type="number"
                  step="0.01"
                  name="custo_30dias"
                  value={formData.custo_30dias}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group-checkbox">
                <input type="checkbox" disabled />
              </div>
              <div className="form-group">
                <label>Custo Base:</label>
                <input
                  type="number"
                  step="0.01"
                  name="custo_base"
                  value={formData.custo_base}
                  onChange={handleChange}
                  className="field-readonly"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>60 dias:</label>
                <input
                  type="number"
                  step="0.01"
                  name="custo_60dias"
                  value={formData.custo_60dias}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group-checkbox">
                <input type="checkbox" disabled />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>90 dias:</label>
                <input
                  type="number"
                  step="0.01"
                  name="custo_90dias"
                  value={formData.custo_90dias}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group-checkbox">
                <input type="checkbox" disabled />
              </div>
              <div className="form-group">
                <label>Preço de Venda Manufatura:</label>
                <input
                  type="number"
                  step="0.01"
                  name="preco_manufatura"
                  value={formData.preco_manufatura}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Preço de Venda Varejo:</label>
                <input
                  type="number"
                  step="0.01"
                  name="preco_varejo"
                  value={formData.preco_varejo}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>120 dias:</label>
                <input
                  type="number"
                  step="0.01"
                  name="custo_120dias"
                  value={formData.custo_120dias}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group-checkbox">
                <input type="checkbox" checked readOnly />
              </div>
              <div className="form-group-currency">
                <button type="button" className="btn-currency">$</button>
              </div>
              <div className="form-group-currency">
                <button type="button" className="btn-currency">$</button>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>150 dias:</label>
                <input
                  type="number"
                  step="0.01"
                  name="custo_150dias"
                  value={formData.custo_150dias}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group-checkbox">
                <input type="checkbox" disabled />
              </div>
              <div className="form-group">
                <label>Markup de Manufatura (%):</label>
                <input
                  type="number"
                  step="0.01"
                  name="markup_manufatura"
                  value={formData.markup_manufatura}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Markup de Varejo (%):</label>
                <input
                  type="number"
                  step="0.01"
                  name="markup_varejo"
                  value={formData.markup_varejo}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>
            <X size={18} />
            Sair
          </button>
          <button type="submit" className="btn-save" disabled={loading}>
            <Save size={18} />
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .produto-form-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .form-header {
          margin-bottom: 20px;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #718096;
        }

        .breadcrumb span:last-child {
          color: #2d3748;
          font-weight: 500;
        }

        .produto-form {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        .form-section {
          margin-bottom: 35px;
        }

        .form-section:last-of-type {
          margin-bottom: 0;
        }

        .section-title {
          font-size: 18px;
          color: #2d3748;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
          font-weight: 600;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .pricing-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-size: 14px;
          color: #4a5568;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .form-group input,
        .form-group select {
          padding: 10px 14px;
          border: 1px solid #cbd5e0;
          border-radius: 6px;
          font-size: 14px;
          color: #2d3748;
          transition: all 0.2s;
          background: white;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #5dceaa;
          box-shadow: 0 0 0 3px rgba(93, 206, 170, 0.1);
        }

        .field-readonly {
          background: #e6fffa !important;
          color: #234e52;
          font-weight: 500;
        }

        .input-with-currency {
          position: relative;
        }

        .input-with-currency .currency {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: #5dceaa;
          color: white;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          pointer-events: none;
        }

        .checkbox-group {
          flex-direction: row;
          align-items: center;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          margin: 0;
        }

        .checkbox-group input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
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
          padding: 12px 24px;
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
          background: #f56565;
          color: white;
        }

        .btn-cancel:hover {
          background: #e53e3e;
        }
      `}</style>
    </div>
  );
}

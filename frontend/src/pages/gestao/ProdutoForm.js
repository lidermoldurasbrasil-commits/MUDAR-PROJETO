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
    fornecedor: produto?.fornecedor || '',
    localizacao: produto?.localizacao || '',
    familia: produto?.familia || '1-Molduras',
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
    
    // Prazo selecionado para cálculo
    prazo_selecionado: produto?.prazo_selecionado || '120dias',
    
    loja_id: lojaAtual
  });

  const [loading, setLoading] = useState(false);

  // Função para calcular o custo base baseado na família e dimensões
  const calcularCustoBase = (data) => {
    const familia = data.familia || '';
    const largura = parseFloat(data.largura) || 0;
    const comprimento = parseFloat(data.comprimento) || 0;
    const prazoSelecionado = data.prazo_selecionado || '120dias';
    
    // Pegar o custo do prazo selecionado
    let custoUnitario = 0;
    switch(prazoSelecionado) {
      case 'vista':
        custoUnitario = parseFloat(data.custo_vista) || 0;
        break;
      case '30dias':
        custoUnitario = parseFloat(data.custo_30dias) || 0;
        break;
      case '60dias':
        custoUnitario = parseFloat(data.custo_60dias) || 0;
        break;
      case '90dias':
        custoUnitario = parseFloat(data.custo_90dias) || 0;
        break;
      case '120dias':
        custoUnitario = parseFloat(data.custo_120dias) || 0;
        break;
      case '150dias':
        custoUnitario = parseFloat(data.custo_150dias) || 0;
        break;
      default:
        custoUnitario = parseFloat(data.custo_120dias) || 0;
    }
    
    if (custoUnitario === 0) return 0;
    
    // Calcular baseado na família
    if (familia.includes('Moldura')) {
      // Moldura: cálculo por metro linear (perímetro)
      const perimetroMetros = ((largura * 2) + (comprimento * 2)) / 100;
      return (custoUnitario * perimetroMetros).toFixed(2);
    } 
    else if (familia.includes('Vidro') || familia.includes('Espelho') || 
             familia.includes('MDF') || familia.includes('Papel') || 
             familia.includes('Adesivo') || familia.includes('Substrato')) {
      // Planos: cálculo por m² (área)
      const areaM2 = (largura * comprimento) / 10000;
      return (custoUnitario * areaM2).toFixed(2);
    }
    else {
      // Outros: custo direto
      return custoUnitario.toFixed(2);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: newValue };
      
      // Recalcular custo base quando mudar:
      // - Prazo selecionado
      // - Família
      // - Dimensões (largura, comprimento)
      // - Custos de prazos
      if (name === 'prazo_selecionado' || name === 'familia' || 
          name === 'largura' || name === 'comprimento' ||
          name === 'custo_vista' || name === 'custo_30dias' || 
          name === 'custo_60dias' || name === 'custo_90dias' || 
          name === 'custo_120dias' || name === 'custo_150dias') {
        updated.custo_base = calcularCustoBase(updated);
      }
      
      // Calcular markup automaticamente
      if (name === 'custo_base' || name === 'preco_manufatura' || name === 'preco_varejo' ||
          name === 'prazo_selecionado' || name === 'familia' || 
          name === 'largura' || name === 'comprimento') {
        const custoBase = parseFloat(updated.custo_base) || 0;
        const precoManufatura = parseFloat(updated.preco_manufatura) || 0;
        const precoVarejo = parseFloat(updated.preco_varejo) || 0;
        
        // Calcular Markup Manufatura
        if (custoBase > 0 && precoManufatura > 0) {
          const markupManufatura = ((precoManufatura - custoBase) / custoBase * 100).toFixed(2);
          updated.markup_manufatura = markupManufatura;
        } else {
          updated.markup_manufatura = '';
        }
        
        // Calcular Markup Varejo
        if (custoBase > 0 && precoVarejo > 0) {
          const markupVarejo = ((precoVarejo - custoBase) / custoBase * 100).toFixed(2);
          updated.markup_varejo = markupVarejo;
        } else {
          updated.markup_varejo = '';
        }
      }
      
      return updated;
    });
  };

  const handlePrazoChange = (prazo) => {
    setFormData(prev => {
      const updated = { ...prev, prazo_selecionado: prazo };
      updated.custo_base = calcularCustoBase(updated);
      
      // Recalcular markups
      const custoBase = parseFloat(updated.custo_base) || 0;
      const precoManufatura = parseFloat(updated.preco_manufatura) || 0;
      const precoVarejo = parseFloat(updated.preco_varejo) || 0;
      
      if (custoBase > 0 && precoManufatura > 0) {
        updated.markup_manufatura = ((precoManufatura - custoBase) / custoBase * 100).toFixed(2);
      }
      
      if (custoBase > 0 && precoVarejo > 0) {
        updated.markup_varejo = ((precoVarejo - custoBase) / custoBase * 100).toFixed(2);
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.referencia || !formData.descricao) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    // Converter strings vazias em 0 para campos numéricos
    const cleanedData = {
      ...formData,
      largura: parseFloat(formData.largura) || 0,
      comprimento: parseFloat(formData.comprimento) || 0,
      espessura: parseFloat(formData.espessura) || 0,
      saldo_estoque: parseFloat(formData.saldo_estoque) || 0,
      custo_vista: parseFloat(formData.custo_vista) || 0,
      custo_30dias: parseFloat(formData.custo_30dias) || 0,
      custo_60dias: parseFloat(formData.custo_60dias) || 0,
      custo_90dias: parseFloat(formData.custo_90dias) || 0,
      custo_120dias: parseFloat(formData.custo_120dias) || 0,
      custo_150dias: parseFloat(formData.custo_150dias) || 0,
      desconto_lista: parseFloat(formData.desconto_lista) || 0,
      custo_base: parseFloat(formData.custo_base) || 0,
      preco_manufatura: parseFloat(formData.preco_manufatura) || 0,
      preco_varejo: parseFloat(formData.preco_varejo) || 0,
      markup_manufatura: parseFloat(formData.markup_manufatura) || 0,
      markup_varejo: parseFloat(formData.markup_varejo) || 0
    };

    setLoading(true);

    try {
      if (produto?.id) {
        // Atualizar produto existente
        await axios.put(`${API}/produtos/${produto.id}`, cleanedData);
        toast.success('Produto atualizado com sucesso!');
      } else {
        // Criar novo produto
        await axios.post(`${API}/produtos`, cleanedData);
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
            
            {/* Linha 1: SKU e Descrição */}
            <div className="form-row">
              <div className="form-group">
                <label>SKU:</label>
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

            {/* Linha 2: Fornecedor (span 2) */}
            <div className="form-row">
              <div className="form-group form-group-full">
                <label>Fornecedor:</label>
                <input
                  type="text"
                  name="fornecedor"
                  value={formData.fornecedor}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Linha 3: Localização, Família, Tipo Produto */}
            <div className="form-row form-row-3">
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

            {/* Linha 4: Ref Loja, Largura, Comprimento */}
            <div className="form-row form-row-3">
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

            {/* Linha 5: NCM, Espessura, Saldo Estoque */}
            <div className="form-row form-row-3">
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
                  readOnly
                />
              </div>
            </div>

            {/* Linha 6: CFOP, Ponto Compra, Ativo */}
            <div className="form-row form-row-3">
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
            
            {/* Linha 1: Custo à Vista (com checkbox) e Desconto Lista */}
            <div className="form-row form-row-with-check">
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
                  className="field-readonly"
                  readOnly
                />
              </div>
            </div>

            {/* Linha 2: 30 dias (com checkbox) e Custo Base */}
            <div className="form-row form-row-with-check">
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

            {/* Linha 3: 60 dias (com checkbox) */}
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

            {/* Linha 4: 90 dias (com checkbox), Preço Manufatura, Preço Varejo */}
            <div className="form-row form-row-4">
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

            {/* Linha 5: 120 dias (com checkbox marcado), botões $ */}
            <div className="form-row form-row-4">
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

            {/* Linha 6: 150 dias (com checkbox), Markup Manufatura, Markup Varejo */}
            <div className="form-row form-row-4">
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
                  className="field-readonly"
                  readOnly
                />
              </div>
              <div className="form-group">
                <label>Markup de Varejo (%):</label>
                <input
                  type="number"
                  step="0.01"
                  name="markup_varejo"
                  value={formData.markup_varejo}
                  className="field-readonly"
                  readOnly
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
          max-width: 1400px;
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

        .form-two-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }

        .form-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .section-title {
          font-size: 16px;
          color: #2d3748;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
          font-weight: 600;
        }

        .form-row {
          display: flex;
          gap: 15px;
          align-items: flex-end;
        }

        .form-group {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .form-group-checkbox {
          width: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-bottom: 10px;
        }

        .form-group-checkbox input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .form-group-currency {
          width: 50px;
          display: flex;
          align-items: flex-end;
          padding-bottom: 10px;
        }

        .btn-currency {
          background: #5dceaa;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
        }

        .checkbox-group-inline {
          display: flex;
          align-items: center;
          padding-top: 28px;
        }

        .checkbox-group-inline label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          margin: 0;
        }

        .checkbox-group-inline input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .form-group label {
          font-size: 13px;
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
          background: white;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #5dceaa;
          box-shadow: 0 0 0 3px rgba(93, 206, 170, 0.1);
        }

        .field-readonly {
          background: #b2dfdb !important;
          color: #00695c;
          font-weight: 500;
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
          background: #5dceaa;
          color: white;
        }

        .btn-cancel:hover {
          background: #4db89a;
        }

        /* New layout classes */
        .form-group-full {
          flex: 2;
        }

        .form-row-3 {
          display: flex;
          gap: 15px;
          align-items: flex-end;
        }

        .form-row-3 .form-group {
          flex: 1;
        }

        .form-row-4 {
          display: flex;
          gap: 15px;
          align-items: flex-end;
        }

        .form-row-4 .form-group {
          flex: 1;
        }

        .form-row-with-check {
          display: flex;
          gap: 15px;
          align-items: flex-end;
        }

        .form-row-with-check .form-group {
          flex: 1;
          min-width: 0;
        }

        /* Garantir que campos de prazo tenham mesmo tamanho */
        .form-row-with-check .form-group:first-child,
        .form-row .form-group:first-child,
        .form-row-4 .form-group:first-child {
          flex: 0 0 140px;
          min-width: 140px;
          max-width: 140px;
        }

        @media (max-width: 1024px) {
          .form-two-columns {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

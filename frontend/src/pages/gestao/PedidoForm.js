import { useState, useEffect } from 'react';
import { X, Save, Calculator, UserPlus } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/gestao`;

const TIPOS_PRODUTO = ['Quadro', 'Espelho', 'Moldura avulsa', 'Fine-Art'];
const FORMAS_PAGAMENTO = ['À Vista', 'Pix', 'Cartão Crédito', 'Cartão Débito', 'Boleto', '30 dias', '60 dias', '90 dias'];

export default function PedidoForm({ pedido, lojaAtual, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('cliente');
  const [loading, setLoading] = useState(false);
  const [canViewCosts, setCanViewCosts] = useState(false);
  
  // Dados para dropdowns
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [showClienteForm, setShowClienteForm] = useState(false);
  
  const [formData, setFormData] = useState({
    // ABA 1: Cliente + Dados Básicos
    cliente_id: pedido?.cliente_id || '',
    cliente_nome: pedido?.cliente_nome || '',
    tipo_produto: pedido?.tipo_produto || 'Quadro',
    altura: pedido?.altura || '',
    largura: pedido?.largura || '',
    quantidade: pedido?.quantidade || 1,
    
    // ABA 2: Composição
    moldura_id: pedido?.moldura_id || '',
    usar_vidro: pedido?.usar_vidro || false,
    vidro_id: pedido?.vidro_id || '',
    usar_mdf: pedido?.usar_mdf || false,
    mdf_id: pedido?.mdf_id || '',
    usar_papel: pedido?.usar_papel || false,
    papel_id: pedido?.papel_id || '',
    usar_passepartout: pedido?.usar_passepartout || false,
    passepartout_id: pedido?.passepartout_id || '',
    produto_pronto_id: pedido?.produto_pronto_id || '',
    promocao_id: pedido?.promocao_id || '',
    espelho_organico_id: pedido?.espelho_organico_id || '',
    
    // ABA 3: Orçamento
    descricao_orcamento: pedido?.descricao_orcamento || '',
    forma_pagamento: pedido?.forma_pagamento || '',
    desconto_percentual: pedido?.desconto_percentual || 0,
    desconto_valor: pedido?.desconto_valor || 0,
    sobre_preco_percentual: pedido?.sobre_preco_percentual || 0,
    sobre_preco_valor: pedido?.sobre_preco_valor || 0,
    
    // ABA 4: Controle
    vendedor: pedido?.vendedor || '',
    prazo_entrega: pedido?.prazo_entrega || '',
    observacoes: pedido?.observacoes || '',
    
    // Cálculos
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
    valor_final: pedido?.valor_final || 0,
    
    loja_id: lojaAtual || 'fabrica'
  });

  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    celular: '',
    email: '',
    endereco: '',
    numero: '',
    cidade: '',
    estado: '',
    loja_id: lojaAtual || 'fabrica'
  });

  useEffect(() => {
    checkPermissions();
    fetchData();
  }, []);

  const checkPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCanViewCosts(response.data.can_view_costs);
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Buscar clientes
      const clientesRes = await axios.get(`${API}/clientes`, { headers });
      setClientes(clientesRes.data);
      
      // Buscar produtos
      const produtosRes = await axios.get(`${API}/produtos`, { headers });
      setProdutos(produtosRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleClienteChange = (e) => {
    const clienteId = e.target.value;
    const cliente = clientes.find(c => c.id === clienteId);
    
    setFormData(prev => ({
      ...prev,
      cliente_id: clienteId,
      cliente_nome: cliente ? cliente.nome : ''
    }));
  };

  const handleNovoClienteChange = (e) => {
    const { name, value } = e.target;
    setNovoCliente(prev => ({ ...prev, [name]: value }));
  };

  const handleCadastrarCliente = async () => {
    if (!novoCliente.nome || !novoCliente.telefone) {
      toast.error('Preencha nome e telefone do cliente');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/clientes`, novoCliente, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Cliente cadastrado com sucesso!');
      setClientes(prev => [...prev, response.data]);
      setFormData(prev => ({
        ...prev,
        cliente_id: response.data.id,
        cliente_nome: response.data.nome
      }));
      setShowClienteForm(false);
      setNovoCliente({
        nome: '',
        cpf: '',
        telefone: '',
        celular: '',
        email: '',
        endereco: '',
        numero: '',
        cidade: '',
        estado: '',
        loja_id: lojaAtual || 'fabrica'
      });
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      toast.error('Erro ao cadastrar cliente');
    }
  };

  const handleDescontoPercentualChange = (e) => {
    const percentual = parseFloat(e.target.value) || 0;
    const valorDesconto = (formData.preco_venda * percentual) / 100;
    
    setFormData(prev => ({
      ...prev,
      desconto_percentual: percentual,
      desconto_valor: valorDesconto,
      valor_final: prev.preco_venda - valorDesconto + prev.sobre_preco_valor
    }));
  };

  const handleDescontoValorChange = (e) => {
    const valor = parseFloat(e.target.value) || 0;
    const percentual = (valor / formData.preco_venda) * 100;
    
    setFormData(prev => ({
      ...prev,
      desconto_valor: valor,
      desconto_percentual: percentual,
      valor_final: prev.preco_venda - valor + prev.sobre_preco_valor
    }));
  };

  const handleSobrePrecoPercentualChange = (e) => {
    const percentual = parseFloat(e.target.value) || 0;
    const valorSobre = (formData.preco_venda * percentual) / 100;
    
    setFormData(prev => ({
      ...prev,
      sobre_preco_percentual: percentual,
      sobre_preco_valor: valorSobre,
      valor_final: prev.preco_venda - prev.desconto_valor + valorSobre
    }));
  };

  const handleSobrePrecoValorChange = (e) => {
    const valor = parseFloat(e.target.value) || 0;
    const percentual = (valor / formData.preco_venda) * 100;
    
    setFormData(prev => ({
      ...prev,
      sobre_preco_valor: valor,
      sobre_preco_percentual: percentual,
      valor_final: prev.preco_venda - prev.desconto_valor + valor
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
        ...response.data,
        valor_final: response.data.preco_venda
      }));
      
      toast.success('Cálculo realizado com sucesso!');
      setActiveTab('orcamento');
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
    }).format(value || 0);
  };

  // Filtrar produtos por família
  const molduras = produtos.filter(p => p.familia && p.familia.includes('Moldura'));
  const vidros = produtos.filter(p => p.familia && p.familia.includes('Vidro'));
  const mdfs = produtos.filter(p => p.familia && (p.familia.includes('Substrato') || p.familia.includes('MDF')));
  const papeis = produtos.filter(p => p.familia && (p.familia.includes('Papel') || p.familia.includes('Adesivo')));
  const passepartouts = produtos.filter(p => p.familia && p.familia.includes('PasseParTout'));
  const produtosProntos = produtos.filter(p => p.familia && p.familia.includes('Produto Pronto'));
  const promocoes = produtos.filter(p => p.familia && p.familia.includes('Promoção'));
  const espelhosOrganicos = produtos.filter(p => p.familia && p.familia.includes('Espelho Orgânico'));

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
          className={`tab ${activeTab === 'cliente' ? 'active' : ''}`}
          onClick={() => setActiveTab('cliente')}
        >
          1. Cliente e Dados Básicos
        </button>
        <button
          className={`tab ${activeTab === 'composicao' ? 'active' : ''}`}
          onClick={() => setActiveTab('composicao')}
        >
          2. Composição
        </button>
        <button
          className={`tab ${activeTab === 'orcamento' ? 'active' : ''}`}
          onClick={() => setActiveTab('orcamento')}
        >
          3. Orçamento
        </button>
        <button
          className={`tab ${activeTab === 'controle' ? 'active' : ''}`}
          onClick={() => setActiveTab('controle')}
        >
          4. Controle
        </button>
        {canViewCosts && (
          <button
            className={`tab ${activeTab === 'calculo' ? 'active' : ''}`}
            onClick={() => setActiveTab('calculo')}
          >
            5. Cálculo Técnico 🔒
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="pedido-form">
        {/* ABA 1: Cliente e Dados Básicos */}
        {activeTab === 'cliente' && (
          <div className="tab-content">
            <h3>Seleção de Cliente</h3>
            
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label>Cliente: *</label>
                <select
                  name="cliente_id"
                  value={formData.cliente_id}
                  onChange={handleClienteChange}
                  required
                >
                  <option value="">Selecione um cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nome} - {c.telefone}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="btn-new-cliente"
                onClick={() => setShowClienteForm(!showClienteForm)}
              >
                <UserPlus size={18} />
                Novo Cliente
              </button>
            </div>

            {showClienteForm && (
              <div className="novo-cliente-box">
                <h4>Cadastro Rápido de Cliente</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nome: *</label>
                    <input
                      type="text"
                      name="nome"
                      value={novoCliente.nome}
                      onChange={handleNovoClienteChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Telefone: *</label>
                    <input
                      type="text"
                      name="telefone"
                      value={novoCliente.telefone}
                      onChange={handleNovoClienteChange}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Celular:</label>
                    <input
                      type="text"
                      name="celular"
                      value={novoCliente.celular}
                      onChange={handleNovoClienteChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>E-mail:</label>
                    <input
                      type="email"
                      name="email"
                      value={novoCliente.email}
                      onChange={handleNovoClienteChange}
                    />
                  </div>
                </div>
                <button type="button" className="btn-cadastrar" onClick={handleCadastrarCliente}>
                  Cadastrar Cliente
                </button>
              </div>
            )}

            <h3>Especificações do Produto</h3>
            
            <div className="form-row">
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

            <button type="button" className="btn-next" onClick={() => setActiveTab('composicao')}>
              Próximo: Composição →
            </button>
          </div>
        )}

        {/* ABA 2: Composição */}
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

            <h3 style={{ marginTop: '30px' }}>Produtos Especiais</h3>

            <div className="form-group">
              <label>Produto Pronto:</label>
              <select
                name="produto_pronto_id"
                value={formData.produto_pronto_id}
                onChange={handleChange}
              >
                <option value="">Selecione...</option>
                {produtosProntos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.referencia} - {p.descricao} - {formatCurrency(p.preco_manufatura)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Promoção:</label>
              <select
                name="promocao_id"
                value={formData.promocao_id}
                onChange={handleChange}
              >
                <option value="">Selecione...</option>
                {promocoes.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.referencia} - {p.descricao} - {formatCurrency(p.preco_manufatura)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Espelho Orgânico (em desenvolvimento):</label>
              <select
                name="espelho_organico_id"
                value={formData.espelho_organico_id}
                onChange={handleChange}
                disabled
              >
                <option value="">Em breve...</option>
              </select>
            </div>

            <button type="button" className="btn-calculate" onClick={handleCalcular}>
              <Calculator size={18} />
              Calcular Custos
            </button>
          </div>
        )}

        {/* ABA 3: Orçamento */}
        {activeTab === 'orcamento' && (
          <div className="tab-content">
            <h3>Orçamento para o Cliente</h3>

            <div className="form-group">
              <label>Descrição do Trabalho:</label>
              <textarea
                name="descricao_orcamento"
                value={formData.descricao_orcamento}
                onChange={handleChange}
                rows="4"
                placeholder="Descreva o trabalho para o cliente..."
              />
            </div>

            <div className="orcamento-valores">
              <div className="valor-item">
                <span>Preço de Venda:</span>
                <strong>{formatCurrency(formData.preco_venda)}</strong>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Forma de Pagamento:</label>
                <select
                  name="forma_pagamento"
                  value={formData.forma_pagamento}
                  onChange={handleChange}
                >
                  <option value="">Selecione...</option>
                  {FORMAS_PAGAMENTO.map(forma => (
                    <option key={forma} value={forma}>{forma}</option>
                  ))}
                </select>
              </div>
            </div>

            <h4>Ajustes de Preço</h4>
            
            <div className="form-row">
              <div className="form-group">
                <label>Desconto (%):</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.desconto_percentual}
                  onChange={handleDescontoPercentualChange}
                />
              </div>
              <div className="form-group">
                <label>Desconto (R$):</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.desconto_valor}
                  onChange={handleDescontoValorChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Sobre-preço (%):</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.sobre_preco_percentual}
                  onChange={handleSobrePrecoPercentualChange}
                />
              </div>
              <div className="form-group">
                <label>Sobre-preço (R$):</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.sobre_preco_valor}
                  onChange={handleSobrePrecoValorChange}
                />
              </div>
            </div>

            <div className="valor-final-box">
              <span>VALOR FINAL:</span>
              <strong>{formatCurrency(formData.valor_final)}</strong>
            </div>
          </div>
        )}

        {/* ABA 4: Controle */}
        {activeTab === 'controle' && (
          <div className="tab-content">
            <h3>Controle Interno</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Vendedor:</label>
                <input
                  type="text"
                  name="vendedor"
                  value={formData.vendedor}
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
              <label>Observações Internas:</label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                rows="4"
              />
            </div>
          </div>
        )}

        {/* ABA 5: Cálculo Técnico (apenas Diretor/Gerente) */}
        {activeTab === 'calculo' && canViewCosts && (
          <div className="tab-content">
            <h3>Ficha Técnica de Custos</h3>

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

            {formData.custo_perda > 0 && (
              <div className="alerta-perda">
                ⚠️ Perda técnica: {formatCurrency(formData.custo_perda)}
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
                <strong>{formData.markup.toFixed(2)}x</strong>
              </div>
              <div className="total-item">
                <span>Margem:</span>
                <strong>{formData.margem_percentual.toFixed(1)}%</strong>
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
        }

        .btn-close:hover {
          background: #f7fafc;
        }

        .tabs {
          display: flex;
          gap: 5px;
          margin-bottom: 20px;
          border-bottom: 2px solid #e2e8f0;
          flex-wrap: wrap;
        }

        .tab {
          padding: 12px 20px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-size: 14px;
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
          margin: 25px 0 15px 0;
        }

        .form-row {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
          align-items: flex-end;
        }

        .form-group {
          flex: 1;
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
        .form-group select,
        .form-group textarea {
          padding: 10px 12px;
          border: 1px solid #cbd5e0;
          border-radius: 6px;
          font-size: 14px;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #5dceaa;
          box-shadow: 0 0 0 3px rgba(93, 206, 170, 0.1);
        }

        .btn-new-cliente {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
        }

        .btn-new-cliente:hover {
          background: #2563eb;
        }

        .novo-cliente-box {
          background: #f7fafc;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 2px dashed #cbd5e0;
        }

        .novo-cliente-box h4 {
          margin: 0 0 15px 0;
          color: #2d3748;
          font-size: 15px;
        }

        .btn-cadastrar {
          background: #5dceaa;
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }

        .btn-cadastrar:hover {
          background: #4db89a;
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
          font-weight: 500;
        }

        .checkbox-group input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .btn-next,
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
        }

        .btn-calculate {
          background: #8b5cf6;
        }

        .btn-next:hover {
          background: #2563eb;
        }

        .btn-calculate:hover {
          background: #7c3aed;
        }

        .orcamento-valores {
          background: #f7fafc;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .valor-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          font-size: 16px;
        }

        .valor-final-box {
          background: #5dceaa;
          color: white;
          padding: 20px;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          font-size: 20px;
          font-weight: 600;
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
        }

        .composicao-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }

        .composicao-table thead {
          background: #f7fafc;
        }

        .composicao-table th {
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
          border: none;
        }

        .btn-save {
          background: #5dceaa;
          color: white;
        }

        .btn-save:hover:not(:disabled) {
          background: #4db89a;
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

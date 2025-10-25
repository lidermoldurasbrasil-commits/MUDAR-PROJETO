import { useState, useEffect } from 'react';
import { X, Save, Calculator, Search, UserPlus, Package } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/gestao`;

const TIPOS_PRODUTO = ['Quadro', 'Espelho', 'Moldura avulsa', 'Fine-Art'];
const FORMAS_PAGAMENTO = ['À Vista', 'Pix', 'Cartão Crédito', 'Cartão Débito', 'Boleto', '30 dias', '60 dias', '90 dias'];

export default function PedidoForm({ pedido, lojaAtual, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState(
    pedido && pedido.itens && pedido.itens.length > 0 ? 'orcamento' : 'basico'
  );
  const [loading, setLoading] = useState(false);
  const [canViewCosts, setCanViewCosts] = useState(false);
  
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [showClienteForm, setShowClienteForm] = useState(false);
  const [molduraSku, setMolduraSku] = useState('');
  
  // NOVOS ESTADOS PARA FORMAS DE PAGAMENTO
  const [contasBancarias, setContasBancarias] = useState([]);
  const [formasPagamentoDisponiveis, setFormasPagamentoDisponiveis] = useState([]);
  const [contaBancariaSelecionada, setContaBancariaSelecionada] = useState('');
  const [formaPagamentoSelecionada, setFormaPagamentoSelecionada] = useState(null);
  
  const [formData, setFormData] = useState({
    cliente_id: pedido?.cliente_id || '',
    cliente_nome: pedido?.cliente_nome || '',
    tipo_produto: pedido?.tipo_produto || 'Quadro',
    altura: pedido?.altura || '',
    largura: pedido?.largura || '',
    quantidade: pedido?.quantidade || 1,
    
    moldura_id: pedido?.moldura_id || '',
    moldura_descricao: pedido?.moldura_descricao || '',
    moldura_preco: 0,
    usar_vidro: pedido?.usar_vidro || false,
    vidro_id: pedido?.vidro_id || '',
    vidro_descricao: pedido?.vidro_descricao || '',
    vidro_preco: 0,
    usar_mdf: pedido?.usar_mdf || false,
    mdf_id: pedido?.mdf_id || '',
    mdf_descricao: pedido?.mdf_descricao || '',
    mdf_preco: 0,
    usar_papel: pedido?.usar_papel || false,
    papel_id: pedido?.papel_id || '',
    papel_descricao: pedido?.papel_descricao || '',
    papel_preco: 0,
    usar_passepartout: pedido?.usar_passepartout || false,
    passepartout_id: pedido?.passepartout_id || '',
    passepartout_descricao: pedido?.passepartout_descricao || '',
    passepartout_preco: 0,
    produto_pronto_id: pedido?.produto_pronto_id || '',
    produto_pronto_descricao: pedido?.produto_pronto_descricao || '',
    produto_pronto_preco: 0,
    promocao_id: pedido?.promocao_id || '',
    promocao_descricao: pedido?.promocao_descricao || '',
    promocao_preco: 0,
    
    descricao_orcamento: pedido?.descricao_orcamento || '',
    forma_pagamento: pedido?.forma_pagamento || '',
    valor_entrada: pedido?.valor_entrada || 0,
    
    // NOVOS CAMPOS FINANCEIROS
    conta_bancaria_id: pedido?.conta_bancaria_id || '',
    conta_bancaria_nome: pedido?.conta_bancaria_nome || '',
    forma_pagamento_id: pedido?.forma_pagamento_id || '',
    forma_pagamento_nome: pedido?.forma_pagamento_nome || '',
    forma_pagamento_parcelas: pedido?.forma_pagamento_parcelas || 1,
    forma_pagamento_bandeira: pedido?.forma_pagamento_bandeira || '',
    taxa_percentual: pedido?.taxa_percentual || 0,
    taxa_valor_real: pedido?.taxa_valor_real || 0,
    valor_bruto: pedido?.valor_bruto || 0,
    valor_liquido_empresa: pedido?.valor_liquido_empresa || 0,
    
    desconto_percentual: pedido?.desconto_percentual || 0,
    desconto_valor: pedido?.desconto_valor || 0,
    sobre_preco_percentual: pedido?.sobre_preco_percentual || 0,
    sobre_preco_valor: pedido?.sobre_preco_valor || 0,
    
    vendedor: pedido?.vendedor || '',
    prazo_entrega: pedido?.prazo_entrega || '',
    observacoes: pedido?.observacoes || '',
    
    // Campos do objeto do cliente
    imagem_anexada: pedido?.imagem_anexada || '',
    sku_objeto_cliente: pedido?.sku_objeto_cliente || '',
    
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

  // NOVO: Array para armazenar múltiplos produtos no pedido
  const [produtosPedido, setProdutosPedido] = useState([]);

  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    telefone: '',
    celular: '',
    email: '',
    endereco: '',
    cidade: '',
    loja_id: lojaAtual || 'fabrica'
  });

  useEffect(() => {
    checkPermissions();
    fetchData();
    
    // NOVO: Reconstruir produtosPedido ao editar um pedido existente
    if (pedido) {
      console.log('Carregando pedido para edição:', pedido);
      
      // Tentar carregar produtos_detalhes primeiro (estrutura completa)
      if (pedido.produtos_detalhes) {
        try {
          const produtosCarregados = JSON.parse(pedido.produtos_detalhes);
          if (produtosCarregados && produtosCarregados.length > 0) {
            setProdutosPedido(produtosCarregados);
            console.log('Produtos carregados de produtos_detalhes:', produtosCarregados);
            return;
          }
        } catch (e) {
          console.error('Erro ao parsear produtos_detalhes:', e);
        }
      }
      
      // Fallback: Reconstruir a partir dos itens (para pedidos antigos)
      if (pedido.itens && pedido.itens.length > 0) {
        const totalVenda = pedido.itens.reduce((sum, item) => sum + (item.subtotal_venda || 0), 0);
        const totalCusto = pedido.itens.reduce((sum, item) => sum + (item.subtotal || 0), 0);
        
        const produtoReconstruido = {
          id: Date.now(),
          tipo_produto: pedido.tipo_produto || 'Quadro',
          altura: pedido.altura || 0,
          largura: pedido.largura || 0,
          quantidade: pedido.quantidade || 1,
          area: pedido.area || 0,
          perimetro: pedido.perimetro || 0,
          itens: pedido.itens || [],
          total: totalVenda,
          custo: totalCusto,  // NOVO: Adicionar custo
          moldura_descricao: pedido.moldura_descricao,
          vidro_descricao: pedido.vidro_descricao,
          mdf_descricao: pedido.mdf_descricao,
          papel_descricao: pedido.papel_descricao,
          passepartout_descricao: pedido.passepartout_descricao
        };
        
        setProdutosPedido([produtoReconstruido]);
        console.log('Produto reconstruído (fallback):', produtoReconstruido);
      }
    }
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
      
      const [clientesRes, produtosRes, contasRes] = await Promise.all([
        axios.get(`${API}/clientes`, { headers }),
        axios.get(`${API}/produtos`, { headers }),
        axios.get(`${API}/financeiro/contas-bancarias?status=Ativo`, { headers })
      ]);
      
      setClientes(clientesRes.data);
      setProdutos(produtosRes.data);
      setContasBancarias(contasRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  const fetchFormasPagamento = async (bancoId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/financeiro/formas-pagamento-ativas?banco_id=${bancoId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFormasPagamentoDisponiveis(response.data);
    } catch (error) {
      console.error('Erro ao buscar formas de pagamento:', error);
      toast.error('Erro ao carregar formas de pagamento');
    }
  };

  const handleBancoChange = (bancoId) => {
    setContaBancariaSelecionada(bancoId);
    setFormaPagamentoSelecionada(null);
    
    const banco = contasBancarias.find(c => c.id === bancoId);
    setFormData(prev => ({
      ...prev,
      conta_bancaria_id: bancoId,
      conta_bancaria_nome: banco?.nome || '',
      forma_pagamento_id: '',
      forma_pagamento_nome: '',
      taxa_percentual: 0,
      taxa_valor_real: 0,
      valor_liquido_empresa: prev.valor_final
    }));
    
    if (bancoId) {
      fetchFormasPagamento(bancoId);
    } else {
      setFormasPagamentoDisponiveis([]);
    }
  };

  const handleFormaPagamentoChange = (formaId) => {
    const forma = formasPagamentoDisponiveis.find(f => f.id === formaId);
    if (!forma) return;
    
    setFormaPagamentoSelecionada(forma);
    
    // Calcular valores
    const valorBruto = formData.valor_final;
    const taxaValor = valorBruto * (forma.taxa_banco_percentual / 100);
    const valorLiquido = valorBruto - taxaValor;
    
    setFormData(prev => ({
      ...prev,
      forma_pagamento_id: forma.id,
      forma_pagamento_nome: forma.nome_formatado || forma.forma_pagamento,
      forma_pagamento_parcelas: forma.numero_parcelas,
      forma_pagamento_bandeira: forma.bandeira,
      taxa_percentual: forma.taxa_banco_percentual,
      taxa_valor_real: taxaValor,
      valor_bruto: valorBruto,
      valor_liquido_empresa: valorLiquido
    }));
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
      toast.error('Preencha nome e telefone');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/clientes`, novoCliente, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Cliente cadastrado!');
      setClientes(prev => [...prev, response.data]);
      setFormData(prev => ({
        ...prev,
        cliente_id: response.data.id,
        cliente_nome: response.data.nome
      }));
      setShowClienteForm(false);
      setNovoCliente({ nome: '', telefone: '', celular: '', email: '', endereco: '', cidade: '', loja_id: lojaAtual || 'fabrica' });
    } catch (error) {
      toast.error('Erro ao cadastrar cliente');
    }
  };

  const handleMolduraSkuSearch = () => {
    const moldura = molduras.find(m => m.referencia === molduraSku);
    if (moldura) {
      handleProdutoSelect('moldura', moldura);
      toast.success(`Moldura ${moldura.referencia} encontrada!`);
    } else {
      toast.error('SKU não encontrado');
    }
  };

  const handleProdutoSelect = (tipo, produto) => {
    if (!produto) return;
    
    const preco = produto.preco_manufatura || produto.preco_varejo || 0;
    
    setFormData(prev => ({
      ...prev,
      [`${tipo}_id`]: produto.id,
      [`${tipo}_descricao`]: produto.descricao,
      [`${tipo}_preco`]: preco
    }));
  };

  const handleImagemUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande (máx 5MB)');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/pedidos/upload-imagem`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setFormData(prev => ({
        ...prev,
        imagem_anexada: response.data.url
      }));

      toast.success('Imagem anexada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao anexar imagem');
    }
  };

  const handleEditarItem = (index, campo, valor) => {
    const novosItens = [...formData.itens];
    novosItens[index][campo] = parseFloat(valor) || 0;
    
    // Recalcular subtotal
    if (campo === 'quantidade' || campo === 'custo_unitario') {
      novosItens[index].subtotal = novosItens[index].quantidade * novosItens[index].custo_unitario;
    }
    
    // Recalcular custo total
    const novoCustoTotal = novosItens.reduce((sum, item) => sum + item.subtotal, 0);
    
    // Recalcular preço de venda
    const novoPrecoVenda = novoCustoTotal * formData.markup;
    
    // Recalcular valor final mantendo descontos/sobre-preços proporcionais
    const desconto = formData.desconto_valor;
    const sobrePreco = formData.sobre_preco_valor;
    const novoValorFinal = novoPrecoVenda - desconto + sobrePreco;
    
    setFormData(prev => ({
      ...prev,
      itens: novosItens,
      custo_total: novoCustoTotal,
      preco_venda: novoPrecoVenda,
      valor_final: novoValorFinal,
      margem_percentual: ((novoPrecoVenda - novoCustoTotal) / novoPrecoVenda * 100) || 0
    }));
    
    toast.success('Item atualizado!');
  };

  const handleRemoverItem = (index) => {
    if (!window.confirm('Deseja remover este item?')) return;
    
    const novosItens = formData.itens.filter((_, i) => i !== index);
    const novoCustoTotal = novosItens.reduce((sum, item) => sum + item.subtotal, 0);
    const novoPrecoVenda = novoCustoTotal * formData.markup;
    const desconto = formData.desconto_valor;
    const sobrePreco = formData.sobre_preco_valor;
    
    setFormData(prev => ({
      ...prev,
      itens: novosItens,
      custo_total: novoCustoTotal,
      preco_venda: novoPrecoVenda,
      valor_final: novoPrecoVenda - desconto + sobrePreco,
      margem_percentual: ((novoPrecoVenda - novoCustoTotal) / novoPrecoVenda * 100) || 0
    }));
    
    toast.success('Item removido!');
  };

  // NOVA FUNÇÃO: Recalcular automaticamente ao mudar medidas
  const handleMedidasChange = async (campo, valor) => {
    // Atualizar o campo
    setFormData(prev => ({ ...prev, [campo]: valor }));
    
    // Se tem altura E largura E já tem itens calculados, recalcular
    const novaAltura = campo === 'altura' ? valor : formData.altura;
    const novaLargura = campo === 'largura' ? valor : formData.largura;
    
    if (novaAltura && novaLargura && formData.itens && formData.itens.length > 0) {
      // Aguardar um pouco para evitar múltiplas chamadas
      setTimeout(async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.post(`${API}/pedidos/calcular`, {
            ...formData,
            altura: novaAltura,
            largura: novaLargura
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // Calcular total dos insumos
          const totalInsumos = response.data.itens?.reduce((sum, item) => sum + (item.subtotal_venda || 0), 0) || 0;
          
          // Manter descontos e sobre-preços atuais
          const descontoAtual = formData.desconto_valor || 0;
          const sobrePrecoAtual = formData.sobre_preco_valor || 0;
          
          setFormData(prev => ({
            ...prev,
            ...response.data,
            altura: novaAltura,
            largura: novaLargura,
            desconto_percentual: prev.desconto_percentual,
            desconto_valor: descontoAtual,
            sobre_preco_percentual: prev.sobre_preco_percentual,
            sobre_preco_valor: sobrePrecoAtual,
            valor_final: totalInsumos - descontoAtual + sobrePrecoAtual
          }));
          
          toast.success('Orçamento recalculado!');
        } catch (error) {
          console.error('Erro ao recalcular:', error);
        }
      }, 500);
    }
  };

  const handleDescontoPercentualChange = (e) => {
    const percentual = parseFloat(e.target.value) || 0;
    // Calcular total dos insumos
    const totalInsumos = formData.itens?.reduce((sum, item) => sum + (item.subtotal_venda || 0), 0) || 0;
    const valorDesconto = (totalInsumos * percentual) / 100;
    
    // Usar os valores atuais de sobre-preço
    const sobrePrecoValor = formData.sobre_preco_valor || 0;
    
    setFormData(prev => ({
      ...prev,
      desconto_percentual: percentual,
      desconto_valor: valorDesconto,
      valor_final: totalInsumos - valorDesconto + sobrePrecoValor
    }));
  };

  const handleDescontoValorChange = (e) => {
    const valor = parseFloat(e.target.value) || 0;
    // Calcular total dos insumos
    const totalInsumos = formData.itens?.reduce((sum, item) => sum + (item.subtotal_venda || 0), 0) || 0;
    const percentual = totalInsumos > 0 ? (valor / totalInsumos) * 100 : 0;
    
    // Usar os valores atuais de sobre-preço
    const sobrePrecoValor = formData.sobre_preco_valor || 0;
    
    setFormData(prev => ({
      ...prev,
      desconto_valor: valor,
      desconto_percentual: percentual,
      valor_final: totalInsumos - valor + sobrePrecoValor
    }));
  };

  const handleSobrePrecoPercentualChange = (e) => {
    const percentual = parseFloat(e.target.value) || 0;
    // Calcular total dos insumos
    const totalInsumos = formData.itens?.reduce((sum, item) => sum + (item.subtotal_venda || 0), 0) || 0;
    const valorSobre = (totalInsumos * percentual) / 100;
    
    // Usar os valores atuais de desconto
    const descontoValor = formData.desconto_valor || 0;
    
    setFormData(prev => ({
      ...prev,
      sobre_preco_percentual: percentual,
      sobre_preco_valor: valorSobre,
      valor_final: totalInsumos - descontoValor + valorSobre
    }));
  };

  const handleSobrePrecoValorChange = (e) => {
    const valor = parseFloat(e.target.value) || 0;
    // Calcular total dos insumos
    const totalInsumos = formData.itens?.reduce((sum, item) => sum + (item.subtotal_venda || 0), 0) || 0;
    const percentual = totalInsumos > 0 ? (valor / totalInsumos) * 100 : 0;
    
    // Usar os valores atuais de desconto
    const descontoValor = formData.desconto_valor || 0;
    
    setFormData(prev => ({
      ...prev,
      sobre_preco_valor: valor,
      sobre_preco_percentual: percentual,
      valor_final: totalInsumos - descontoValor + valor
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
      
      // Calcular total de venda e custo dos insumos deste produto
      const totalVenda = response.data.itens?.reduce((sum, item) => sum + (item.subtotal_venda || 0), 0) || 0;
      const totalCusto = response.data.itens?.reduce((sum, item) => sum + (item.subtotal || 0), 0) || 0;
      
      // Criar objeto do produto calculado
      const produtoCalculado = {
        id: Date.now(), // ID temporário único
        tipo_produto: formData.tipo_produto,
        altura: formData.altura,
        largura: formData.largura,
        quantidade: formData.quantidade,
        area: response.data.area,
        perimetro: response.data.perimetro,
        itens: response.data.itens,
        total: totalVenda,  // Total de venda
        custo: totalCusto,  // NOVO: Total de custo
        moldura_descricao: response.data.moldura_descricao,
        vidro_descricao: response.data.vidro_descricao,
        mdf_descricao: response.data.mdf_descricao,
        papel_descricao: response.data.papel_descricao,
        passepartout_descricao: response.data.passepartout_descricao
      };
      
      // Adicionar produto ao array
      setProdutosPedido(prev => [...prev, produtoCalculado]);
      
      // Recalcular totais gerais
      const novosProdutos = [...produtosPedido, produtoCalculado];
      const totalGeralVenda = novosProdutos.reduce((sum, p) => sum + p.total, 0);
      const totalGeralCusto = novosProdutos.reduce((sum, p) => sum + (p.custo || 0), 0);
      
      setFormData(prev => ({
        ...prev,
        ...response.data,
        custo_total: totalGeralCusto,  // NOVO: Custo real
        preco_venda: totalGeralVenda,  // Preço de venda
        valor_final: totalGeralVenda  // Total de todos os produtos
      }));
      
      toast.success('Produto adicionado ao orçamento!');
      setActiveTab('orcamento');
    } catch (error) {
      console.error('Erro ao calcular:', error);
      toast.error('Erro ao calcular');
    }
  };

  // Função auxiliar para remover campos vazios que causam erro de validação
  const limparDadosVazios = (dados) => {
    const dadosLimpos = { ...dados };
    
    // Remover prazo_entrega se estiver vazio (causa erro 422)
    if (dadosLimpos.prazo_entrega === '' || !dadosLimpos.prazo_entrega) {
      delete dadosLimpos.prazo_entrega;
    }
    
    return dadosLimpos;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== INICIANDO SALVAMENTO DO PEDIDO ===');
    console.log('produtosPedido:', produtosPedido);
    console.log('formData:', formData);
    
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Se tem produtos calculados, usar estrutura completa
      if (produtosPedido && produtosPedido.length > 0) {
        console.log('✅ Tem produtos calculados:', produtosPedido.length);
        
        const primeiroProduto = produtosPedido[0];
        const todosItens = produtosPedido.flatMap(p => p.itens || []);
        const totalGeralVenda = produtosPedido.reduce((sum, p) => sum + (p.total || 0), 0);
        const totalGeralCusto = produtosPedido.reduce((sum, p) => sum + (p.custo || 0), 0);
        
        console.log('Total Venda:', totalGeralVenda);
        console.log('Total Custo:', totalGeralCusto);
        
        const dadosEnvio = limparDadosVazios({
          ...formData,
          altura: primeiroProduto.altura || formData.altura || 0,
          largura: primeiroProduto.largura || formData.largura || 0,
          quantidade: primeiroProduto.quantidade || formData.quantidade || 1,
          tipo_produto: primeiroProduto.tipo_produto || formData.tipo_produto || 'Quadro',
          cliente_nome: formData.cliente_nome || 'Cliente não informado',
          itens: todosItens,
          custo_total: totalGeralCusto,  // CORRIGIDO: Usar soma dos custos
          preco_venda: totalGeralVenda,  // Usar soma dos preços de venda
          valor_final: totalGeralVenda - (formData.desconto_valor || 0) + (formData.sobre_preco_valor || 0),
          // NOVO: Salvar estrutura de múltiplos produtos como JSON
          produtos_detalhes: JSON.stringify(produtosPedido)
        });
        
        console.log('📤 Enviando dados (com produtos):', dadosEnvio);
        
        if (pedido?.id) {
          console.log('🔄 Atualizando pedido ID:', pedido.id);
          await axios.put(`${API}/pedidos/${pedido.id}`, dadosEnvio, {
            headers: { Authorization: `Bearer ${token}` }
          });
          toast.success('Pedido atualizado!');
        } else {
          console.log('➕ Criando novo pedido');
          const response = await axios.post(`${API}/pedidos`, dadosEnvio, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('✅ Resposta do servidor:', response.data);
          toast.success('Pedido criado com sucesso!');
        }
      } else {
        console.log('⚠️ Sem produtos calculados, salvando dados básicos');
        
        // Sem produtos calculados, salvar dados básicos
        const dadosEnvio = limparDadosVazios({
          ...formData,
          cliente_nome: formData.cliente_nome || 'Cliente não informado',
          altura: formData.altura || 0,
          largura: formData.largura || 0,
          quantidade: formData.quantidade || 1,
          tipo_produto: formData.tipo_produto || 'Quadro',
          itens: [],
          custo_total: 0,
          preco_venda: 0,
          valor_final: 0,
          produtos_detalhes: "[]"
        });
        
        console.log('📤 Enviando dados (sem produtos):', dadosEnvio);
        
        if (pedido?.id) {
          console.log('🔄 Atualizando pedido ID:', pedido.id);
          await axios.put(`${API}/pedidos/${pedido.id}`, dadosEnvio, {
            headers: { Authorization: `Bearer ${token}` }
          });
          toast.success('Pedido atualizado!');
        } else {
          console.log('➕ Criando novo pedido');
          const response = await axios.post(`${API}/pedidos`, dadosEnvio, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('✅ Resposta do servidor:', response.data);
          toast.success('Pedido criado com sucesso!');
        }
      }
      
      console.log('✅ Salvamento concluído, chamando onSave()');
      onSave();
    } catch (error) {
      console.error('❌ ERRO AO SALVAR:', error);
      console.error('Detalhes do erro:', error.response?.data);
      console.error('Status do erro:', error.response?.status);
      toast.error('Erro ao salvar: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
      console.log('=== FIM DO SALVAMENTO ===');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const molduras = produtos.filter(p => p.familia && p.familia.includes('Moldura'));
  const vidros = produtos.filter(p => p.familia && p.familia.includes('Vidro'));
  const mdfs = produtos.filter(p => p.familia && (p.familia.includes('Substrato') || p.familia.includes('MDF')));
  const papeis = produtos.filter(p => p.familia && (p.familia.includes('Papel') || p.familia.includes('Adesivo')));
  const passepartouts = produtos.filter(p => p.familia && p.familia.includes('PasseParTout'));
  const produtosProntos = produtos.filter(p => p.familia && p.familia.includes('Produto Pronto'));
  const promocoes = produtos.filter(p => p.familia && p.familia.includes('Promoção'));

  return (
    <div className="system-container">
      <div className="system-header">
        <div className="header-title">
          <Package size={24} />
          <h2>{pedido ? `Pedido #${pedido.numero_pedido || 'Editar'}` : 'Novo Pedido de Manufatura'}</h2>
        </div>
        <button className="btn-close-system" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="system-tabs">
        <button className={`system-tab ${activeTab === 'basico' ? 'active' : ''}`} onClick={() => setActiveTab('basico')}>
          <span className="tab-number">1</span> Especificações
        </button>
        <button className={`system-tab ${activeTab === 'composicao' ? 'active' : ''}`} onClick={() => setActiveTab('composicao')}>
          <span className="tab-number">2</span> Composição
        </button>
        <button className={`system-tab ${activeTab === 'orcamento' ? 'active' : ''}`} onClick={() => setActiveTab('orcamento')}>
          <span className="tab-number">3</span> Orçamento
        </button>
        <button className={`system-tab ${activeTab === 'controle' ? 'active' : ''}`} onClick={() => setActiveTab('controle')}>
          <span className="tab-number">4</span> Controle & Cliente
        </button>
        {canViewCosts && (
          <button className={`system-tab ${activeTab === 'calculo' ? 'active' : ''}`} onClick={() => setActiveTab('calculo')}>
            <span className="tab-number">5</span> Custos 🔒
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="system-form">
        {activeTab === 'basico' && (
          <div className="system-content">
            <div className="section-title">Especificações do Produto</div>
            
            <div className="form-grid">
              <div className="input-group">
                <label>Tipo de Produto *</label>
                <select name="tipo_produto" value={formData.tipo_produto} onChange={handleChange} required>
                  {TIPOS_PRODUTO.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Altura (cm) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  name="altura" 
                  value={formData.altura} 
                  onChange={(e) => handleMedidasChange('altura', e.target.value)} 
                  required 
                />
              </div>
              <div className="input-group">
                <label>Largura (cm) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  name="largura" 
                  value={formData.largura} 
                  onChange={(e) => handleMedidasChange('largura', e.target.value)} 
                  required 
                />
              </div>
              <div className="input-group">
                <label>Quantidade *</label>
                <input 
                  type="number" 
                  name="quantidade" 
                  value={formData.quantidade} 
                  onChange={(e) => handleMedidasChange('quantidade', e.target.value)} 
                  min="1" 
                  required 
                />
              </div>
            </div>

            <button type="button" className="btn-next-system" onClick={() => setActiveTab('composicao')}>
              Avançar para Composição →
            </button>
          </div>
        )}

        {activeTab === 'composicao' && (
          <div className="system-content">
            <div className="section-title">Seleção de Insumos</div>

            {/* Moldura com campo SKU */}
            <div className="insumo-card">
              <div className="insumo-header">
                <span className="insumo-label">🖼️ Moldura</span>
              </div>
              <div className="form-grid">
                <div className="input-group" style={{flex: '0 0 200px'}}>
                  <label>Buscar por SKU</label>
                  <div className="sku-search">
                    <input
                      type="text"
                      value={molduraSku}
                      onChange={(e) => setMolduraSku(e.target.value)}
                      placeholder="Digite o SKU"
                      onKeyPress={(e) => e.key === 'Enter' && handleMolduraSkuSearch()}
                    />
                    <button type="button" className="btn-search" onClick={handleMolduraSkuSearch}>
                      <Search size={16} />
                    </button>
                  </div>
                </div>
                <div className="input-group" style={{flex: '1'}}>
                  <label>Ou selecione da lista</label>
                  <select
                    value={formData.moldura_id}
                    onChange={(e) => {
                      const mol = molduras.find(m => m.id === e.target.value);
                      handleProdutoSelect('moldura', mol);
                    }}
                  >
                    <option value="">Selecione...</option>
                    {molduras.map(m => (
                      <option key={m.id} value={m.id}>{m.referencia} - {m.descricao}</option>
                    ))}
                  </select>
                </div>
              </div>
              {formData.moldura_id && (
                <div className="preco-badge">
                  <span>Preço:</span> <strong>{formatCurrency(formData.moldura_preco)}</strong>
                </div>
              )}
            </div>

            {/* Vidro */}
            <div className="insumo-card">
              <div className="insumo-header">
                <label className="checkbox-inline">
                  <input type="checkbox" name="usar_vidro" checked={formData.usar_vidro} onChange={handleChange} />
                  <span className="insumo-label">🔷 Vidro</span>
                </label>
              </div>
              {formData.usar_vidro && (
                <>
                  <div className="input-group">
                    <select
                      name="vidro_id"
                      value={formData.vidro_id}
                      onChange={(e) => {
                        const vid = vidros.find(v => v.id === e.target.value);
                        handleProdutoSelect('vidro', vid);
                      }}
                    >
                      <option value="">Selecione...</option>
                      {vidros.map(v => (
                        <option key={v.id} value={v.id}>{v.referencia} - {v.descricao}</option>
                      ))}
                    </select>
                  </div>
                  {formData.vidro_id && (
                    <div className="preco-badge">
                      <span>Preço:</span> <strong>{formatCurrency(formData.vidro_preco)}</strong>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* MDF */}
            <div className="insumo-card">
              <div className="insumo-header">
                <label className="checkbox-inline">
                  <input type="checkbox" name="usar_mdf" checked={formData.usar_mdf} onChange={handleChange} />
                  <span className="insumo-label">📦 MDF/Substrato</span>
                </label>
              </div>
              {formData.usar_mdf && (
                <>
                  <div className="input-group">
                    <select
                      name="mdf_id"
                      value={formData.mdf_id}
                      onChange={(e) => {
                        const mdf = mdfs.find(m => m.id === e.target.value);
                        handleProdutoSelect('mdf', mdf);
                      }}
                    >
                      <option value="">Selecione...</option>
                      {mdfs.map(m => (
                        <option key={m.id} value={m.id}>{m.referencia} - {m.descricao}</option>
                      ))}
                    </select>
                  </div>
                  {formData.mdf_id && (
                    <div className="preco-badge">
                      <span>Preço:</span> <strong>{formatCurrency(formData.mdf_preco)}</strong>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Papel/Adesivo */}
            <div className="insumo-card">
              <div className="insumo-header">
                <label className="checkbox-inline">
                  <input type="checkbox" name="usar_papel" checked={formData.usar_papel} onChange={handleChange} />
                  <span className="insumo-label">📄 Papel/Adesivo</span>
                </label>
              </div>
              {formData.usar_papel && (
                <>
                  <div className="input-group">
                    <select
                      name="papel_id"
                      value={formData.papel_id}
                      onChange={(e) => {
                        const pap = papeis.find(p => p.id === e.target.value);
                        handleProdutoSelect('papel', pap);
                      }}
                    >
                      <option value="">Selecione...</option>
                      {papeis.map(p => (
                        <option key={p.id} value={p.id}>{p.referencia} - {p.descricao}</option>
                      ))}
                    </select>
                  </div>
                  {formData.papel_id && (
                    <div className="preco-badge">
                      <span>Preço:</span> <strong>{formatCurrency(formData.papel_preco)}</strong>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Passe-partout */}
            <div className="insumo-card">
              <div className="insumo-header">
                <label className="checkbox-inline">
                  <input type="checkbox" name="usar_passepartout" checked={formData.usar_passepartout} onChange={handleChange} />
                  <span className="insumo-label">🎨 Passe-partout</span>
                </label>
              </div>
              {formData.usar_passepartout && (
                <>
                  <div className="input-group">
                    <select
                      name="passepartout_id"
                      value={formData.passepartout_id}
                      onChange={(e) => {
                        const pp = passepartouts.find(p => p.id === e.target.value);
                        handleProdutoSelect('passepartout', pp);
                      }}
                    >
                      <option value="">Selecione...</option>
                      {passepartouts.map(p => (
                        <option key={p.id} value={p.id}>{p.referencia} - {p.descricao}</option>
                      ))}
                    </select>
                  </div>
                  {formData.passepartout_id && (
                    <div className="preco-badge">
                      <span>Preço:</span> <strong>{formatCurrency(formData.passepartout_preco)}</strong>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="section-title" style={{marginTop: '30px'}}>Produtos Especiais</div>

            {/* Produto Pronto */}
            <div className="insumo-card">
              <div className="insumo-header">
                <span className="insumo-label">✨ Produto Pronto</span>
              </div>
              <div className="input-group">
                <select
                  name="produto_pronto_id"
                  value={formData.produto_pronto_id}
                  onChange={(e) => {
                    const prod = produtosProntos.find(p => p.id === e.target.value);
                    handleProdutoSelect('produto_pronto', prod);
                  }}
                >
                  <option value="">Selecione...</option>
                  {produtosProntos.map(p => (
                    <option key={p.id} value={p.id}>{p.referencia} - {p.descricao} - {formatCurrency(p.preco_manufatura)}</option>
                  ))}
                </select>
              </div>
              {formData.produto_pronto_id && (
                <div className="preco-badge">
                  <span>Preço:</span> <strong>{formatCurrency(formData.produto_pronto_preco)}</strong>
                </div>
              )}
            </div>

            {/* Promoção */}
            <div className="insumo-card">
              <div className="insumo-header">
                <span className="insumo-label">🎁 Promoção</span>
              </div>
              <div className="input-group">
                <select
                  name="promocao_id"
                  value={formData.promocao_id}
                  onChange={(e) => {
                    const promo = promocoes.find(p => p.id === e.target.value);
                    handleProdutoSelect('promocao', promo);
                  }}
                >
                  <option value="">Selecione...</option>
                  {promocoes.map(p => (
                    <option key={p.id} value={p.id}>{p.referencia} - {p.descricao} - {formatCurrency(p.preco_manufatura)}</option>
                  ))}
                </select>
              </div>
              {formData.promocao_id && (
                <div className="preco-badge">
                  <span>Preço:</span> <strong>{formatCurrency(formData.promocao_preco)}</strong>
                </div>
              )}
            </div>

            <button type="button" className="btn-calculate-system" onClick={handleCalcular}>
              <Calculator size={18} />
              Calcular Orçamento
            </button>
          </div>
        )}

        {activeTab === 'orcamento' && (
          <div className="system-content">
            <div className="section-title">Orçamento Comercial</div>

            <div className="form-group-full">
              <label>Descrição do Trabalho</label>
              <textarea
                name="descricao_orcamento"
                value={formData.descricao_orcamento}
                onChange={handleChange}
                rows="4"
                placeholder="Descreva os detalhes do trabalho..."
              />
            </div>

            {/* NOVA SEÇÃO: Composição do Orçamento - Múltiplos Produtos */}
            {produtosPedido && produtosPedido.length > 0 && (
              <>
                <div className="section-title" style={{marginTop: '30px'}}>Composição do Orçamento</div>
                
                {produtosPedido.map((produto, produtoIndex) => (
                  <div key={produto.id} style={{marginBottom: '30px', padding: '15px', background: '#f7fafc', borderRadius: '8px', border: '2px solid #e2e8f0'}}>
                    {/* Cabeçalho do Produto */}
                    <div style={{marginBottom: '15px', padding: '10px', background: 'white', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div>
                        <strong style={{fontSize: '16px', color: '#2d7a5e'}}>Produto {produtoIndex + 1}: {produto.tipo_produto}</strong>
                        <div style={{fontSize: '13px', color: '#718096', marginTop: '5px'}}>
                          <strong>Quantidade:</strong> {produto.quantidade} unidade(s)
                          <span style={{marginLeft: '15px'}}>|</span>
                          <span style={{marginLeft: '15px'}}><strong>Dimensões:</strong> {produto.altura}cm × {produto.largura}cm</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Remover este produto do orçamento?')) {
                            const novosProdutos = produtosPedido.filter((_, i) => i !== produtoIndex);
                            setProdutosPedido(novosProdutos);
                            const novoTotal = novosProdutos.reduce((sum, p) => sum + p.total, 0);
                            setFormData(prev => ({...prev, valor_final: novoTotal}));
                            toast.success('Produto removido!');
                          }
                        }}
                        style={{padding: '8px 16px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600'}}
                      >
                        Remover
                      </button>
                    </div>
                    
                    {/* Tabela de Insumos do Produto */}
                    <div className="table-responsive">
                      <table className="orcamento-table">
                        <thead>
                          <tr>
                            <th>Insumo</th>
                            <th>Quantidade</th>
                            <th>Unidade</th>
                            <th>Preço Unit.</th>
                            <th>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {produto.itens.map((item, index) => (
                            <tr key={index}>
                              <td className="item-descricao">{item.insumo_descricao}</td>
                              <td className="quantidade-value">{item.quantidade?.toFixed(2)}</td>
                              <td>{item.unidade}</td>
                              <td className="preco-value">{formatCurrency(item.preco_unitario || 0)}</td>
                              <td className="subtotal-value">{formatCurrency(item.subtotal_venda || 0)}</td>
                            </tr>
                          ))}
                          <tr className="total-row">
                            <td colSpan="4"><strong>SUBTOTAL PRODUTO {produtoIndex + 1}</strong></td>
                            <td className="subtotal-value"><strong>{formatCurrency(produto.total)}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
                
                {/* Total Geral de Todos os Produtos */}
                <div style={{marginTop: '20px', padding: '15px', background: '#2d7a5e', color: 'white', borderRadius: '8px', textAlign: 'right'}}>
                  <div style={{fontSize: '18px', fontWeight: '700'}}>
                    TOTAL GERAL: {formatCurrency(produtosPedido.reduce((sum, p) => sum + p.total, 0))}
                  </div>
                </div>
                
                {/* Botão para adicionar mais produtos */}
                <div style={{marginTop: '15px', textAlign: 'center'}}>
                  <button 
                    type="button" 
                    className="btn-add-produto"
                    onClick={() => {
                      toast.info('Voltando para Especificações para adicionar novo produto...');
                      setActiveTab('basico');
                    }}
                    style={{
                      padding: '12px 24px',
                      background: '#5dceaa',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Package size={18} />
                    Adicionar Outro Produto/Medida ao Pedido
                  </button>
                  <p style={{fontSize: '12px', color: '#718096', marginTop: '8px'}}>
                    Defina nova medida/insumos e clique em "Calcular Orçamento" novamente
                  </p>
                </div>
              </>
            )}

            {/* SEÇÃO: CONDIÇÕES DE PAGAMENTO */}
            <div style={{
              marginTop: '30px',
              padding: '20px',
              background: '#f0fdf9',
              border: '2px solid #5dceaa',
              borderRadius: '12px'
            }}>
              <div className="section-title" style={{color: '#5dceaa', marginBottom: '20px'}}>
                💳 Condições de Pagamento
              </div>
              
              <div className="form-grid">
                <div className="input-group">
                  <label>Banco / Conta para Recebimento *</label>
                  <select 
                    value={contaBancariaSelecionada}
                    onChange={(e) => handleBancoChange(e.target.value)}
                    style={{border: '2px solid #5dceaa'}}
                  >
                    <option value="">Selecione o banco...</option>
                    {contasBancarias.map(conta => (
                      <option key={conta.id} value={conta.id}>
                        {conta.nome} - {conta.banco}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="input-group">
                  <label>Forma de Pagamento *</label>
                  <select 
                    value={formData.forma_pagamento_id}
                    onChange={(e) => handleFormaPagamentoChange(e.target.value)}
                    disabled={!contaBancariaSelecionada}
                    style={{border: '2px solid #5dceaa'}}
                  >
                    <option value="">Selecione a forma...</option>
                    {formasPagamentoDisponiveis.map(forma => (
                      <option key={forma.id} value={forma.id}>
                        {forma.nome_formatado}
                      </option>
                    ))}
                  </select>
                  {!contaBancariaSelecionada && (
                    <small style={{color: '#718096'}}>Selecione primeiro o banco</small>
                  )}
                </div>
              </div>

              {formaPagamentoSelecionada && (
                <div style={{
                  marginTop: '20px',
                  padding: '15px',
                  background: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <table style={{width: '100%', fontSize: '14px'}}>
                    <thead>
                      <tr style={{borderBottom: '2px solid #e2e8f0'}}>
                        <th style={{padding: '8px', textAlign: 'left', color: '#4a5568'}}>Item</th>
                        <th style={{padding: '8px', textAlign: 'right', color: '#4a5568'}}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{padding: '8px'}}>Valor Bruto da Venda</td>
                        <td style={{padding: '8px', textAlign: 'right', fontWeight: '600'}}>
                          {formatCurrency(formData.valor_bruto)}
                        </td>
                      </tr>
                      <tr>
                        <td style={{padding: '8px'}}>Taxa ({formData.taxa_percentual}%)</td>
                        <td style={{padding: '8px', textAlign: 'right', color: '#ef4444', fontWeight: '600'}}>
                          - {formatCurrency(formData.taxa_valor_real)}
                        </td>
                      </tr>
                      <tr style={{borderTop: '2px solid #e2e8f0', background: '#f0fdf9'}}>
                        <td style={{padding: '8px', fontWeight: '700', color: '#10b981'}}>Valor Líquido Empresa</td>
                        <td style={{padding: '8px', textAlign: 'right', fontWeight: '700', fontSize: '18px', color: '#10b981'}}>
                          {formatCurrency(formData.valor_liquido_empresa)}
                        </td>
                      </tr>
                      {formData.forma_pagamento_parcelas > 1 && (
                        <tr>
                          <td style={{padding: '8px', fontSize: '12px', color: '#718096'}}>
                            Parcelas: {formData.forma_pagamento_parcelas}x
                          </td>
                          <td style={{padding: '8px', textAlign: 'right', fontSize: '12px', color: '#718096'}}>
                            Aprox. {formatCurrency(formData.valor_bruto / formData.forma_pagamento_parcelas)} por parcela
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="form-grid" style={{marginTop: '20px'}}>
              <div className="input-group">
                <label>Valor de Entrada (Sinal/Adiantamento)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  name="valor_entrada"
                  value={formData.valor_entrada} 
                  onChange={handleChange}
                  placeholder="R$ 0,00"
                  style={{fontWeight: '600'}}
                />
              </div>
            </div>

            <div className="adjustments-grid">
              <div className="adjustment-card">
                <div className="adjustment-title">Desconto</div>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Percentual (%)</label>
                    <input type="number" step="0.01" value={formData.desconto_percentual} onChange={handleDescontoPercentualChange} />
                  </div>
                  <div className="input-group">
                    <label>Valor (R$)</label>
                    <input type="number" step="0.01" value={formData.desconto_valor} onChange={handleDescontoValorChange} />
                  </div>
                </div>
              </div>

              <div className="adjustment-card">
                <div className="adjustment-title">Sobre-preço</div>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Percentual (%)</label>
                    <input type="number" step="0.01" value={formData.sobre_preco_percentual} onChange={handleSobrePrecoPercentualChange} />
                  </div>
                  <div className="input-group">
                    <label>Valor (R$)</label>
                    <input type="number" step="0.01" value={formData.sobre_preco_valor} onChange={handleSobrePrecoValorChange} />
                  </div>
                </div>
              </div>
            </div>

            <div className="valor-final-display">
              <div className="valor-final-label">VALOR FINAL</div>
              <div className="valor-final-amount">{formatCurrency(formData.valor_final)}</div>
            </div>
            
            {/* NOVO: Resumo de Pagamento */}
            {formData.valor_entrada > 0 && (
              <div style={{marginTop: '20px', padding: '15px', background: '#f0fdf4', borderRadius: '8px', border: '2px solid #86efac'}}>
                <div style={{fontSize: '14px', fontWeight: '600', color: '#166534', marginBottom: '10px'}}>
                  📊 RESUMO DE PAGAMENTO
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #d1fae5'}}>
                  <span style={{color: '#064e3b', fontWeight: '500'}}>Valor Pago (Entrada):</span>
                  <span style={{color: '#059669', fontWeight: '700', fontSize: '16px'}}>
                    {formatCurrency(formData.valor_entrada)}
                  </span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', marginTop: '8px'}}>
                  <span style={{color: '#064e3b', fontWeight: '500'}}>Saldo Restante:</span>
                  <span style={{color: '#dc2626', fontWeight: '700', fontSize: '18px'}}>
                    {formatCurrency(formData.valor_final - formData.valor_entrada)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'controle' && (
          <div className="system-content">
            <div className="section-title">Informações do Cliente</div>
            
            <div className="form-grid">
              <div className="input-group" style={{flex: '2'}}>
                <label>Cliente *</label>
                <select name="cliente_id" value={formData.cliente_id} onChange={handleClienteChange} required>
                  <option value="">Selecione um cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nome} - {c.telefone}</option>
                  ))}
                </select>
              </div>
              <button type="button" className="btn-add-cliente" onClick={() => setShowClienteForm(!showClienteForm)}>
                <UserPlus size={18} />
                Novo Cliente
              </button>
            </div>

            {showClienteForm && (
              <div className="quick-add-box">
                <div className="quick-add-title">Cadastro Rápido</div>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Nome *</label>
                    <input type="text" name="nome" value={novoCliente.nome} onChange={handleNovoClienteChange} />
                  </div>
                  <div className="input-group">
                    <label>Telefone *</label>
                    <input type="text" name="telefone" value={novoCliente.telefone} onChange={handleNovoClienteChange} />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Celular</label>
                    <input type="text" name="celular" value={novoCliente.celular} onChange={handleNovoClienteChange} />
                  </div>
                  <div className="input-group">
                    <label>E-mail</label>
                    <input type="email" name="email" value={novoCliente.email} onChange={handleNovoClienteChange} />
                  </div>
                </div>
                <button type="button" className="btn-save-quick" onClick={handleCadastrarCliente}>
                  Salvar Cliente
                </button>
              </div>
            )}

            <div className="section-title" style={{marginTop: '30px'}}>Objeto do Cliente para Emoldurar</div>

            <div className="form-grid">
              <div className="input-group">
                <label>SKU do Objeto</label>
                <input
                  type="text"
                  name="sku_objeto_cliente"
                  value={formData.sku_objeto_cliente}
                  onChange={handleChange}
                  placeholder="Ex: GRAV-001"
                />
              </div>
              <div className="input-group">
                <label>Anexar Foto do Objeto</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImagemUpload}
                  className="file-input"
                />
              </div>
            </div>

            {formData.imagem_anexada && (
              <div className="image-preview-box">
                <div className="preview-title">Imagem Anexada:</div>
                <img src={formData.imagem_anexada} alt="Objeto do cliente" className="preview-image" />
              </div>
            )}

            <div className="section-title" style={{marginTop: '30px'}}>Controle Interno</div>

            <div className="form-grid">
              <div className="input-group">
                <label>Vendedor</label>
                <input type="text" name="vendedor" value={formData.vendedor} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label>Prazo de Entrega</label>
                <input type="date" name="prazo_entrega" value={formData.prazo_entrega} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group-full">
              <label>Observações Internas</label>
              <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows="3" />
            </div>
          </div>
        )}

        {activeTab === 'calculo' && canViewCosts && (
          <div className="system-content">
            <div className="section-title">Análise Técnica de Custos</div>

            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Área</div>
                <div className="metric-value">{formData.area.toFixed(4)} m²</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Perímetro</div>
                <div className="metric-value">{formData.perimetro.toFixed(2)} cm</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Barras</div>
                <div className="metric-value">{formData.barras_necessarias}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Sobra</div>
                <div className="metric-value">{formData.sobra.toFixed(2)} cm</div>
              </div>
            </div>

            {formData.custo_perda > 0 && (
              <div className="alert-warning">
                ⚠️ Perda técnica: {formatCurrency(formData.custo_perda)}
              </div>
            )}

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Insumo</th>
                    <th>Qtd</th>
                    <th>Un.</th>
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
            </div>

            <div className="summary-grid">
              <div className="summary-item">
                <span>Custo Total:</span>
                <strong>{formatCurrency(formData.custo_total)}</strong>
              </div>
              <div className="summary-item">
                <span>Markup:</span>
                <strong>{formData.markup.toFixed(2)}x</strong>
              </div>
              <div className="summary-item">
                <span>Margem:</span>
                <strong>{formData.margem_percentual.toFixed(1)}%</strong>
              </div>
            </div>
          </div>
        )}

        <div className="system-actions">
          <button type="button" className="btn-cancel-system" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-save-system" disabled={loading}>
            <Save size={18} />
            {loading ? 'Salvando...' : 'Salvar Pedido'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .system-container {
          background: #f8f9fa;
          min-height: 100vh;
          padding: 20px;
        }

        .system-header {
          background: white;
          padding: 20px 30px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-title h2 {
          margin: 0;
          font-size: 22px;
          color: #1a202c;
          font-weight: 600;
        }

        .btn-close-system {
          background: #f7fafc;
          border: none;
          padding: 8px;
          border-radius: 6px;
          cursor: pointer;
          color: #4a5568;
          transition: all 0.2s;
        }

        .btn-close-system:hover {
          background: #e2e8f0;
        }

        .system-tabs {
          display: flex;
          gap: 8px;
          background: white;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          overflow-x: auto;
        }

        .system-tab {
          flex: 1;
          min-width: 140px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f7fafc;
          border: 2px solid transparent;
          padding: 12px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #4a5568;
          transition: all 0.2s;
        }

        .system-tab.active {
          background: #e6f7f1;
          border-color: #5dceaa;
          color: #2d7a5e;
        }

        .system-tab:hover:not(.active) {
          background: #edf2f7;
        }

        .tab-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: #cbd5e0;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }

        .system-tab.active .tab-number {
          background: #5dceaa;
        }

        .system-form {
          background: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          margin-bottom: 20px;
        }

        .system-content {
          max-width: 1200px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e2e8f0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
        }

        .input-group label {
          font-size: 13px;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .input-group input,
        .input-group select {
          padding: 10px 12px;
          border: 1px solid #cbd5e0;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          transition: all 0.2s;
        }

        .input-group input:focus,
        .input-group select:focus {
          outline: none;
          border-color: #5dceaa;
          box-shadow: 0 0 0 3px rgba(93, 206, 170, 0.1);
        }

        .form-group-full {
          margin-bottom: 20px;
        }

        .form-group-full label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .form-group-full textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #cbd5e0;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
        }

        .form-group-full textarea:focus {
          outline: none;
          border-color: #5dceaa;
          box-shadow: 0 0 0 3px rgba(93, 206, 170, 0.1);
        }

        .insumo-card {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
        }

        .insumo-header {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }

        .insumo-label {
          font-size: 15px;
          font-weight: 600;
          color: #2d3748;
        }

        .checkbox-inline {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        .checkbox-inline input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .sku-search {
          display: flex;
          gap: 8px;
        }

        .sku-search input {
          flex: 1;
        }

        .btn-search {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-search:hover {
          background: #2563eb;
        }

        .preco-badge {
          background: #e6f7f1;
          border: 1px solid #5dceaa;
          padding: 8px 12px;
          border-radius: 6px;
          margin-top: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #2d7a5e;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .preco-badge strong {
          color: #1a5940;
          font-size: 16px;
        }

        .btn-next-system,
        .btn-calculate-system {
          background: #5dceaa;
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 24px;
          transition: all 0.2s;
        }

        .btn-calculate-system {
          background: #8b5cf6;
        }

        .btn-next-system:hover {
          background: #4db89a;
          box-shadow: 0 4px 12px rgba(93, 206, 170, 0.3);
        }

        .btn-calculate-system:hover {
          background: #7c3aed;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        .valor-display {
          background: #f7fafc;
          border: 2px solid #e2e8f0;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .valor-label {
          font-size: 14px;
          font-weight: 600;
          color: #4a5568;
          text-transform: uppercase;
        }

        .valor-amount {
          font-size: 28px;
          font-weight: 700;
          color: #2d3748;
        }

        .adjustments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin: 24px 0;
        }

        .adjustment-card {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
        }

        .adjustment-title {
          font-size: 15px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 12px;
        }

        .valor-final-display {
          background: linear-gradient(135deg, #5dceaa 0%, #4db89a 100%);
          padding: 24px;
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 16px rgba(93, 206, 170, 0.3);
        }

        .valor-final-label {
          font-size: 16px;
          font-weight: 700;
          color: white;
          letter-spacing: 1px;
        }

        .valor-final-amount {
          font-size: 36px;
          font-weight: 800;
          color: white;
        }

        .btn-add-cliente {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }

        .btn-add-cliente:hover {
          background: #2563eb;
        }

        .quick-add-box {
          background: #fef3c7;
          border: 2px dashed #f59e0b;
          padding: 20px;
          border-radius: 8px;
          margin: 16px 0 24px 0;
        }

        .quick-add-title {
          font-size: 15px;
          font-weight: 600;
          color: #92400e;
          margin-bottom: 12px;
        }

        .btn-save-quick {
          background: #10b981;
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 12px;
        }

        .btn-save-quick:hover {
          background: #059669;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .metric-card {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          padding: 16px;
          border-radius: 8px;
          text-align: center;
        }

        .metric-label {
          font-size: 12px;
          font-weight: 600;
          color: #718096;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .metric-value {
          font-size: 24px;
          font-weight: 700;
          color: #2d3748;
        }

        .alert-warning {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          color: #92400e;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .table-responsive {
          overflow-x: auto;
          margin-bottom: 24px;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table thead {
          background: #f7fafc;
        }

        .data-table th {
          padding: 12px;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          color: #4a5568;
          text-transform: uppercase;
          border-bottom: 2px solid #e2e8f0;
        }

        .data-table td {
          padding: 12px;
          font-size: 14px;
          color: #2d3748;
          border-bottom: 1px solid #e2e8f0;
        }

        .orcamento-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }

        .orcamento-table thead {
          background: #5dceaa;
        }

        .orcamento-table th {
          padding: 14px 12px;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .orcamento-table tbody tr {
          border-bottom: 1px solid #e2e8f0;
          transition: background 0.2s;
        }

        .orcamento-table tbody tr:hover:not(.total-row) {
          background: #f7fafc;
        }

        .orcamento-table td {
          padding: 12px;
          font-size: 14px;
          color: #2d3748;
        }

        .item-descricao {
          font-weight: 500;
          color: #2d3748;
        }

        .quantidade-value, .preco-value {
          text-align: right;
          font-family: 'Courier New', monospace;
          color: #4a5568;
        }

        .edit-input {
          width: 100%;
          max-width: 120px;
          padding: 6px 10px;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .edit-input:focus {
          outline: none;
          border-color: #5dceaa;
          box-shadow: 0 0 0 3px rgba(93, 206, 170, 0.1);
        }

        .subtotal-value {
          font-weight: 600;
          color: #2d7a5e;
        }

        .btn-remove-item {
          background: #fee2e2;
          color: #dc2626;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 700;
          transition: all 0.2s;
        }

        .btn-remove-item:hover {
          background: #fecaca;
          transform: scale(1.1);
        }

        .total-row {
          background: #f7fafc;
          font-weight: 600;
        }

        .total-row td {
          border-top: 2px solid #e2e8f0;
          padding: 14px 12px;
        }

        .summary-grid {
          background: #f7fafc;
          padding: 20px;
          border-radius: 8px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          font-size: 15px;
        }

        .summary-item strong {
          font-weight: 700;
          color: #2d3748;
        }

        .system-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 24px;
          border-top: 2px solid #e2e8f0;
        }

        .btn-cancel-system,
        .btn-save-system {
          padding: 12px 32px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .btn-cancel-system {
          background: #e2e8f0;
          border: none;
          color: #4a5568;
        }

        .btn-cancel-system:hover {
          background: #cbd5e0;
        }

        .btn-save-system {
          background: #5dceaa;
          border: none;
          color: white;
        }

        .btn-save-system:hover:not(:disabled) {
          background: #4db89a;
          box-shadow: 0 4px 12px rgba(93, 206, 170, 0.3);
        }

        .btn-save-system:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .file-input {
          padding: 8px;
          border: 2px dashed #cbd5e0;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .file-input:hover {
          border-color: #5dceaa;
          background: #f7fafc;
        }

        .image-preview-box {
          background: #f7fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
        }

        .preview-title {
          font-size: 13px;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 12px;
          text-transform: uppercase;
        }

        .preview-image {
          max-width: 300px;
          max-height: 300px;
          border-radius: 8px;
          border: 1px solid #cbd5e0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Edit2, Copy, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import ProdutoForm from './ProdutoForm';

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

export default function Produtos() {
  const { lojaAtual } = useOutletContext();
  const navigate = useNavigate();
  
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [familiaFilter, setFamiliaFilter] = useState('');

  useEffect(() => {
    fetchProdutos();
  }, [lojaAtual]);

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/produtos`, {
        params: { loja: lojaAtual }
      });
      setProdutos(res.data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNovoProduto = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEdit = (produto) => {
    setEditingProduct(produto);
    setShowForm(true);
  };

  const handleDuplicate = (produto) => {
    const duplicado = { ...produto };
    delete duplicado.id;
    duplicado.referencia = `${produto.referencia}-COPIA`;
    setEditingProduct(duplicado);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
      await axios.delete(`${API}/produtos/${id}`);
      toast.success('Produto excluído com sucesso!');
      fetchProdutos();
    } catch (error) {
      toast.error('Erro ao excluir produto');
    }
  };

  const filteredProdutos = produtos.filter(p => {
    const matchSearch = !searchTerm || 
      p.referencia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchFamilia = !familiaFilter || p.familia === familiaFilter;
    
    return matchSearch && matchFamilia;
  });

  if (showForm) {
    return (
      <ProdutoForm
        produto={editingProduct}
        lojaAtual={lojaAtual}
        onClose={() => {
          setShowForm(false);
          setEditingProduct(null);
        }}
        onSave={() => {
          setShowForm(false);
          setEditingProduct(null);
          fetchProdutos();
        }}
      />
    );
  }

  return (
    <div className="produtos-page">
      {/* Header */}
      <div className="page-header">
        <h2>Produtos</h2>
        <button className="btn-primary" onClick={handleNovoProduto}>
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      {/* Filtros */}
      <div className="filtros-section">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por referência, código ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="filter-select"
          value={familiaFilter}
          onChange={(e) => setFamiliaFilter(e.target.value)}
        >
          <option value="">Todas as Famílias</option>
          {FAMILIAS.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Lista de Produtos - Tabela */}
      <div className="produtos-lista">
        {loading ? (
          <div className="loading">Carregando produtos...</div>
        ) : filteredProdutos.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum produto encontrado</p>
            <button className="btn-secondary" onClick={handleNovoProduto}>
              Cadastrar Primeiro Produto
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="produtos-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Descrição</th>
                  <th>Família</th>
                  <th>Fornecedor</th>
                  <th className="text-right">Estoque</th>
                  <th className="text-right">Custo Base</th>
                  <th className="text-right">Preço Manufatura</th>
                  <th className="text-right">Preço Varejo</th>
                  <th className="text-center">Markup</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProdutos.map(produto => (
                  <tr key={produto.id}>
                    <td className="font-bold">{produto.referencia}</td>
                    <td>{produto.descricao}</td>
                    <td><span className="badge-familia">{produto.familia}</span></td>
                    <td>{produto.fornecedor || '-'}</td>
                    <td className="text-right">{produto.saldo_estoque || 0}</td>
                    <td className="text-right">R$ {Number(produto.custo_base || 0).toFixed(2)}</td>
                    <td className="text-right">R$ {Number(produto.preco_manufatura || 0).toFixed(2)}</td>
                    <td className="text-right preco-destaque">R$ {Number(produto.preco_varejo || 0).toFixed(2)}</td>
                    <td className="text-center">
                      {produto.markup_varejo ? (
                        <span className="badge-markup">{Number(produto.markup_varejo).toFixed(0)}%</span>
                      ) : '-'}
                    </td>
                    <td className="text-center">
                      <span className={`status-badge ${produto.ativo ? 'ativo' : 'inativo'}`}>
                        {produto.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="produto-actions">
                        <button onClick={() => handleEdit(produto)} title="Editar">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDuplicate(produto)} title="Duplicar">
                          <Copy size={16} />
                        </button>
                        <button onClick={() => handleDelete(produto.id)} title="Excluir" className="btn-delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .produtos-page {
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

        .btn-primary {
          background: #5dceaa;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: #4db89a;
          box-shadow: 0 4px 12px rgba(93, 206, 170, 0.3);
        }

        .btn-secondary {
          background: white;
          color: #5dceaa;
          border: 2px solid #5dceaa;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #5dceaa;
          color: white;
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
          color: #2d3748;
        }

        .filter-select {
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          color: #2d3748;
          background: #f7fafc;
          cursor: pointer;
          min-width: 200px;
        }

        .produtos-lista {
          min-height: 400px;
        }

        .loading {
          text-align: center;
          padding: 60px 20px;
          color: #718096;
          font-size: 16px;
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
        }

        .empty-state p {
          color: #718096;
          font-size: 18px;
          margin-bottom: 20px;
        }

        .table-container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        .produtos-table {
          width: 100%;
          border-collapse: collapse;
        }

        .produtos-table thead {
          background: #f7fafc;
          border-bottom: 2px solid #e2e8f0;
        }

        .produtos-table th {
          padding: 14px 16px;
          text-align: left;
          font-size: 13px;
          font-weight: 600;
          color: #4a5568;
          text-transform: uppercase;
        }

        .produtos-table td {
          padding: 16px;
          border-bottom: 1px solid #f0f0f0;
          font-size: 14px;
          color: #2d3748;
        }

        .produtos-table tbody tr:hover {
          background: #f7fafc;
        }

        .font-bold {
          font-weight: 600;
          color: #2d3748;
        }

        .text-right {
          text-align: right;
        }

        .text-center {
          text-align: center;
        }

        .badge-familia {
          background: #edf2f7;
          color: #2d3748;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge-markup {
          background: #5dceaa;
          color: white;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .preco-destaque {
          color: #5dceaa;
          font-weight: 600;
        }

        .produto-actions {
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .produto-actions button {
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

        .produto-actions button:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
        }

        .produto-actions .btn-delete:hover {
          background: #fff5f5;
          border-color: #fc8181;
          color: #e53e3e;
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
      `}</style>
    </div>
  );
}

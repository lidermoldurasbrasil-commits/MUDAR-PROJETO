import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, Save } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/gestao`;

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    rg: '',
    data_nascimento: '',
    telefone: '',
    celular: '',
    email: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    observacoes: '',
    loja_id: 'fabrica'
  });

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    filterClientes();
  }, [clientes, searchTerm]);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/clientes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClientes(response.data);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const filterClientes = () => {
    if (!searchTerm) {
      setFilteredClientes(clientes);
      return;
    }

    const filtered = clientes.filter(c =>
      c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cpf?.includes(searchTerm) ||
      c.telefone?.includes(searchTerm)
    );
    setFilteredClientes(filtered);
  };

  const handleAdd = () => {
    setSelectedCliente(null);
    setFormData({
      nome: '',
      cpf: '',
      rg: '',
      data_nascimento: '',
      telefone: '',
      celular: '',
      email: '',
      cep: '',
      endereco: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      observacoes: '',
      loja_id: 'fabrica'
    });
    setShowForm(true);
  };

  const handleEdit = (cliente) => {
    setSelectedCliente(cliente);
    setFormData(cliente);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este cliente?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/clientes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Cliente excluído com sucesso!');
      fetchClientes();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nome || !formData.telefone) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      if (selectedCliente) {
        await axios.put(`${API}/clientes/${selectedCliente.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await axios.post(`${API}/clientes`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Cliente cadastrado com sucesso!');
      }

      setShowForm(false);
      fetchClientes();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar cliente');
    }
  };

  if (showForm) {
    return (
      <div className="clientes-form-container">
        <div className="form-header">
          <h2>{selectedCliente ? 'Editar Cliente' : 'Novo Cliente'}</h2>
          <button className="btn-close" onClick={() => setShowForm(false)}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="cliente-form">
          <h3>Dados Pessoais</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Nome Completo: *</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>CPF:</label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>RG:</label>
              <input
                type="text"
                name="rg"
                value={formData.rg}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Data de Nascimento:</label>
              <input
                type="date"
                name="data_nascimento"
                value={formData.data_nascimento}
                onChange={handleChange}
              />
            </div>
          </div>

          <h3>Contato</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Telefone: *</label>
              <input
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                placeholder="(00) 0000-0000"
                required
              />
            </div>
            <div className="form-group">
              <label>Celular:</label>
              <input
                type="text"
                name="celular"
                value={formData.celular}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="form-group">
              <label>E-mail:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <h3>Endereço de Entrega</h3>
          <div className="form-row">
            <div className="form-group">
              <label>CEP:</label>
              <input
                type="text"
                name="cep"
                value={formData.cep}
                onChange={handleChange}
                placeholder="00000-000"
              />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label>Endereço:</label>
              <input
                type="text"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Número:</label>
              <input
                type="text"
                name="numero"
                value={formData.numero}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Complemento:</label>
              <input
                type="text"
                name="complemento"
                value={formData.complemento}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Bairro:</label>
              <input
                type="text"
                name="bairro"
                value={formData.bairro}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Cidade:</label>
              <input
                type="text"
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Estado:</label>
              <input
                type="text"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                maxLength="2"
                placeholder="SP"
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

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-save">
              <Save size={18} />
              Salvar
            </button>
          </div>
        </form>

        <style jsx>{`
          .clientes-form-container {
            max-width: 1000px;
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

          .cliente-form {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          }

          .cliente-form h3 {
            font-size: 16px;
            color: #2d3748;
            margin: 25px 0 15px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #e2e8f0;
          }

          .cliente-form h3:first-child {
            margin-top: 0;
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
          }

          .form-group label {
            font-size: 14px;
            color: #4a5568;
            margin-bottom: 6px;
            font-weight: 500;
          }

          .form-group input,
          .form-group textarea {
            padding: 10px 12px;
            border: 1px solid #cbd5e0;
            border-radius: 6px;
            font-size: 14px;
          }

          .form-group input:focus,
          .form-group textarea:focus {
            outline: none;
            border-color: #5dceaa;
            box-shadow: 0 0 0 3px rgba(93, 206, 170, 0.1);
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

          .btn-save:hover {
            background: #4db89a;
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

  return (
    <div className="clientes-container">
      <div className="clientes-header">
        <h1>Clientes</h1>
        <button className="btn-add" onClick={handleAdd}>
          <Plus size={20} />
          Novo Cliente
        </button>
      </div>

      <div className="search-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="clientes-table-container">
        {loading ? (
          <div className="loading">Carregando clientes...</div>
        ) : (
          <table className="clientes-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>Celular</th>
                <th>Cidade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              ) : (
                filteredClientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td className="cliente-nome">{cliente.nome}</td>
                    <td>{cliente.cpf || '-'}</td>
                    <td>{cliente.telefone}</td>
                    <td>{cliente.celular || '-'}</td>
                    <td>{cliente.cidade || '-'}</td>
                    <td className="actions">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEdit(cliente)}
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(cliente.id)}
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <style jsx>{`
        .clientes-container {
          padding: 30px;
          max-width: 1600px;
          margin: 0 auto;
        }

        .clientes-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .clientes-header h1 {
          font-size: 28px;
          color: #2d3748;
          margin: 0;
        }

        .btn-add {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #5dceaa;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-add:hover {
          background: #4db89a;
          box-shadow: 0 4px 12px rgba(93, 206, 170, 0.3);
        }

        .search-section {
          margin-bottom: 20px;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          padding: 10px 15px;
          border-radius: 8px;
          border: 1px solid #cbd5e0;
          max-width: 500px;
        }

        .search-box input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
        }

        .clientes-table-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          overflow: hidden;
        }

        .clientes-table {
          width: 100%;
          border-collapse: collapse;
        }

        .clientes-table thead {
          background: #f7fafc;
        }

        .clientes-table th {
          padding: 15px;
          text-align: left;
          font-size: 13px;
          font-weight: 600;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e2e8f0;
        }

        .clientes-table td {
          padding: 15px;
          font-size: 14px;
          color: #2d3748;
          border-bottom: 1px solid #e2e8f0;
        }

        .clientes-table tbody tr:hover {
          background: #f7fafc;
        }

        .cliente-nome {
          font-weight: 600;
          color: #5dceaa;
        }

        .actions {
          display: flex;
          gap: 8px;
        }

        .btn-icon {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .btn-edit {
          color: #3b82f6;
        }

        .btn-edit:hover {
          background: #dbeafe;
        }

        .btn-delete {
          color: #ef4444;
        }

        .btn-delete:hover {
          background: #fee2e2;
        }

        .loading,
        .no-data {
          padding: 60px;
          text-align: center;
          color: #718096;
        }
      `}</style>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Key, Users } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/gestao`;

const ROLES = [
  { value: 'director', label: 'Diretor (Acesso Total)', color: '#8B5CF6' },
  { value: 'manager', label: 'Gerente (Acesso Total)', color: '#3B82F6' },
  { value: 'sala_impressao', label: 'Sala de Impressão', color: '#F59E0B' },
  { value: 'arte', label: 'Setor de Arte', color: '#10B981' },
  { value: 'expedicao', label: 'Expedição', color: '#06B6D4' },
  { value: 'montagem', label: 'Montagem', color: '#8B5CF6' },
  { value: 'separacao', label: 'Em Separação', color: '#EC4899' }
];

export default function GestaoUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'sala_impressao'
  });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/usuarios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarios(response.data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        role: 'sala_impressao'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      role: 'sala_impressao'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validações
    if (!formData.username.trim()) {
      toast.error('Nome de usuário é obrigatório');
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      toast.error('Senha é obrigatória para novos usuários');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (editingUser) {
        // Editar
        await axios.put(
          `${API}/usuarios/${editingUser.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Usuário atualizado com sucesso');
      } else {
        // Criar
        await axios.post(
          `${API}/usuarios`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Usuário criado com sucesso');
      }
      
      handleCloseModal();
      fetchUsuarios();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast.error(error.response?.data?.detail || 'Erro ao salvar usuário');
    }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Tem certeza que deseja deletar o usuário "${username}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/usuarios/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Usuário deletado com sucesso');
      fetchUsuarios();
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      toast.error(error.response?.data?.detail || 'Erro ao deletar usuário');
    }
  };

  const getRoleLabel = (role) => {
    const roleObj = ROLES.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  };

  const getRoleColor = (role) => {
    const roleObj = ROLES.find(r => r.value === role);
    return roleObj ? roleObj.color : '#94A3B8';
  };

  return (
    <div className="gestao-usuarios-container">
      <style>{`
        .gestao-usuarios-container {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .header h1 {
          font-size: 28px;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
        }

        .card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        thead {
          background: #f8fafc;
        }

        th {
          padding: 16px;
          text-align: left;
          font-weight: 600;
          color: #64748b;
          font-size: 13px;
          text-transform: uppercase;
          border-bottom: 2px solid #e2e8f0;
        }

        td {
          padding: 16px;
          border-bottom: 1px solid #e2e8f0;
          color: #334155;
        }

        tbody tr:hover {
          background: #f8fafc;
        }

        .role-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          color: white;
        }

        .actions {
          display: flex;
          gap: 8px;
        }

        .btn-icon {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-icon:hover {
          background: #f1f5f9;
        }

        .btn-icon.edit:hover {
          background: #dbeafe;
          color: #2563eb;
        }

        .btn-icon.delete:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          border-radius: 12px;
          padding: 32px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal h2 {
          margin: 0 0 24px 0;
          color: #1e293b;
          font-size: 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #334155;
          font-weight: 600;
          font-size: 14px;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #667eea;
        }

        .form-help {
          font-size: 12px;
          color: #64748b;
          margin-top: 4px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .btn-secondary {
          flex: 1;
          padding: 12px;
          border: 2px solid #e2e8f0;
          background: white;
          color: #64748b;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .btn-submit {
          flex: 1;
          padding: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-submit:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #94a3b8;
        }

        .empty-state svg {
          margin: 0 auto 16px;
          opacity: 0.5;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #64748b;
        }
      `}</style>

      <div className="header">
        <h1>
          <Users size={32} />
          Gestão de Usuários
        </h1>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} />
          Novo Usuário
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Carregando usuários...</div>
        ) : usuarios.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <p>Nenhum usuário cadastrado</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Setor / Permissão</th>
                  <th>Criado em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>
                      <strong>{usuario.username}</strong>
                    </td>
                    <td>
                      <span 
                        className="role-badge"
                        style={{ backgroundColor: getRoleColor(usuario.role) }}
                      >
                        {getRoleLabel(usuario.role)}
                      </span>
                    </td>
                    <td>
                      {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn-icon edit"
                          onClick={() => handleOpenModal(usuario)}
                          title="Editar usuário"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          className="btn-icon delete"
                          onClick={() => handleDelete(usuario.id, usuario.username)}
                          title="Deletar usuário"
                        >
                          <Trash2 size={18} />
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome de Usuário *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="Digite o nome de usuário"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Key size={16} style={{ display: 'inline', marginRight: '4px' }} />
                  Senha {editingUser ? '(deixe vazio para manter)' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder={editingUser ? 'Nova senha (opcional)' : 'Digite a senha'}
                  required={!editingUser}
                />
                {editingUser && (
                  <div className="form-help">
                    Deixe em branco para não alterar a senha atual
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Setor / Permissão *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  required
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <div className="form-help">
                  Setores operacionais têm acesso limitado apenas à produção
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-submit">
                  {editingUser ? 'Atualizar' : 'Criar'} Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

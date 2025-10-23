import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const ENTITIES = ['Factory', 'Store 1', 'Store 2', 'Store 3'];

export default function AccountsPayable() {
  const [accounts, setAccounts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filterEntity, setFilterEntity] = useState('');
  const [formData, setFormData] = useState({ supplier: '', invoice_number: '', due_date: '', value: 0, cost_center: '', status: 'Pending', entity: 'Factory' });

  useEffect(() => { fetchAccounts(); }, [filterEntity]);

  const fetchAccounts = async () => {
    try {
      const url = filterEntity ? `${API}/accounts-payable?entity=${filterEntity}` : `${API}/accounts-payable`;
      const res = await axios.get(url);
      setAccounts(res.data);
    } catch (error) {
      toast.error('Error loading accounts');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/accounts-payable`, formData);
      toast.success('Account created');
      fetchAccounts();
      setShowModal(false);
      setFormData({ supplier: '', invoice_number: '', due_date: '', value: 0, cost_center: '', status: 'Pending', entity: 'Factory' });
    } catch (error) {
      toast.error('Error saving account');
    }
  };

  return (
    <div data-testid="accounts-payable-page">
      <div className="page-header">
        <div><h2>Accounts Payable</h2></div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)} data-testid="filter-entity">
            <option value="">All Entities</option>
            {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <button className="btn-primary" onClick={() => setShowModal(true)} data-testid="add-account-payable-btn"><Plus size={20} /><span>Add Account</span></button>
        </div>
      </div>
      <div className="card">
        <table data-testid="accounts-payable-table">
          <thead><tr><th>Supplier</th><th>Invoice</th><th>Due Date</th><th>Value</th><th>Cost Center</th><th>Entity</th><th>Status</th></tr></thead>
          <tbody>
            {accounts.map(acc => (
              <tr key={acc.id}>
                <td>{acc.supplier}</td><td>{acc.invoice_number}</td><td>{acc.due_date}</td><td>${acc.value}</td>
                <td>{acc.cost_center}</td><td>{acc.entity}</td>
                <td><span className={`status-badge status-${acc.status.toLowerCase()}`}>{acc.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay"><div className="modal-content">
          <div className="modal-header"><h3>New Account Payable</h3><button onClick={() => setShowModal(false)} className="close-btn">&times;</button></div>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Supplier</label><input type="text" value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})} required data-testid="input-supplier" /></div>
            <div className="form-group"><label>Invoice Number</label><input type="text" value={formData.invoice_number} onChange={(e) => setFormData({...formData, invoice_number: e.target.value})} required /></div>
            <div className="form-group"><label>Due Date</label><input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} required /></div>
            <div className="form-group"><label>Value</label><input type="number" step="0.01" value={formData.value} onChange={(e) => setFormData({...formData, value: parseFloat(e.target.value)})} required /></div>
            <div className="form-group"><label>Cost Center</label><input type="text" value={formData.cost_center} onChange={(e) => setFormData({...formData, cost_center: e.target.value})} required /></div>
            <div className="form-group"><label>Entity</label><select value={formData.entity} onChange={(e) => setFormData({...formData, entity: e.target.value})}>{ENTITIES.map(e => <option key={e}>{e}</option>)}</select></div>
            <div className="modal-actions"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary" data-testid="submit-account-payable">Create</button></div>
          </form>
        </div></div>
      )}
    </div>
  );
}

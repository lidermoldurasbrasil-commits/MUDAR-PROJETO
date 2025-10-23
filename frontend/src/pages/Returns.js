import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_OPTIONS = ['Pending', 'Under Review', 'Approved for Refund', 'Resolved'];
const PLATFORMS = ['Shopee', 'Mercado Livre', 'TikTok'];

export default function Returns() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    order_id: '', platform: 'Shopee', product: '', return_reason: '',
    cost: 0, responsible_department: '', resolution_status: 'Pending'
  });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API}/returns`);
      setItems(res.data);
    } catch (error) {
      toast.error('Error loading returns');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/returns`, formData);
      toast.success('Return created');
      fetchItems();
      setShowModal(false);
      setFormData({ order_id: '', platform: 'Shopee', product: '', return_reason: '', cost: 0, responsible_department: '', resolution_status: 'Pending' });
    } catch (error) {
      toast.error('Error saving return');
    }
  };

  return (
    <div data-testid="returns-page">
      <div className="page-header">
        <div><h2>Returns Management</h2></div>
        <button className="btn-primary" onClick={() => setShowModal(true)} data-testid="add-return-btn"><Plus size={20} /><span>Add Return</span></button>
      </div>
      <div className="card">
        <table data-testid="returns-table">
          <thead><tr><th>Order ID</th><th>Platform</th><th>Product</th><th>Reason</th><th>Cost</th><th>Department</th><th>Status</th></tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>{item.order_id}</td><td>{item.platform}</td><td>{item.product}</td><td>{item.return_reason}</td>
                <td>${item.cost}</td><td>{item.responsible_department}</td>
                <td><span className={`status-badge status-${item.resolution_status.toLowerCase().replace(' ', '-')}`}>{item.resolution_status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay"><div className="modal-content">
          <div className="modal-header"><h3>New Return</h3><button onClick={() => setShowModal(false)} className="close-btn">&times;</button></div>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Order ID</label><input type="text" value={formData.order_id} onChange={(e) => setFormData({...formData, order_id: e.target.value})} required /></div>
            <div className="form-group"><label>Platform</label><select value={formData.platform} onChange={(e) => setFormData({...formData, platform: e.target.value})}>{PLATFORMS.map(p => <option key={p}>{p}</option>)}</select></div>
            <div className="form-group"><label>Product</label><input type="text" value={formData.product} onChange={(e) => setFormData({...formData, product: e.target.value})} required /></div>
            <div className="form-group"><label>Return Reason</label><textarea value={formData.return_reason} onChange={(e) => setFormData({...formData, return_reason: e.target.value})} required /></div>
            <div className="form-group"><label>Cost</label><input type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({...formData, cost: parseFloat(e.target.value)})} required /></div>
            <div className="form-group"><label>Responsible Department</label><input type="text" value={formData.responsible_department} onChange={(e) => setFormData({...formData, responsible_department: e.target.value})} required /></div>
            <div className="modal-actions"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Create</button></div>
          </form>
        </div></div>
      )}
    </div>
  );
}

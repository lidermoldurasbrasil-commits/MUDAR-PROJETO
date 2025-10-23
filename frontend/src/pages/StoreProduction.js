import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const STATUS_OPTIONS = ['Artwork Creation', 'Client Approval', 'Printing', 'Production', 'Ready', 'Delivered'];

export default function StoreProduction() {
  const { storeId } = useParams();
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ store: storeId, customer_name: '', order_id: '', status: 'Artwork Creation', delivery_deadline: '' });

  useEffect(() => { fetchItems(); }, [storeId]);

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API}/store-production?store=${storeId}`);
      setItems(res.data);
    } catch (error) {
      toast.error('Error loading items');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/store-production`, formData);
      toast.success('Task created');
      fetchItems();
      setShowModal(false);
      setFormData({ store: storeId, customer_name: '', order_id: '', status: 'Artwork Creation', delivery_deadline: '' });
    } catch (error) {
      toast.error('Error saving task');
    }
  };

  const storeName = storeId === 'factory' ? 'Factory' : `Store ${storeId.replace('store', '')}`;

  return (
    <div data-testid="store-production-page">
      <div className="page-header">
        <div><h2>{storeName} Production</h2></div>
        <button className="btn-primary" onClick={() => setShowModal(true)} data-testid="add-store-production-btn"><Plus size={20} /><span>Add Task</span></button>
      </div>
      <div className="card">
        <table data-testid="store-production-table">
          <thead><tr><th>Customer</th><th>Order ID</th><th>Status</th><th>Delivery Deadline</th></tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>{item.customer_name}</td><td>{item.order_id}</td>
                <td><span className={`status-badge status-${item.status.toLowerCase().replace(' ', '-')}`}>{item.status}</span></td>
                <td>{item.delivery_deadline}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay"><div className="modal-content">
          <div className="modal-header"><h3>New Production Task</h3><button onClick={() => setShowModal(false)} className="close-btn">&times;</button></div>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Customer Name</label><input type="text" value={formData.customer_name} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} required data-testid="input-customer-name" /></div>
            <div className="form-group"><label>Order ID</label><input type="text" value={formData.order_id} onChange={(e) => setFormData({...formData, order_id: e.target.value})} required /></div>
            <div className="form-group"><label>Status</label><select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>{STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}</select></div>
            <div className="form-group"><label>Delivery Deadline</label><input type="date" value={formData.delivery_deadline} onChange={(e) => setFormData({...formData, delivery_deadline: e.target.value})} required /></div>
            <div className="modal-actions"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary" data-testid="submit-store-production">Create</button></div>
          </form>
        </div></div>
      )}
    </div>
  );
}

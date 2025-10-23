import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const STATUS_OPTIONS = ['Sent to Supplier', 'In Production', 'In Transit', 'Delivered'];

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ request_id: '', supplier: '', order_date: '', status: 'Sent to Supplier' });

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API}/purchase-orders`);
      setOrders(res.data);
    } catch (error) {
      toast.error('Error loading orders');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/purchase-orders`, formData);
      toast.success('Order created');
      fetchOrders();
      setShowModal(false);
      setFormData({ request_id: '', supplier: '', order_date: '', status: 'Sent to Supplier' });
    } catch (error) {
      toast.error('Error saving order');
    }
  };

  return (
    <div data-testid="purchase-orders-page">
      <div className="page-header">
        <div><h2>Purchase Orders</h2></div>
        <button className="btn-primary" onClick={() => setShowModal(true)} data-testid="add-purchase-order-btn"><Plus size={20} /><span>New Order</span></button>
      </div>
      <div className="card">
        <table data-testid="purchase-orders-table">
          <thead><tr><th>Request ID</th><th>Supplier</th><th>Order Date</th><th>Status</th></tr></thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>{order.request_id}</td><td>{order.supplier}</td><td>{order.order_date}</td>
                <td><span className={`status-badge status-${order.status.toLowerCase().replace(' ', '-')}`}>{order.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay"><div className="modal-content">
          <div className="modal-header"><h3>New Purchase Order</h3><button onClick={() => setShowModal(false)} className="close-btn">&times;</button></div>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Request ID</label><input type="text" value={formData.request_id} onChange={(e) => setFormData({...formData, request_id: e.target.value})} required data-testid="input-request-id" /></div>
            <div className="form-group"><label>Supplier</label><input type="text" value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})} required /></div>
            <div className="form-group"><label>Order Date</label><input type="date" value={formData.order_date} onChange={(e) => setFormData({...formData, order_date: e.target.value})} required /></div>
            <div className="form-group"><label>Status</label><select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>{STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}</select></div>
            <div className="modal-actions"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary" data-testid="submit-purchase-order">Create</button></div>
          </form>
        </div></div>
      )}
    </div>
  );
}

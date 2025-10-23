import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const CHANNELS = ['Marketplace', 'Store 1', 'Store 2', 'Store 3'];

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ channel: 'Marketplace', product: '', quantity: 0, revenue: 0, sale_date: '' });

  useEffect(() => { fetchSales(); }, []);

  const fetchSales = async () => {
    try {
      const res = await axios.get(`${API}/sales`);
      setSales(res.data);
    } catch (error) {
      toast.error('Error loading sales');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/sales`, formData);
      toast.success('Sale created');
      fetchSales();
      setShowModal(false);
      setFormData({ channel: 'Marketplace', product: '', quantity: 0, revenue: 0, sale_date: '' });
    } catch (error) {
      toast.error('Error saving sale');
    }
  };

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.revenue, 0);

  return (
    <div data-testid="sales-page">
      <div className="page-header">
        <div><h2>Sales</h2><p className="stats-text">Total Revenue: ${totalRevenue.toFixed(2)}</p></div>
        <button className="btn-primary" onClick={() => setShowModal(true)} data-testid="add-sale-btn"><Plus size={20} /><span>Add Sale</span></button>
      </div>
      <div className="card">
        <table data-testid="sales-table">
          <thead><tr><th>Channel</th><th>Product</th><th>Quantity</th><th>Revenue</th><th>Sale Date</th></tr></thead>
          <tbody>
            {sales.map(sale => (
              <tr key={sale.id}>
                <td>{sale.channel}</td><td>{sale.product}</td><td>{sale.quantity}</td>
                <td>${sale.revenue}</td><td>{sale.sale_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay"><div className="modal-content">
          <div className="modal-header"><h3>New Sale</h3><button onClick={() => setShowModal(false)} className="close-btn">&times;</button></div>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Channel</label><select value={formData.channel} onChange={(e) => setFormData({...formData, channel: e.target.value})} data-testid="select-channel">{CHANNELS.map(c => <option key={c}>{c}</option>)}</select></div>
            <div className="form-group"><label>Product</label><input type="text" value={formData.product} onChange={(e) => setFormData({...formData, product: e.target.value})} required /></div>
            <div className="form-group"><label>Quantity</label><input type="number" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})} required /></div>
            <div className="form-group"><label>Revenue</label><input type="number" step="0.01" value={formData.revenue} onChange={(e) => setFormData({...formData, revenue: parseFloat(e.target.value)})} required /></div>
            <div className="form-group"><label>Sale Date</label><input type="date" value={formData.sale_date} onChange={(e) => setFormData({...formData, sale_date: e.target.value})} required /></div>
            <div className="modal-actions"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary" data-testid="submit-sale">Create</button></div>
          </form>
        </div></div>
      )}
      <style jsx>{`.stats-text { color: #667eea; font-weight: 600; font-size: 18px; margin-top: 8px; }`}</style>
    </div>
  );
}

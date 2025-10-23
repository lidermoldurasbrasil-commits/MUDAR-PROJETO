import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const STATUS_OPTIONS = ['Created', 'Under Analysis', 'Resolved', 'Not Resolved'];

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ customer_name: '', order_id: '', problem_description: '', manager: '', status: 'Created' });

  useEffect(() => { fetchComplaints(); }, []);

  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${API}/complaints`);
      setComplaints(res.data);
    } catch (error) {
      toast.error('Error loading complaints');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/complaints`, formData);
      toast.success('Complaint created');
      fetchComplaints();
      setShowModal(false);
      setFormData({ customer_name: '', order_id: '', problem_description: '', manager: '', status: 'Created' });
    } catch (error) {
      toast.error('Error saving complaint');
    }
  };

  return (
    <div data-testid="complaints-page">
      <div className="page-header">
        <div><h2>Customer Complaints</h2></div>
        <button className="btn-primary" onClick={() => setShowModal(true)} data-testid="add-complaint-btn"><Plus size={20} /><span>Add Complaint</span></button>
      </div>
      <div className="card">
        <table data-testid="complaints-table">
          <thead><tr><th>Customer</th><th>Order ID</th><th>Problem</th><th>Manager</th><th>Status</th></tr></thead>
          <tbody>
            {complaints.map(complaint => (
              <tr key={complaint.id}>
                <td>{complaint.customer_name}</td><td>{complaint.order_id}</td><td>{complaint.problem_description}</td>
                <td>{complaint.manager}</td>
                <td><span className={`status-badge status-${complaint.status.toLowerCase().replace(' ', '-')}`}>{complaint.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay"><div className="modal-content">
          <div className="modal-header"><h3>New Complaint</h3><button onClick={() => setShowModal(false)} className="close-btn">&times;</button></div>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Customer Name</label><input type="text" value={formData.customer_name} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} required data-testid="input-customer-name" /></div>
            <div className="form-group"><label>Order ID</label><input type="text" value={formData.order_id} onChange={(e) => setFormData({...formData, order_id: e.target.value})} required /></div>
            <div className="form-group"><label>Problem Description</label><textarea value={formData.problem_description} onChange={(e) => setFormData({...formData, problem_description: e.target.value})} required /></div>
            <div className="form-group"><label>Assigned Manager</label><input type="text" value={formData.manager} onChange={(e) => setFormData({...formData, manager: e.target.value})} required /></div>
            <div className="modal-actions"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary" data-testid="submit-complaint">Create</button></div>
          </form>
        </div></div>
      )}
    </div>
  );
}

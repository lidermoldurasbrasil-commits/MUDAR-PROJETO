import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PurchaseRequests() {
  const [requests, setRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ item_name: '', description: '', quantity: 0, supplier: '', estimated_cost: 0, requested_by: '' });

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API}/purchase-requests`);
      setRequests(res.data);
    } catch (error) {
      toast.error('Error loading requests');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/purchase-requests`, formData);
      toast.success('Request created');
      fetchRequests();
      setShowModal(false);
      setFormData({ item_name: '', description: '', quantity: 0, supplier: '', estimated_cost: 0, requested_by: '' });
    } catch (error) {
      toast.error('Error saving request');
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.patch(`${API}/purchase-requests/${id}/approve`);
      toast.success('Request approved');
      fetchRequests();
    } catch (error) {
      toast.error('Error approving request');
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.patch(`${API}/purchase-requests/${id}/reject`);
      toast.success('Request rejected');
      fetchRequests();
    } catch (error) {
      toast.error('Error rejecting request');
    }
  };

  return (
    <div data-testid="purchase-requests-page">
      <div className="page-header">
        <div><h2>Purchase Requests</h2></div>
        <button className="btn-primary" onClick={() => setShowModal(true)} data-testid="add-purchase-request-btn"><Plus size={20} /><span>New Request</span></button>
      </div>
      <div className="card">
        <table data-testid="purchase-requests-table">
          <thead><tr><th>Item</th><th>Description</th><th>Qty</th><th>Supplier</th><th>Cost</th><th>Requested By</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.id}>
                <td>{req.item_name}</td><td>{req.description}</td><td>{req.quantity}</td><td>{req.supplier}</td>
                <td>${req.estimated_cost}</td><td>{req.requested_by}</td>
                <td><span className={`status-badge status-${req.approval_status.toLowerCase()}`}>{req.approval_status}</span></td>
                <td>
                  {req.approval_status === 'Pending' && (
                    <div className="action-buttons">
                      <button onClick={() => handleApprove(req.id)} className="btn-success" data-testid={`approve-request-${req.id}`}><Check size={16} /></button>
                      <button onClick={() => handleReject(req.id)} className="btn-danger" data-testid={`reject-request-${req.id}`}><X size={16} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay"><div className="modal-content">
          <div className="modal-header"><h3>New Purchase Request</h3><button onClick={() => setShowModal(false)} className="close-btn">&times;</button></div>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Item Name</label><input type="text" value={formData.item_name} onChange={(e) => setFormData({...formData, item_name: e.target.value})} required data-testid="input-item-name" /></div>
            <div className="form-group"><label>Description</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required /></div>
            <div className="form-group"><label>Quantity</label><input type="number" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})} required /></div>
            <div className="form-group"><label>Supplier</label><input type="text" value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})} required /></div>
            <div className="form-group"><label>Estimated Cost</label><input type="number" step="0.01" value={formData.estimated_cost} onChange={(e) => setFormData({...formData, estimated_cost: parseFloat(e.target.value)})} required /></div>
            <div className="form-group"><label>Requested By</label><input type="text" value={formData.requested_by} onChange={(e) => setFormData({...formData, requested_by: e.target.value})} required /></div>
            <div className="modal-actions"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary" data-testid="submit-purchase-request">Create</button></div>
          </form>
        </div></div>
      )}
    </div>
  );
}

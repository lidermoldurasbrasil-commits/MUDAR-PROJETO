import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const STATUS_OPTIONS = ['New Lead', 'In Contact', 'Proposal Sent', 'Converted', 'Lost'];
const STORES = ['Store 1', 'Store 2', 'Store 3'];

export default function CRM() {
  const [leads, setLeads] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ client_name: '', contact_info: '', interest: '', store: 'Store 1', follow_up_date: '', status: 'New Lead' });

  useEffect(() => { fetchLeads(); }, []);

  const fetchLeads = async () => {
    try {
      const res = await axios.get(`${API}/leads`);
      setLeads(res.data);
    } catch (error) {
      toast.error('Error loading leads');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/leads`, formData);
      toast.success('Lead created');
      fetchLeads();
      setShowModal(false);
      setFormData({ client_name: '', contact_info: '', interest: '', store: 'Store 1', follow_up_date: '', status: 'New Lead' });
    } catch (error) {
      toast.error('Error saving lead');
    }
  };

  return (
    <div data-testid="crm-page">
      <div className="page-header">
        <div><h2>CRM / Leads</h2></div>
        <button className="btn-primary" onClick={() => setShowModal(true)} data-testid="add-lead-btn"><Plus size={20} /><span>Add Lead</span></button>
      </div>
      <div className="card">
        <table data-testid="leads-table">
          <thead><tr><th>Client</th><th>Contact</th><th>Interest</th><th>Store</th><th>Follow-up Date</th><th>Status</th></tr></thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id}>
                <td>{lead.client_name}</td><td>{lead.contact_info}</td><td>{lead.interest}</td><td>{lead.store}</td>
                <td>{lead.follow_up_date}</td>
                <td><span className={`status-badge status-${lead.status.toLowerCase().replace(' ', '-')}`}>{lead.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay"><div className="modal-content">
          <div className="modal-header"><h3>New Lead</h3><button onClick={() => setShowModal(false)} className="close-btn">&times;</button></div>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Client Name</label><input type="text" value={formData.client_name} onChange={(e) => setFormData({...formData, client_name: e.target.value})} required data-testid="input-client-name" /></div>
            <div className="form-group"><label>Contact Info</label><input type="text" value={formData.contact_info} onChange={(e) => setFormData({...formData, contact_info: e.target.value})} required placeholder="Email or Phone" /></div>
            <div className="form-group"><label>Interest</label><input type="text" value={formData.interest} onChange={(e) => setFormData({...formData, interest: e.target.value})} required placeholder="Product/Service interest" /></div>
            <div className="form-group"><label>Store</label><select value={formData.store} onChange={(e) => setFormData({...formData, store: e.target.value})}>{STORES.map(s => <option key={s}>{s}</option>)}</select></div>
            <div className="form-group"><label>Follow-up Date</label><input type="date" value={formData.follow_up_date} onChange={(e) => setFormData({...formData, follow_up_date: e.target.value})} required /></div>
            <div className="form-group"><label>Status</label><select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>{STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}</select></div>
            <div className="modal-actions"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary" data-testid="submit-lead">Create</button></div>
          </form>
        </div></div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const ENTITIES = ['Factory', 'Store 1', 'Store 2', 'Store 3'];

export default function CostCenter() {
  const [costs, setCosts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ department: '', salaries: 0, taxes: 0, vacation: 0, thirteenth_salary: 0, depreciation: 0, equipment_costs: 0, rent: 0, accounting: 0, systems: 0, other_expenses: 0, month: '', year: new Date().getFullYear(), entity: 'Factory' });

  useEffect(() => { fetchCosts(); }, []);

  const fetchCosts = async () => {
    try {
      const res = await axios.get(`${API}/cost-center`);
      setCosts(res.data);
    } catch (error) {
      toast.error('Error loading costs');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/cost-center`, formData);
      toast.success('Cost center created');
      fetchCosts();
      setShowModal(false);
    } catch (error) {
      toast.error('Error saving cost');
    }
  };

  const calculateTotal = (cost) => {
    return cost.salaries + cost.taxes + cost.vacation + cost.thirteenth_salary + cost.depreciation + cost.equipment_costs + cost.rent + cost.accounting + cost.systems + cost.other_expenses;
  };

  return (
    <div data-testid="cost-center-page">
      <div className="page-header">
        <div><h2>Cost Center</h2></div>
        <button className="btn-primary" onClick={() => setShowModal(true)} data-testid="add-cost-center-btn"><Plus size={20} /><span>Add Cost</span></button>
      </div>
      <div className="card">
        <table data-testid="cost-center-table">
          <thead><tr><th>Department</th><th>Month/Year</th><th>Entity</th><th>Salaries</th><th>Taxes</th><th>Rent</th><th>Total</th></tr></thead>
          <tbody>
            {costs.map(cost => (
              <tr key={cost.id}>
                <td>{cost.department}</td><td>{cost.month}/{cost.year}</td><td>{cost.entity}</td>
                <td>${cost.salaries}</td><td>${cost.taxes}</td><td>${cost.rent}</td>
                <td className="font-bold">${calculateTotal(cost).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay"><div className="modal-content">
          <div className="modal-header"><h3>New Cost Center</h3><button onClick={() => setShowModal(false)} className="close-btn">&times;</button></div>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group"><label>Department</label><input type="text" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} required data-testid="input-department" /></div>
              <div className="form-group"><label>Entity</label><select value={formData.entity} onChange={(e) => setFormData({...formData, entity: e.target.value})}>{ENTITIES.map(e => <option key={e}>{e}</option>)}</select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Month</label><input type="text" value={formData.month} onChange={(e) => setFormData({...formData, month: e.target.value})} required placeholder="January" /></div>
              <div className="form-group"><label>Year</label><input type="number" value={formData.year} onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Salaries</label><input type="number" step="0.01" value={formData.salaries} onChange={(e) => setFormData({...formData, salaries: parseFloat(e.target.value)})} /></div>
              <div className="form-group"><label>Taxes</label><input type="number" step="0.01" value={formData.taxes} onChange={(e) => setFormData({...formData, taxes: parseFloat(e.target.value)})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Vacation</label><input type="number" step="0.01" value={formData.vacation} onChange={(e) => setFormData({...formData, vacation: parseFloat(e.target.value)})} /></div>
              <div className="form-group"><label>13th Salary</label><input type="number" step="0.01" value={formData.thirteenth_salary} onChange={(e) => setFormData({...formData, thirteenth_salary: parseFloat(e.target.value)})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Depreciation</label><input type="number" step="0.01" value={formData.depreciation} onChange={(e) => setFormData({...formData, depreciation: parseFloat(e.target.value)})} /></div>
              <div className="form-group"><label>Equipment</label><input type="number" step="0.01" value={formData.equipment_costs} onChange={(e) => setFormData({...formData, equipment_costs: parseFloat(e.target.value)})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Rent</label><input type="number" step="0.01" value={formData.rent} onChange={(e) => setFormData({...formData, rent: parseFloat(e.target.value)})} /></div>
              <div className="form-group"><label>Accounting</label><input type="number" step="0.01" value={formData.accounting} onChange={(e) => setFormData({...formData, accounting: parseFloat(e.target.value)})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Systems</label><input type="number" step="0.01" value={formData.systems} onChange={(e) => setFormData({...formData, systems: parseFloat(e.target.value)})} /></div>
              <div className="form-group"><label>Other</label><input type="number" step="0.01" value={formData.other_expenses} onChange={(e) => setFormData({...formData, other_expenses: parseFloat(e.target.value)})} /></div>
            </div>
            <div className="modal-actions"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary" data-testid="submit-cost-center">Create</button></div>
          </form>
        </div></div>
      )}
      <style jsx>{`.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; } .font-bold { font-weight: 700; color: #2d3748; }`}</style>
    </div>
  );
}

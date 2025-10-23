import { useState } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Breakeven() {
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [result, setResult] = useState(null);

  const handleCalculate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.get(`${API}/breakeven/calculate?month=${month}&year=${year}`);
      setResult(res.data);
      toast.success('Calculation complete');
    } catch (error) {
      toast.error('Error calculating breakeven');
    }
  };

  return (
    <div data-testid="breakeven-page">
      <div className="page-header"><h2>Break-even Analysis</h2></div>
      
      <div className="card">
        <form onSubmit={handleCalculate} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', marginBottom: '32px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Month</label>
            <input type="text" value={month} onChange={(e) => setMonth(e.target.value)} required placeholder="January" data-testid="input-month" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Year</label>
            <input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value))} required data-testid="input-year" />
          </div>
          <button type="submit" className="btn-primary" data-testid="calculate-breakeven-btn"><Search size={20} /><span>Calculate</span></button>
        </form>

        {result && (
          <div data-testid="breakeven-result">
            <div className="result-grid">
              <div className="result-card"><h4>Total Costs</h4><p className="result-value">${result.total_costs.toFixed(2)}</p></div>
              <div className="result-card"><h4>Accounts Payable</h4><p className="result-value">${result.accounts_payable.toFixed(2)}</p></div>
              <div className="result-card"><h4>Total Expenses</h4><p className="result-value">${result.total_expenses.toFixed(2)}</p></div>
              <div className="result-card"><h4>Total Revenue</h4><p className="result-value success">${result.total_revenue.toFixed(2)}</p></div>
            </div>
            <div className="result-summary">
              <h3>Profit/Loss</h3>
              <p className={`result-value ${result.profit >= 0 ? 'success' : 'danger'}`} data-testid="profit-value">${result.profit.toFixed(2)}</p>
              <p className={`status-badge ${result.breakeven_reached ? 'status-approved' : 'status-rejected'}`} data-testid="breakeven-status">
                {result.breakeven_reached ? 'Breakeven Reached ✓' : 'Below Breakeven'}
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .result-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .result-card { background: #f7fafc; border-radius: 12px; padding: 20px; }
        .result-card h4 { font-size: 14px; color: #718096; margin-bottom: 8px; }
        .result-value { font-size: 28px; font-weight: 700; color: #2d3748; }
        .result-value.success { color: #56ab2f; }
        .result-value.danger { color: #eb3349; }
        .result-summary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; padding: 32px; text-align: center; }
        .result-summary h3 { font-size: 20px; margin-bottom: 16px; }
        .result-summary .result-value { color: white; margin-bottom: 16px; }
      `}</style>
    </div>
  );
}

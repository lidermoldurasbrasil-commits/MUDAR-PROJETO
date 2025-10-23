import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('manager');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const data = isRegister ? { username, password, role } : { username, password };
      
      const response = await axios.post(`${API}${endpoint}`, data);
      onLogin(response.data.token, response.data.user);
      toast.success(isRegister ? 'Account created!' : 'Welcome back!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" data-testid="login-page">
      <div className="login-box">
        <div className="login-header">
          <h1 data-testid="login-title">Manufacturing Management</h1>
          <p>Complete business control in one place</p>
        </div>

        <form onSubmit={handleSubmit} data-testid="login-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              data-testid="username-input"
              placeholder="Enter your username"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="password-input"
              placeholder="Enter your password"
            />
          </div>

          {isRegister && (
            <div className="form-group">
              <label>Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                data-testid="role-select"
              >
                <option value="manager">Manager</option>
                <option value="director">Director</option>
                <option value="production">Production</option>
                <option value="logistics">Logistics</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
            data-testid="submit-button"
          >
            {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="login-toggle">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="toggle-link"
            data-testid="toggle-auth-mode"
          >
            {isRegister ? 'Already have an account? Sign In' : 'Need an account? Register'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .login-box {
          background: white;
          border-radius: 24px;
          padding: 48px;
          width: 100%;
          max-width: 450px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-header h1 {
          font-size: 28px;
          color: #2d3748;
          margin-bottom: 8px;
        }

        .login-header p {
          color: #718096;
          font-size: 14px;
        }

        .w-full {
          width: 100%;
          margin-top: 8px;
        }

        .login-toggle {
          text-align: center;
          margin-top: 24px;
        }

        .toggle-link {
          background: none;
          border: none;
          color: #667eea;
          font-size: 14px;
          cursor: pointer;
          text-decoration: underline;
        }

        .toggle-link:hover {
          color: #764ba2;
        }
      `}</style>
    </div>
  );
}
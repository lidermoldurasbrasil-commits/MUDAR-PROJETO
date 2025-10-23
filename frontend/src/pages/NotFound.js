import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '40px'
    }}>
      <div style={{
        fontSize: '120px',
        fontWeight: '700',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '24px'
      }}>
        404
      </div>
      
      <h2 style={{
        fontSize: '32px',
        color: '#2d3748',
        marginBottom: '16px'
      }}>
        Página Não Encontrada
      </h2>
      
      <p style={{
        fontSize: '16px',
        color: '#718096',
        marginBottom: '32px',
        maxWidth: '500px'
      }}>
        A página que você está procurando não existe ou foi movida. Por favor, verifique a URL ou navegue de volta ao dashboard.
      </p>
      
      <div style={{ display: 'flex', gap: '16px' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          data-testid="go-back-button"
        >
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </button>
        
        <button
          onClick={() => navigate('/')}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          data-testid="home-button"
        >
          <Home size={20} />
          <span>Início</span>
        </button>
      </div>
    </div>
  );
}

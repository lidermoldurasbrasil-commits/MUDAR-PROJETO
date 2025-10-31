import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Plug, RefreshCw, CheckCircle, XCircle, ExternalLink, Loader, ShoppingCart } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function IntegradorML() {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [daysBack, setDaysBack] = useState(30);

  useEffect(() => {
    checkConnectionStatus();
    
    // Verificar se voltou do OAuth
    const params = new URLSearchParams(window.location.search);
    if (params.get('ml_connected') === 'true') {
      toast.success('✅ Mercado Livre conectado com sucesso!');
      checkConnectionStatus();
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('ml_error')) {
      toast.error(`Erro ao conectar: ${params.get('ml_error')}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/integrator/mercadolivre/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConnectionStatus(response.data);
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      setConnectionStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/integrator/mercadolivre/auth-url`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.auth_url) {
        // Redirecionar para autorização
        window.location.href = response.data.auth_url;
      }
    } catch (error) {
      console.error('Erro ao gerar URL de autorização:', error);
      toast.error('Erro ao iniciar conexão com Mercado Livre');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/integrator/mercadolivre/sync`,
        { days_back: parseInt(daysBack) },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 60000 // 60 segundos
        }
      );
      
      if (response.data.success) {
        toast.success(`✅ ${response.data.orders_synced} pedidos sincronizados!`);
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast.error(error.response?.data?.detail || 'Erro ao sincronizar pedidos');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Integrador Mercado Livre</h1>
        <p className="text-gray-600">Conecte sua conta do Mercado Livre e sincronize pedidos automaticamente</p>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img 
              src="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/5.21.22/mercadolibre/logo__large_plus.png" 
              alt="Mercado Livre"
              className="h-8"
            />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Mercado Livre</h2>
              {connectionStatus?.connected && (
                <p className="text-sm text-gray-600">User ID: {connectionStatus.user_id}</p>
              )}
            </div>
          </div>
          
          {connectionStatus?.connected ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Conectado</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              <span className="font-semibold">Desconectado</span>
            </div>
          )}
        </div>

        {connectionStatus?.connected && connectionStatus?.expires_at && (
          <div className="text-sm text-gray-600 mb-4">
            Token expira em: {new Date(connectionStatus.expires_at).toLocaleString('pt-BR')}
          </div>
        )}

        {!connectionStatus?.connected ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 mb-3">
              Para conectar sua conta do Mercado Livre:
            </p>
            <ol className="text-sm text-blue-800 space-y-2 mb-4 list-decimal list-inside">
              <li>Clique no botão "Conectar Mercado Livre"</li>
              <li>Faça login na sua conta do Mercado Livre</li>
              <li>Autorize o aplicativo</li>
              <li>Você será redirecionado de volta</li>
            </ol>
            <button
              onClick={handleConnect}
              className="flex items-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg transition-colors"
            >
              <Plug className="w-5 h-5" />
              Conectar Mercado Livre
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Conta conectada com sucesso! Agora você pode sincronizar pedidos.
              </p>
            </div>

            {/* Sincronização */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Sincronizar Pedidos</h3>
              
              <div className="flex items-center gap-4 mb-4">
                <label className="text-sm text-gray-700">
                  Sincronizar últimos:
                </label>
                <select
                  value={daysBack}
                  onChange={(e) => setDaysBack(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7">7 dias</option>
                  <option value="15">15 dias</option>
                  <option value="30">30 dias</option>
                  <option value="60">60 dias</option>
                  <option value="90">90 dias</option>
                </select>
              </div>

              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
              >
                {syncing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Sincronizar Pedidos
                  </>
                )}
              </button>

              {syncing && (
                <p className="text-sm text-gray-600 mt-2">
                  ⏳ Buscando pedidos do Mercado Livre... Isso pode levar alguns minutos.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Informações adicionais */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">ℹ️ Informações</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Os pedidos sincronizados serão salvos automaticamente na collection "orders"</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>O token de acesso é renovado automaticamente quando necessário</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Você pode receber notificações em tempo real via webhooks configurados</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>A sincronização pode levar alguns minutos dependendo da quantidade de pedidos</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

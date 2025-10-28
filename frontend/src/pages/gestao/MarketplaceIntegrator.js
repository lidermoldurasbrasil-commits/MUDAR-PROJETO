import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Plug, RefreshCw, CheckCircle, XCircle, ExternalLink, Download, Calendar, Package } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL || '';

export default function MarketplaceIntegrator() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/integrator/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus(response.data);
    } catch (error) {
      console.error('Erro ao buscar status:', error);
      
      // Se não conseguir buscar, mostrar status default
      setStatus({
        mercado_livre: { authenticated: false, user_id: null, token_expires_at: null },
        shopee: { authenticated: false, shop_id: null },
        statistics: { total_orders: 0, mercado_livre_orders: 0, shopee_orders: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizeMercadoLivre = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/integrator/mercadolivre/authorize`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.authorization_url) {
        // Abrir URL de autorização em nova aba
        window.open(response.data.authorization_url, '_blank');
        toast.info('Autorize o aplicativo no Mercado Livre e volte aqui.');
      }
    } catch (error) {
      console.error('Erro ao iniciar autorização:', error);
      toast.error(error.response?.data?.detail || 'Erro ao iniciar autorização');
    }
  };

  const handleSyncMercadoLivre = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/integrator/mercadolivre/sync`,
        { days_back: 7 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(response.data.message);
      
      // Atualizar status
      await fetchStatus();
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast.error(error.response?.data?.detail || 'Erro ao sincronizar pedidos');
    } finally {
      setSyncing(false);
    }
  };

  const handleFetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/integrator/orders?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setOrders(response.data.orders || []);
      setShowOrders(true);
      toast.success(`${response.data.total} pedidos carregados`);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      toast.error('Erro ao buscar pedidos');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="animate-spin text-blue-500" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Plug size={32} className="text-blue-500" />
            <h1 className="text-3xl font-bold text-white">Integrador de Marketplaces</h1>
          </div>
          <p className="text-gray-400">
            Centralize e sincronize automaticamente todos os pedidos do Mercado Livre e Shopee
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Mercado Livre Card */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-black">ML</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Mercado Livre</h2>
                  <p className="text-sm text-gray-400">Sincronização via API</p>
                </div>
              </div>
              {status?.mercado_livre?.authenticated ? (
                <CheckCircle className="text-green-500" size={24} />
              ) : (
                <XCircle className="text-red-500" size={24} />
              )}
            </div>

            {status?.mercado_livre?.authenticated ? (
              <div className="space-y-3">
                <div className="bg-gray-700 rounded p-3">
                  <p className="text-sm text-gray-400">User ID</p>
                  <p className="text-white font-mono">{status.mercado_livre.user_id}</p>
                </div>
                <div className="bg-gray-700 rounded p-3">
                  <p className="text-sm text-gray-400">Token expira em</p>
                  <p className="text-white">
                    {status.mercado_livre.token_expires_at 
                      ? new Date(status.mercado_livre.token_expires_at).toLocaleString('pt-BR')
                      : 'N/A'}
                  </p>
                </div>
                <button
                  onClick={handleSyncMercadoLivre}
                  disabled={syncing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={syncing ? 'animate-spin' : ''} size={20} />
                  {syncing ? 'Sincronizando...' : 'Sincronizar Pedidos'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
                  <p className="text-yellow-400 text-sm">
                    ⚠️ Não autenticado. Clique em "Autorizar" para conectar sua conta.
                  </p>
                </div>
                <button
                  onClick={handleAuthorizeMercadoLivre}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <ExternalLink size={20} />
                  Autorizar Mercado Livre
                </button>
              </div>
            )}
          </div>

          {/* Shopee Card */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">SH</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Shopee</h2>
                  <p className="text-sm text-gray-400">Sincronização via API</p>
                </div>
              </div>
              {status?.shopee?.authenticated ? (
                <CheckCircle className="text-green-500" size={24} />
              ) : (
                <XCircle className="text-red-500" size={24} />
              )}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
              <p className="text-blue-400 text-sm">
                ℹ️ Integração Shopee em desenvolvimento. Em breve disponível.
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Package size={24} />
            Estatísticas de Pedidos
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Total de Pedidos</p>
              <p className="text-3xl font-bold text-white">{status?.statistics?.total_orders || 0}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Mercado Livre</p>
              <p className="text-3xl font-bold text-yellow-500">{status?.statistics?.mercado_livre_orders || 0}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Shopee</p>
              <p className="text-3xl font-bold text-orange-500">{status?.statistics?.shopee_orders || 0}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Ações</h3>
          <div className="flex gap-4">
            <button
              onClick={handleFetchOrders}
              className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded-lg font-medium flex items-center gap-2"
            >
              <Download size={20} />
              Ver Pedidos Integrados
            </button>
            <button
              onClick={fetchStatus}
              className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-6 rounded-lg font-medium flex items-center gap-2"
            >
              <RefreshCw size={20} />
              Atualizar Status
            </button>
          </div>
        </div>

        {/* Orders List */}
        {showOrders && orders.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">
              Pedidos Integrados ({orders.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Marketplace</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">ID do Pedido</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Comprador</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Valor</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.internal_order_id} className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          order.marketplace === 'MERCADO_LIVRE' 
                            ? 'bg-yellow-500/20 text-yellow-400' 
                            : 'bg-orange-500/20 text-orange-400'
                        }`}>
                          {order.marketplace === 'MERCADO_LIVRE' ? 'ML' : 'Shopee'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white font-mono text-sm">{order.marketplace_order_id}</td>
                      <td className="py-3 px-4 text-gray-300">{order.buyer_full_name || order.buyer_username}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                          {order.status_general}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-green-400 font-medium">
                        {order.currency} {order.total_amount_buyer?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {order.created_at_marketplace 
                          ? new Date(order.created_at_marketplace).toLocaleDateString('pt-BR')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

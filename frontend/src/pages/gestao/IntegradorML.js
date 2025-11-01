import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Plug, RefreshCw, CheckCircle, XCircle, ExternalLink, Loader, ShoppingCart } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function IntegradorML() {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [daysBack, setDaysBack] = useState(30);

  const checkConnectionStatus = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      if (mounted) {
        await checkConnectionStatus();
        
        // Verificar se voltou do OAuth
        const params = new URLSearchParams(window.location.search);
        if (params.get('ml_connected') === 'true') {
          toast.success('✅ Mercado Livre conectado com sucesso!');
          window.history.replaceState({}, '', window.location.pathname);
        } else if (params.get('ml_error')) {
          toast.error(`Erro ao conectar: ${params.get('ml_error')}`);
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    };
    
    init();
    
    return () => {
      mounted = false;
    };
  }, [checkConnectionStatus]);

  const handleConnect = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Chamando endpoint:', `${API}/integrator/mercadolivre/auth-url`);
      
      const response = await axios.get(`${API}/integrator/mercadolivre/auth-url`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Resposta recebida:', response.data);
      
      if (response.data.success && response.data.auth_url) {
        // Redirecionar para autorização
        console.log('🚀 Redirecionando para:', response.data.auth_url);
        window.location.href = response.data.auth_url;
      } else {
        toast.error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('❌ Erro completo:', error);
      console.error('❌ Resposta do servidor:', error.response?.data);
      const errorMsg = error.response?.data?.detail || error.message || 'Erro ao iniciar conexão com Mercado Livre';
      toast.error(errorMsg);
    }
  }, []);

  const handleSync = useCallback(async () => {
    if (syncing) return;
    
    setSyncing(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API}/integrator/mercadolivre/sync`,
        { days_back: parseInt(daysBack) },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 120000
        }
      );
      
      if (response.data.success) {
        // Aguardar setState completar
        await new Promise(resolve => setTimeout(resolve, 200));
        setSyncing(false);
        
        // Mostrar toast após estado atualizado
        await new Promise(resolve => setTimeout(resolve, 100));
        toast.success(`✅ ${response.data.orders_synced} pedidos sincronizados!`, { duration: 4000 });
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      // Aguardar setState completar
      await new Promise(resolve => setTimeout(resolve, 200));
      setSyncing(false);
      
      // Mostrar erro após estado atualizado
      await new Promise(resolve => setTimeout(resolve, 100));
      const errorMsg = error.response?.data?.detail || error.message || 'Erro ao sincronizar pedidos';
      toast.error(errorMsg);
    }
  }, [syncing, daysBack]);

  const handleImport = useCallback(async () => {
    if (importing) return;
    
    setImporting(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API}/integrator/mercadolivre/import-to-system`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 60000
        }
      );
      
      if (response.data.success) {
        // Aguardar setState completar antes de mostrar toast
        await new Promise(resolve => setTimeout(resolve, 200));
        setImporting(false);
        
        // Agora mostrar toast após estado atualizado
        await new Promise(resolve => setTimeout(resolve, 100));
        toast.success(response.data.message, { duration: 4000 });
      }
    } catch (error) {
      console.error('Erro ao importar:', error);
      // Aguardar setState completar
      await new Promise(resolve => setTimeout(resolve, 200));
      setImporting(false);
      
      // Mostrar erro após estado atualizado
      await new Promise(resolve => setTimeout(resolve, 100));
      const errorMsg = error.response?.data?.detail || error.message || 'Erro ao importar pedidos';
      toast.error(errorMsg);
    }
  }, [importing]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6" key="integrador-ml-page">
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
              <h3 className="font-semibold text-gray-900 mb-3">🔄 Sincronizar Pedidos do Mercado Livre</h3>
              <p className="text-sm text-gray-600 mb-3">Baixa os pedidos do Mercado Livre para o banco de dados intermediário.</p>
              
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

            {/* Importação */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold text-gray-900 mb-3">📦 Importar para o Sistema</h3>
              <p className="text-sm text-gray-600 mb-3">Importa os pedidos sincronizados para o sistema de gestão (formato Bling).</p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-800">
                  ℹ️ Após sincronizar, clique aqui para importar os pedidos ao sistema e visualizá-los em <strong>Marketplaces</strong>.
                </p>
              </div>

              <button
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
              >
                {importing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Importar Pedidos para o Sistema
                  </>
                )}
              </button>

              {importing && (
                <p className="text-sm text-gray-600 mt-2">
                  📦 Convertendo pedidos para formato Bling... Aguarde.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Informações adicionais */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">ℹ️ Como Funciona</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">1️⃣</span>
            <div>
              <p className="font-semibold text-gray-800">Conectar Conta</p>
              <p className="text-sm text-gray-600">Autorize o aplicativo a acessar sua conta do Mercado Livre</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">2️⃣</span>
            <div>
              <p className="font-semibold text-gray-800">Sincronizar Pedidos (API)</p>
              <p className="text-sm text-gray-600">Baixa os pedidos do ML para o banco de dados intermediário (collection "orders")</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">3️⃣</span>
            <div>
              <p className="font-semibold text-gray-800">Importar para o Sistema (API)</p>
              <p className="text-sm text-gray-600">Converte os pedidos para o formato Bling e adiciona ao sistema (collection "pedidos")</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">4️⃣</span>
            <div>
              <p className="font-semibold text-gray-800">Visualizar e Gerenciar</p>
              <p className="text-sm text-gray-600">Os pedidos aparecem em <strong>Marketplaces → Mercado Livre</strong> com todos os campos do Bling</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-300">
          <p className="text-sm text-gray-700 font-semibold mb-2">📦 Ou use Planilha Bling (Alternativa):</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
            <p className="text-sm text-blue-800 mb-2">
              Se você já tem as planilhas exportadas do <strong>Bling ERP</strong> ou <strong>Mercado Livre</strong>, pode fazer upload direto:
            </p>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Acesse <strong>Marketplaces → Mercado Livre</strong></li>
              <li>Clique no botão <strong>"Upload Planilha"</strong></li>
              <li>Selecione a planilha .xlsx ou .csv</li>
              <li>Os pedidos serão importados automaticamente</li>
            </ol>
          </div>
          <p className="text-xs text-gray-600 italic">
            💡 <strong>Dica:</strong> A planilha do Bling já vem com os campos corretos. Basta exportar e fazer upload!
          </p>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-300">
          <p className="text-sm text-gray-700 font-semibold mb-2">📋 Campos Importados (Padrão Bling):</p>
          <ul className="text-sm text-gray-600 grid grid-cols-2 gap-2">
            <li>• Número do Pedido</li>
            <li>• Cliente (Nome e Contato)</li>
            <li>• Produto e SKU</li>
            <li>• Quantidade e Valores</li>
            <li>• Endereço Completo</li>
            <li>• Cidade e Estado</li>
            <li>• Status de Produção</li>
            <li>• Status de Montagem</li>
            <li>• Taxas e Comissões</li>
            <li>• Datas (Venda, Entrega)</li>
            <li>• Opções de Envio</li>
            <li>• Observações</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

# 📍 ONDE ESTÁ O MARKETPLACE INTEGRATOR?

## ✅ Sistema Funcionando - Endpoints Respondendo!

---

## 📂 ESTRUTURA DE ARQUIVOS

```
/app/
├── backend/
│   ├── marketplace_integrator.py        ⭐ MÓDULO PRINCIPAL (26KB)
│   ├── sync_marketplaces_cron.py        🔄 CRON JOB (3.4KB)
│   └── server.py                        🔧 MODIFICADO (novos endpoints)
│
└── MARKETPLACE_INTEGRATOR_DOCS.md       📚 DOCUMENTAÇÃO (12KB)
```

---

## 🔗 ENDPOINTS DA API (Já Funcionando!)

### Base URL:
```
https://marcos-mfg.preview.emergentagent.com
```

### 1️⃣ Verificar Status das Integrações
```bash
GET /api/integrator/status
Authorization: Bearer {seu_token}
```

**Teste agora:**
```bash
curl -X GET "https://marcos-mfg.preview.emergentagent.com/api/integrator/status" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta atual:**
```json
{
  "mercado_livre": {
    "authenticated": false,
    "user_id": null,
    "token_expires_at": null
  },
  "shopee": {
    "authenticated": false,
    "shop_id": null
  },
  "statistics": {
    "total_orders": 0,
    "mercado_livre_orders": 0,
    "shopee_orders": 0
  }
}
```
➡️ **Precisa autenticar primeiro!**

---

### 2️⃣ Iniciar Autorização Mercado Livre
```bash
GET /api/integrator/mercadolivre/authorize
Authorization: Bearer {seu_token}
```

**Teste agora:**
```bash
curl -X GET "https://marcos-mfg.preview.emergentagent.com/api/integrator/mercadolivre/authorize" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:**
```json
{
  "authorization_url": "https://auth.mercadolibre.com.br/authorization?...",
  "message": "Redirecione o usuário para authorization_url para autorizar"
}
```

➡️ **Abrir `authorization_url` no navegador para autorizar**

---

### 3️⃣ Sincronizar Pedidos (Após Autorizar)
```bash
POST /api/integrator/mercadolivre/sync
Authorization: Bearer {seu_token}
Content-Type: application/json

{
  "days_back": 7
}
```

**Teste:**
```bash
curl -X POST "https://marcos-mfg.preview.emergentagent.com/api/integrator/mercadolivre/sync" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"days_back": 7}'
```

---

### 4️⃣ Listar Pedidos Integrados
```bash
GET /api/integrator/orders?marketplace=MERCADO_LIVRE&limit=50
Authorization: Bearer {seu_token}
```

**Teste:**
```bash
curl -X GET "https://marcos-mfg.preview.emergentagent.com/api/integrator/orders?limit=10" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 📄 ARQUIVOS DETALHADOS

### 1. `/app/backend/marketplace_integrator.py`

**Conteúdo:**
- `class MercadoLivreIntegrator` (600+ linhas)
  - `get_authorization_url()` - Gera URL OAuth com PKCE
  - `exchange_code_for_token()` - Troca código por token
  - `refresh_token()` - Renova token automaticamente
  - `fetch_orders_since()` - Busca pedidos desde data
  - `fetch_order_detail()` - Busca detalhes completos
  - `map_to_internal_order()` - Mapeia ML → Order
  - `map_to_internal_items()` - Mapeia ML → OrderItem

- `class ShopeeIntegrator` (estrutura básica)
  - `generate_signature()` - HMAC SHA256
  - `authorize()` - Inicia autorização

- Funções de persistência:
  - `save_or_update_order()`
  - `save_or_update_order_items()`
  - `save_or_update_payments()`
  - `save_or_update_shipments()`

**Ver arquivo:**
```bash
cat /app/backend/marketplace_integrator.py
```

---

### 2. `/app/backend/sync_marketplaces_cron.py`

**Conteúdo:**
- Script para executar sincronização automática
- Roda a cada 30 minutos (quando configurado)
- Logs detalhados de cada sincronização

**Executar manualmente:**
```bash
cd /app/backend
python3 sync_marketplaces_cron.py
```

**Ver arquivo:**
```bash
cat /app/backend/sync_marketplaces_cron.py
```

---

### 3. `/app/backend/server.py` (Modificações)

**Novos modelos Pydantic (linhas ~1880-2180):**
```python
class MarketplaceCredentials(BaseModel)
class Order(BaseModel)           # 40+ campos
class OrderItem(BaseModel)
class Payment(BaseModel)
class Shipment(BaseModel)
```

**Novos endpoints (linhas ~5349+):**
```python
@api_router.get("/integrator/mercadolivre/authorize")
@api_router.get("/integrator/mercadolivre/callback")
@api_router.post("/integrator/mercadolivre/sync")
@api_router.get("/integrator/orders")
@api_router.get("/integrator/status")
```

**Ver modelos:**
```bash
grep -A 50 "class Order(BaseModel)" /app/backend/server.py | head -70
```

**Ver endpoints:**
```bash
grep -A 20 "integrator/mercadolivre/authorize" /app/backend/server.py
```

---

### 4. `/app/MARKETPLACE_INTEGRATOR_DOCS.md`

**Documentação completa com:**
- Arquitetura do sistema
- Guia de configuração
- Exemplos de uso
- Mapeamento de campos ML → Interno
- Troubleshooting
- Checklist de implementação

**Ler documentação:**
```bash
cat /app/MARKETPLACE_INTEGRATOR_DOCS.md
```

**Ou navegar:**
```bash
nano /app/MARKETPLACE_INTEGRATOR_DOCS.md
```

---

## 🗄️ COLLECTIONS MONGODB

O integrador usa estas collections (criadas automaticamente ao usar):

```javascript
// Conectar no MongoDB
mongo

use gestao_manufatura

// Verificar collections
show collections

// Procurar por:
orders                    // Pedidos padronizados
order_items              // Itens dos pedidos
payments                 // Pagamentos
shipments                // Envios/rastreio
marketplace_credentials  // Tokens de autenticação
ml_pkce_sessions        // Sessões temporárias OAuth
```

**Verificar dados:**
```javascript
// Ver credenciais salvas
db.marketplace_credentials.find().pretty()

// Ver pedidos integrados
db.orders.find().limit(5).pretty()

// Ver itens
db.order_items.find().limit(5).pretty()
```

---

## 🔧 COMO USAR (Passo a Passo)

### Passo 1: Obter Credenciais Mercado Livre

1. Acesse: https://developers.mercadolibre.com.br/
2. Crie uma conta de desenvolvedor
3. Crie um aplicativo
4. Copie:
   - **App ID** (Client ID)
   - **Secret Key** (Client Secret)
5. Configure **Redirect URI**: 
   ```
   https://marcos-mfg.preview.emergentagent.com/api/integrator/mercadolivre/callback
   ```

### Passo 2: Adicionar no .env

```bash
# Editar .env
nano /app/backend/.env

# Adicionar:
ML_CLIENT_ID=seu_app_id_aqui
ML_CLIENT_SECRET=seu_client_secret_aqui
ML_REDIRECT_URI=https://marcos-mfg.preview.emergentagent.com/api/integrator/mercadolivre/callback

# Salvar (Ctrl+O, Enter, Ctrl+X)

# Reiniciar backend
sudo supervisorctl restart backend
```

### Passo 3: Fazer Login e Obter Token

```bash
# Login como diretor
curl -X POST "https://marcos-mfg.preview.emergentagent.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"diretor","password":"123"}'

# Copiar o access_token da resposta
```

### Passo 4: Autorizar Mercado Livre

```bash
# Substituir SEU_TOKEN pelo token copiado
curl -X GET "https://marcos-mfg.preview.emergentagent.com/api/integrator/mercadolivre/authorize" \
  -H "Authorization: Bearer SEU_TOKEN"

# Copiar a URL retornada
# Abrir no navegador
# Fazer login no Mercado Livre
# Autorizar o aplicativo
```

### Passo 5: Sincronizar Pedidos

```bash
# Após autorizar
curl -X POST "https://marcos-mfg.preview.emergentagent.com/api/integrator/mercadolivre/sync" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"days_back": 30}'
```

### Passo 6: Ver Pedidos Importados

```bash
curl -X GET "https://marcos-mfg.preview.emergentagent.com/api/integrator/orders?limit=10" \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## 🎯 TESTANDO AGORA (Sem Credenciais)

Você pode testar os endpoints mesmo sem credenciais:

```bash
# 1. Login
TOKEN=$(curl -s -X POST "https://marcos-mfg.preview.emergentagent.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"diretor","password":"123"}' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

echo "Token: $TOKEN"

# 2. Verificar status
curl -X GET "https://marcos-mfg.preview.emergentagent.com/api/integrator/status" \
  -H "Authorization: Bearer $TOKEN"

# 3. Tentar autorizar (vai pedir credenciais no .env)
curl -X GET "https://marcos-mfg.preview.emergentagent.com/api/integrator/mercadolivre/authorize" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 RESUMO VISUAL

```
┌─────────────────────────────────────────────────────────────┐
│                  MARKETPLACE INTEGRATOR                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📁 BACKEND                                                  │
│  ├── marketplace_integrator.py  (Módulo principal)          │
│  ├── sync_marketplaces_cron.py  (Sincronização automática)  │
│  └── server.py                   (5 novos endpoints)         │
│                                                              │
│  📊 MONGODB                                                  │
│  ├── orders                      (Pedidos)                   │
│  ├── order_items                 (Itens)                     │
│  ├── payments                    (Pagamentos)                │
│  ├── shipments                   (Envios)                    │
│  └── marketplace_credentials     (Tokens)                    │
│                                                              │
│  🔗 ENDPOINTS                                                │
│  ├── GET  /api/integrator/status                            │
│  ├── GET  /api/integrator/mercadolivre/authorize           │
│  ├── GET  /api/integrator/mercadolivre/callback            │
│  ├── POST /api/integrator/mercadolivre/sync                │
│  └── GET  /api/integrator/orders                            │
│                                                              │
│  📚 DOCS                                                     │
│  └── /app/MARKETPLACE_INTEGRATOR_DOCS.md                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ STATUS ATUAL

- ✅ **Backend:** Rodando e respondendo
- ✅ **Endpoints:** Funcionando
- ✅ **Modelos:** Criados
- ✅ **OAuth2:** Implementado
- ⏳ **Credenciais:** Aguardando configuração
- ⏳ **Primeira autorização:** Pendente

---

**Próximo passo:** Configurar credenciais no `.env` e testar primeira autorização!

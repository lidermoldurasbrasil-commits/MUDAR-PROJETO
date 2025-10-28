# 📦 Marketplace Integrator - Documentação Completa

## ✅ Status: ESTRUTURA IMPLEMENTADA

Sistema completo de integração com **Mercado Livre** e **Shopee** para centralizar todos os dados de pedidos.

---

## 🏗️ Arquitetura

### 📁 Arquivos Criados:

1. **`/app/backend/marketplace_integrator.py`**
   - Módulo principal com classes `MercadoLivreIntegrator` e `ShopeeIntegrator`
   - Funções de mapeamento e persistência
   - OAuth2 + PKCE (Mercado Livre)
   - HMAC SHA256 (Shopee)

2. **`/app/backend/sync_marketplaces_cron.py`**
   - Script para sincronização automática
   - Executar a cada 30 minutos via cron/supervisor

3. **`/app/backend/server.py`** (modificado)
   - Novos modelos Pydantic: `Order`, `OrderItem`, `Payment`, `Shipment`, `MarketplaceCredentials`
   - 5 novos endpoints REST da API

### 📊 Collections MongoDB:

- `orders` - Pedidos padronizados
- `order_items` - Itens dos pedidos
- `payments` - Pagamentos
- `shipments` - Envios/rastreio
- `marketplace_credentials` - Credenciais (tokens)
- `ml_pkce_sessions` - Sessões temporárias PKCE

---

## 🔐 Autenticação

### Mercado Livre (OAuth2 + PKCE)

#### Variáveis de Ambiente (.env):
```bash
ML_CLIENT_ID=seu_app_id_aqui
ML_CLIENT_SECRET=seu_client_secret_aqui
ML_REDIRECT_URI=https://seu-dominio.com/api/integrator/mercadolivre/callback
```

#### Fluxo de Autorização:

**1. Iniciar Autorização:**
```bash
GET /api/integrator/mercadolivre/authorize
Authorization: Bearer {seu_token_jwt}
```

**Resposta:**
```json
{
  "authorization_url": "https://auth.mercadolibre.com.br/authorization?...",
  "message": "Redirecione o usuário para authorization_url"
}
```

**2. Usuário Autoriza:**
- Abrir `authorization_url` no navegador
- Usuário faz login no Mercado Livre e autoriza
- ML redireciona para `ML_REDIRECT_URI?code=...&state=...`

**3. Callback Automático:**
```bash
GET /api/integrator/mercadolivre/callback?code=ML-123456&state=abc
```

**Resposta:**
```json
{
  "success": true,
  "message": "✅ Autorização concluída com sucesso!",
  "user_id": "123456789",
  "expires_in": 21600
}
```

**4. Token Armazenado:**
- `access_token` e `refresh_token` salvos em `marketplace_credentials`
- Sistema renova automaticamente quando expira

---

### Shopee (HMAC SHA256)

#### Variáveis de Ambiente (.env):
```bash
SHOPEE_PARTNER_ID=seu_partner_id
SHOPEE_PARTNER_KEY=sua_partner_key
SHOPEE_SHOP_ID=seu_shop_id
SHOPEE_REDIRECT_URI=https://seu-dominio.com/api/integrator/shopee/callback
```

#### Fluxo (TODO - estrutura pronta):
```bash
GET /api/integrator/shopee/authorize
```

---

## 📡 Endpoints da API

### 1. Status das Integrações

```bash
GET /api/integrator/status
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "mercado_livre": {
    "authenticated": true,
    "user_id": "123456789",
    "token_expires_at": "2025-01-28T15:30:00Z"
  },
  "shopee": {
    "authenticated": false,
    "shop_id": null
  },
  "statistics": {
    "total_orders": 1250,
    "mercado_livre_orders": 890,
    "shopee_orders": 360
  }
}
```

---

### 2. Sincronizar Mercado Livre (Manual)

```bash
POST /api/integrator/mercadolivre/sync
Authorization: Bearer {token}
Content-Type: application/json

{
  "days_back": 7
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "✅ Sincronização concluída",
  "total_orders": 45,
  "orders_processed": 45,
  "orders_created": 12,
  "orders_updated": 33
}
```

---

### 3. Listar Pedidos Integrados

```bash
GET /api/integrator/orders?marketplace=MERCADO_LIVRE&limit=50
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "success": true,
  "total": 45,
  "orders": [
    {
      "internal_order_id": "abc123",
      "marketplace": "MERCADO_LIVRE",
      "marketplace_order_id": "2000123456789",
      "status_general": "paid",
      "buyer_full_name": "João Silva",
      "total_amount_buyer": 150.00,
      "created_at_marketplace": "2025-01-28T10:00:00Z",
      "items": [
        {
          "product_title": "Moldura Preta 30x40",
          "quantity": 2,
          "unit_price": 75.00
        }
      ]
    }
  ]
}
```

---

## 🔄 Sincronização Automática

### Configurar Cron Job:

#### Opção 1: Crontab (Linux)
```bash
# Editar crontab
crontab -e

# Adicionar linha (executar a cada 30 minutos)
*/30 * * * * cd /app/backend && /usr/bin/python3 sync_marketplaces_cron.py >> /var/log/marketplace_sync.log 2>&1
```

#### Opção 2: Supervisor (Recomendado)
```ini
[program:marketplace_sync]
command=python3 /app/backend/sync_marketplaces_cron.py
directory=/app/backend
autostart=true
autorestart=true
startretries=3
stderr_logfile=/var/log/supervisor/marketplace_sync.err.log
stdout_logfile=/var/log/supervisor/marketplace_sync.out.log
```

#### Executar Manualmente (Teste):
```bash
cd /app/backend
python3 sync_marketplaces_cron.py
```

---

## 📋 Entidades Internas

### Order (Pedido)

Campos principais:
- **Identificação**: `internal_order_id`, `marketplace`, `marketplace_order_id`
- **Status**: `status_general`, `status_payment`, `status_fulfillment`
- **Comprador**: `buyer_*` (id, username, nome, telefone, email)
- **Endereço**: `ship_to_*` (nome, telefone, rua, número, cidade, estado, CEP)
- **Financeiro**: `subtotal_items`, `discount_*`, `shipping_cost_*`, `total_amount_buyer`, `total_payout_seller`
- **Logística**: `tracking_number`, `tracking_carrier`, `shipping_status`
- **Datas**: `created_at_marketplace`, `paid_at`, `shipped_at`, `delivered_at`

### OrderItem (Item do Pedido)

- `seller_sku` - SKU interno
- `product_title` - Nome do produto
- `variation_name` - Ex: "Cor: Preto / Tamanho: 50x70"
- `quantity`, `unit_price`, `total_price_item`

### Payment (Pagamento)

- `method` - pix, cartão, boleto
- `status` - approved, pending, refunded
- `installment_qty`, `installment_value`
- `fee_platform`, `fee_payment_gateway`

### Shipment (Envio)

- `tracking_number`, `carrier_name`
- `status` - ready_to_ship, shipped, delivered
- `ship_by_deadline`, `shipped_at`, `delivered_at`
- Endereço completo de destino

---

## 🗺️ Mapeamento Mercado Livre

### Campos ML → Interno:

```python
# Pedido
ML order.id → internal_order_id
ML order.status → status_general
ML payments[].status → status_payment
ML shipping.status → status_fulfillment

# Comprador
ML buyer.id → buyer_id_marketplace
ML buyer.nickname → buyer_username
ML buyer.first_name + last_name → buyer_full_name

# Endereço
ML shipment.receiver_address.* → ship_to_*

# Financeiro
ML order.total_amount → total_amount_buyer
ML payments[].transaction_amount → transaction_amount
ML payments[].installments → installments_qty

# Logística
ML shipping.id → shipment_id_marketplace
ML shipping.tracking_number → tracking_number
ML shipping.logistic_type → tracking_carrier

# Itens
ML order_items[].item.id → marketplace_item_id
ML order_items[].item.seller_custom_field → seller_sku
ML order_items[].item.title → product_title
ML order_items[].quantity → quantity
ML order_items[].unit_price → unit_price
```

---

## 🎯 Próximos Passos

### 1. Obter Credenciais

**Mercado Livre:**
1. Acesse: https://developers.mercadolibre.com.br/
2. Crie um aplicativo
3. Copie `App ID` e `Secret Key`
4. Configure `Redirect URI`
5. Adicione no `.env`:
   ```bash
   ML_CLIENT_ID=seu_app_id
   ML_CLIENT_SECRET=seu_secret
   ML_REDIRECT_URI=sua_url_callback
   ```

**Shopee:**
1. Acesse Shopee Open Platform
2. Registre como Partner
3. Obtenha `Partner ID` e `Partner Key`
4. Adicione no `.env`

### 2. Autorizar Primeira Vez

```bash
# 1. Chamar endpoint de autorização
curl -X GET "http://localhost:8001/api/integrator/mercadolivre/authorize" \
  -H "Authorization: Bearer {seu_token}"

# 2. Abrir URL retornada no navegador
# 3. Autorizar no Mercado Livre
# 4. Será redirecionado para callback (automático)
```

### 3. Testar Sincronização

```bash
# Sincronização manual
curl -X POST "http://localhost:8001/api/integrator/mercadolivre/sync" \
  -H "Authorization: Bearer {seu_token}" \
  -H "Content-Type: application/json" \
  -d '{"days_back": 7}'

# Verificar pedidos
curl -X GET "http://localhost:8001/api/integrator/orders?limit=10" \
  -H "Authorization: Bearer {seu_token}"
```

### 4. Ativar Sincronização Automática

```bash
# Adicionar ao supervisor
sudo nano /etc/supervisor/conf.d/marketplace_sync.conf
# Adicionar configuração acima
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start marketplace_sync
```

---

## 🔧 Completar Implementação

### Implementações Pendentes:

#### 1. Mercado Livre - Dados Financeiros Completos
- [ ] Buscar dados de billing/settlement
- [ ] Calcular `tax_platform_fee` exato
- [ ] Calcular `tax_payment_fee`
- [ ] Calcular `total_payout_seller`

#### 2. Mercado Livre - Payment & Shipment Entities
- [ ] Mapear `payments` para entidade `Payment`
- [ ] Mapear `shipping` para entidade `Shipment`
- [ ] Salvar no banco

#### 3. Shopee - Implementação Completa
- [ ] `fetch_orders_since()`
- [ ] Mapeamento Shopee → entidades internas
- [ ] Salvar dados

#### 4. Frontend (Opcional)
- [ ] Página de configuração de integrações
- [ ] Botões de autorização
- [ ] Dashboard de pedidos integrados
- [ ] Sincronização manual via UI

---

## 📊 Exemplo de Uso Completo

### Cenário: Sincronizar e Listar Pedidos

```python
# 1. Importar módulo
from marketplace_integrator import MercadoLivreIntegrator
from datetime import datetime, timedelta

# 2. Instanciar
ml = MercadoLivreIntegrator()

# 3. Buscar pedidos dos últimos 7 dias
date_from = datetime.now() - timedelta(days=7)
orders = await ml.fetch_orders_since(date_from)

# 4. Processar cada pedido
for ml_order in orders:
    # Mapear para formato interno
    internal_order = ml.map_to_internal_order(ml_order)
    
    # Salvar
    order_id = await save_or_update_order(internal_order)
    
    # Salvar itens
    items = ml.map_to_internal_items(ml_order, order_id)
    await save_or_update_order_items(items)

# 5. Consultar pedidos salvos
saved_orders = await db.orders.find({
    'marketplace': 'MERCADO_LIVRE'
}).to_list(None)

print(f"Total: {len(saved_orders)} pedidos")
```

---

## 🐛 Troubleshooting

### Erro: "Credenciais não encontradas"
```bash
# Verificar se está autenticado
curl http://localhost:8001/api/integrator/status \
  -H "Authorization: Bearer {token}"

# Se não autenticado, executar autorização
```

### Erro: "Token expirado"
```bash
# Sistema renova automaticamente, mas pode forçar:
# 1. Deletar credenciais antigas
db.marketplace_credentials.deleteOne({marketplace: 'MERCADO_LIVRE'})

# 2. Autorizar novamente
```

### Sincronização não está rodando
```bash
# Verificar logs
tail -f /var/log/marketplace_sync.log

# Testar manualmente
python3 /app/backend/sync_marketplaces_cron.py
```

---

## ✅ Checklist de Implementação

### Estrutura Base:
- [x] Modelos Pydantic (Order, OrderItem, Payment, Shipment)
- [x] Collections MongoDB
- [x] Módulo `marketplace_integrator.py`
- [x] OAuth2 + PKCE (Mercado Livre)
- [x] HMAC SHA256 (Shopee estrutura)
- [x] Endpoints API REST
- [x] Script de cron job

### Mercado Livre:
- [x] Autorização OAuth2 + PKCE
- [x] Refresh token automático
- [x] Fetch orders desde data
- [x] Fetch order detail + shipment
- [x] Mapeamento ML → Order
- [x] Mapeamento ML → OrderItem
- [ ] Mapeamento ML → Payment (completo)
- [ ] Mapeamento ML → Shipment (completo)
- [ ] Dados financeiros detalhados

### Shopee:
- [x] Estrutura de autenticação HMAC
- [ ] Implementar fetch orders
- [ ] Mapeamento completo
- [ ] Testes

### Produção:
- [ ] Adicionar credenciais reais no .env
- [ ] Executar primeira autorização
- [ ] Testar sincronização manual
- [ ] Ativar cron job automático
- [ ] Monitorar logs

---

**Status Final**: ✅ ESTRUTURA COMPLETA IMPLEMENTADA - Pronto para adicionar credenciais e testar!

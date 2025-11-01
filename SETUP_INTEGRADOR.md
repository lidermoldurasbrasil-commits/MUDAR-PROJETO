# 🚀 Setup Rápido - Integrador Mercado Livre

## ⚠️ Erro: "Credenciais não configuradas"

Se você vê esse erro ao clicar em "Autorizar Mercado Livre", significa que as variáveis de ambiente não foram configuradas.

---

## 📋 Passo a Passo de Configuração

### 1️⃣ Obter Credenciais do Mercado Livre

**a) Acesse o Portal de Desenvolvedores:**
- URL: https://developers.mercadolibre.com.br/
- Faça login com sua conta do Mercado Livre

**b) Crie um Aplicativo:**
1. Clique em "Meus aplicativos" → "Criar aplicativo"
2. Preencha:
   - **Nome**: Marcos MFG Integrador (ou qualquer nome)
   - **Descrição curta**: Sistema de integração de pedidos
   - **Categoria**: Gerenciamento de vendas
   - **Redirect URI**: `https://marcos-marketplace.preview.emergentagent.com/api/integrator/mercadolivre/callback`

**c) Copie as Credenciais:**
Após criar, você verá:
- **App ID** (Client ID)
- **Secret Key** (Client Secret)

📝 Copie esses valores!

---

### 2️⃣ Adicionar no Backend (.env)

**a) Editar arquivo .env:**
```bash
nano /app/backend/.env
```

**b) Adicionar no final do arquivo:**
```bash
# Mercado Livre Integration
ML_CLIENT_ID=seu_app_id_aqui_copiar_do_portal
ML_CLIENT_SECRET=seu_client_secret_aqui_copiar_do_portal
ML_REDIRECT_URI=https://marcos-marketplace.preview.emergentagent.com/api/integrator/mercadolivre/callback
```

**c) Salvar e sair:**
- Pressione `Ctrl + O` (salvar)
- Pressione `Enter` (confirmar)
- Pressione `Ctrl + X` (sair)

---

### 3️⃣ Reiniciar Backend

```bash
sudo supervisorctl restart backend
```

Aguarde 5 segundos e verifique:
```bash
sudo supervisorctl status backend
```

Deve mostrar: `RUNNING`

---

### 4️⃣ Testar Autorização

**a) Volte para a interface web:**
- Login como diretor
- Vá em: **Marketplace → Integrador** 🔌

**b) Clique em "Autorizar Mercado Livre":**
- Se configurado corretamente, abrirá página do Mercado Livre
- Faça login e autorize o aplicativo
- Será redirecionado de volta (callback)

**c) Após autorização:**
- Status mudará para: ✅ **Autenticado**
- Verá seu User ID
- Botão "Sincronizar Pedidos" ficará disponível

---

### 5️⃣ Sincronizar Pedidos

Após autenticar:
1. Clique em **"Sincronizar Pedidos"**
2. Sistema buscará pedidos dos últimos 7 dias
3. Verá mensagem: "X pedidos importados"
4. Clique em **"Ver Pedidos Integrados"** para visualizar

---

## 🔍 Verificar se Funcionou

### Teste 1: Verificar .env
```bash
grep "ML_CLIENT_ID" /app/backend/.env
```
✅ Deve mostrar: `ML_CLIENT_ID=seu_app_id`

### Teste 2: Testar Endpoint
```bash
# Fazer login
TOKEN=$(curl -s -X POST "https://marcos-marketplace.preview.emergentagent.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"diretor","password":"123"}' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# Testar autorização
curl -X GET "https://marcos-marketplace.preview.emergentagent.com/api/integrator/mercadolivre/authorize" \
  -H "Authorization: Bearer $TOKEN"
```

✅ **Resposta correta** (client_id preenchido):
```json
{
  "authorization_url": "https://auth.mercadolibre.com.br/authorization?...&client_id=SEU_APP_ID&...",
  "message": "Redirecione o usuário para authorization_url"
}
```

❌ **Resposta errada** (client_id vazio):
```json
{
  "authorization_url": "https://auth.mercadolibre.com.br/authorization?...&client_id=&...",
  ...
}
```
Se client_id estiver vazio, revise o passo 2.

---

## ❓ Problemas Comuns

### Erro: "client_id vazio"
**Causa:** Credenciais não adicionadas no .env
**Solução:** Revisar passo 2 - adicionar ML_CLIENT_ID e ML_CLIENT_SECRET

### Erro: "Backend não reiniciou"
**Causa:** Syntax error no .env
**Solução:** 
```bash
# Ver logs de erro
tail -n 50 /var/log/supervisor/backend.err.log

# Verificar se .env está correto
cat /app/backend/.env
```

### Erro: "Redirect URI não corresponde"
**Causa:** URL no portal ML diferente do configurado
**Solução:** No portal ML, edite o aplicativo e configure exatamente:
```
https://marcos-marketplace.preview.emergentagent.com/api/integrator/mercadolivre/callback
```

### Erro: "Token expirou"
**Causa:** Token JWT do login expirou
**Solução:** Fazer logout e login novamente

---

## 📊 Exemplo .env Completo

```bash
# MongoDB
MONGO_URL=mongodb://localhost:27017
DB_NAME=gestao_manufatura

# JWT
JWT_SECRET=seu_secret_key_aqui

# Mercado Livre Integration
ML_CLIENT_ID=1234567890123456
ML_CLIENT_SECRET=abcdefghijklmnopqrstuvwxyz123456
ML_REDIRECT_URI=https://marcos-marketplace.preview.emergentagent.com/api/integrator/mercadolivre/callback

# Shopee Integration (futuro)
# SHOPEE_PARTNER_ID=
# SHOPEE_PARTNER_KEY=
# SHOPEE_SHOP_ID=
```

---

## ✅ Checklist de Configuração

- [ ] Criar conta de desenvolvedor no Mercado Livre
- [ ] Criar aplicativo no portal ML
- [ ] Copiar App ID e Secret Key
- [ ] Configurar Redirect URI no portal ML
- [ ] Adicionar ML_CLIENT_ID no .env
- [ ] Adicionar ML_CLIENT_SECRET no .env
- [ ] Adicionar ML_REDIRECT_URI no .env
- [ ] Reiniciar backend
- [ ] Testar autorização na interface
- [ ] Autorizar no Mercado Livre
- [ ] Sincronizar primeiros pedidos
- [ ] Verificar pedidos integrados

---

## 🎯 Após Configurar

Quando tudo estiver configurado:
1. ✅ Card do Mercado Livre mostrará status **Autenticado**
2. ✅ Mostrará seu **User ID**
3. ✅ Botão **"Sincronizar Pedidos"** ficará ativo
4. ✅ Poderá ver pedidos na tabela
5. 🔄 Sincronização automática funcionará (cron job)

---

**Documentação completa:** `/app/MARKETPLACE_INTEGRATOR_DOCS.md`
**Onde está o integrador:** `/app/ONDE_ESTA_O_INTEGRADOR.md`

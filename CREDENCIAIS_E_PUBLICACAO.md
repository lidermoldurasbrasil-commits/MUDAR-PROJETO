# 🏭 Sistema de Gestão de Manufatura - Marcos
## Credenciais de Acesso e Preparação para Produção

---

## 📋 Credenciais dos Usuários

### 👔 Acesso Diretor (Acesso Completo)
- **Username:** `diretor`
- **Senha:** `123`
- **Permissões:** 
  - ✅ Visualizar e editar Produção
  - ✅ Visualizar informações Financeiras
  - ✅ Acesso completo ao sistema

---

### 🔧 Acessos dos Setores de Produção

#### 1. Setor Espelho
- **Username:** `espelho`
- **Senha:** `123`
- **Permissões:** Produção apenas (sem Financeiro)

#### 2. Setor Molduras com Vidro
- **Username:** `molduras-vidro`
- **Senha:** `123`
- **Permissões:** Produção apenas (sem Financeiro)

#### 3. Setor Molduras
- **Username:** `molduras`
- **Senha:** `123`
- **Permissões:** Produção apenas (sem Financeiro)

#### 4. Setor Impressão
- **Username:** `impressao`
- **Senha:** `123`
- **Permissões:** Produção apenas (sem Financeiro)

#### 5. Setor Expedição
- **Username:** `expedicao`
- **Senha:** `123`
- **Permissões:** Produção apenas (sem Financeiro)

#### 6. Setor Embalagem
- **Username:** `embalagem`
- **Senha:** `123`
- **Permissões:** Produção apenas (sem Financeiro)

---

## ✅ Funcionalidades Implementadas

### 🔐 Controle de Acesso
- ✅ Usuários dos setores criados com role "production"
- ✅ Usuário diretor criado com role "director"
- ✅ Aba "Financeiro" oculta para usuários de produção
- ✅ Aba "Financeiro" visível apenas para director e manager

### ⚡ Atualização em Tempo Real
- ✅ Polling automático a cada 5 segundos
- ✅ Atualização silenciosa (sem spinner de loading)
- ✅ Quando um setor atualiza status, todos veem a mudança automaticamente

### 📊 Funcionalidades de Produção
- ✅ Visualização de pedidos (Produção, Monday, Kanban)
- ✅ Filtros por Setor e Status Produção
- ✅ Edição de status dos pedidos
- ✅ Importação de planilhas Shopee e Mercado Livre
- ✅ Detecção automática de setor baseado em SKU

---

## 🧪 Checklist de Testes Necessários

### 1. Teste de Autenticação
- [ ] Login com usuário diretor
- [ ] Login com cada setor (espelho, molduras-vidro, molduras, impressao, expedicao, embalagem)
- [ ] Verificar redirecionamento correto após login

### 2. Teste de Permissões
- [ ] Diretor vê aba "Financeiro"
- [ ] Setores NÃO veem aba "Financeiro"
- [ ] Diretor pode editar todos os campos
- [ ] Setores podem editar campos de produção

### 3. Teste de Importação
- [ ] Importar planilha Shopee com usuário diretor
- [ ] Importar planilha Mercado Livre com usuário diretor
- [ ] Verificar detecção automática de setor por SKU
- [ ] Confirmar que todos os campos são importados corretamente

### 4. Teste de Atualização em Tempo Real
- [ ] Abrir sistema em 2 navegadores (ex: Chrome e Firefox)
- [ ] Fazer login com usuários diferentes
- [ ] Atualizar status em um navegador
- [ ] Verificar se atualização aparece no outro em até 5 segundos

### 5. Teste de Regras de Negócio
- [ ] Shopee: Verificar detecção de tipo de envio (Flex, Coleta)
- [ ] Mercado Livre: Verificar campos específicos (Receita, Tarifas)
- [ ] Verificar cálculo de valor líquido
- [ ] Verificar classificação automática de setores

### 6. Teste de Filtros
- [ ] Filtro por Setor (Espelho, Molduras, etc.)
- [ ] Filtro por Status Produção (Aguardando, Em montagem, etc.)
- [ ] Filtro por SKU
- [ ] Filtro por Status geral
- [ ] Botão "Limpar Filtros"

---

## 🚀 Checklist para Publicação

### Pré-Produção
- [ ] Todos os testes acima concluídos
- [ ] Credenciais documentadas
- [ ] Backup do banco de dados criado
- [ ] Variáveis de ambiente configuradas corretamente

### Segurança
- [ ] **IMPORTANTE:** Alterar senhas padrão "123" para senhas seguras
- [ ] Configurar HTTPS/SSL
- [ ] Revisar permissões de banco de dados
- [ ] Configurar firewall

### Performance
- [ ] Otimizar queries do banco de dados
- [ ] Configurar cache se necessário
- [ ] Testar carga com múltiplos usuários simultâneos

### Monitoramento
- [ ] Configurar logs de erro
- [ ] Configurar alertas de sistema
- [ ] Documentar procedimentos de backup

---

## ⚠️ Avisos Importantes

### Senhas Padrão
⚠️ **ATENÇÃO:** Todas as senhas estão configuradas como "123" para facilitar o setup inicial.

**VOCÊ DEVE ALTERAR ESSAS SENHAS ANTES DE COLOCAR EM PRODUÇÃO!**

Para alterar senhas, execute no MongoDB:
```javascript
// Conectar ao banco
use gestao_manufatura

// Atualizar senha de um usuário (exemplo)
db.users.updateOne(
  { username: "diretor" },
  { $set: { password: "<hash_bcrypt_da_nova_senha>" } }
)
```

### Backup
Sempre faça backup do banco de dados antes de qualquer atualização em produção:
```bash
mongodump --uri="mongodb://localhost:27017/gestao_manufatura" --out=/backup/$(date +%Y%m%d)
```

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs do sistema
2. Revisar esta documentação
3. Contatar equipe de desenvolvimento

---

**Última atualização:** 28/10/2025
**Versão:** 1.0 - Produção Ready

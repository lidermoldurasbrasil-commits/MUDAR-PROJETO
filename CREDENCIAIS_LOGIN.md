# 🔐 CREDENCIAIS DE ACESSO - SISTEMA MARCOS MFG

## ✅ TODOS OS USUÁRIOS ESTÃO FUNCIONANDO

### 📊 LISTA DE CREDENCIAIS

| Username | Senha | Nome | Setor | Role |
|----------|-------|------|-------|------|
| `diretor` | `123` | Diretor | - | director |
| `espelho` | `123` | Alex | Espelho | production |
| `molduras-vidro` | `123` | Ronaldo | Molduras com Vidro | production |
| `molduras` | `123` | Luiz | Molduras | production |
| `impressao` | `123` | Camila | Impressão | production |
| `expedicao` | `123` | Thalita | Expedição | production |
| `embalagem` | `123` | Ludmila | Embalagem | production |

---

## 🔍 COMO FAZER LOGIN

### Passo a Passo:

1. **Acesse a página de login**
   - URL: http://localhost:3000/login

2. **Digite o username** (ATENÇÃO aos traços!)
   - ✅ CORRETO: `molduras` (sem traço)
   - ✅ CORRETO: `molduras-vidro` (COM traço)
   - ✅ CORRETO: `expedicao` (sem "ç", com "c")
   - ❌ ERRADO: `moldura` (singular)
   - ❌ ERRADO: `expedição` (com "ç")

3. **Digite a senha**
   - Para todos: `123`

4. **Clique em "Entrar"**

---

## ⚠️ ATENÇÃO AOS DETALHES

### Usernames EXATOS (copie e cole):

```
diretor
espelho
molduras-vidro
molduras
impressao
expedicao
embalagem
```

### Erros Comuns:

| ❌ ERRADO | ✅ CORRETO |
|-----------|------------|
| `moldura` | `molduras` |
| `molduras vidro` | `molduras-vidro` |
| `molduras_vidro` | `molduras-vidro` |
| `expedição` | `expedicao` |
| `impressão` | `impressao` |

---

## 🧪 TESTES REALIZADOS

**Status do Backend:** ✅ FUNCIONANDO 100%

Todos os 7 usuários foram testados via API:
- ✅ espelho/123 - Login OK
- ✅ molduras-vidro/123 - Login OK
- ✅ molduras/123 - Login OK
- ✅ impressao/123 - Login OK
- ✅ expedicao/123 - Login OK
- ✅ embalagem/123 - Login OK
- ✅ diretor/123 - Login OK

**Token JWT:** Gerado corretamente para todos
**Roles:** Corretos (production/director)

---

## 🎯 O QUE CADA USUÁRIO VÊ

### Usuários Production (setores):
- ✅ Dashboard de Projetos
- ✅ Banner de boas-vindas personalizado
- ✅ Apenas menu "Produção"
- ✅ Abas: Produção e Pedidos Antigos
- ❌ NÃO veem: Financeiro, Monday, Kanban, Lista
- ❌ NÃO veem: Valor Produzido Hoje

### Usuário Diretor:
- ✅ TUDO (acesso completo)
- ✅ Todas as abas e menus
- ✅ Informações financeiras

---

## 📞 SUPORTE

Se ainda assim não conseguir fazer login:

1. **Verifique:**
   - Username está EXATAMENTE como na tabela acima
   - Senha é `123` (sem espaços)
   - Está usando a página de login correta

2. **Limpe o cache:**
   - Ctrl + Shift + R (Windows/Linux)
   - Cmd + Shift + R (Mac)

3. **Tente em modo anônimo/privado**
   - Pode haver cache de sessão antiga

---

**Última atualização:** 28/10/2025
**Versão do Sistema:** 1.0

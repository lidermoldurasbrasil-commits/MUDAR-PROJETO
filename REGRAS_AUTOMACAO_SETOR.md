# 🤖 Regras de Automação de Setor por SKU

## 📋 Documentação das Regras de Detecção Automática

Este documento contém as regras de automação para definir automaticamente o setor de um pedido baseado no SKU durante a importação de planilhas.

---

## 🎯 Implementação Atual

**Status:** ✅ Implementado no Mercado Livre  
**Localização:** `/app/backend/server.py` - Função `detectar_setor_por_sku()`  
**Linha:** ~4452

---

## 📖 Regras de Detecção

### 1️⃣ IMPRESSÃO (Prioridade Alta)
**Setor:** `Impressão`  
**Ícone:** 🖨️  
**Cor:** Laranja (`#F59E0B`)

**Padrões SKU:**
- Contém: `PD`

**Exemplos:**
- `PD-A4-001` → Impressão
- `POSTER-PD-123` → Impressão
- `KIT-PD-CUSTOM` → Impressão

---

### 2️⃣ ESPELHO
**Setor:** `Espelho`  
**Ícone:** 🪞  
**Cor:** Azul (`#3B82F6`)

**Padrões SKU:**
- Contém: `ESPELHO`, `LED`, `ESP`

**Exemplos:**
- `ESPELHO-50X70` → Espelho
- `LED-MIRROR-001` → Espelho
- `ESP-DECORATIVO` → Espelho

---

### 3️⃣ MOLDURAS (Sem Vidro)
**Setor:** `Molduras`  
**Ícone:** 🖼️  
**Cor:** Rosa (`#EC4899`)

**Padrões SKU:**
- Contém: `MM`, `MB`, `MP`, `SV`
- **CONDIÇÃO ESPECIAL:** Não deve conter `CV` (exceto para A4-CV)
- Contém: `A4-CV` (caso específico que vai para Molduras)

**Exemplos:**
- `MM-123` → Molduras
- `MB-GOLD` → Molduras
- `MP-SILVER` → Molduras
- `SV-CLASSIC` → Molduras
- `A4-CV` → Molduras ✨
- `KIT-10-A4-CV` → Molduras ✨
- `KIT-5-A4-CV` → Molduras ✨

**Exceções:**
- `MM-CV-123` → Vai para "Molduras com Vidro" (tem CV)

---

### 4️⃣ MOLDURAS COM VIDRO
**Setor:** `Molduras com Vidro`  
**Ícone:** 🖼️  
**Cor:** Roxo (`#8B5CF6`)

**Padrões SKU:**

**A) Códigos Alfanuméricos:**
- Contém: `MF`, `MB`, `MP`, `MM`, `MD`, `CX`, `CV`
- **EXCEÇÃO:** NÃO incluir se contém `A4-CV`, `KIT-10-A4-CV`, `KIT-5-A4-CV`

**B) Padrões de Dimensões:**
- Contém: `50X50`, `30X30`, `60X90`, `80X120`
- **Nota:** Case insensitive (aceita `50x50` ou `50X50`)

**Exemplos:**
- `MF-001` → Molduras com Vidro
- `CV-PREMIUM` → Molduras com Vidro
- `QUADRO-50X50` → Molduras com Vidro
- `FRAME-30x30` → Molduras com Vidro
- `MM-CV-123` → Molduras com Vidro (tem CV)
- `CX-ESPECIAL` → Molduras com Vidro

**Exceções (vão para Molduras):**
- `A4-CV` → Molduras (regra especial)
- `KIT-10-A4-CV` → Molduras (regra especial)
- `KIT-5-A4-CV` → Molduras (regra especial)

---

### 5️⃣ PADRÃO (Fallback)
**Setor:** `Espelho`  
**Cor:** Azul

Se o SKU não corresponder a nenhuma regra acima, o sistema atribui automaticamente ao setor "Espelho" como padrão.

---

## 🔄 Ordem de Prioridade

A detecção segue esta ordem de verificação:

```
1. PD → IMPRESSÃO (maior prioridade)
2. ESPELHO/LED/ESP → ESPELHO
3. A4-CV (específico) → MOLDURAS
4. MM/MB/MP/SV (sem CV) → MOLDURAS
5. MF/MB/MP/MM/MD/CX/CV (exceto A4-CV) → MOLDURAS COM VIDRO
6. Dimensões (50X50, etc) → MOLDURAS COM VIDRO
7. Default → ESPELHO
```

---

## 🔧 Implementação Técnica

### Função Principal
```python
def detectar_setor_por_sku(sku_texto):
    """
    Detecta automaticamente o setor baseado no SKU
    Retorna: string com nome do setor
    """
    # Implementação...
```

### Localização no Código
- **Arquivo:** `/app/backend/server.py`
- **Função:** `processar_linha_mercadolivre()`
- **Uso:** `'status_producao': detectar_setor_por_sku(sku)`

---

## 📊 Exemplos de Casos Especiais

### Caso 1: SKU com Múltiplos Padrões
```
SKU: "MM-CV-50X50"
Análise: Contém MM (Molduras) + CV (Vidro) + Dimensão
Resultado: Molduras com Vidro (CV tem precedência)
```

### Caso 2: Exceção A4-CV
```
SKU: "KIT-10-A4-CV"
Análise: Contém CV, mas está na lista de exceções
Resultado: Molduras (regra especial)
```

### Caso 3: Prioridade de Impressão
```
SKU: "MM-PD-001"
Análise: Contém MM (Molduras) + PD (Impressão)
Resultado: Impressão (PD tem prioridade máxima)
```

---

## 🚀 Próximos Passos (TO-DO)

### ⏳ Implementação Shopee
- [ ] Adaptar função `detectar_setor_por_sku()` para Shopee
- [ ] Adicionar na função `processar_linha_shopee()`
- [ ] Testar com planilhas Shopee reais
- [ ] Validar regras funcionam para padrões SKU da Shopee

### Código para Shopee:
```python
# Em processar_linha_shopee(), adicionar:
'status_producao': detectar_setor_por_sku(sku),  # Setor detectado automaticamente
```

---

## 📝 Logs e Debugging

O sistema gera logs detalhados durante a detecção:

```
🖨️ SKU 'PD-A4-001' → IMPRESSÃO (contém PD)
🪞 SKU 'ESPELHO-LED' → ESPELHO (contém LED)
🖼️ SKU 'MM-GOLD' → MOLDURA (contém MM)
🖼️ SKU 'CV-50X50' → MOLDURAS COM VIDRO (contém CV)
⭐ SKU 'CUSTOM-001' → ESPELHO (padrão)
```

---

## ✅ Status de Implementação

| Plataforma | Status | Data |
|------------|--------|------|
| Mercado Livre | ✅ Implementado | 2025-01-27 |
| Shopee | ⏳ Pendente | - |

---

## 📌 Notas Importantes

1. **Case Insensitive:** Todas as comparações são feitas em uppercase
2. **Normalização:** Dimensões são normalizadas (x → X)
3. **Logs Detalhados:** Cada detecção gera log com emoji e motivo
4. **Fallback Seguro:** Sempre retorna "Espelho" se nenhuma regra aplicar
5. **Prioridade Clara:** Regras são aplicadas em ordem específica

---

## 🔒 Regras de Negócio Validadas

- ✅ A4-CV sempre vai para Molduras (não para Molduras com Vidro)
- ✅ PD tem prioridade sobre outras regras
- ✅ CV sem A4-CV vai para Molduras com Vidro
- ✅ Dimensões (50X50, etc) sempre vão para Molduras com Vidro
- ✅ SKUs sem correspondência vão para Espelho (seguro)

---

**Última Atualização:** 2025-01-27  
**Versão:** 1.0  
**Autor:** Sistema de Gestão Marcos

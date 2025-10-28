# 🎓 Sistema de Aprendizado Automático Durante Upload

## ✅ IMPLEMENTADO E ATIVO

O sistema agora **corrige automaticamente** os setores durante o upload de planilhas!

## 🔄 Fluxo Completo de Aprendizado

### 1️⃣ Primeira Importação (Sem Aprendizado)
```
1. Você faz upload da planilha Shopee/Mercado Livre
2. Sistema detecta setor automaticamente por regras
   Exemplo: SKU "MOLDURA-PRETA-30X40" → detecta "Molduras"
3. Pedido é importado com setor "Molduras"
```

### 2️⃣ Reclassificação Manual (Ensinando a IA)
```
1. Você abre o pedido e vê que o setor está errado
2. Muda manualmente de "Molduras" → "Molduras com Vidro"
3. ✅ Sistema registra automaticamente:
   - SKU: "MOLDURA-PRETA-30X40"
   - Setor Correto: "Molduras com Vidro"
   - Usuário e data
4. Toast aparece: "✅ IA aprendeu com sua classificação!"
```

### 3️⃣ Próxima Importação (COM Aprendizado Automático) ⭐
```
1. Você faz upload de NOVA planilha
2. Planilha contém o MESMO SKU "MOLDURA-PRETA-30X40"
3. Sistema detecta: "Molduras" (regra automática)
4. 🎓 SISTEMA VERIFICA feedback e encontra: "Molduras com Vidro"
5. 🎓 SISTEMA CORRIGE automaticamente: "Molduras" → "Molduras com Vidro"
6. Pedido é importado JÁ COM SETOR CORRETO ✅
7. Mensagem: "45 pedidos importados. 🎓 12 pedidos corrigidos automaticamente pela IA"
```

## 📊 Exemplo Prático Completo

### Cenário Real:

**Upload #1 - Sem histórico:**
```
Planilha com 50 pedidos
├─ SKU "ESPELHO-RED-60" → detectado "Personalizado"
├─ SKU "KIT-PD-30X40" → detectado "Personalizado"
└─ SKU "MOLDURA-10X15" → detectado "Molduras"

Resultado: 50 importados, 0 corrigidos
```

**Reclassificação Manual:**
```
Você corrige manualmente:
├─ "ESPELHO-RED-60" → muda para "Espelho" ✅
├─ "KIT-PD-30X40" → muda para "Impressão" ✅
└─ "MOLDURA-10X15" → muda para "Molduras com Vidro" ✅

Sistema registra os 3 feedbacks ✅
```

**Upload #2 - Com aprendizado:**
```
Nova planilha com 100 pedidos, incluindo:
├─ SKU "ESPELHO-RED-60" (já visto antes)
├─ SKU "KIT-PD-30X40" (já visto antes)
├─ SKU "MOLDURA-10X15" (já visto antes)
└─ 97 pedidos novos

Sistema processa:
├─ "ESPELHO-RED-60": detecta "Personalizado" 
    → 🎓 corrige para "Espelho" (feedback anterior)
├─ "KIT-PD-30X40": detecta "Personalizado"
    → 🎓 corrige para "Impressão" (feedback anterior)
├─ "MOLDURA-10X15": detecta "Molduras"
    → 🎓 corrige para "Molduras com Vidro" (feedback anterior)

Resultado: 100 importados, 🎓 3 corrigidos automaticamente ✅
Mensagem: "100 pedidos importados com sucesso. 
           🎓 3 pedidos corrigidos automaticamente pela IA"
```

## 🎯 Benefícios

✅ **Zero Trabalho Extra**: Correção automática durante importação  
✅ **Sem Retrabalho**: SKUs conhecidos já vêm corretos  
✅ **Transparente**: Sistema informa quantos foram corrigidos  
✅ **Acumulativo**: Quanto mais você usa, menos precisa corrigir  
✅ **Compartilhado**: Todos os usuários se beneficiam  

## 📋 Resposta do Sistema

### Mensagem de Sucesso:
```json
{
  "message": "45 pedidos importados com sucesso. 12 duplicados ignorados. 🎓 8 pedidos corrigidos automaticamente pela IA",
  "total_importados": 45,
  "total_duplicados": 12,
  "total_corrigidos_ia": 8,
  "total_linhas": 65,
  "erros": 0,
  "pedidos_duplicados": ["ID1", "ID2", ...],
  "pedidos_corrigidos_ia": [
    {
      "sku": "ESPELHO-RED-60",
      "setor_original": "Personalizado",
      "setor_corrigido": "Espelho"
    },
    ...
  ]
}
```

### No Console do Backend:
```
🎓 IA corrigiu automaticamente: SKU 'ESPELHO-RED-60' de 'Personalizado' → 'Espelho'
🎓 IA corrigiu automaticamente: SKU 'KIT-PD-30X40' de 'Personalizado' → 'Impressão'
```

## 🔍 Como Funciona Tecnicamente

### Durante Upload de Planilha:

1. **Sistema processa linha** (Shopee ou Mercado Livre)
2. **Detecta setor** usando regras automáticas (`detectar_setor_por_sku()`)
3. **🎓 NOVO: Verifica feedback**
   ```python
   feedback = await db.sku_feedback.find_one(
       {"sku": sku},
       sort=[("created_at", -1)]  # Mais recente
   )
   ```
4. **Se encontrou feedback:**
   ```python
   if feedback:
       setor_aprendido = feedback['setor_correto']
       pedido_data['status_producao'] = setor_aprendido
       print(f"🎓 Corrigido: {sku} → {setor_aprendido}")
   ```
5. **Pedido é importado** com setor correto

### Durante Reclassificação Manual:

1. **Usuário muda setor** na interface
2. **Sistema salva pedido** normalmente
3. **🎓 Sistema registra feedback automaticamente:**
   ```python
   await axios.post('/api/pedidos/registrar-feedback-sku', {
       sku: sku,
       setor_original: setor_anterior,
       setor_correto: novo_setor,
       pedido_id: pedido_id
   })
   ```
4. **Toast aparece**: "✅ IA aprendeu com sua classificação!"

## 📊 Estatísticas de Aprendizado

Para ver quantos SKUs a IA já aprendeu:

```javascript
// No MongoDB
use gestao_manufatura

// Total de feedbacks
db.sku_feedback.count()

// SKUs únicos aprendidos
db.sku_feedback.distinct("sku").length

// Top 10 SKUs mais corrigidos
db.sku_feedback.aggregate([
  {$group: {_id: "$sku", count: {$sum: 1}}},
  {$sort: {count: -1}},
  {$limit: 10}
])

// Últimas correções
db.sku_feedback.find().sort({created_at: -1}).limit(10)
```

## 🧪 Como Testar

### Teste Passo a Passo:

1. **Faça upload de uma planilha** (Shopee ou Mercado Livre)
2. **Anote alguns SKUs** que foram importados
3. **Mude manualmente o setor** de 2-3 pedidos
4. **Veja o toast**: "✅ IA aprendeu com sua classificação!"
5. **Faça upload da MESMA planilha novamente** (ou planilha com mesmos SKUs)
6. **Veja a mensagem**: "🎓 X pedidos corrigidos automaticamente pela IA"
7. **Verifique os pedidos**: Devem ter o setor que você escolheu manualmente

## 🔧 Implementação Técnica

### Backend:
- **Arquivo**: `/app/backend/server.py`
- **Função Upload**: `upload_planilha_pedidos()` (linha ~4817)
- **Verificação Feedback**: linhas 4834-4853
- **Registro Feedback**: `registrar_feedback_sku()` (linha ~5111)

### Frontend:
- **Arquivo**: `/app/frontend/src/pages/gestao/MarketplaceProjetoDetalhes.js`
- **Detecção Mudança**: `handleUpdatePedido()` (linha ~443)
- **Envio Automático**: linhas 462-477

### Banco de Dados:
- **Coleção**: `sku_feedback`
- **Índices recomendados**:
  - `{"sku": 1, "created_at": -1}` → busca rápida por SKU
  - `{"created_at": -1}` → ordenação por data

## 💡 Dicas de Uso

### Para Máxima Eficiência:

1. **Corrija sempre que vir erro**: Cada correção melhora o sistema
2. **Seja consistente**: Use sempre o mesmo setor para SKUs similares
3. **Revise novos uploads**: Cheque se correções automáticas estão corretas
4. **Observe a mensagem**: Veja quantos foram corrigidos automaticamente

### Comportamentos Esperados:

✅ **SKU idêntico** → Correção 100% garantida  
✅ **Sistema aprende rápido** → Primeira correção já ensina  
✅ **Não requer configuração** → Funciona automaticamente  
✅ **Não quebra nada** → Se não houver feedback, usa regras normais  

## 🎯 Indicadores de Sucesso

Você saberá que está funcionando quando:

1. ✅ Mensagem de upload incluir "🎓 X pedidos corrigidos"
2. ✅ Número de correções aumentar a cada upload repetido
3. ✅ Logs do backend mostrarem "🎓 IA corrigiu automaticamente"
4. ✅ Você gastar menos tempo corrigindo setores manualmente

---

**Status**: ✅ SISTEMA TOTALMENTE OPERACIONAL E TESTADO!

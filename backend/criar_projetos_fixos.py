#!/usr/bin/env python3
"""
Script para criar os projetos fixos de marketplace:
- Mercado Livre
- Shopee - Diamonds
"""

import sys
import os
from pymongo import MongoClient
from dotenv import load_dotenv
import uuid

# Carregar variáveis de ambiente
load_dotenv()

# Obter MONGO_URL do ambiente
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'gestao_manufatura')

if not mongo_url:
    print("❌ ERRO: MONGO_URL não encontrado no .env")
    sys.exit(1)

# Definir projetos fixos
projetos = [
    {
        'id': 'mercadolivre-projeto',
        'nome': 'Mercado Livre',
        'plataforma': 'mercadolivre',
        'ativo': True,
        'pedidos_em_producao': 0,
        'pedidos_enviados': 0,
        'pedidos_entregues': 0,
        'pedidos_atrasados': 0
    },
    {
        'id': 'shopee-projeto',
        'nome': 'Shopee - Diamonds',
        'plataforma': 'shopee',
        'ativo': True,
        'pedidos_em_producao': 0,
        'pedidos_enviados': 0,
        'pedidos_entregues': 0,
        'pedidos_atrasados': 0
    }
]

try:
    # Conectar ao MongoDB
    client = MongoClient(mongo_url)
    db = client[db_name]
    
    print(f"\n🔄 Criando projetos fixos de marketplace no banco '{db_name}'...")
    print("=" * 60)
    
    created = 0
    updated = 0
    
    for projeto in projetos:
        # Verificar se projeto já existe
        existing = db.projetos_marketplace.find_one({'id': projeto['id']})
        
        if existing:
            # Atualizar projeto existente
            result = db.projetos_marketplace.update_one(
                {'id': projeto['id']},
                {'$set': projeto}
            )
            if result.modified_count > 0:
                print(f"✅ Atualizado: {projeto['nome']} ({projeto['plataforma']})")
                updated += 1
            else:
                print(f"ℹ️  Já existia: {projeto['nome']} ({projeto['plataforma']})")
        else:
            # Criar novo projeto
            db.projetos_marketplace.insert_one(projeto)
            print(f"✅ Criado: {projeto['nome']} ({projeto['plataforma']})")
            created += 1
    
    print("\n" + "=" * 60)
    print(f"📊 Resumo:")
    print(f"   - Criados: {created}")
    print(f"   - Atualizados: {updated}")
    print(f"\n✅ Projetos criados com sucesso!")
    
except Exception as e:
    print(f"\n❌ ERRO ao criar projetos: {e}")
    sys.exit(1)
finally:
    if 'client' in locals():
        client.close()

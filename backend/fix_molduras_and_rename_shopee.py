#!/usr/bin/env python3
"""
Script para:
1. Corrigir acesso do usuário 'molduras' (adicionar ativo=True)
2. Renomear projeto 'Shopee Brasil' para 'Shopee - Diamonds'
"""

import sys
import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Obter MONGO_URL do ambiente
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'gestao_manufatura')

if not mongo_url:
    print("❌ ERRO: MONGO_URL não encontrado no .env")
    sys.exit(1)

try:
    # Conectar ao MongoDB
    client = MongoClient(mongo_url)
    db = client[db_name]
    
    print(f"\n🔧 Executando correções no banco '{db_name}'...")
    print("=" * 60)
    
    # 1. Corrigir usuário molduras
    print("\n1️⃣ Corrigindo acesso do usuário 'molduras'...")
    result_user = db.users.update_one(
        {'username': 'molduras'},
        {'$set': {'ativo': True}}
    )
    
    if result_user.modified_count > 0:
        print("✅ Usuário 'molduras' atualizado com ativo=True")
    elif result_user.matched_count > 0:
        print("ℹ️  Usuário 'molduras' já estava com ativo=True")
    else:
        print("⚠️  Usuário 'molduras' não encontrado")
    
    # 2. Renomear projeto Shopee
    print("\n2️⃣ Renomeando projeto 'Shopee Brasil' para 'Shopee - Diamonds'...")
    result_project = db.projetos_marketplace.update_one(
        {'nome': 'Shopee Brasil'},
        {'$set': {'nome': 'Shopee - Diamonds'}}
    )
    
    if result_project.modified_count > 0:
        print("✅ Projeto renomeado: 'Shopee Brasil' → 'Shopee - Diamonds'")
    elif result_project.matched_count > 0:
        print("ℹ️  Projeto já estava com nome 'Shopee - Diamonds'")
    else:
        print("⚠️  Projeto 'Shopee Brasil' não encontrado")
    
    print("\n" + "=" * 60)
    print("✅ Correções concluídas!")
    
except Exception as e:
    print(f"\n❌ ERRO ao executar correções: {e}")
    sys.exit(1)
finally:
    if 'client' in locals():
        client.close()

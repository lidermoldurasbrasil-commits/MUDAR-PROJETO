#!/usr/bin/env python3
"""
Script para atualizar os nomes dos usuários dos setores de produção.
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
    
    # Mapeamento de usernames para nomes
    nomes_setores = {
        'espelho': 'Mateus',
        'molduras-vidro': 'Ronaldo',
        'molduras': 'Luiz',
        'impressao': 'Camila',
        'expedicao': 'Thalita',
        'embalagem': 'Ludmila'
    }
    
    print(f"\n🔄 Atualizando nomes dos usuários de produção no banco '{db_name}'...")
    print("=" * 60)
    
    for username, nome in nomes_setores.items():
        result = db.users.update_one(
            {'username': username},
            {'$set': {'nome': nome}}
        )
        
        if result.modified_count > 0:
            print(f"✅ Atualizado: {username} → {nome}")
        elif result.matched_count > 0:
            print(f"ℹ️  Já estava correto: {username} → {nome}")
        else:
            print(f"⚠️  Usuário não encontrado: {username}")
    
    print("\n✅ Atualização concluída!")
    
except Exception as e:
    print(f"\n❌ ERRO ao atualizar nomes: {e}")
    sys.exit(1)
finally:
    if 'client' in locals():
        client.close()

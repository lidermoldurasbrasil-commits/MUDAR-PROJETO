#!/usr/bin/env python3
"""
Script para criar usuários dos setores de produção no banco de dados.
Executar apenas uma vez para configuração inicial.
"""

import sys
import os
import bcrypt
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

# Definir usuários dos setores
users_production = [
    {'username': 'espelho', 'nome': 'Alex', 'password': '123', 'role': 'production', 'ativo': True},
    {'username': 'molduras-vidro', 'nome': 'Ronaldo', 'password': '123', 'role': 'production', 'ativo': True},
    {'username': 'molduras', 'nome': 'Luiz', 'password': '123', 'role': 'production', 'ativo': True},
    {'username': 'impressao', 'nome': 'Camila', 'password': '123', 'role': 'production', 'ativo': True},
    {'username': 'expedicao', 'nome': 'Thalita', 'password': '123', 'role': 'production', 'ativo': True},
    {'username': 'embalagem', 'nome': 'Ludmila', 'password': '123', 'role': 'production', 'ativo': True}
]

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

try:
    # Conectar ao MongoDB
    client = MongoClient(mongo_url)
    db = client[db_name]
    
    print(f"\n🔄 Criando usuários de produção no banco '{db_name}'...")
    print("=" * 60)
    
    created = 0
    updated = 0
    errors = 0
    
    for user_data in users_production:
        username = user_data['username']
        
        # Verificar se usuário já existe
        existing = db.users.find_one({'username': username})
        
        # Preparar dados do usuário
        user_doc = {
            'id': str(uuid.uuid4()),
            'username': username,
            'nome': user_data['nome'],
            'password_hash': hash_password(user_data['password']),
            'role': user_data['role'],
            'ativo': user_data['ativo']
        }
        
        if existing:
            # Atualizar usuário existente
            result = db.users.update_one(
                {'username': username},
                {'$set': user_doc}
            )
            if result.modified_count > 0:
                print(f"✅ Atualizado: {username} ({user_data['nome']})")
                updated += 1
            else:
                print(f"ℹ️  Já existia: {username} ({user_data['nome']})")
        else:
            # Criar novo usuário
            try:
                db.users.insert_one(user_doc)
                print(f"✅ Criado: {username} ({user_data['nome']})")
                created += 1
            except Exception as e:
                print(f"❌ Erro ao criar {username}: {e}")
                errors += 1
    
    print("\n" + "=" * 60)
    print(f"📊 Resumo:")
    print(f"   - Criados: {created}")
    print(f"   - Atualizados: {updated}")
    print(f"   - Erros: {errors}")
    print(f"\n✅ Processo concluído!")
    
except Exception as e:
    print(f"\n❌ ERRO ao criar usuários: {e}")
    sys.exit(1)
finally:
    if 'client' in locals():
        client.close()

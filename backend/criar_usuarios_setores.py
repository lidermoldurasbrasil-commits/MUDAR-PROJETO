#!/usr/bin/env python3
"""
Script para criar usuários dos setores de produção e diretor
"""
import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import uuid
import os

# Configuração
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Usuários a serem criados
USUARIOS = [
    {
        "username": "espelho",
        "nome": "Setor Espelho",
        "role": "production",
        "senha": "123"
    },
    {
        "username": "molduras-vidro",
        "nome": "Setor Molduras com Vidro",
        "role": "production",
        "senha": "123"
    },
    {
        "username": "molduras",
        "nome": "Setor Molduras",
        "role": "production",
        "senha": "123"
    },
    {
        "username": "impressao",
        "nome": "Setor Impressão",
        "role": "production",
        "senha": "123"
    },
    {
        "username": "expedicao",
        "nome": "Setor Expedição",
        "role": "production",
        "senha": "123"
    },
    {
        "username": "embalagem",
        "nome": "Setor Embalagem",
        "role": "production",
        "senha": "123"
    },
    {
        "username": "diretor",
        "nome": "Diretor",
        "role": "director",
        "senha": "123"
    }
]

async def criar_usuarios():
    """Cria os usuários dos setores no banco de dados"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['gestao_manufatura']
    users_collection = db['users']
    
    print("🔧 Conectado ao MongoDB")
    print(f"📍 Database: {db.name}")
    print(f"📊 Collection: users")
    print("-" * 60)
    
    criados = 0
    ja_existentes = 0
    
    for usuario in USUARIOS:
        # Verificar se usuário já existe
        existing = await users_collection.find_one({"username": usuario["username"]})
        
        if existing:
            print(f"⚠️  Usuário '{usuario['username']}' já existe - pulando")
            ja_existentes += 1
            continue
        
        # Criar novo usuário
        user_data = {
            "id": str(uuid.uuid4()),
            "username": usuario["username"],
            "nome": usuario["nome"],
            "password": pwd_context.hash(usuario["senha"]),
            "role": usuario["role"],
            "ativo": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "loja_padrao": "fabrica"
        }
        
        await users_collection.insert_one(user_data)
        
        role_emoji = "👔" if usuario["role"] == "director" else "🔧"
        print(f"{role_emoji} ✅ Criado: {usuario['nome']} (username: {usuario['username']}, role: {usuario['role']})")
        criados += 1
    
    print("-" * 60)
    print(f"✨ Resumo:")
    print(f"   - Criados: {criados}")
    print(f"   - Já existentes: {ja_existentes}")
    print(f"   - Total: {len(USUARIOS)}")
    print()
    print("🔐 Credenciais de acesso:")
    print("-" * 60)
    for usuario in USUARIOS:
        role_label = "Diretor" if usuario["role"] == "director" else "Setor"
        print(f"   {role_label}: {usuario['username']} / senha: {usuario['senha']}")
    
    client.close()

if __name__ == "__main__":
    print("=" * 60)
    print("🏭 CRIAÇÃO DE USUÁRIOS DOS SETORES DE PRODUÇÃO")
    print("=" * 60)
    print()
    
    asyncio.run(criar_usuarios())
    
    print()
    print("=" * 60)
    print("✅ Script concluído!")
    print("=" * 60)

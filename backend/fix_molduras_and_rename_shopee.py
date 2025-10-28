#!/usr/bin/env python3
"""
Script para:
1. Verificar e corrigir usuário 'molduras'
2. Renomear projeto Shopee para 'Shopee - Diamonds'
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

async def fix_issues():
    """Corrige problemas identificados"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['gestao_manufatura']
    users_collection = db['users']
    projetos_collection = db['projetos_marketplace']
    
    print("🔧 Conectado ao MongoDB")
    print(f"📍 Database: {db.name}")
    print("-" * 60)
    
    # 1. VERIFICAR E CORRIGIR USUÁRIO MOLDURAS
    print("\n1️⃣ VERIFICANDO USUÁRIO 'molduras'...")
    molduras_user = await users_collection.find_one({"username": "molduras"})
    
    if not molduras_user:
        print("⚠️  Usuário 'molduras' não encontrado - CRIANDO...")
        user_data = {
            "id": str(uuid.uuid4()),
            "username": "molduras",
            "nome": "Luiz",
            "password_hash": pwd_context.hash("123"),
            "role": "production",
            "ativo": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "loja_padrao": "fabrica"
        }
        await users_collection.insert_one(user_data)
        print("✅ Usuário 'molduras' criado com sucesso!")
        print(f"   - Nome: Luiz")
        print(f"   - Username: molduras")
        print(f"   - Senha: 123")
        print(f"   - Role: production")
    else:
        print("✅ Usuário 'molduras' encontrado!")
        print(f"   - ID: {molduras_user.get('id', 'N/A')}")
        print(f"   - Nome: {molduras_user.get('nome', 'N/A')}")
        print(f"   - Role: {molduras_user.get('role', 'N/A')}")
        print(f"   - Ativo: {molduras_user.get('ativo', 'N/A')}")
        
        # Verificar se tem password_hash (campo correto)
        has_password_hash = 'password_hash' in molduras_user
        has_password = 'password' in molduras_user
        
        print(f"   - Campo 'password_hash': {'✅ SIM' if has_password_hash else '❌ NÃO'}")
        print(f"   - Campo 'password' (antigo): {'✅ SIM' if has_password else '❌ NÃO'}")
        
        # Se só tem 'password', migrar para 'password_hash'
        if has_password and not has_password_hash:
            print("🔄 Migrando campo 'password' para 'password_hash'...")
            await users_collection.update_one(
                {"username": "molduras"},
                {
                    "$set": {"password_hash": molduras_user['password']},
                    "$unset": {"password": ""}
                }
            )
            print("✅ Campo migrado com sucesso!")
        
        # Se não tem nenhum, criar password_hash
        if not has_password_hash and not has_password:
            print("🔄 Criando password_hash para usuário...")
            await users_collection.update_one(
                {"username": "molduras"},
                {"$set": {"password_hash": pwd_context.hash("123")}}
            )
            print("✅ Password criado com sucesso!")
    
    # 2. RENOMEAR PROJETO SHOPEE
    print("\n2️⃣ RENOMEANDO PROJETO SHOPEE...")
    shopee_project = await projetos_collection.find_one({"plataforma": "shopee"})
    
    if shopee_project:
        old_name = shopee_project.get('nome', 'N/A')
        print(f"📦 Projeto encontrado: {old_name}")
        
        if old_name != "Shopee - Diamonds":
            print(f"🔄 Renomeando para 'Shopee - Diamonds'...")
            await projetos_collection.update_one(
                {"plataforma": "shopee"},
                {
                    "$set": {
                        "nome": "Shopee - Diamonds",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            print("✅ Projeto renomeado com sucesso!")
        else:
            print("✅ Projeto já tem o nome correto!")
    else:
        print("⚠️  Projeto Shopee não encontrado no banco de dados")
        print("   (Será criado automaticamente quando o endpoint de projetos for chamado)")
    
    print("\n" + "=" * 60)
    print("✅ TODAS AS CORREÇÕES CONCLUÍDAS!")
    print("=" * 60)
    print("\n📋 CREDENCIAIS DE TESTE:")
    print("   Username: molduras")
    print("   Senha: 123")
    print("   Role: production")
    
    client.close()

if __name__ == "__main__":
    print("=" * 60)
    print("🔧 CORREÇÕES DO SISTEMA MARCOS")
    print("=" * 60)
    print()
    
    asyncio.run(fix_issues())

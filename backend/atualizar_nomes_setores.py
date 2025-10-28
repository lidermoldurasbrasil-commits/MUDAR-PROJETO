#!/usr/bin/env python3
"""
Script para atualizar nomes dos operadores dos setores
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')

# Mapeamento de username para nome real
NOMES_OPERADORES = {
    "expedicao": "Thalita",
    "embalagem": "Ludmila",
    "molduras": "Luiz",
    "molduras-vidro": "Ronaldo",
    "espelho": "Alex",
    "impressao": "Camila"
}

async def atualizar_nomes():
    """Atualiza os nomes dos operadores"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['gestao_manufatura']
    users_collection = db['users']
    
    print("🔧 Atualizando nomes dos operadores...")
    print("-" * 60)
    
    for username, nome in NOMES_OPERADORES.items():
        result = await users_collection.update_one(
            {"username": username},
            {"$set": {"nome": nome}}
        )
        
        if result.modified_count > 0:
            print(f"✅ {username} → {nome}")
        else:
            print(f"⚠️  {username} não encontrado ou já atualizado")
    
    print("-" * 60)
    print("✨ Nomes atualizados com sucesso!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(atualizar_nomes())

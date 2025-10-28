#!/usr/bin/env python3
"""
Script para criar os dois projetos fixos: Shopee e Mercado Livre
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')

PROJETOS_FIXOS = [
    {
        "id": "shopee-projeto",
        "nome": "Shopee",
        "descricao": "Marketplace Shopee - Gestão de Pedidos",
        "plataforma": "shopee",
        "icone": "🛍️",
        "cor": "#EE4D2D",
        "ativo": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "mercadolivre-projeto",
        "nome": "Mercado Livre",
        "descricao": "Marketplace Mercado Livre - Gestão de Pedidos",
        "plataforma": "mercadolivre",
        "icone": "🛒",
        "cor": "#FFE600",
        "ativo": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
]

async def criar_projetos_fixos():
    """Cria ou atualiza os projetos fixos"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['gestao_manufatura']
    projetos_collection = db['projetos_marketplace']
    
    print("🏭 Configurando projetos fixos...")
    print("-" * 60)
    
    # Deletar TODOS os projetos existentes
    result = await projetos_collection.delete_many({})
    print(f"🗑️  Deletados {result.deleted_count} projetos antigos")
    print()
    
    # Criar os dois projetos fixos
    for projeto in PROJETOS_FIXOS:
        await projetos_collection.insert_one(projeto)
        print(f"✅ Criado: {projeto['nome']} ({projeto['plataforma']})")
        print(f"   ID: {projeto['id']}")
        print(f"   Ícone: {projeto['icone']}")
        print()
    
    print("-" * 60)
    print("✨ Configuração concluída!")
    print()
    print("📊 Projetos ativos:")
    print("   1. 🛍️ Shopee - Marketplace Shopee")
    print("   2. 🛒 Mercado Livre - Marketplace Mercado Livre")
    
    client.close()

if __name__ == "__main__":
    print("=" * 60)
    print("🔧 CONFIGURAÇÃO DE PROJETOS FIXOS")
    print("=" * 60)
    print()
    
    asyncio.run(criar_projetos_fixos())
    
    print()
    print("=" * 60)
    print("✅ Script concluído!")
    print("=" * 60)

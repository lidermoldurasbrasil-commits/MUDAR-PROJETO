#!/usr/bin/env python3
"""
Cron Job para Sincronização Automática de Marketplaces
Executar a cada 30 minutos via supervisor
"""
import asyncio
import sys
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Adicionar diretório backend ao path
sys.path.insert(0, str(Path(__file__).parent))

from marketplace_integrator import (
    MercadoLivreIntegrator,
    ShopeeIntegrator,
    save_or_update_order,
    save_or_update_order_items,
    save_or_update_payments,
    save_or_update_shipments,
    db
)

async def sync_mercado_livre():
    """Sincroniza pedidos do Mercado Livre"""
    try:
        print("=" * 60)
        print(f"🛍️  MERCADO LIVRE SYNC - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
        integrator = MercadoLivreIntegrator()
        
        # Verificar se está autenticado
        creds = await integrator.get_credentials()
        if not creds or not creds.get('access_token'):
            print("⚠️  Mercado Livre não autenticado - pulando sincronização")
            return
        
        # Buscar pedidos dos últimos 2 dias (para garantir updates)
        date_from = datetime.now(timezone.utc) - timedelta(days=2)
        
        ml_orders = await integrator.fetch_orders_since(date_from)
        
        orders_created = 0
        orders_updated = 0
        
        for ml_order in ml_orders:
            try:
                internal_order = integrator.map_to_internal_order(ml_order)
                
                existing = await db.orders.find_one({
                    'marketplace_order_id': internal_order['marketplace_order_id']
                })
                
                internal_order_id = await save_or_update_order(internal_order)
                
                if existing:
                    orders_updated += 1
                else:
                    orders_created += 1
                
                items = integrator.map_to_internal_items(ml_order, internal_order_id)
                await save_or_update_order_items(items)
                
            except Exception as e:
                print(f"❌ Erro ao processar pedido: {e}")
                continue
        
        print(f"✅ Mercado Livre: {orders_created} novos, {orders_updated} atualizados")
        
    except Exception as e:
        print(f"❌ Erro na sincronização Mercado Livre: {e}")

async def sync_shopee():
    """Sincroniza pedidos da Shopee"""
    try:
        print("=" * 60)
        print(f"🛒 SHOPEE SYNC - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
        # TODO: Implementar quando Shopee estiver completo
        print("⚠️  Shopee sync ainda não implementado")
        
    except Exception as e:
        print(f"❌ Erro na sincronização Shopee: {e}")

async def main():
    """Função principal do cron"""
    print("\n" + "=" * 60)
    print("🔄 INICIANDO SINCRONIZAÇÃO AUTOMÁTICA")
    print("=" * 60)
    
    try:
        # Sincronizar Mercado Livre
        await sync_mercado_livre()
        
        # Sincronizar Shopee
        await sync_shopee()
        
        print("\n" + "=" * 60)
        print("✅ SINCRONIZAÇÃO CONCLUÍDA")
        print("=" * 60 + "\n")
        
    except Exception as e:
        print(f"\n❌ Erro geral na sincronização: {e}\n")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())

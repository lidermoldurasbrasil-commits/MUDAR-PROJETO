"""
Marketplace Integrator Module
Integração completa com Mercado Livre e Shopee
"""
import os
import asyncio
import httpx
import hashlib
import hmac
import base64
import secrets
import json
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, List
from urllib.parse import urlencode
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'gestao_manufatura')]

# ============= MERCADO LIVRE =============

class MercadoLivreIntegrator:
    """Integrador Mercado Livre com OAuth2 + PKCE"""
    
    def __init__(self):
        self.client_id = os.environ.get('ML_CLIENT_ID', '')
        self.client_secret = os.environ.get('ML_CLIENT_SECRET', '')
        self.redirect_uri = os.environ.get('ML_REDIRECT_URI', 'http://localhost:8001/api/integrator/mercadolivre/callback')
        self.base_url = 'https://api.mercadolibre.com'
        self.auth_url = 'https://auth.mercadolibre.com.br'
        
    def generate_pkce_pair(self) -> tuple:
        """Gera code_verifier e code_challenge para PKCE"""
        # Code verifier: string aleatória de 43-128 caracteres
        code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
        
        # Code challenge: SHA256 do verifier, base64url encoded
        challenge_bytes = hashlib.sha256(code_verifier.encode('utf-8')).digest()
        code_challenge = base64.urlsafe_b64encode(challenge_bytes).decode('utf-8').rstrip('=')
        
        return code_verifier, code_challenge
    
    async def get_authorization_url(self) -> Dict[str, str]:
        """
        Gera URL de autorização com PKCE
        Retorna: {url, code_verifier} - armazenar code_verifier para callback
        """
        code_verifier, code_challenge = self.generate_pkce_pair()
        
        # Salvar code_verifier temporariamente no banco (será usado no callback)
        await db.ml_pkce_sessions.insert_one({
            'code_verifier': code_verifier,
            'code_challenge': code_challenge,
            'created_at': datetime.now(timezone.utc),
            'expires_at': datetime.now(timezone.utc) + timedelta(minutes=10)
        })
        
        params = {
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'code_challenge': code_challenge,
            'code_challenge_method': 'S256',
            'state': secrets.token_urlsafe(16)  # State para CSRF protection
        }
        
        auth_url = f"{self.auth_url}/authorization?{urlencode(params)}"
        
        return {
            'url': auth_url,
            'code_verifier': code_verifier,
            'state': params['state']
        }
    
    async def exchange_code_for_token(self, code: str, code_verifier: str) -> Dict:
        """
        Troca o código de autorização por access_token usando PKCE
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.auth_url}/oauth/token",
                data={
                    'grant_type': 'authorization_code',
                    'client_id': self.client_id,
                    'client_secret': self.client_secret,
                    'code': code,
                    'redirect_uri': self.redirect_uri,
                    'code_verifier': code_verifier
                },
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            
            if response.status_code != 200:
                raise Exception(f"Erro ao obter token: {response.text}")
            
            token_data = response.json()
            
            # Salvar credenciais no banco
            await self.save_credentials(token_data)
            
            return token_data
    
    async def save_credentials(self, token_data: Dict):
        """Salva ou atualiza credenciais do Mercado Livre"""
        credentials = {
            'marketplace': 'MERCADO_LIVRE',
            'user_id': token_data.get('user_id', ''),
            'access_token': token_data['access_token'],
            'refresh_token': token_data['refresh_token'],
            'token_expires_at': datetime.now(timezone.utc) + timedelta(seconds=token_data.get('expires_in', 21600)),
            'updated_at': datetime.now(timezone.utc)
        }
        
        # Atualizar ou inserir
        await db.marketplace_credentials.update_one(
            {'marketplace': 'MERCADO_LIVRE'},
            {'$set': credentials},
            upsert=True
        )
        
        print(f"✅ Credenciais Mercado Livre salvas. User ID: {credentials['user_id']}")
    
    async def get_credentials(self) -> Optional[Dict]:
        """Busca credenciais armazenadas"""
        creds = await db.marketplace_credentials.find_one({'marketplace': 'MERCADO_LIVRE'})
        return creds
    
    async def refresh_token(self) -> Dict:
        """Renova o access_token usando refresh_token"""
        creds = await self.get_credentials()
        
        if not creds or not creds.get('refresh_token'):
            raise Exception("Nenhuma credencial encontrada. Execute autorização primeiro.")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.auth_url}/oauth/token",
                data={
                    'grant_type': 'refresh_token',
                    'client_id': self.client_id,
                    'client_secret': self.client_secret,
                    'refresh_token': creds['refresh_token']
                },
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            
            if response.status_code != 200:
                raise Exception(f"Erro ao renovar token: {response.text}")
            
            token_data = response.json()
            await self.save_credentials(token_data)
            
            return token_data
    
    async def ensure_valid_token(self) -> str:
        """Garante que temos um token válido, renovando se necessário"""
        creds = await self.get_credentials()
        
        if not creds:
            raise Exception("Nenhuma credencial encontrada. Execute autorização primeiro.")
        
        # Verificar se token está próximo de expirar (menos de 5 minutos)
        expires_at = creds.get('token_expires_at')
        if expires_at and datetime.now(timezone.utc) >= expires_at - timedelta(minutes=5):
            print("🔄 Token expirando, renovando...")
            token_data = await self.refresh_token()
            return token_data['access_token']
        
        return creds['access_token']
    
    async def fetch_orders_since(self, date_from: datetime, seller_id: str = None) -> List[Dict]:
        """
        Busca pedidos do Mercado Livre desde uma data específica
        
        Args:
            date_from: Data inicial para buscar pedidos
            seller_id: ID do vendedor (se não informado, busca das credenciais)
        """
        access_token = await self.ensure_valid_token()
        
        if not seller_id:
            creds = await self.get_credentials()
            seller_id = creds.get('user_id')
        
        if not seller_id:
            raise Exception("seller_id não encontrado")
        
        # Formatar data para ISO 8601
        date_str = date_from.strftime('%Y-%m-%dT%H:%M:%S.000-00:00')
        
        all_orders = []
        offset = 0
        limit = 50
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            while True:
                # Buscar lista de pedidos
                search_url = f"{self.base_url}/orders/search"
                params = {
                    'seller': seller_id,
                    'order.date_created.from': date_str,
                    'sort': 'date_desc',
                    'offset': offset,
                    'limit': limit
                }
                
                headers = {'Authorization': f'Bearer {access_token}'}
                
                response = await client.get(search_url, params=params, headers=headers)
                
                if response.status_code != 200:
                    print(f"❌ Erro ao buscar pedidos: {response.status_code} - {response.text}")
                    break
                
                data = response.json()
                results = data.get('results', [])
                
                if not results:
                    break
                
                # Para cada pedido, buscar detalhes completos
                for order_id in results:
                    try:
                        order_detail = await self.fetch_order_detail(order_id, access_token)
                        if order_detail:
                            all_orders.append(order_detail)
                    except Exception as e:
                        print(f"❌ Erro ao buscar detalhes do pedido {order_id}: {e}")
                        continue
                
                # Paginação
                if len(results) < limit:
                    break
                
                offset += limit
        
        print(f"✅ {len(all_orders)} pedidos encontrados desde {date_from}")
        return all_orders
    
    async def fetch_order_detail(self, order_id: str, access_token: str = None) -> Optional[Dict]:
        """Busca detalhes completos de um pedido"""
        if not access_token:
            access_token = await self.ensure_valid_token()
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Buscar pedido
            order_url = f"{self.base_url}/orders/{order_id}"
            headers = {'Authorization': f'Bearer {access_token}'}
            
            response = await client.get(order_url, headers=headers)
            
            if response.status_code != 200:
                print(f"❌ Erro ao buscar pedido {order_id}: {response.text}")
                return None
            
            order_data = response.json()
            
            # Buscar dados de shipment se existir
            shipment_data = None
            if order_data.get('shipping', {}).get('id'):
                shipment_id = order_data['shipping']['id']
                shipment_url = f"{self.base_url}/shipments/{shipment_id}"
                
                shipment_response = await client.get(shipment_url, headers=headers)
                if shipment_response.status_code == 200:
                    shipment_data = shipment_response.json()
            
            # Combinar dados
            order_data['_shipment_detail'] = shipment_data
            
            return order_data
    
    def map_to_internal_order(self, ml_order: Dict) -> Dict:
        """Mapeia pedido do Mercado Livre para formato interno"""
        
        # Dados básicos
        order_id = str(ml_order.get('id', ''))
        status = ml_order.get('status', '')
        
        # Comprador
        buyer = ml_order.get('buyer', {})
        buyer_id = str(buyer.get('id', ''))
        buyer_nickname = buyer.get('nickname', '')
        buyer_first_name = buyer.get('first_name', '')
        buyer_last_name = buyer.get('last_name', '')
        buyer_phone = buyer.get('phone', {}).get('area_code', '') + buyer.get('phone', {}).get('number', '')
        buyer_email = buyer.get('email', '')
        
        # Shipping/Endereço
        shipping = ml_order.get('shipping', {})
        shipment_detail = ml_order.get('_shipment_detail', {})
        
        receiver_address = shipment_detail.get('receiver_address', {}) if shipment_detail else shipping.get('receiver_address', {})
        
        ship_to_name = receiver_address.get('receiver_name', '')
        ship_to_phone = receiver_address.get('receiver_phone', '')
        ship_to_street = receiver_address.get('street_name', '')
        ship_to_number = receiver_address.get('street_number', '')
        ship_to_complement = receiver_address.get('comment', '')
        ship_to_district = receiver_address.get('neighborhood', {}).get('name', '') if isinstance(receiver_address.get('neighborhood'), dict) else receiver_address.get('neighborhood', '')
        ship_to_city = receiver_address.get('city', {}).get('name', '') if isinstance(receiver_address.get('city'), dict) else receiver_address.get('city', '')
        ship_to_state = receiver_address.get('state', {}).get('name', '') if isinstance(receiver_address.get('state'), dict) else receiver_address.get('state', '')
        ship_to_zipcode = receiver_address.get('zip_code', '')
        ship_to_country = receiver_address.get('country', {}).get('name', '') if isinstance(receiver_address.get('country'), dict) else 'Brasil'
        
        # Financeiro
        currency = ml_order.get('currency_id', 'BRL')
        total_amount = float(ml_order.get('total_amount', 0))
        
        # Calcular subtotal dos itens
        subtotal_items = 0.0
        for item in ml_order.get('order_items', []):
            subtotal_items += float(item.get('unit_price', 0)) * int(item.get('quantity', 1))
        
        # Pagamento
        payments = ml_order.get('payments', [])
        payment_status = payments[0].get('status', '') if payments else ''
        paid_at_str = payments[0].get('date_approved') if payments else None
        installments = int(payments[0].get('installments', 1)) if payments else 1
        
        # Shipping
        shipping_cost = float(shipping.get('cost', 0))
        shipping_id = str(shipping.get('id', ''))
        shipping_status = shipping.get('status', '')
        
        tracking_number = shipment_detail.get('tracking_number', '') if shipment_detail else ''
        tracking_carrier = shipping.get('logistic_type', '')
        
        # Datas
        created_at = self._parse_ml_date(ml_order.get('date_created'))
        paid_at = self._parse_ml_date(paid_at_str) if paid_at_str else None
        shipped_at = self._parse_ml_date(shipment_detail.get('status_history', {}).get('date_shipped')) if shipment_detail else None
        delivered_at = self._parse_ml_date(shipment_detail.get('status_history', {}).get('date_delivered')) if shipment_detail else None
        last_updated = self._parse_ml_date(ml_order.get('last_updated'))
        
        # Montar objeto Order
        internal_order = {
            'marketplace': 'MERCADO_LIVRE',
            'marketplace_order_id': order_id,
            'order_number_display': order_id,
            
            'status_general': self._map_ml_status(status),
            'status_payment': payment_status,
            'status_fulfillment': shipping_status,
            
            'created_at_marketplace': created_at,
            'paid_at': paid_at,
            'shipped_at': shipped_at,
            'delivered_at': delivered_at,
            'last_updated_at': last_updated,
            
            'buyer_id_marketplace': buyer_id,
            'buyer_username': buyer_nickname,
            'buyer_full_name': f"{buyer_first_name} {buyer_last_name}".strip(),
            'buyer_phone': buyer_phone,
            'buyer_email': buyer_email,
            
            'ship_to_name': ship_to_name,
            'ship_to_phone': ship_to_phone,
            'ship_to_street': ship_to_street,
            'ship_to_number': ship_to_number,
            'ship_to_complement': ship_to_complement,
            'ship_to_district': ship_to_district,
            'ship_to_city': ship_to_city,
            'ship_to_state': ship_to_state,
            'ship_to_zipcode': ship_to_zipcode,
            'ship_to_country': ship_to_country,
            
            'currency': currency,
            'subtotal_items': subtotal_items,
            'shipping_cost_charged': shipping_cost,
            'total_amount_buyer': total_amount,
            'installments_qty': installments,
            
            'shipment_id_marketplace': shipping_id,
            'shipping_status': shipping_status,
            'shipping_method': tracking_carrier,
            'tracking_number': tracking_number,
            'tracking_carrier': tracking_carrier,
            
            'updated_at': datetime.now(timezone.utc)
        }
        
        return internal_order
    
    def map_to_internal_items(self, ml_order: Dict, internal_order_id: str) -> List[Dict]:
        """Mapeia itens do pedido ML para formato interno"""
        items = []
        
        for item in ml_order.get('order_items', []):
            internal_item = {
                'internal_order_id': internal_order_id,
                'marketplace_order_id': str(ml_order.get('id', '')),
                'marketplace_item_id': str(item.get('item', {}).get('id', '')),
                'marketplace_variation_id': str(item.get('item', {}).get('variation_id', '')),
                
                'seller_sku': item.get('item', {}).get('seller_custom_field', ''),
                'product_title': item.get('item', {}).get('title', ''),
                'variation_name': self._build_variation_name(item.get('item', {}).get('variation_attributes', [])),
                
                'quantity': int(item.get('quantity', 1)),
                'unit_price': float(item.get('unit_price', 0)),
                'original_unit_price': float(item.get('full_unit_price', 0)),
                'total_price_item': float(item.get('unit_price', 0)) * int(item.get('quantity', 1)),
                'currency': item.get('currency_id', 'BRL'),
                
                'updated_at': datetime.now(timezone.utc)
            }
            
            items.append(internal_item)
        
        return items
    
    def _build_variation_name(self, variation_attrs: List[Dict]) -> str:
        """Constrói nome da variação a partir dos atributos"""
        if not variation_attrs:
            return ""
        
        parts = []
        for attr in variation_attrs:
            name = attr.get('name', '')
            value = attr.get('value_name', '')
            if name and value:
                parts.append(f"{name}: {value}")
        
        return " / ".join(parts)
    
    def _map_ml_status(self, ml_status: str) -> str:
        """Mapeia status do ML para status geral interno"""
        status_map = {
            'confirmed': 'paid',
            'payment_required': 'pending',
            'payment_in_process': 'pending',
            'paid': 'paid',
            'cancelled': 'cancelled',
            'invalid': 'cancelled'
        }
        return status_map.get(ml_status, ml_status)
    
    def _parse_ml_date(self, date_str) -> Optional[datetime]:
        """Parse de data do ML para datetime"""
        if not date_str:
            return None
        
        try:
            # ML retorna em formato ISO 8601
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except:
            return None


# ============= SHOPEE =============

class ShopeeIntegrator:
    """Integrador Shopee com autenticação HMAC"""
    
    def __init__(self):
        self.partner_id = int(os.environ.get('SHOPEE_PARTNER_ID', '0'))
        self.partner_key = os.environ.get('SHOPEE_PARTNER_KEY', '')
        self.shop_id = int(os.environ.get('SHOPEE_SHOP_ID', '0'))
        self.base_url = 'https://partner.shopeemobile.com'
    
    def generate_signature(self, path: str, timestamp: int, access_token: str = '', shop_id: int = 0) -> str:
        """Gera assinatura HMAC SHA256 para Shopee API"""
        # Base string: partner_id + path + timestamp + access_token + shop_id
        base_string = f"{self.partner_id}{path}{timestamp}{access_token}{shop_id}"
        
        # HMAC SHA256
        signature = hmac.new(
            self.partner_key.encode('utf-8'),
            base_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return signature
    
    async def authorize(self) -> Dict:
        """
        Inicia processo de autorização Shopee
        Retorna URL para redirecionar vendedor
        """
        path = '/api/v2/shop/auth_partner'
        timestamp = int(datetime.now(timezone.utc).timestamp())
        
        signature = self.generate_signature(path, timestamp)
        redirect_url = os.environ.get('SHOPEE_REDIRECT_URI', 'http://localhost:8001/api/integrator/shopee/callback')
        
        auth_url = f"{self.base_url}{path}"
        params = {
            'partner_id': self.partner_id,
            'redirect': redirect_url,
            'timestamp': timestamp,
            'sign': signature
        }
        
        return {
            'url': f"{auth_url}?{urlencode(params)}"
        }
    
    async def get_access_token(self, code: str, shop_id: int) -> Dict:
        """Obtém access_token após autorização"""
        path = '/api/v2/auth/token/get'
        timestamp = int(datetime.now(timezone.utc).timestamp())
        
        signature = self.generate_signature(path, timestamp, shop_id=shop_id)
        
        url = f"{self.base_url}{path}"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                params={
                    'partner_id': self.partner_id,
                    'timestamp': timestamp,
                    'sign': signature
                },
                json={
                    'code': code,
                    'shop_id': shop_id,
                    'partner_id': self.partner_id
                }
            )
            
            if response.status_code != 200:
                raise Exception(f"Erro ao obter token Shopee: {response.text}")
            
            token_data = response.json()
            
            # Salvar credenciais
            await self.save_credentials(token_data, shop_id)
            
            return token_data
    
    async def save_credentials(self, token_data: Dict, shop_id: int):
        """Salva credenciais Shopee"""
        credentials = {
            'marketplace': 'SHOPEE',
            'shop_id': str(shop_id),
            'access_token': token_data.get('access_token', ''),
            'refresh_token': token_data.get('refresh_token', ''),
            'token_expires_at': datetime.now(timezone.utc) + timedelta(seconds=token_data.get('expire_in', 14400)),
            'updated_at': datetime.now(timezone.utc)
        }
        
        await db.marketplace_credentials.update_one(
            {'marketplace': 'SHOPEE', 'shop_id': str(shop_id)},
            {'$set': credentials},
            upsert=True
        )
        
        print(f"✅ Credenciais Shopee salvas. Shop ID: {shop_id}")
    
    # TODO: Implementar fetch_orders_since, mapeamento, etc.
    # (Estrutura similar ao Mercado Livre)


# ============= FUNÇÕES DE PERSISTÊNCIA =============

async def save_or_update_order(order_data: Dict) -> str:
    """Salva ou atualiza pedido na collection orders"""
    marketplace_order_id = order_data.get('marketplace_order_id')
    
    # Verificar se já existe
    existing = await db.orders.find_one({'marketplace_order_id': marketplace_order_id})
    
    if existing:
        # Atualizar
        await db.orders.update_one(
            {'marketplace_order_id': marketplace_order_id},
            {'$set': order_data}
        )
        print(f"🔄 Pedido {marketplace_order_id} atualizado")
        return existing['internal_order_id']
    else:
        # Inserir novo
        if 'internal_order_id' not in order_data:
            order_data['internal_order_id'] = str(secrets.token_urlsafe(16))
        
        order_data['inserted_at'] = datetime.now(timezone.utc)
        await db.orders.insert_one(order_data)
        print(f"✅ Pedido {marketplace_order_id} criado")
        return order_data['internal_order_id']

async def save_or_update_order_items(items_data: List[Dict]):
    """Salva ou atualiza itens do pedido"""
    for item in items_data:
        marketplace_order_id = item.get('marketplace_order_id')
        marketplace_item_id = item.get('marketplace_item_id')
        
        # Verificar se já existe
        existing = await db.order_items.find_one({
            'marketplace_order_id': marketplace_order_id,
            'marketplace_item_id': marketplace_item_id
        })
        
        if existing:
            await db.order_items.update_one(
                {'internal_order_item_id': existing['internal_order_item_id']},
                {'$set': item}
            )
        else:
            if 'internal_order_item_id' not in item:
                item['internal_order_item_id'] = str(secrets.token_urlsafe(16))
            
            item['inserted_at'] = datetime.now(timezone.utc)
            await db.order_items.insert_one(item)

async def save_or_update_payments(payments_data: List[Dict]):
    """Salva ou atualiza pagamentos"""
    for payment in payments_data:
        marketplace_payment_id = payment.get('marketplace_payment_id')
        
        if not marketplace_payment_id:
            continue
        
        existing = await db.payments.find_one({'marketplace_payment_id': marketplace_payment_id})
        
        if existing:
            await db.payments.update_one(
                {'internal_payment_id': existing['internal_payment_id']},
                {'$set': payment}
            )
        else:
            if 'internal_payment_id' not in payment:
                payment['internal_payment_id'] = str(secrets.token_urlsafe(16))
            
            payment['inserted_at'] = datetime.now(timezone.utc)
            await db.payments.insert_one(payment)

async def save_or_update_shipments(shipments_data: List[Dict]):
    """Salva ou atualiza envios"""
    for shipment in shipments_data:
        marketplace_shipment_id = shipment.get('marketplace_shipment_id')
        
        if not marketplace_shipment_id:
            continue
        
        existing = await db.shipments.find_one({'marketplace_shipment_id': marketplace_shipment_id})
        
        if existing:
            await db.shipments.update_one(
                {'internal_shipment_id': existing['internal_shipment_id']},
                {'$set': shipment}
            )
        else:
            if 'internal_shipment_id' not in shipment:
                shipment['internal_shipment_id'] = str(secrets.token_urlsafe(16))
            
            shipment['inserted_at'] = datetime.now(timezone.utc)
            await db.shipments.insert_one(shipment)

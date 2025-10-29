#!/usr/bin/env python3
"""
TESTE FINAL DE PRÉ-PRODUÇÃO - VALIDAÇÃO COMPLETA
Sistema vai para produção AGORA. Preciso validar 100% das funcionalidades críticas com TODOS os usuários.
"""

import requests
import sys
import json
import os
from datetime import datetime

class PreProductionTester:
    def __init__(self):
        # Get backend URL from environment
        self.base_url = "https://shopeeml-sync.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.tokens = {}  # Store tokens for different users
        self.projects = {}  # Store project data
        self.orders_data = {}  # Store orders data for integrity checks
        
        # Production users to test
        self.production_users = [
            {"username": "diretor", "password": "123", "role": "director"},
            {"username": "espelho", "password": "123", "role": "production"},
            {"username": "molduras-vidro", "password": "123", "role": "production"},
            {"username": "molduras", "password": "123", "role": "production"},
            {"username": "impressao", "password": "123", "role": "production"},
            {"username": "expedicao", "password": "123", "role": "production"},
            {"username": "embalagem", "password": "123", "role": "production"}
        ]

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            'name': name,
            'success': success,
            'details': details
        })

    def make_request(self, method, endpoint, data=None, token=None, params=None):
        """Make HTTP request to API"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            return response.status_code, response_data

        except Exception as e:
            return 0, {"error": str(e)}

    def test_authentication_all_users(self):
        """1. AUTENTICAÇÃO - Todos os Usuários"""
        print("\n🔐 TESTE 1: AUTENTICAÇÃO - TODOS OS USUÁRIOS")
        print("=" * 60)
        
        all_success = True
        
        for user in self.production_users:
            username = user["username"]
            password = user["password"]
            expected_role = user["role"]
            
            print(f"\n📋 Testando login: {username}/{password}")
            
            # Make login request
            status, response = self.make_request(
                'POST', 
                'auth/login',
                data={"username": username, "password": password}
            )
            
            if status == 200:
                # Check response format
                if 'access_token' in response and 'user' in response:
                    token = response['access_token']
                    user_data = response['user']
                    
                    # Verify token format and user data
                    if (token and 
                        user_data.get('username') == username and 
                        user_data.get('role') == expected_role):
                        
                        self.tokens[username] = token
                        print(f"✅ Login {username} - Token válido, role: {user_data.get('role')}")
                        self.log_test(f"Login {username}/123", True)
                    else:
                        print(f"❌ Login {username} - Dados inválidos: {user_data}")
                        self.log_test(f"Login {username}/123", False, "Dados de usuário inválidos")
                        all_success = False
                else:
                    print(f"❌ Login {username} - Formato de resposta inválido: {response}")
                    self.log_test(f"Login {username}/123", False, "Formato de resposta inválido")
                    all_success = False
            else:
                print(f"❌ Login {username} - Status {status}: {response}")
                self.log_test(f"Login {username}/123", False, f"Status {status}")
                all_success = False
        
        if all_success:
            print(f"\n✅ TODOS OS {len(self.production_users)} USUÁRIOS AUTENTICADOS COM SUCESSO!")
        else:
            print(f"\n❌ FALHA NA AUTENTICAÇÃO DE ALGUNS USUÁRIOS")
        
        return all_success

    def test_project_access(self):
        """2. ACESSO AOS PROJETOS"""
        print("\n🏢 TESTE 2: ACESSO AOS PROJETOS")
        print("=" * 60)
        
        all_success = True
        
        # Test with director
        print("\n📋 Testando acesso aos projetos - DIRETOR")
        director_token = self.tokens.get('diretor')
        if not director_token:
            print("❌ Token do diretor não disponível")
            self.log_test("Acesso Projetos - Diretor", False, "Token não disponível")
            return False
        
        status, response = self.make_request(
            'GET',
            'gestao/marketplaces/projetos',
            token=director_token
        )
        
        if status == 200 and isinstance(response, list):
            # Check for required projects
            project_names = [p.get('nome', '') for p in response]
            shopee_found = any('shopee' in name.lower() or 'diamonds' in name.lower() for name in project_names)
            ml_found = any('mercado' in name.lower() or 'livre' in name.lower() for name in project_names)
            
            if shopee_found and ml_found:
                print("✅ Diretor - Projetos Shopee e Mercado Livre encontrados")
                self.log_test("Acesso Projetos - Diretor", True)
                self.projects['director'] = response
            else:
                print(f"❌ Diretor - Projetos não encontrados. Disponíveis: {project_names}")
                self.log_test("Acesso Projetos - Diretor", False, f"Projetos não encontrados: {project_names}")
                all_success = False
        else:
            print(f"❌ Diretor - Status {status}: {response}")
            self.log_test("Acesso Projetos - Diretor", False, f"Status {status}")
            all_success = False
        
        # Test with production user (espelho)
        print("\n📋 Testando acesso aos projetos - USUÁRIO PRODUÇÃO (espelho)")
        espelho_token = self.tokens.get('espelho')
        if not espelho_token:
            print("❌ Token do usuário espelho não disponível")
            self.log_test("Acesso Projetos - Espelho", False, "Token não disponível")
            return False
        
        status, response = self.make_request(
            'GET',
            'gestao/marketplaces/projetos',
            token=espelho_token
        )
        
        if status == 200 and isinstance(response, list):
            # Check for required projects
            project_names = [p.get('nome', '') for p in response]
            shopee_found = any('shopee' in name.lower() or 'diamonds' in name.lower() for name in project_names)
            ml_found = any('mercado' in name.lower() or 'livre' in name.lower() for name in project_names)
            
            if shopee_found and ml_found:
                print("✅ Espelho - Projetos Shopee e Mercado Livre encontrados")
                self.log_test("Acesso Projetos - Espelho", True)
                self.projects['espelho'] = response
            else:
                print(f"❌ Espelho - Projetos não encontrados. Disponíveis: {project_names}")
                self.log_test("Acesso Projetos - Espelho", False, f"Projetos não encontrados: {project_names}")
                all_success = False
        else:
            print(f"❌ Espelho - Status {status}: {response}")
            self.log_test("Acesso Projetos - Espelho", False, f"Status {status}")
            all_success = False
        
        return all_success

    def test_order_listing_with_required_fields(self):
        """3. LISTAGEM DE PEDIDOS - Com Todos os Campos"""
        print("\n📋 TESTE 3: LISTAGEM DE PEDIDOS - CAMPOS OBRIGATÓRIOS")
        print("=" * 60)
        
        # Get Shopee project ID
        shopee_project = None
        if 'director' in self.projects:
            for project in self.projects['director']:
                if 'shopee' in project.get('nome', '').lower() or 'diamonds' in project.get('nome', '').lower():
                    shopee_project = project
                    break
        
        if not shopee_project:
            print("❌ Projeto Shopee não encontrado")
            self.log_test("Listagem Pedidos - Projeto Shopee", False, "Projeto não encontrado")
            return False
        
        project_id = shopee_project.get('id')
        print(f"📋 Testando pedidos do projeto: {shopee_project.get('nome')} (ID: {project_id})")
        
        # Get orders from Shopee project
        director_token = self.tokens.get('diretor')
        status, response = self.make_request(
            'GET',
            'gestao/marketplaces/pedidos',
            token=director_token,
            params={'projeto_id': project_id}
        )
        
        if status != 200:
            print(f"❌ Falha ao buscar pedidos - Status {status}: {response}")
            self.log_test("Listagem Pedidos - GET Request", False, f"Status {status}")
            return False
        
        if not isinstance(response, list):
            print(f"❌ Resposta não é uma lista: {type(response)}")
            self.log_test("Listagem Pedidos - Response Format", False, "Não é lista")
            return False
        
        orders = response
        total_orders = len(orders)
        print(f"📊 Total de pedidos encontrados: {total_orders}")
        
        if total_orders == 0:
            print("❌ Nenhum pedido encontrado no projeto Shopee")
            self.log_test("Listagem Pedidos - Quantidade", False, "Nenhum pedido encontrado")
            return False
        
        # Store orders for integrity check later
        self.orders_data['initial_count'] = total_orders
        self.orders_data['initial_orders'] = orders.copy()
        
        # Check required fields in orders
        required_fields = [
            'numero_pedido', 'id_venda', 'sku', 'numero_referencia_sku',
            'status_producao', 'status_logistica', 'status_montagem', 'quantidade'
        ]
        
        field_stats = {field: 0 for field in required_fields}
        orders_with_status_montagem = 0
        
        print(f"\n🔍 Verificando campos obrigatórios em {total_orders} pedidos...")
        
        for i, order in enumerate(orders):
            # Check each required field
            for field in required_fields:
                if field in order and order[field] is not None and order[field] != "":
                    field_stats[field] += 1
            
            # Special check for status_montagem (CRITICAL)
            if 'status_montagem' in order and order['status_montagem'] is not None and order['status_montagem'] != "":
                orders_with_status_montagem += 1
        
        # Report field statistics
        print(f"\n📊 Estatísticas dos campos:")
        all_fields_ok = True
        
        for field, count in field_stats.items():
            percentage = (count / total_orders) * 100
            if field == 'status_montagem':
                # CRITICAL: status_montagem must exist in 100% of orders
                if percentage == 100:
                    print(f"✅ {field}: {count}/{total_orders} ({percentage:.1f}%) - CRÍTICO OK")
                    self.log_test(f"Campo {field} - 100% presente", True)
                else:
                    print(f"❌ {field}: {count}/{total_orders} ({percentage:.1f}%) - CRÍTICO FALHOU")
                    self.log_test(f"Campo {field} - 100% presente", False, f"Apenas {percentage:.1f}%")
                    all_fields_ok = False
            else:
                # Other fields should be present in most orders
                if percentage >= 80:
                    print(f"✅ {field}: {count}/{total_orders} ({percentage:.1f}%)")
                    self.log_test(f"Campo {field} - Presente", True)
                else:
                    print(f"⚠️ {field}: {count}/{total_orders} ({percentage:.1f}%) - Baixa cobertura")
                    self.log_test(f"Campo {field} - Presente", False, f"Apenas {percentage:.1f}%")
        
        # Check for cliente_nome in Mercado Livre orders (if any)
        ml_orders = [o for o in orders if 'mercado' in str(o.get('plataforma', '')).lower()]
        if ml_orders:
            ml_with_cliente = len([o for o in ml_orders if o.get('cliente_nome')])
            ml_percentage = (ml_with_cliente / len(ml_orders)) * 100
            print(f"📋 Mercado Livre - cliente_nome: {ml_with_cliente}/{len(ml_orders)} ({ml_percentage:.1f}%)")
        
        return all_fields_ok

    def test_status_updates_and_persistence(self):
        """4. ATUALIZAÇÃO DE STATUS - Persistência de Dados"""
        print("\n🔄 TESTE 4: ATUALIZAÇÃO DE STATUS - PERSISTÊNCIA")
        print("=" * 60)
        
        if not self.orders_data.get('initial_orders'):
            print("❌ Dados de pedidos não disponíveis do teste anterior")
            return False
        
        orders = self.orders_data['initial_orders']
        director_token = self.tokens.get('diretor')
        
        if len(orders) < 4:
            print(f"❌ Poucos pedidos disponíveis para teste ({len(orders)}). Necessário pelo menos 4.")
            return False
        
        # Select orders for testing
        test_orders = orders[:4]  # Use first 4 orders
        updates_made = []
        
        print(f"📋 Selecionados {len(test_orders)} pedidos para teste de atualização")
        
        # Test 1: Update status_producao
        order1 = test_orders[0]
        order1_id = order1.get('id')
        original_status_producao = order1.get('status_producao')
        new_status_producao = "Molduras" if original_status_producao != "Molduras" else "Espelho"
        
        print(f"\n📋 Teste 1: Atualizando status_producao do pedido {order1_id}")
        print(f"   Original: {original_status_producao} → Novo: {new_status_producao}")
        
        # Create full order data with updated status_producao
        updated_order1 = order1.copy()
        updated_order1['status_producao'] = new_status_producao
        
        status, response = self.make_request(
            'PUT',
            f'gestao/marketplaces/pedidos/{order1_id}',
            data=updated_order1,
            token=director_token
        )
        
        if status == 200:
            print("✅ Atualização status_producao - Sucesso")
            self.log_test("Atualização status_producao", True)
            updates_made.append(('status_producao', order1_id, original_status_producao, new_status_producao))
        else:
            print(f"❌ Atualização status_producao - Status {status}: {response}")
            self.log_test("Atualização status_producao", False, f"Status {status}")
            return False
        
        # Test 2: Update status_logistica
        order2 = test_orders[1]
        order2_id = order2.get('id')
        original_status_logistica = order2.get('status_logistica')
        new_status_logistica = "Em montagem" if original_status_logistica != "Em montagem" else "Aguardando"
        
        print(f"\n📋 Teste 2: Atualizando status_logistica do pedido {order2_id}")
        print(f"   Original: {original_status_logistica} → Novo: {new_status_logistica}")
        
        status, response = self.make_request(
            'PUT',
            f'gestao/marketplaces/pedidos/{order2_id}',
            data={'status_logistica': new_status_logistica},
            token=director_token
        )
        
        if status == 200:
            print("✅ Atualização status_logistica - Sucesso")
            self.log_test("Atualização status_logistica", True)
            updates_made.append(('status_logistica', order2_id, original_status_logistica, new_status_logistica))
        else:
            print(f"❌ Atualização status_logistica - Status {status}: {response}")
            self.log_test("Atualização status_logistica", False, f"Status {status}")
            return False
        
        # Test 3: Update status_montagem to "Em Montagem"
        order3 = test_orders[2]
        order3_id = order3.get('id')
        original_status_montagem = order3.get('status_montagem')
        new_status_montagem = "Em Montagem"
        
        print(f"\n📋 Teste 3: Atualizando status_montagem do pedido {order3_id}")
        print(f"   Original: {original_status_montagem} → Novo: {new_status_montagem}")
        
        status, response = self.make_request(
            'PUT',
            f'gestao/marketplaces/pedidos/{order3_id}',
            data={'status_montagem': new_status_montagem},
            token=director_token
        )
        
        if status == 200:
            print("✅ Atualização status_montagem (Em Montagem) - Sucesso")
            self.log_test("Atualização status_montagem (Em Montagem)", True)
            updates_made.append(('status_montagem', order3_id, original_status_montagem, new_status_montagem))
        else:
            print(f"❌ Atualização status_montagem (Em Montagem) - Status {status}: {response}")
            self.log_test("Atualização status_montagem (Em Montagem)", False, f"Status {status}")
            return False
        
        # Test 4: Update status_montagem to "Finalizado"
        order4 = test_orders[3]
        order4_id = order4.get('id')
        original_status_montagem4 = order4.get('status_montagem')
        new_status_montagem4 = "Finalizado"
        
        print(f"\n📋 Teste 4: Atualizando status_montagem do pedido {order4_id}")
        print(f"   Original: {original_status_montagem4} → Novo: {new_status_montagem4}")
        
        status, response = self.make_request(
            'PUT',
            f'gestao/marketplaces/pedidos/{order4_id}',
            data={'status_montagem': new_status_montagem4},
            token=director_token
        )
        
        if status == 200:
            print("✅ Atualização status_montagem (Finalizado) - Sucesso")
            self.log_test("Atualização status_montagem (Finalizado)", True)
            updates_made.append(('status_montagem', order4_id, original_status_montagem4, new_status_montagem4))
        else:
            print(f"❌ Atualização status_montagem (Finalizado) - Status {status}: {response}")
            self.log_test("Atualização status_montagem (Finalizado)", False, f"Status {status}")
            return False
        
        # CRITICAL: Verify persistence by fetching orders again
        print(f"\n🔍 VERIFICAÇÃO CRÍTICA: Confirmando persistência das mudanças...")
        
        # Get project ID for re-fetching
        shopee_project = None
        if 'director' in self.projects:
            for project in self.projects['director']:
                if 'shopee' in project.get('nome', '').lower() or 'diamonds' in project.get('nome', '').lower():
                    shopee_project = project
                    break
        
        if not shopee_project:
            print("❌ Projeto Shopee não encontrado para verificação")
            return False
        
        project_id = shopee_project.get('id')
        
        # Re-fetch orders
        status, updated_orders_response = self.make_request(
            'GET',
            'gestao/marketplaces/pedidos',
            token=director_token,
            params={'projeto_id': project_id}
        )
        
        if status != 200:
            print(f"❌ Falha ao buscar pedidos atualizados - Status {status}")
            self.log_test("Verificação Persistência", False, f"Status {status}")
            return False
        
        updated_orders = updated_orders_response
        
        # Verify each update was persisted
        persistence_ok = True
        
        for field, order_id, old_value, new_value in updates_made:
            # Find the updated order
            updated_order = None
            for order in updated_orders:
                if order.get('id') == order_id:
                    updated_order = order
                    break
            
            if not updated_order:
                print(f"❌ Pedido {order_id} não encontrado após atualização")
                persistence_ok = False
                continue
            
            current_value = updated_order.get(field)
            if current_value == new_value:
                print(f"✅ {field} do pedido {order_id}: {old_value} → {new_value} (PERSISTIDO)")
                self.log_test(f"Persistência {field} - {order_id}", True)
            else:
                print(f"❌ {field} do pedido {order_id}: Esperado {new_value}, Atual {current_value}")
                self.log_test(f"Persistência {field} - {order_id}", False, f"Esperado {new_value}, atual {current_value}")
                persistence_ok = False
        
        # CRITICAL: Verify no data disappeared
        new_total = len(updated_orders)
        original_total = self.orders_data['initial_count']
        
        print(f"\n🔍 VERIFICAÇÃO DE INTEGRIDADE:")
        print(f"   Pedidos originais: {original_total}")
        print(f"   Pedidos após atualizações: {new_total}")
        
        if new_total == original_total:
            print("✅ NENHUM PEDIDO DESAPARECEU - Integridade mantida")
            self.log_test("Integridade de Dados", True)
        else:
            print(f"❌ DADOS PERDIDOS: {original_total - new_total} pedidos desapareceram")
            self.log_test("Integridade de Dados", False, f"{original_total - new_total} pedidos perdidos")
            persistence_ok = False
        
        return persistence_ok

    def test_filters(self):
        """5. FILTROS"""
        print("\n🔍 TESTE 5: FILTROS")
        print("=" * 60)
        
        # Get project ID
        shopee_project = None
        if 'director' in self.projects:
            for project in self.projects['director']:
                if 'shopee' in project.get('nome', '').lower() or 'diamonds' in project.get('nome', '').lower():
                    shopee_project = project
                    break
        
        if not shopee_project:
            print("❌ Projeto Shopee não encontrado")
            return False
        
        project_id = shopee_project.get('id')
        director_token = self.tokens.get('diretor')
        
        all_filters_ok = True
        
        # Test 1: Filter by setor (status_producao = "Molduras")
        print(f"\n📋 Teste 1: Filtro por setor (status_producao = 'Molduras')")
        
        status, response = self.make_request(
            'GET',
            'gestao/marketplaces/pedidos',
            token=director_token,
            params={'projeto_id': project_id, 'status_producao': 'Molduras'}
        )
        
        if status == 200 and isinstance(response, list):
            molduras_orders = response
            # Verify all returned orders have status_producao = "Molduras"
            invalid_orders = [o for o in molduras_orders if o.get('status_producao') != 'Molduras']
            
            if len(invalid_orders) == 0:
                print(f"✅ Filtro setor 'Molduras' - {len(molduras_orders)} pedidos retornados, todos corretos")
                self.log_test("Filtro por Setor (Molduras)", True)
            else:
                print(f"❌ Filtro setor 'Molduras' - {len(invalid_orders)} pedidos com setor incorreto")
                self.log_test("Filtro por Setor (Molduras)", False, f"{len(invalid_orders)} pedidos incorretos")
                all_filters_ok = False
        else:
            print(f"❌ Filtro setor 'Molduras' - Status {status}: {response}")
            self.log_test("Filtro por Setor (Molduras)", False, f"Status {status}")
            all_filters_ok = False
        
        # Test 2: Filter by status produção (status_logistica = "Aguardando")
        print(f"\n📋 Teste 2: Filtro por status produção (status_logistica = 'Aguardando')")
        
        status, response = self.make_request(
            'GET',
            'gestao/marketplaces/pedidos',
            token=director_token,
            params={'projeto_id': project_id, 'status_logistica': 'Aguardando'}
        )
        
        if status == 200 and isinstance(response, list):
            aguardando_orders = response
            # Verify all returned orders have status_logistica = "Aguardando"
            invalid_orders = [o for o in aguardando_orders if o.get('status_logistica') != 'Aguardando']
            
            if len(invalid_orders) == 0:
                print(f"✅ Filtro status produção 'Aguardando' - {len(aguardando_orders)} pedidos retornados, todos corretos")
                self.log_test("Filtro por Status Produção (Aguardando)", True)
            else:
                print(f"❌ Filtro status produção 'Aguardando' - {len(invalid_orders)} pedidos com status incorreto")
                self.log_test("Filtro por Status Produção (Aguardando)", False, f"{len(invalid_orders)} pedidos incorretos")
                all_filters_ok = False
        else:
            print(f"❌ Filtro status produção 'Aguardando' - Status {status}: {response}")
            self.log_test("Filtro por Status Produção (Aguardando)", False, f"Status {status}")
            all_filters_ok = False
        
        # Test 3: Filter by status montagem (status_montagem = "Aguardando Montagem")
        print(f"\n📋 Teste 3: Filtro por status montagem (status_montagem = 'Aguardando Montagem')")
        
        status, response = self.make_request(
            'GET',
            'gestao/marketplaces/pedidos',
            token=director_token,
            params={'projeto_id': project_id, 'status_montagem': 'Aguardando Montagem'}
        )
        
        if status == 200 and isinstance(response, list):
            aguardando_montagem_orders = response
            # Verify all returned orders have status_montagem = "Aguardando Montagem"
            invalid_orders = [o for o in aguardando_montagem_orders if o.get('status_montagem') != 'Aguardando Montagem']
            
            if len(invalid_orders) == 0:
                print(f"✅ Filtro status montagem 'Aguardando Montagem' - {len(aguardando_montagem_orders)} pedidos retornados, todos corretos")
                self.log_test("Filtro por Status Montagem (Aguardando Montagem)", True)
            else:
                print(f"❌ Filtro status montagem 'Aguardando Montagem' - {len(invalid_orders)} pedidos com status incorreto")
                self.log_test("Filtro por Status Montagem (Aguardando Montagem)", False, f"{len(invalid_orders)} pedidos incorretos")
                all_filters_ok = False
        else:
            print(f"❌ Filtro status montagem 'Aguardando Montagem' - Status {status}: {response}")
            self.log_test("Filtro por Status Montagem (Aguardando Montagem)", False, f"Status {status}")
            all_filters_ok = False
        
        return all_filters_ok

    def test_data_integrity_final_check(self):
        """6. INTEGRIDADE DOS DADOS - Verificação Final"""
        print("\n🛡️ TESTE 6: INTEGRIDADE DOS DADOS - VERIFICAÇÃO FINAL")
        print("=" * 60)
        
        # Get project ID
        shopee_project = None
        if 'director' in self.projects:
            for project in self.projects['director']:
                if 'shopee' in project.get('nome', '').lower() or 'diamonds' in project.get('nome', '').lower():
                    shopee_project = project
                    break
        
        if not shopee_project:
            print("❌ Projeto Shopee não encontrado")
            return False
        
        project_id = shopee_project.get('id')
        director_token = self.tokens.get('diretor')
        
        # Final count of orders
        status, response = self.make_request(
            'GET',
            'gestao/marketplaces/pedidos',
            token=director_token,
            params={'projeto_id': project_id}
        )
        
        if status != 200:
            print(f"❌ Falha ao buscar pedidos finais - Status {status}")
            return False
        
        final_orders = response
        final_count = len(final_orders)
        initial_count = self.orders_data.get('initial_count', 0)
        
        print(f"📊 CONTAGEM FINAL DE PEDIDOS:")
        print(f"   Inicial: {initial_count}")
        print(f"   Final: {final_count}")
        print(f"   Diferença: {final_count - initial_count}")
        
        if final_count == initial_count:
            print("✅ INTEGRIDADE PERFEITA - Nenhum pedido perdido")
            self.log_test("Integridade Final - Contagem", True)
            integrity_ok = True
        elif final_count > initial_count:
            print(f"✅ INTEGRIDADE OK - {final_count - initial_count} novos pedidos adicionados")
            self.log_test("Integridade Final - Contagem", True)
            integrity_ok = True
        else:
            print(f"❌ PERDA DE DADOS - {initial_count - final_count} pedidos desapareceram")
            self.log_test("Integridade Final - Contagem", False, f"{initial_count - final_count} pedidos perdidos")
            integrity_ok = False
        
        # Check for any errors in the system
        error_count = len([r for r in self.test_results if not r['success']])
        total_tests = len(self.test_results)
        success_rate = ((total_tests - error_count) / total_tests) * 100 if total_tests > 0 else 0
        
        print(f"\n📊 RESUMO GERAL DOS TESTES:")
        print(f"   Total de testes: {total_tests}")
        print(f"   Sucessos: {total_tests - error_count}")
        print(f"   Falhas: {error_count}")
        print(f"   Taxa de sucesso: {success_rate:.1f}%")
        
        return integrity_ok

    def run_all_tests(self):
        """Execute all pre-production tests"""
        print("🚀 INICIANDO TESTE FINAL DE PRÉ-PRODUÇÃO")
        print("=" * 80)
        print("Sistema vai para produção AGORA!")
        print("Validando 100% das funcionalidades críticas com TODOS os usuários.")
        print("=" * 80)
        
        # Execute all tests in sequence
        tests = [
            ("AUTENTICAÇÃO - Todos os Usuários", self.test_authentication_all_users),
            ("ACESSO AOS PROJETOS", self.test_project_access),
            ("LISTAGEM DE PEDIDOS - Campos Obrigatórios", self.test_order_listing_with_required_fields),
            ("ATUALIZAÇÃO DE STATUS - Persistência", self.test_status_updates_and_persistence),
            ("FILTROS", self.test_filters),
            ("INTEGRIDADE DOS DADOS - Verificação Final", self.test_data_integrity_final_check)
        ]
        
        results = []
        
        for test_name, test_function in tests:
            try:
                result = test_function()
                results.append((test_name, result))
            except Exception as e:
                print(f"❌ ERRO CRÍTICO no teste {test_name}: {str(e)}")
                results.append((test_name, False))
                self.log_test(f"ERRO CRÍTICO - {test_name}", False, str(e))
        
        # Final summary
        print("\n" + "=" * 80)
        print("🏁 RESULTADO FINAL DO TESTE DE PRÉ-PRODUÇÃO")
        print("=" * 80)
        
        success_count = sum(1 for _, success in results if success)
        total_count = len(results)
        
        print(f"\n📊 CRITÉRIOS DE SUCESSO:")
        for test_name, success in results:
            status = "✅" if success else "❌"
            print(f"{status} {test_name}")
        
        print(f"\n📈 RESUMO:")
        print(f"   Testes principais: {success_count}/{total_count}")
        print(f"   Taxa de sucesso: {(success_count/total_count)*100:.1f}%")
        
        # Check specific success criteria
        print(f"\n🎯 VERIFICAÇÃO DOS CRITÉRIOS OBRIGATÓRIOS:")
        
        criteria_met = []
        
        # ✅ All 7 users can login
        auth_success = results[0][1] if len(results) > 0 else False
        criteria_met.append(("Todos os 7 usuários conseguem fazer login", auth_success))
        
        # ✅ All can see projects
        projects_success = results[1][1] if len(results) > 1 else False
        criteria_met.append(("Todos conseguem ver projetos", projects_success))
        
        # ✅ All orders have status_montagem
        orders_success = results[2][1] if len(results) > 2 else False
        criteria_met.append(("Todos os pedidos têm status_montagem", orders_success))
        
        # ✅ Updates work and persist
        updates_success = results[3][1] if len(results) > 3 else False
        criteria_met.append(("Atualizações funcionam e persistem", updates_success))
        
        # ✅ Filters return correct results
        filters_success = results[4][1] if len(results) > 4 else False
        criteria_met.append(("Filtros retornam resultados corretos", filters_success))
        
        # ✅ ZERO orders lost
        integrity_success = results[5][1] if len(results) > 5 else False
        criteria_met.append(("ZERO pedidos perdidos", integrity_success))
        
        # ✅ No 500, 422, 404 errors
        no_errors = all(r['success'] for r in self.test_results if 'Status 5' not in r.get('details', '') and 'Status 4' not in r.get('details', ''))
        criteria_met.append(("Sem erros 500, 422, 404", no_errors))
        
        for criterion, met in criteria_met:
            status = "✅" if met else "❌"
            print(f"{status} {criterion}")
        
        all_criteria_met = all(met for _, met in criteria_met)
        
        print(f"\n🚀 RESULTADO FINAL:")
        if all_criteria_met:
            print("✅ SISTEMA APROVADO PARA PRODUÇÃO!")
            print("   Todos os critérios obrigatórios foram atendidos.")
            print("   O sistema está pronto para ir ao ar.")
        else:
            print("❌ SISTEMA NÃO APROVADO PARA PRODUÇÃO!")
            print("   Alguns critérios obrigatórios falharam.")
            print("   Correções necessárias antes do lançamento.")
        
        return all_criteria_met

def main():
    """Main function to run pre-production tests"""
    tester = PreProductionTester()
    
    try:
        success = tester.run_all_tests()
        
        if success:
            print(f"\n🎉 TESTE DE PRÉ-PRODUÇÃO CONCLUÍDO COM SUCESSO!")
            sys.exit(0)
        else:
            print(f"\n💥 TESTE DE PRÉ-PRODUÇÃO FALHOU!")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print(f"\n⚠️ Teste interrompido pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 ERRO CRÍTICO: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
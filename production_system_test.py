import requests
import sys
import json
import os
import tempfile
import pandas as pd
from datetime import datetime, timedelta
import io

class ProductionSystemTester:
    def __init__(self, base_url="https://factory-mgmt-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data storage
        self.created_items = {
            'projects': [],
            'users': [],
            'orders': []
        }

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

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        # Don't set Content-Type for file uploads
        if not files and 'Content-Type' not in test_headers:
            test_headers['Content-Type'] = 'application/json'

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files, headers=test_headers)
                else:
                    response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            if success:
                self.log_test(name, True)
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}: {response_data}")

            return success, response_data

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_authentication_and_permissions(self):
        """Test authentication with director and production sector users"""
        print("\n🔐 Testing Authentication and Permissions...")
        
        # Test 1: Login with director user
        print("\n📋 Test 1: Director Login")
        success_director, director_response = self.run_test(
            "Director Login (diretor/123)",
            "POST",
            "auth/login",
            200,
            data={
                "username": "diretor",
                "password": "123"
            }
        )
        
        director_token = None
        if success_director and 'token' in director_response:
            director_token = director_response['token']
            director_user = director_response.get('user', {})
            
            # Verify director role
            if director_user.get('role') == 'director':
                print("✅ Director role verified correctly")
                self.log_test("Director Role Verification", True)
            else:
                print(f"❌ Director role incorrect: {director_user.get('role')}")
                self.log_test("Director Role Verification", False, f"Role: {director_user.get('role')}")
        
        # Test 2: Login with production sector users
        production_sectors = [
            ("espelho", "Espelho sector"),
            ("molduras-vidro", "Molduras com Vidro sector"),
            ("molduras", "Molduras sector"),
            ("impressao", "Impressão sector"),
            ("expedicao", "Expedição sector"),
            ("embalagem", "Embalagem sector")
        ]
        
        production_tokens = {}
        for username, description in production_sectors:
            print(f"\n📋 Test: {description} Login")
            success_prod, prod_response = self.run_test(
                f"Production Login ({username}/123)",
                "POST",
                "auth/login",
                200,
                data={
                    "username": username,
                    "password": "123"
                }
            )
            
            if success_prod and 'token' in prod_response:
                production_tokens[username] = prod_response['token']
                prod_user = prod_response.get('user', {})
                
                # Verify production role
                if prod_user.get('role') == 'production':
                    print(f"✅ {description} role verified correctly")
                    self.log_test(f"{description} Role Verification", True)
                else:
                    print(f"❌ {description} role incorrect: {prod_user.get('role')}")
                    self.log_test(f"{description} Role Verification", False, f"Role: {prod_user.get('role')}")
        
        # Set director token for subsequent tests
        if director_token:
            self.token = director_token
            self.user_data = director_response.get('user', {})
            return True
        else:
            print("❌ Failed to authenticate as director - cannot proceed")
            return False

    def test_shopee_import(self):
        """Test Shopee project creation and spreadsheet import"""
        print("\n🛍️ Testing Shopee Import...")
        
        # Step 1: Create Shopee project
        print("\n📋 Step 1: Creating Shopee project")
        shopee_project_data = {
            "nome": "Projeto Shopee Teste",
            "plataforma": "Shopee",
            "descricao": "Projeto de teste para importação Shopee",
            "loja_id": "fabrica"
        }
        
        success_project, project_response = self.run_test(
            "Create Shopee Project",
            "POST",
            "gestao/marketplaces/projetos",
            200,
            data=shopee_project_data
        )
        
        if not success_project or 'id' not in project_response:
            print("❌ Failed to create Shopee project")
            return False
        
        project_id = project_response['id']
        self.created_items['projects'].append(project_id)
        print(f"✅ Shopee project created with ID: {project_id}")
        
        # Step 2: Create test Shopee spreadsheet
        print("\n📋 Step 2: Creating test Shopee spreadsheet")
        shopee_data = [
            {
                'ID do pedido': '251023TEST001',
                'Número de referência SKU': 'Moldura Preta,33X45 cm',
                'Nome da variação': 'Moldura Preta 33x45cm',
                'Quantidade': 2,
                'Preço acordado': 139.00,
                'Taxa de comissão': 25.02,
                'Taxa de serviço': 10.26,
                'Opção de envio': 'Shopee Xpress',
                'Data prevista de envio': '2024-01-15'
            },
            {
                'ID do pedido': '251023TEST002',
                'Número de referência SKU': 'KIT-PD-40x60-PERSONALIZADO',
                'Nome da variação': 'Kit Impressão Personalizado',
                'Quantidade': 1,
                'Preço acordado': 89.90,
                'Taxa de comissão': 16.18,
                'Taxa de serviço': 6.63,
                'Opção de envio': 'Shopee Entrega Direta',
                'Data prevista de envio': '2024-01-16'
            },
            {
                'ID do pedido': '251023TEST003',
                'Número de referência SKU': 'ESPELHO-REDONDO-60CM',
                'Nome da variação': 'Espelho Redondo 60cm',
                'Quantidade': 1,
                'Preço acordado': 199.90,
                'Taxa de comissão': 35.98,
                'Taxa de serviço': 14.79,
                'Opção de envio': 'Retirada pelo Comprador',
                'Data prevista de envio': '2024-01-17'
            },
            {
                'ID do pedido': '251023TEST004',
                'Número de referência SKU': 'MF-BRANCA-50x70-CV',
                'Nome da variação': 'Moldura com Vidro Branca',
                'Quantidade': 1,
                'Preço acordado': 159.90,
                'Taxa de comissão': 28.78,
                'Taxa de serviço': 11.81,
                'Opção de envio': 'Shopee Xpress',
                'Data prevista de envio': '2024-01-18'
            }
        ]
        
        # Create Excel file in memory
        excel_buffer = io.BytesIO()
        df = pd.DataFrame(shopee_data)
        df.to_excel(excel_buffer, index=False, engine='openpyxl')
        excel_buffer.seek(0)
        
        # Step 3: Upload spreadsheet
        print("\n📋 Step 3: Uploading Shopee spreadsheet")
        files = {
            'file': ('shopee_test.xlsx', excel_buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        }
        
        upload_data = {
            'projeto_id': project_id,
            'formato': 'shopee'
        }
        
        success_upload, upload_response = self.run_test(
            "Upload Shopee Spreadsheet",
            "POST",
            "gestao/marketplaces/pedidos/upload-planilha",
            200,
            data=upload_data,
            files=files
        )
        
        if not success_upload:
            print("❌ Failed to upload Shopee spreadsheet")
            return False
        
        # Step 4: Verify import results
        print("\n📋 Step 4: Verifying Shopee import results")
        
        # Check import summary
        total_imported = upload_response.get('total_importados', 0)
        if total_imported == 4:
            print(f"✅ Correct number of orders imported: {total_imported}")
            self.log_test("Shopee Import Count", True)
        else:
            print(f"❌ Expected 4 orders, got {total_imported}")
            self.log_test("Shopee Import Count", False, f"Expected 4, got {total_imported}")
        
        # Step 5: Verify orders in database
        print("\n📋 Step 5: Verifying orders in database")
        success_get, orders_response = self.run_test(
            "Get Shopee Orders",
            "GET",
            f"gestao/marketplaces/pedidos?projeto_id={project_id}",
            200
        )
        
        if success_get and isinstance(orders_response, list):
            print(f"✅ Retrieved {len(orders_response)} orders from database")
            
            # Verify specific order details
            validation_results = []
            
            for order in orders_response:
                # Test sector detection
                sku = order.get('sku', '')
                status_producao = order.get('status_producao', '')
                
                if 'Moldura Preta,33X45 cm' in sku:
                    expected_sector = 'Molduras'
                elif 'PD' in sku:
                    expected_sector = 'Impressão'
                elif 'ESPELHO' in sku:
                    expected_sector = 'Espelho'
                elif any(x in sku for x in ['MF', 'MD', 'CX', 'CV']):
                    expected_sector = 'Molduras com Vidro'
                else:
                    expected_sector = 'Personalizado'
                
                if status_producao == expected_sector:
                    print(f"✅ SKU '{sku}' correctly detected as '{expected_sector}'")
                    validation_results.append(True)
                else:
                    print(f"❌ SKU '{sku}' detected as '{status_producao}', expected '{expected_sector}'")
                    validation_results.append(False)
                
                # Test shipping type detection
                opcao_envio = order.get('opcao_envio', '')
                tipo_envio = order.get('tipo_envio', '')
                
                if opcao_envio == 'Shopee Xpress' and tipo_envio == 'Coleta':
                    print(f"✅ Shipping type correctly detected: {opcao_envio} → {tipo_envio}")
                    validation_results.append(True)
                elif opcao_envio == 'Shopee Entrega Direta' and tipo_envio == 'Flex Shopee':
                    print(f"✅ Shipping type correctly detected: {opcao_envio} → {tipo_envio}")
                    validation_results.append(True)
                elif opcao_envio == 'Retirada pelo Comprador' and tipo_envio == 'Coleta':
                    print(f"✅ Shipping type correctly detected: {opcao_envio} → {tipo_envio}")
                    validation_results.append(True)
                else:
                    print(f"❌ Shipping type incorrect: {opcao_envio} → {tipo_envio}")
                    validation_results.append(False)
                
                # Test status_logistica default
                status_logistica = order.get('status_logistica', '')
                if status_logistica == 'Aguardando':
                    print(f"✅ Default status_logistica correctly set: {status_logistica}")
                    validation_results.append(True)
                else:
                    print(f"❌ status_logistica incorrect: {status_logistica}, expected 'Aguardando'")
                    validation_results.append(False)
            
            # Overall validation
            if all(validation_results):
                print("✅ All Shopee import validations passed!")
                self.log_test("Shopee Import Validation", True)
                return True
            else:
                failed_count = len([r for r in validation_results if not r])
                print(f"❌ Shopee import validation failed: {failed_count} issues")
                self.log_test("Shopee Import Validation", False, f"{failed_count} validation issues")
                return False
        else:
            print("❌ Failed to retrieve orders from database")
            return False

    def test_mercado_livre_import(self):
        """Test Mercado Livre project creation and spreadsheet import"""
        print("\n🛒 Testing Mercado Livre Import...")
        
        # Step 1: Create Mercado Livre project
        print("\n📋 Step 1: Creating Mercado Livre project")
        ml_project_data = {
            "nome": "Projeto Mercado Livre Teste",
            "plataforma": "Mercado Livre",
            "descricao": "Projeto de teste para importação Mercado Livre",
            "loja_id": "fabrica"
        }
        
        success_project, project_response = self.run_test(
            "Create Mercado Livre Project",
            "POST",
            "gestao/marketplaces/projetos",
            200,
            data=ml_project_data
        )
        
        if not success_project or 'id' not in project_response:
            print("❌ Failed to create Mercado Livre project")
            return False
        
        project_id = project_response['id']
        self.created_items['projects'].append(project_id)
        print(f"✅ Mercado Livre project created with ID: {project_id}")
        
        # Step 2: Create test Mercado Livre spreadsheet
        print("\n📋 Step 2: Creating test Mercado Livre spreadsheet")
        
        # Create ML format spreadsheet with header at row 5 (0-indexed row 4)
        ml_data = []
        
        # Add empty rows for header positioning (ML format has header at row 5)
        for i in range(4):
            ml_data.append({})
        
        # Add header row
        ml_data.append({
            'Número do pedido': 'Número do pedido',
            'SKU': 'SKU',
            'Título': 'Título',
            'Quantidade': 'Quantidade',
            'Receita': 'Receita',
            'Tarifas': 'Tarifas',
            'Cancelamentos': 'Cancelamentos',
            'Forma de Entrega': 'Forma de Entrega'
        })
        
        # Add data rows
        test_orders = [
            {
                'Número do pedido': 'ML001TEST',
                'SKU': 'MM-MADEIRA-40x60',
                'Título': 'Moldura Madeira 40x60cm',
                'Quantidade': 1,
                'Receita': 120.00,
                'Tarifas': 12.00,
                'Cancelamentos': 0.00,
                'Forma de Entrega': 'Mercado Envios Flex'
            },
            {
                'Número do pedido': 'ML002TEST',
                'SKU': 'PD-FOTO-30x40-PREMIUM',
                'Título': 'Impressão Foto Premium 30x40',
                'Quantidade': 2,
                'Receita': 89.90,
                'Tarifas': 8.99,
                'Cancelamentos': 0.00,
                'Forma de Entrega': 'Correios e pontos de envio'
            },
            {
                'Número do pedido': 'ML003TEST',
                'SKU': 'ESPELHO-OVAL-80CM',
                'Título': 'Espelho Oval 80cm',
                'Quantidade': 1,
                'Receita': 299.90,
                'Tarifas': 29.99,
                'Cancelamentos': 0.00,
                'Forma de Entrega': 'Coleta'
            },
            {
                'Número do pedido': 'ML004TEST',
                'SKU': 'CX-VIDRO-TEMPERADO-50x70',
                'Título': 'Caixa com Vidro Temperado 50x70',
                'Quantidade': 1,
                'Receita': 199.90,
                'Tarifas': 19.99,
                'Cancelamentos': 5.00,
                'Forma de Entrega': 'Agência Mercado Livre'
            }
        ]
        
        for order in test_orders:
            ml_data.append(order)
        
        # Create Excel file in memory
        excel_buffer = io.BytesIO()
        df = pd.DataFrame(ml_data)
        df.to_excel(excel_buffer, index=False, engine='openpyxl')
        excel_buffer.seek(0)
        
        # Step 3: Upload spreadsheet
        print("\n📋 Step 3: Uploading Mercado Livre spreadsheet")
        files = {
            'file': ('ml_test.xlsx', excel_buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        }
        
        upload_data = {
            'projeto_id': project_id,
            'formato': 'mercadolivre'
        }
        
        success_upload, upload_response = self.run_test(
            "Upload Mercado Livre Spreadsheet",
            "POST",
            "gestao/marketplaces/pedidos/upload-planilha",
            200,
            data=upload_data,
            files=files
        )
        
        if not success_upload:
            print("❌ Failed to upload Mercado Livre spreadsheet")
            return False
        
        # Step 4: Verify import results
        print("\n📋 Step 4: Verifying Mercado Livre import results")
        
        # Check import summary
        total_imported = upload_response.get('total_importados', 0)
        if total_imported == 4:
            print(f"✅ Correct number of orders imported: {total_imported}")
            self.log_test("Mercado Livre Import Count", True)
        else:
            print(f"❌ Expected 4 orders, got {total_imported}")
            self.log_test("Mercado Livre Import Count", False, f"Expected 4, got {total_imported}")
        
        # Step 5: Verify orders in database
        print("\n📋 Step 5: Verifying Mercado Livre orders in database")
        success_get, orders_response = self.run_test(
            "Get Mercado Livre Orders",
            "GET",
            f"gestao/marketplaces/pedidos?projeto_id={project_id}",
            200
        )
        
        if success_get and isinstance(orders_response, list):
            print(f"✅ Retrieved {len(orders_response)} orders from database")
            
            # Verify specific order details
            validation_results = []
            
            for order in orders_response:
                # Test ML specific fields
                receita = order.get('receita')
                tarifas = order.get('tarifas')
                cancelamentos = order.get('cancelamentos')
                valor_liquido = order.get('valor_liquido')
                
                if receita is not None and tarifas is not None and cancelamentos is not None:
                    print(f"✅ ML specific fields present: Receita={receita}, Tarifas={tarifas}, Cancelamentos={cancelamentos}")
                    validation_results.append(True)
                    
                    # Test net value calculation
                    expected_liquido = receita - tarifas - cancelamentos
                    if abs(valor_liquido - expected_liquido) < 0.01:
                        print(f"✅ Net value correctly calculated: {valor_liquido}")
                        validation_results.append(True)
                    else:
                        print(f"❌ Net value incorrect: {valor_liquido}, expected {expected_liquido}")
                        validation_results.append(False)
                else:
                    print(f"❌ ML specific fields missing")
                    validation_results.append(False)
                
                # Test sector detection
                sku = order.get('sku', '')
                status_producao = order.get('status_producao', '')
                
                if 'MM' in sku:
                    expected_sector = 'Molduras'
                elif 'PD' in sku:
                    expected_sector = 'Impressão'
                elif 'ESPELHO' in sku:
                    expected_sector = 'Espelho'
                elif any(x in sku for x in ['CX', 'CV']):
                    expected_sector = 'Molduras com Vidro'
                else:
                    expected_sector = 'Personalizado'
                
                if status_producao == expected_sector:
                    print(f"✅ SKU '{sku}' correctly detected as '{expected_sector}'")
                    validation_results.append(True)
                else:
                    print(f"❌ SKU '{sku}' detected as '{status_producao}', expected '{expected_sector}'")
                    validation_results.append(False)
                
                # Test status_logistica default
                status_logistica = order.get('status_logistica', '')
                if status_logistica == 'Aguardando':
                    print(f"✅ Default status_logistica correctly set: {status_logistica}")
                    validation_results.append(True)
                else:
                    print(f"❌ status_logistica incorrect: {status_logistica}, expected 'Aguardando'")
                    validation_results.append(False)
            
            # Overall validation
            if all(validation_results):
                print("✅ All Mercado Livre import validations passed!")
                self.log_test("Mercado Livre Import Validation", True)
                return True
            else:
                failed_count = len([r for r in validation_results if not r])
                print(f"❌ Mercado Livre import validation failed: {failed_count} issues")
                self.log_test("Mercado Livre Import Validation", False, f"{failed_count} validation issues")
                return False
        else:
            print("❌ Failed to retrieve Mercado Livre orders from database")
            return False

    def test_order_endpoints(self):
        """Test order management endpoints"""
        print("\n📦 Testing Order Endpoints...")
        
        # First, ensure we have a project with orders
        if not self.created_items['projects']:
            print("❌ No projects available for testing - running Shopee import first")
            if not self.test_shopee_import():
                return False
        
        project_id = self.created_items['projects'][0]
        
        # Step 1: Test GET orders with filters
        print("\n📋 Step 1: Testing GET orders endpoint")
        success_get, orders_response = self.run_test(
            "GET Orders by Project",
            "GET",
            f"gestao/marketplaces/pedidos?projeto_id={project_id}",
            200
        )
        
        if not success_get or not isinstance(orders_response, list) or len(orders_response) == 0:
            print("❌ No orders found for testing")
            return False
        
        print(f"✅ Retrieved {len(orders_response)} orders")
        
        # Test filters
        success_filter, filtered_response = self.run_test(
            "GET Orders with Status Filter",
            "GET",
            f"gestao/marketplaces/pedidos?projeto_id={project_id}&status_producao=Molduras",
            200
        )
        
        if success_filter:
            molduras_count = len([o for o in filtered_response if o.get('status_producao') == 'Molduras'])
            print(f"✅ Filter working: {molduras_count} Molduras orders found")
            self.log_test("Order Filtering", True)
        
        # Step 2: Test PUT order updates
        print("\n📋 Step 2: Testing PUT order updates")
        test_order = orders_response[0]
        order_id = test_order.get('id')
        
        if not order_id:
            print("❌ No order ID found for testing")
            return False
        
        # Test status_producao update
        update_data = {
            "status_producao": "Em montagem"
        }
        
        success_update1, update_response1 = self.run_test(
            "Update Order Status Producao",
            "PUT",
            f"gestao/marketplaces/pedidos/{order_id}",
            200,
            data=update_data
        )
        
        if success_update1:
            print("✅ status_producao updated successfully")
            self.log_test("Update Status Producao", True)
        
        # Test status_logistica update
        update_data2 = {
            "status_logistica": "Em produção"
        }
        
        success_update2, update_response2 = self.run_test(
            "Update Order Status Logistica",
            "PUT",
            f"gestao/marketplaces/pedidos/{order_id}",
            200,
            data=update_data2
        )
        
        if success_update2:
            print("✅ status_logistica updated successfully")
            self.log_test("Update Status Logistica", True)
        
        # Test general status update
        update_data3 = {
            "status": "Processando"
        }
        
        success_update3, update_response3 = self.run_test(
            "Update Order General Status",
            "PUT",
            f"gestao/marketplaces/pedidos/{order_id}",
            200,
            data=update_data3
        )
        
        if success_update3:
            print("✅ General status updated successfully")
            self.log_test("Update General Status", True)
        
        # Step 3: Verify updates were saved
        print("\n📋 Step 3: Verifying updates were saved")
        success_verify, verify_response = self.run_test(
            "Verify Order Updates",
            "GET",
            f"gestao/marketplaces/pedidos/{order_id}",
            200
        )
        
        if success_verify:
            updated_order = verify_response
            
            # Check if updates were saved
            validation_results = []
            
            if updated_order.get('status_producao') == 'Em montagem':
                print("✅ status_producao update verified")
                validation_results.append(True)
            else:
                print(f"❌ status_producao not updated: {updated_order.get('status_producao')}")
                validation_results.append(False)
            
            if updated_order.get('status_logistica') == 'Em produção':
                print("✅ status_logistica update verified")
                validation_results.append(True)
            else:
                print(f"❌ status_logistica not updated: {updated_order.get('status_logistica')}")
                validation_results.append(False)
            
            if updated_order.get('status') == 'Processando':
                print("✅ General status update verified")
                validation_results.append(True)
            else:
                print(f"❌ General status not updated: {updated_order.get('status')}")
                validation_results.append(False)
            
            if all(validation_results):
                print("✅ All order updates verified successfully!")
                self.log_test("Order Updates Verification", True)
                return True
            else:
                print("❌ Some order updates were not saved")
                self.log_test("Order Updates Verification", False, "Updates not saved")
                return False
        else:
            print("❌ Failed to verify order updates")
            return False

    def test_sku_rules(self):
        """Test SKU sector detection rules"""
        print("\n🏷️ Testing SKU Rules...")
        
        # Test cases for SKU detection
        test_cases = [
            ("Moldura Preta,33X45 cm", "Molduras"),
            ("KIT-PD-40x60-PERSONALIZADO", "Impressão"),
            ("ESPELHO-REDONDO-60CM", "Espelho"),
            ("MF-BRANCA-50x70-CV", "Molduras com Vidro"),
            ("MD-DOURADA-40x60", "Molduras com Vidro"),
            ("CX-VIDRO-30x40", "Molduras com Vidro"),
            ("CV-PREMIUM-50x70", "Molduras com Vidro"),
            ("MM-MADEIRA-60x80", "Molduras"),
            ("PRODUTO-GENERICO", "Personalizado")
        ]
        
        # Create a test project for SKU testing
        print("\n📋 Creating test project for SKU rules")
        sku_project_data = {
            "nome": "Projeto Teste SKU",
            "plataforma": "Shopee",
            "descricao": "Projeto para testar regras de SKU",
            "loja_id": "fabrica"
        }
        
        success_project, project_response = self.run_test(
            "Create SKU Test Project",
            "POST",
            "gestao/marketplaces/projetos",
            200,
            data=sku_project_data
        )
        
        if not success_project or 'id' not in project_response:
            print("❌ Failed to create SKU test project")
            return False
        
        project_id = project_response['id']
        self.created_items['projects'].append(project_id)
        
        # Create test spreadsheet with all SKU cases
        print("\n📋 Creating test spreadsheet with SKU cases")
        sku_data = []
        
        for i, (sku, expected_sector) in enumerate(test_cases):
            sku_data.append({
                'ID do pedido': f'SKU_TEST_{i+1:03d}',
                'Número de referência SKU': sku,
                'Nome da variação': f'Produto {sku}',
                'Quantidade': 1,
                'Preço acordado': 100.00,
                'Taxa de comissão': 10.00,
                'Taxa de serviço': 5.00,
                'Opção de envio': 'Shopee Xpress',
                'Data prevista de envio': '2024-01-15'
            })
        
        # Create Excel file
        excel_buffer = io.BytesIO()
        df = pd.DataFrame(sku_data)
        df.to_excel(excel_buffer, index=False, engine='openpyxl')
        excel_buffer.seek(0)
        
        # Upload spreadsheet
        print("\n📋 Uploading SKU test spreadsheet")
        files = {
            'file': ('sku_test.xlsx', excel_buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        }
        
        upload_data = {
            'projeto_id': project_id,
            'formato': 'shopee'
        }
        
        success_upload, upload_response = self.run_test(
            "Upload SKU Test Spreadsheet",
            "POST",
            "gestao/marketplaces/pedidos/upload-planilha",
            200,
            data=upload_data,
            files=files
        )
        
        if not success_upload:
            print("❌ Failed to upload SKU test spreadsheet")
            return False
        
        # Verify SKU detection results
        print("\n📋 Verifying SKU detection results")
        success_get, orders_response = self.run_test(
            "Get SKU Test Orders",
            "GET",
            f"gestao/marketplaces/pedidos?projeto_id={project_id}",
            200
        )
        
        if not success_get or not isinstance(orders_response, list):
            print("❌ Failed to retrieve SKU test orders")
            return False
        
        # Validate each SKU detection
        validation_results = []
        
        for order in orders_response:
            sku = order.get('sku', '')
            detected_sector = order.get('status_producao', '')
            
            # Find expected sector for this SKU
            expected_sector = None
            for test_sku, test_sector in test_cases:
                if test_sku == sku:
                    expected_sector = test_sector
                    break
            
            if expected_sector:
                if detected_sector == expected_sector:
                    print(f"✅ SKU '{sku}' correctly detected as '{expected_sector}'")
                    validation_results.append(True)
                    self.log_test(f"SKU Detection - {sku}", True)
                else:
                    print(f"❌ SKU '{sku}' detected as '{detected_sector}', expected '{expected_sector}'")
                    validation_results.append(False)
                    self.log_test(f"SKU Detection - {sku}", False, f"Expected {expected_sector}, got {detected_sector}")
            else:
                print(f"⚠️ SKU '{sku}' not found in test cases")
        
        # Overall SKU rules validation
        if all(validation_results):
            print("✅ All SKU detection rules working correctly!")
            self.log_test("SKU Rules - Overall", True)
            return True
        else:
            failed_count = len([r for r in validation_results if not r])
            print(f"❌ SKU detection failed: {failed_count}/{len(validation_results)} cases")
            self.log_test("SKU Rules - Overall", False, f"{failed_count} detection failures")
            return False

    def run_all_tests(self):
        """Run all production system tests"""
        print("🚀 Starting Production System Tests...")
        print("=" * 60)
        
        test_results = []
        
        # Test 1: Authentication and Permissions
        print("\n" + "=" * 60)
        result1 = self.test_authentication_and_permissions()
        test_results.append(("Authentication and Permissions", result1))
        
        if not result1:
            print("❌ Authentication failed - cannot proceed with other tests")
            return False
        
        # Test 2: Shopee Import
        print("\n" + "=" * 60)
        result2 = self.test_shopee_import()
        test_results.append(("Shopee Import", result2))
        
        # Test 3: Mercado Livre Import
        print("\n" + "=" * 60)
        result3 = self.test_mercado_livre_import()
        test_results.append(("Mercado Livre Import", result3))
        
        # Test 4: Order Endpoints
        print("\n" + "=" * 60)
        result4 = self.test_order_endpoints()
        test_results.append(("Order Endpoints", result4))
        
        # Test 5: SKU Rules
        print("\n" + "=" * 60)
        result5 = self.test_sku_rules()
        test_results.append(("SKU Rules", result5))
        
        # Final Summary
        print("\n" + "=" * 60)
        print("🏁 PRODUCTION SYSTEM TEST SUMMARY")
        print("=" * 60)
        
        passed_tests = 0
        total_tests = len(test_results)
        
        for test_name, result in test_results:
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{status} - {test_name}")
            if result:
                passed_tests += 1
        
        print(f"\nOverall Result: {passed_tests}/{total_tests} tests passed")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Detailed test statistics
        print(f"\nDetailed Statistics:")
        print(f"Total API calls: {self.tests_run}")
        print(f"Successful API calls: {self.tests_passed}")
        print(f"API Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        return passed_tests == total_tests

if __name__ == "__main__":
    tester = ProductionSystemTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 ALL PRODUCTION SYSTEM TESTS PASSED!")
        sys.exit(0)
    else:
        print("\n💥 SOME PRODUCTION SYSTEM TESTS FAILED!")
        sys.exit(1)
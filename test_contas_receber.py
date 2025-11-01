#!/usr/bin/env python3

import requests
import sys
import json
import math
from datetime import datetime, timedelta

class ContasReceberTester:
    def __init__(self, base_url="https://marcos-marketplace.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

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

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
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

    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication...")
        
        # Test user registration
        test_username = f"testuser_{datetime.now().strftime('%H%M%S')}"
        test_password = "TestPass123!"
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "username": test_username,
                "password": test_password,
                "role": "manager"
            }
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_data = response['user']
            return True
        else:
            print("❌ Authentication setup failed - cannot proceed with other tests")
            return False

    def test_contas_receber_complete_flow(self):
        """Test complete Contas a Receber module as requested by user"""
        print("\n💰 TESTING COMPLETE CONTAS A RECEBER MODULE...")
        print("🔄 Testing full flow: Setup → Automation → Filters → Settlement → Security → CRUD")
        
        # Store test data for cross-phase usage
        test_data = {}
        
        # PHASE 1: PREPARATION (Create necessary data)
        print("\n📋 PHASE 1: PREPARATION - Creating necessary data...")
        
        # 1. Login already done in authentication
        print("✅ 1. Login completed")
        
        # 2. Create bank account
        print("\n📋 2. Creating bank account...")
        conta_bancaria_data = {
            "nome": "Itaú Fábrica",
            "tipo": "Corrente", 
            "banco": "Itaú",
            "agencia": "1234",
            "conta": "12345-6",
            "saldo_inicial": 10000.0,
            "saldo_atual": 10000.0,
            "cnpj_titular": "Líder Molduras Brasil Ltda",
            "status": "Ativo",
            "loja_id": "fabrica"
        }
        
        success_banco, banco_response = self.run_test(
            "Create Bank Account for Contas Receber",
            "POST",
            "gestao/financeiro/contas-bancarias",
            200,
            data=conta_bancaria_data
        )
        
        if not success_banco or 'id' not in banco_response:
            print("❌ CRITICAL: Failed to create bank account - cannot proceed")
            self.log_test("Contas Receber Complete Flow", False, "Failed to create bank account")
            return False
        
        test_data['conta_bancaria_id'] = banco_response['id']
        print(f"✅ Bank account created with ID: {test_data['conta_bancaria_id']}")
        
        # 3. Create payment method for this account
        print("\n📋 3. Creating payment method...")
        forma_pagamento_data = {
            "forma_pagamento": "Cartão Crédito 3x",
            "tipo": "C",
            "tef": False,
            "pagamento_sefaz": False,
            "bandeira": "Visa",
            "numero_parcelas": 3,
            "espaco_parcelas_dias": 30,
            "taxa_banco_percentual": 2.5,
            "ativa": True
        }
        
        success_forma, forma_response = self.run_test(
            "Create Payment Method for Contas Receber",
            "POST",
            f"gestao/financeiro/contas-bancarias/{test_data['conta_bancaria_id']}/formas-pagamento",
            200,
            data=forma_pagamento_data
        )
        
        if not success_forma or 'id' not in forma_response:
            print("❌ CRITICAL: Failed to create payment method - cannot proceed")
            self.log_test("Contas Receber Complete Flow", False, "Failed to create payment method")
            return False
        
        test_data['forma_pagamento_id'] = forma_response['id']
        print(f"✅ Payment method created with ID: {test_data['forma_pagamento_id']}")
        
        # 4. Create client
        print("\n📋 4. Creating client...")
        cliente_data = {
            "loja_id": "fabrica",
            "nome": "Cliente Teste Receita",
            "cpf": "12345678900",
            "telefone": "(11) 98765-4321",
            "endereco": "Rua Teste, 123",
            "cidade": "São Paulo"
        }
        
        success_cliente, cliente_response = self.run_test(
            "Create Client for Contas Receber",
            "POST",
            "gestao/clientes",
            200,
            data=cliente_data
        )
        
        if not success_cliente or 'id' not in cliente_response:
            print("❌ CRITICAL: Failed to create client - cannot proceed")
            self.log_test("Contas Receber Complete Flow", False, "Failed to create client")
            return False
        
        test_data['cliente_id'] = cliente_response['id']
        print(f"✅ Client created with ID: {test_data['cliente_id']}")
        
        # 5. Create manufacturing order
        print("\n📋 5. Creating manufacturing order...")
        pedido_data = {
            "loja_id": "fabrica",
            "cliente_id": test_data['cliente_id'],
            "cliente_nome": "Cliente Teste Receita",
            "tipo_produto": "Quadro",
            "altura": 50,
            "largura": 70,
            "quantidade": 1,
            "valor_final": 300.0,
            "valor_bruto": 300.0,
            "valor_liquido_empresa": 292.5,  # 300 - 2.5% taxa
            "taxa_percentual": 2.5,
            "forma_pagamento_id": test_data['forma_pagamento_id'],
            "forma_pagamento_nome": "Cartão Crédito 3x",
            "conta_bancaria_id": test_data['conta_bancaria_id'],
            "conta_bancaria_nome": "Itaú Fábrica"
        }
        
        success_pedido, pedido_response = self.run_test(
            "Create Manufacturing Order for Contas Receber",
            "POST",
            "gestao/pedidos",
            200,
            data=pedido_data
        )
        
        if not success_pedido or 'id' not in pedido_response:
            print("❌ CRITICAL: Failed to create manufacturing order - cannot proceed")
            self.log_test("Contas Receber Complete Flow", False, "Failed to create manufacturing order")
            return False
        
        test_data['pedido_id'] = pedido_response['id']
        print(f"✅ Manufacturing order created with ID: {test_data['pedido_id']}")
        
        # PHASE 2: TEST AUTOMATION OF CONTAS A RECEBER CREATION
        print("\n📋 PHASE 2: TESTING AUTOMATION - Creating Contas a Receber...")
        
        # 6. Change order status to "Montagem" to trigger automation
        print("\n📋 6. Changing order status to 'Montagem'...")
        success_status, status_response = self.run_test(
            "Change Order Status to Montagem",
            "PUT",
            f"gestao/pedidos/{test_data['pedido_id']}/status?novo_status=Montagem&observacao=Teste automação",
            200
        )
        
        if not success_status:
            print("❌ CRITICAL: Failed to change order status - cannot test automation")
            self.log_test("Contas Receber Automation", False, "Failed to change order status")
            return False
        
        print("✅ Order status changed to 'Montagem'")
        
        # 7. Verify Contas a Receber were created automatically
        print("\n📋 7. Verifying automatic creation of Contas a Receber...")
        success_list, list_response = self.run_test(
            "List Contas Receber After Automation",
            "GET",
            f"gestao/financeiro/contas-receber?loja=fabrica",
            200
        )
        
        if not success_list:
            print("❌ CRITICAL: Failed to list Contas a Receber")
            self.log_test("Contas Receber Automation Verification", False, "Failed to list accounts")
            return False
        
        # 8. Validate automation results
        print("\n📋 8. Validating automation results...")
        automation_valid = self.validate_contas_receber_automation(list_response, test_data)
        
        if not automation_valid:
            print("❌ CRITICAL: Automation validation failed")
            self.log_test("Contas Receber Automation Validation", False, "Automation validation failed")
            return False
        
        # Store created accounts for later phases
        if 'contas' in list_response and len(list_response['contas']) > 0:
            test_data['contas_receber'] = list_response['contas']
            print(f"✅ Found {len(test_data['contas_receber'])} automatically created accounts")
        
        # PHASE 3: TEST LISTING FILTERS
        print("\n📋 PHASE 3: TESTING LISTING FILTERS...")
        self.test_contas_receber_filters(test_data)
        
        # PHASE 4: TEST ACCOUNT SETTLEMENT
        print("\n📋 PHASE 4: TESTING ACCOUNT SETTLEMENT...")
        self.test_contas_receber_settlement(test_data)
        
        # PHASE 5: TEST SECURITY VALIDATIONS
        print("\n📋 PHASE 5: TESTING SECURITY VALIDATIONS...")
        self.test_contas_receber_security(test_data)
        
        # PHASE 6: TEST MANUAL CRUD
        print("\n📋 PHASE 6: TESTING MANUAL CRUD...")
        self.test_contas_receber_manual_crud(test_data)
        
        print("\n✅ CONTAS A RECEBER COMPLETE FLOW TESTING FINISHED!")
        return True
    
    def validate_contas_receber_automation(self, response, test_data):
        """Validate that Contas a Receber were created correctly by automation"""
        print("\n🔍 Validating Contas a Receber automation results...")
        
        if 'contas' not in response:
            print("❌ No 'contas' field in response")
            return False
        
        contas = response['contas']
        
        # Should have 3 accounts (3 installments)
        if len(contas) != 3:
            print(f"❌ Expected 3 accounts, found {len(contas)}")
            return False
        
        print("✅ Correct number of accounts created (3)")
        
        # Validate each account
        validation_results = []
        
        for i, conta in enumerate(contas, 1):
            print(f"\n📋 Validating account {i}/3...")
            
            # Check pedido_id
            if conta.get('pedido_id') == test_data['pedido_id']:
                print(f"✅ Account {i}: Correct pedido_id")
                validation_results.append(True)
            else:
                print(f"❌ Account {i}: Wrong pedido_id")
                validation_results.append(False)
            
            # Check cliente_origem
            if conta.get('cliente_origem') == "Cliente Teste Receita":
                print(f"✅ Account {i}: Correct cliente_origem")
                validation_results.append(True)
            else:
                print(f"❌ Account {i}: Wrong cliente_origem")
                validation_results.append(False)
            
            # Check parcela numbers
            expected_parcela = i
            if conta.get('numero_parcela') == expected_parcela and conta.get('total_parcelas') == 3:
                print(f"✅ Account {i}: Correct parcela {expected_parcela}/3")
                validation_results.append(True)
            else:
                print(f"❌ Account {i}: Wrong parcela info")
                validation_results.append(False)
            
            # Check values (should be 300/3 = 100 bruto, ~97.5 liquido)
            valor_bruto = conta.get('valor_bruto', 0)
            valor_liquido = conta.get('valor_liquido', 0)
            
            if abs(valor_bruto - 100.0) < 0.1:  # Allow small tolerance
                print(f"✅ Account {i}: Correct valor_bruto (R${valor_bruto:.2f})")
                validation_results.append(True)
            else:
                print(f"❌ Account {i}: Wrong valor_bruto (R${valor_bruto:.2f})")
                validation_results.append(False)
            
            if abs(valor_liquido - 97.5) < 0.1:  # 100 - 2.5% = 97.5
                print(f"✅ Account {i}: Correct valor_liquido (R${valor_liquido:.2f})")
                validation_results.append(True)
            else:
                print(f"❌ Account {i}: Wrong valor_liquido (R${valor_liquido:.2f})")
                validation_results.append(False)
            
            # Check status
            if conta.get('status') == 'Pendente':
                print(f"✅ Account {i}: Correct status (Pendente)")
                validation_results.append(True)
            else:
                print(f"❌ Account {i}: Wrong status")
                validation_results.append(False)
            
            # Check forma_pagamento and conta_bancaria
            if conta.get('forma_pagamento_id') == test_data['forma_pagamento_id']:
                print(f"✅ Account {i}: Correct forma_pagamento_id")
                validation_results.append(True)
            else:
                print(f"❌ Account {i}: Wrong forma_pagamento_id")
                validation_results.append(False)
            
            if conta.get('conta_bancaria_id') == test_data['conta_bancaria_id']:
                print(f"✅ Account {i}: Correct conta_bancaria_id")
                validation_results.append(True)
            else:
                print(f"❌ Account {i}: Wrong conta_bancaria_id")
                validation_results.append(False)
        
        # Check totals in response
        if 'totais' in response:
            totais = response['totais']
            expected_bruto = 300.0
            expected_liquido = 292.5
            
            if abs(totais.get('valor_bruto', 0) - expected_bruto) < 0.1:
                print(f"✅ Correct total valor_bruto (R${totais.get('valor_bruto', 0):.2f})")
                validation_results.append(True)
            else:
                print(f"❌ Wrong total valor_bruto")
                validation_results.append(False)
            
            if abs(totais.get('valor_liquido', 0) - expected_liquido) < 0.1:
                print(f"✅ Correct total valor_liquido (R${totais.get('valor_liquido', 0):.2f})")
                validation_results.append(True)
            else:
                print(f"❌ Wrong total valor_liquido")
                validation_results.append(False)
        
        all_valid = all(validation_results)
        
        if all_valid:
            print("✅ ALL AUTOMATION VALIDATIONS PASSED!")
            self.log_test("Contas Receber Automation - All Validations", True)
        else:
            failed_count = len([r for r in validation_results if not r])
            print(f"❌ AUTOMATION VALIDATION FAILED: {failed_count}/{len(validation_results)} checks failed")
            self.log_test("Contas Receber Automation - All Validations", False, f"{failed_count} validation checks failed")
        
        return all_valid
    
    def test_contas_receber_filters(self, test_data):
        """Test listing filters for Contas a Receber"""
        print("\n🔍 Testing Contas a Receber filters...")
        
        # Test filter by status
        self.run_test(
            "Filter by Status (Pendente)",
            "GET",
            "gestao/financeiro/contas-receber?status=Pendente",
            200
        )
        
        # Test filter by cliente
        self.run_test(
            "Filter by Cliente",
            "GET",
            "gestao/financeiro/contas-receber?cliente=Teste Receita",
            200
        )
        
        # Test filter by forma_pagamento
        self.run_test(
            "Filter by Forma Pagamento",
            "GET",
            "gestao/financeiro/contas-receber?forma_pagamento=Crédito",
            200
        )
        
        # Test filter by conta_bancaria
        if 'conta_bancaria_id' in test_data:
            self.run_test(
                "Filter by Conta Bancaria",
                "GET",
                f"gestao/financeiro/contas-receber?conta_bancaria={test_data['conta_bancaria_id']}",
                200
            )
        
        # Test filter by date range
        from datetime import datetime, timedelta
        hoje = datetime.now()
        inicio = hoje.strftime('%Y-%m-%d')
        fim = (hoje + timedelta(days=90)).strftime('%Y-%m-%d')
        
        self.run_test(
            "Filter by Date Range",
            "GET",
            f"gestao/financeiro/contas-receber?data_venc_inicio={inicio}&data_venc_fim={fim}",
            200
        )
        
        print("✅ Filter tests completed")
    
    def test_contas_receber_settlement(self, test_data):
        """Test account settlement (baixa) functionality"""
        print("\n💳 Testing Contas a Receber settlement...")
        
        if 'contas_receber' not in test_data or len(test_data['contas_receber']) == 0:
            print("❌ No accounts available for settlement test")
            return False
        
        # Select first account for settlement
        conta_para_baixa = test_data['contas_receber'][0]
        conta_id = conta_para_baixa['id']
        
        print(f"📋 Testing settlement for account ID: {conta_id}")
        
        # Get current bank balance before settlement
        if 'conta_bancaria_id' in test_data:
            success_saldo, saldo_response = self.run_test(
                "Get Bank Balance Before Settlement",
                "GET",
                f"gestao/financeiro/contas-bancarias/{test_data['conta_bancaria_id']}",
                200
            )
            
            if success_saldo:
                saldo_anterior = saldo_response.get('saldo_atual', 0)
                print(f"📊 Bank balance before settlement: R${saldo_anterior:.2f}")
                test_data['saldo_anterior'] = saldo_anterior
        
        # Perform settlement
        baixa_data = {
            "data_baixa": "2025-01-15",
            "valor_recebido": 97.5,
            "observacoes": "Recebimento teste via cartão"
        }
        
        success_baixa, baixa_response = self.run_test(
            "Perform Account Settlement",
            "POST",
            f"gestao/financeiro/contas-receber/{conta_id}/baixa",
            200,
            data=baixa_data
        )
        
        if not success_baixa:
            print("❌ Settlement failed")
            return False
        
        # Validate settlement response
        if 'conta' in baixa_response:
            conta_baixada = baixa_response['conta']
            
            # Check status changed to "Recebido"
            if conta_baixada.get('status') == 'Recebido':
                print("✅ Status changed to 'Recebido'")
                self.log_test("Settlement - Status Update", True)
            else:
                print("❌ Status not updated correctly")
                self.log_test("Settlement - Status Update", False, "Status not 'Recebido'")
            
            # Check dates are filled
            if conta_baixada.get('data_recebimento') and conta_baixada.get('data_pago_loja'):
                print("✅ Settlement dates filled")
                self.log_test("Settlement - Dates Update", True)
            else:
                print("❌ Settlement dates not filled")
                self.log_test("Settlement - Dates Update", False, "Missing settlement dates")
        
        # Verify bank balance was updated
        if 'conta_bancaria_id' in test_data and 'saldo_anterior' in test_data:
            success_saldo_novo, saldo_novo_response = self.run_test(
                "Get Bank Balance After Settlement",
                "GET",
                f"gestao/financeiro/contas-bancarias/{test_data['conta_bancaria_id']}",
                200
            )
            
            if success_saldo_novo:
                saldo_novo = saldo_novo_response.get('saldo_atual', 0)
                saldo_esperado = test_data['saldo_anterior'] + 97.5
                
                print(f"📊 Bank balance after settlement: R${saldo_novo:.2f}")
                print(f"📊 Expected balance: R${saldo_esperado:.2f}")
                
                if abs(saldo_novo - saldo_esperado) < 0.1:
                    print("✅ Bank balance updated correctly")
                    self.log_test("Settlement - Bank Balance Update", True)
                else:
                    print("❌ Bank balance not updated correctly")
                    self.log_test("Settlement - Bank Balance Update", False, "Balance mismatch")
        
        # Verify financial movement was created
        success_mov, mov_response = self.run_test(
            "Check Financial Movements",
            "GET",
            f"gestao/financeiro/movimentacoes?conta_bancaria_id={test_data['conta_bancaria_id']}",
            200
        )
        
        if success_mov and isinstance(mov_response, list) and len(mov_response) > 0:
            print("✅ Financial movement created")
            self.log_test("Settlement - Financial Movement", True)
        else:
            print("❌ Financial movement not created")
            self.log_test("Settlement - Financial Movement", False, "No movement found")
        
        # Store settled account for security tests
        test_data['conta_baixada_id'] = conta_id
        
        return True
    
    def test_contas_receber_security(self, test_data):
        """Test security validations for Contas a Receber"""
        print("\n🔒 Testing Contas a Receber security validations...")
        
        # Test duplicate settlement (should fail)
        if 'conta_baixada_id' in test_data:
            baixa_data = {
                "data_baixa": "2025-01-15",
                "valor_recebido": 97.5,
                "observacoes": "Tentativa de baixa duplicada"
            }
            
            success_dup, dup_response = self.run_test(
                "Try Duplicate Settlement (Should Fail)",
                "POST",
                f"gestao/financeiro/contas-receber/{test_data['conta_baixada_id']}/baixa",
                200,  # Should return 200 but with message about already settled
                data=baixa_data
            )
            
            if success_dup and 'message' in dup_response:
                if 'já foi baixada' in dup_response['message']:
                    print("✅ Duplicate settlement properly prevented")
                    self.log_test("Security - Duplicate Settlement Prevention", True)
                else:
                    print("❌ Duplicate settlement not properly handled")
                    self.log_test("Security - Duplicate Settlement Prevention", False, "Wrong message")
            else:
                print("❌ Duplicate settlement test failed")
                self.log_test("Security - Duplicate Settlement Prevention", False, "Test failed")
        
        # Test invalid account ID
        success_invalid, invalid_response = self.run_test(
            "Try Invalid Account ID (Should Fail)",
            "GET",
            "gestao/financeiro/contas-receber/invalid-id-12345",
            404  # Should return 404
        )
        
        if success_invalid:
            print("✅ Invalid account ID properly handled")
            self.log_test("Security - Invalid Account ID", True)
        else:
            print("❌ Invalid account ID not properly handled")
            self.log_test("Security - Invalid Account ID", False, "Should return 404")
    
    def test_contas_receber_manual_crud(self, test_data):
        """Test manual CRUD operations for Contas a Receber"""
        print("\n📝 Testing manual CRUD operations...")
        
        # CREATE - Manual account
        manual_conta_data = {
            "documento": "MANUAL-001",
            "cliente_origem": "Cliente Manual Teste",
            "loja_id": "fabrica",
            "vendedor": "Vendedor Teste",
            "valor_bruto": 150.0,
            "valor_liquido": 150.0,
            "valor": 150.0,
            "forma_pagamento_nome": "PIX",
            "conta_bancaria_id": test_data.get('conta_bancaria_id', ''),
            "conta_bancaria_nome": "Itaú Fábrica",
            "taxa_percentual": 0.0,
            "numero_parcela": 1,
            "total_parcelas": 1,
            "categoria_nome": "Venda Manual",
            "status": "Pendente",
            "descricao": "Conta manual para teste CRUD",
            "observacoes": "Teste de criação manual"
        }
        
        success_create, create_response = self.run_test(
            "Create Manual Conta Receber",
            "POST",
            "gestao/financeiro/contas-receber",
            200,
            data=manual_conta_data
        )
        
        if not success_create or 'id' not in create_response:
            print("❌ Failed to create manual account")
            return False
        
        manual_conta_id = create_response['id']
        print(f"✅ Manual account created with ID: {manual_conta_id}")
        
        # UPDATE - Edit the manual account
        update_data = manual_conta_data.copy()
        update_data['valor_bruto'] = 200.0
        update_data['valor_liquido'] = 200.0
        update_data['valor'] = 200.0
        update_data['observacoes'] = "Conta atualizada via teste"
        
        success_update, update_response = self.run_test(
            "Update Manual Conta Receber",
            "PUT",
            f"gestao/financeiro/contas-receber/{manual_conta_id}",
            200,
            data=update_data
        )
        
        if success_update:
            print("✅ Manual account updated successfully")
            self.log_test("Manual CRUD - Update", True)
        else:
            print("❌ Failed to update manual account")
            self.log_test("Manual CRUD - Update", False, "Update failed")
        
        # DELETE - Remove the manual account
        success_delete, delete_response = self.run_test(
            "Delete Manual Conta Receber",
            "DELETE",
            f"gestao/financeiro/contas-receber/{manual_conta_id}",
            200
        )
        
        if success_delete:
            print("✅ Manual account deleted successfully")
            self.log_test("Manual CRUD - Delete", True)
        else:
            print("❌ Failed to delete manual account")
            self.log_test("Manual CRUD - Delete", False, "Delete failed")
        
        return True

    def print_final_results(self):
        """Print final test results"""
        print(f"\n📊 CONTAS A RECEBER TEST SUMMARY:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL TESTS PASSED!")
        else:
            print("❌ Some tests failed - check details above")

    def run_all_tests(self):
        """Run all Contas a Receber tests"""
        print("🚀 Starting Contas a Receber Module Tests...")
        print(f"🌐 Testing against: {self.base_url}")
        
        # Authentication is required for all other tests
        if not self.test_authentication():
            return False
        
        # Run the complete Contas a Receber flow test
        self.test_contas_receber_complete_flow()
        
        # Print final results
        self.print_final_results()
        
        return True

if __name__ == "__main__":
    tester = ContasReceberTester()
    tester.run_all_tests()
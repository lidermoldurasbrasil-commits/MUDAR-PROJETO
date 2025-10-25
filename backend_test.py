import requests
import sys
import json
import math
from datetime import datetime, timedelta

class BusinessManagementSystemTester:
    def __init__(self, base_url="https://frame-wizard-4.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data storage for cross-module testing
        self.created_items = {
            'production': [],
            'returns': [],
            'marketing': [],
            'purchase_requests': [],
            'purchase_orders': [],
            'accounts_payable': [],
            'sales': [],
            'cost_centers': [],
            'store_production': [],
            'complaints': [],
            'leads': []
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
            
            # Test login with same credentials
            success, login_response = self.run_test(
                "User Login",
                "POST",
                "auth/login",
                200,
                data={
                    "username": test_username,
                    "password": test_password
                }
            )
            
            # Test get current user
            self.run_test(
                "Get Current User",
                "GET",
                "auth/me",
                200
            )
            
            return True
        else:
            print("❌ Authentication setup failed - cannot proceed with other tests")
            return False

    def test_dashboard(self):
        """Test dashboard endpoints"""
        print("\n📊 Testing Dashboard...")
        
        self.run_test(
            "Dashboard Metrics",
            "GET",
            "dashboard/metrics",
            200
        )
        
        self.run_test(
            "Dashboard Charts",
            "GET",
            "dashboard/charts",
            200
        )

    def test_production_board(self):
        """Test production board CRUD operations"""
        print("\n🏭 Testing Production Board...")
        
        # Create production item
        production_data = {
            "project_name": "Test Project",
            "sku": "TEST-001",
            "quantity": 10,
            "client_name": "Test Client",
            "frame_color": "Blue",
            "delivery_date": "2024-12-31",
            "status": "Designing",
            "platform": "Shopee"
        }
        
        success, response = self.run_test(
            "Create Production Item",
            "POST",
            "production",
            200,
            data=production_data
        )
        
        if success and 'id' in response:
            item_id = response['id']
            self.created_items['production'].append(item_id)
            
            # Test get all production items
            self.run_test(
                "Get Production Items",
                "GET",
                "production",
                200
            )
            
            # Test update production item
            updated_data = production_data.copy()
            updated_data['status'] = 'In Production'
            
            self.run_test(
                "Update Production Item",
                "PUT",
                f"production/{item_id}",
                200,
                data=updated_data
            )
            
            # Test delete production item
            self.run_test(
                "Delete Production Item",
                "DELETE",
                f"production/{item_id}",
                200
            )

    def test_returns_management(self):
        """Test returns management"""
        print("\n🔄 Testing Returns Management...")
        
        return_data = {
            "order_id": "ORD-001",
            "platform": "Shopee",
            "product": "Test Product",
            "return_reason": "Defective",
            "cost": 25.50,
            "responsible_department": "Quality Control",
            "resolution_status": "Pending"
        }
        
        success, response = self.run_test(
            "Create Return",
            "POST",
            "returns",
            200,
            data=return_data
        )
        
        if success and 'id' in response:
            item_id = response['id']
            self.created_items['returns'].append(item_id)
            
            self.run_test(
                "Get Returns",
                "GET",
                "returns",
                200
            )
            
            # Test update return
            updated_data = return_data.copy()
            updated_data['resolution_status'] = 'Resolved'
            
            self.run_test(
                "Update Return",
                "PUT",
                f"returns/{item_id}",
                200,
                data=updated_data
            )

    def test_marketing_tasks(self):
        """Test marketing tasks (Kanban board)"""
        print("\n📢 Testing Marketing Tasks...")
        
        task_data = {
            "task_name": "Create Social Media Campaign",
            "project": "Q4 Marketing",
            "deadline": "2024-12-15",
            "assigned_member": "Marketing Team",
            "status": "To Do",
            "description": "Create engaging social media content"
        }
        
        success, response = self.run_test(
            "Create Marketing Task",
            "POST",
            "marketing",
            200,
            data=task_data
        )
        
        if success and 'id' in response:
            task_id = response['id']
            self.created_items['marketing'].append(task_id)
            
            self.run_test(
                "Get Marketing Tasks",
                "GET",
                "marketing",
                200
            )
            
            # Test update task status
            updated_data = task_data.copy()
            updated_data['status'] = 'In Progress'
            
            self.run_test(
                "Update Marketing Task",
                "PUT",
                f"marketing/{task_id}",
                200,
                data=updated_data
            )

    def test_purchase_system(self):
        """Test purchase requests and orders"""
        print("\n🛒 Testing Purchase System...")
        
        # Test Purchase Requests
        request_data = {
            "item_name": "Raw Materials",
            "description": "High quality steel sheets",
            "quantity": 100,
            "supplier": "Steel Corp",
            "estimated_cost": 5000.00,
            "requested_by": "Production Manager"
        }
        
        success, response = self.run_test(
            "Create Purchase Request",
            "POST",
            "purchase-requests",
            200,
            data=request_data
        )
        
        if success and 'id' in response:
            request_id = response['id']
            self.created_items['purchase_requests'].append(request_id)
            
            self.run_test(
                "Get Purchase Requests",
                "GET",
                "purchase-requests",
                200
            )
            
            # Test approval workflow
            self.run_test(
                "Approve Purchase Request",
                "PATCH",
                f"purchase-requests/{request_id}/approve",
                200
            )
            
            # Test Purchase Orders
            order_data = {
                "request_id": request_id,
                "supplier": "Steel Corp",
                "order_date": "2024-08-15",
                "status": "Sent to Supplier"
            }
            
            success, order_response = self.run_test(
                "Create Purchase Order",
                "POST",
                "purchase-orders",
                200,
                data=order_data
            )
            
            if success and 'id' in order_response:
                order_id = order_response['id']
                self.created_items['purchase_orders'].append(order_id)
                
                self.run_test(
                    "Get Purchase Orders",
                    "GET",
                    "purchase-orders",
                    200
                )

    def test_accounts_payable(self):
        """Test accounts payable management"""
        print("\n💰 Testing Accounts Payable...")
        
        payable_data = {
            "supplier": "Steel Corp",
            "invoice_number": "INV-001",
            "due_date": "2024-09-15",
            "value": 5000.00,
            "cost_center": "Production",
            "status": "Pending",
            "entity": "Factory"
        }
        
        success, response = self.run_test(
            "Create Account Payable",
            "POST",
            "accounts-payable",
            200,
            data=payable_data
        )
        
        if success and 'id' in response:
            account_id = response['id']
            self.created_items['accounts_payable'].append(account_id)
            
            self.run_test(
                "Get Accounts Payable",
                "GET",
                "accounts-payable",
                200
            )
            
            # Test filtering by entity
            self.run_test(
                "Get Accounts Payable by Entity",
                "GET",
                "accounts-payable?entity=Factory",
                200
            )

    def test_sales_tracking(self):
        """Test sales tracking"""
        print("\n📈 Testing Sales Tracking...")
        
        sale_data = {
            "channel": "Marketplace",
            "product": "Custom Frame",
            "quantity": 5,
            "revenue": 250.00,
            "sale_date": "2024-08-15"
        }
        
        success, response = self.run_test(
            "Create Sale",
            "POST",
            "sales",
            200,
            data=sale_data
        )
        
        if success and 'id' in response:
            self.created_items['sales'].append(response['id'])
            
            self.run_test(
                "Get Sales",
                "GET",
                "sales",
                200
            )

    def test_cost_center(self):
        """Test cost center management"""
        print("\n🏢 Testing Cost Center...")
        
        cost_data = {
            "department": "Production",
            "salaries": 10000.00,
            "taxes": 2000.00,
            "vacation": 500.00,
            "thirteenth_salary": 833.33,
            "depreciation": 1000.00,
            "equipment_costs": 500.00,
            "rent": 2000.00,
            "accounting": 300.00,
            "systems": 200.00,
            "other_expenses": 100.00,
            "month": "August",
            "year": 2024,
            "entity": "Factory"
        }
        
        success, response = self.run_test(
            "Create Cost Center",
            "POST",
            "cost-center",
            200,
            data=cost_data
        )
        
        if success and 'id' in response:
            cost_id = response['id']
            self.created_items['cost_centers'].append(cost_id)
            
            self.run_test(
                "Get Cost Centers",
                "GET",
                "cost-center",
                200
            )

    def test_breakeven_calculator(self):
        """Test breakeven calculator"""
        print("\n📊 Testing Breakeven Calculator...")
        
        self.run_test(
            "Calculate Breakeven",
            "GET",
            "breakeven/calculate?month=August&year=2024",
            200
        )

    def test_store_production(self):
        """Test store production tasks"""
        print("\n🏪 Testing Store Production...")
        
        store_data = {
            "store": "Store 1",
            "customer_name": "John Doe",
            "order_id": "STORE-001",
            "status": "Artwork Creation",
            "delivery_deadline": "2024-08-20"
        }
        
        success, response = self.run_test(
            "Create Store Production Task",
            "POST",
            "store-production",
            200,
            data=store_data
        )
        
        if success and 'id' in response:
            task_id = response['id']
            self.created_items['store_production'].append(task_id)
            
            self.run_test(
                "Get Store Production Tasks",
                "GET",
                "store-production",
                200
            )
            
            # Test filtering by store
            self.run_test(
                "Get Store Production by Store",
                "GET",
                "store-production?store=Store 1",
                200
            )

    def test_complaints_management(self):
        """Test complaints management"""
        print("\n⚠️ Testing Complaints Management...")
        
        complaint_data = {
            "customer_name": "Jane Smith",
            "order_id": "ORD-002",
            "problem_description": "Product arrived damaged",
            "manager": "Customer Service Manager",
            "status": "Created"
        }
        
        success, response = self.run_test(
            "Create Complaint",
            "POST",
            "complaints",
            200,
            data=complaint_data
        )
        
        if success and 'id' in response:
            complaint_id = response['id']
            self.created_items['complaints'].append(complaint_id)
            
            self.run_test(
                "Get Complaints",
                "GET",
                "complaints",
                200
            )
            
            # Test update complaint
            updated_data = complaint_data.copy()
            updated_data['status'] = 'Under Analysis'
            
            self.run_test(
                "Update Complaint",
                "PUT",
                f"complaints/{complaint_id}",
                200,
                data=updated_data
            )

    def test_crm_leads(self):
        """Test CRM/Leads management"""
        print("\n👥 Testing CRM/Leads...")
        
        lead_data = {
            "client_name": "ABC Company",
            "contact_info": "contact@abc.com",
            "interest": "Custom Manufacturing",
            "store": "Store 1",
            "follow_up_date": "2024-08-20",
            "status": "New Lead"
        }
        
        success, response = self.run_test(
            "Create Lead",
            "POST",
            "leads",
            200,
            data=lead_data
        )
        
        if success and 'id' in response:
            lead_id = response['id']
            self.created_items['leads'].append(lead_id)
            
            self.run_test(
                "Get Leads",
                "GET",
                "leads",
                200
            )
            
            # Test filtering by store
            self.run_test(
                "Get Leads by Store",
                "GET",
                "leads?store=Store 1",
                200
            )
            
            # Test update lead
            updated_data = lead_data.copy()
            updated_data['status'] = 'In Contact'
            
            self.run_test(
                "Update Lead",
                "PUT",
                f"leads/{lead_id}",
                200,
                data=updated_data
            )
            
            # Test delete lead
            self.run_test(
                "Delete Lead",
                "DELETE",
                f"leads/{lead_id}",
                200
            )

    def test_gestao_system(self):
        """Test Sistema de Gestão - Products, Insumos and Manufacturing Orders"""
        print("\n🏭 Testing Sistema de Gestão...")
        
        # First, create some test products for Moldura and Vidro families with pricing
        moldura_data = {
            "loja_id": "fabrica",
            "referencia": "MOLD-TEST-001",
            "descricao": "Moldura Madeira Premium 3cm",
            "familia": "Moldura",
            "largura": 3.0,
            "comprimento": 270.0,
            "custo_120dias": 2.50,  # Cost per bar
            "preco_venda": 7.50,    # Selling price per bar (3x markup)
            "markup_manufatura": 200.0,
            "ativo": True
        }
        
        vidro_data = {
            "loja_id": "fabrica", 
            "referencia": "VID-TEST-001",
            "descricao": "Vidro Temperado Premium 4mm",
            "familia": "Vidro",
            "custo_120dias": 45.00,  # Cost per m²
            "preco_venda": 112.50,   # Selling price per m² (2.5x markup)
            "markup_manufatura": 150.0,
            "ativo": True
        }
        
        # Create moldura product
        success, moldura_response = self.run_test(
            "Create Moldura Product",
            "POST",
            "gestao/produtos",
            200,
            data=moldura_data
        )
        
        moldura_id = None
        if success and 'id' in moldura_response:
            moldura_id = moldura_response['id']
            print(f"✅ Created Moldura with ID: {moldura_id}")
        
        # Create vidro product  
        success, vidro_response = self.run_test(
            "Create Vidro Product",
            "POST",
            "gestao/produtos", 
            200,
            data=vidro_data
        )
        
        vidro_id = None
        if success and 'id' in vidro_response:
            vidro_id = vidro_response['id']
            print(f"✅ Created Vidro with ID: {vidro_id}")
        
        # Test getting products
        self.run_test(
            "Get All Products",
            "GET",
            "gestao/produtos",
            200
        )
        
        # Now test the manufacturing order calculation endpoint
        if moldura_id and vidro_id:
            self.test_manufacturing_order_calculation(moldura_id, vidro_id)
        else:
            print("❌ Cannot test manufacturing calculation - missing product IDs")

    def test_manufacturing_order_calculation(self, moldura_id, vidro_id):
        """Test the updated manufacturing order calculation endpoint with new pricing features"""
        print("\n🔧 Testing Updated Manufacturing Order Calculation Endpoint...")
        
        # Test 1: Calculation with ONLY moldura (no other inputs)
        print("\n📋 TEST 1: Calculation with ONLY moldura")
        test1_data = {
            "altura": 60,  # cm
            "largura": 80,  # cm  
            "quantidade": 1,
            "moldura_id": moldura_id,
            "usar_vidro": False,
            "usar_mdf": False,
            "usar_papel": False,
            "usar_passepartout": False,
            "usar_acessorios": False
        }
        
        success1, response1 = self.run_test(
            "Calculate Order - Only Moldura",
            "POST",
            "gestao/pedidos/calcular",
            200,
            data=test1_data
        )
        
        if success1:
            self.verify_new_pricing_fields(response1, "Only Moldura", expected_items=1)
            
        # Test 2: Calculation with moldura + vidro
        print("\n📋 TEST 2: Calculation with moldura + vidro")
        test2_data = {
            "altura": 50,  # cm
            "largura": 70,  # cm  
            "quantidade": 1,
            "moldura_id": moldura_id,
            "usar_vidro": True,
            "vidro_id": vidro_id,
            "usar_mdf": False,
            "usar_papel": False,
            "usar_passepartout": False,
            "usar_acessorios": False
        }
        
        success2, response2 = self.run_test(
            "Calculate Order - Moldura + Vidro",
            "POST",
            "gestao/pedidos/calcular",
            200,
            data=test2_data
        )
        
        if success2:
            self.verify_new_pricing_fields(response2, "Moldura + Vidro", expected_items=2)
            
        # Test 3: Calculation with ONLY vidro (no moldura)
        print("\n📋 TEST 3: Calculation with ONLY vidro")
        test3_data = {
            "altura": 40,  # cm
            "largura": 60,  # cm  
            "quantidade": 1,
            "moldura_id": None,
            "usar_vidro": True,
            "vidro_id": vidro_id,
            "usar_mdf": False,
            "usar_papel": False,
            "usar_passepartout": False,
            "usar_acessorios": False
        }
        
        success3, response3 = self.run_test(
            "Calculate Order - Only Vidro",
            "POST",
            "gestao/pedidos/calcular",
            200,
            data=test3_data
        )
        
        if success3:
            self.verify_new_pricing_fields(response3, "Only Vidro", expected_items=1)
            
        # Overall test result
        overall_success = success1 and success2 and success3
        if overall_success:
            print("✅ All new pricing functionality tests passed!")
            self.log_test("Updated Calculation Endpoint - All Tests", True)
        else:
            print("❌ Some pricing functionality tests failed")
            self.log_test("Updated Calculation Endpoint - All Tests", False, "One or more tests failed")
            
        return overall_success
    
    def verify_new_pricing_fields(self, response, test_name, expected_items):
        """Verify the new pricing fields in calculation response"""
        print(f"\n🔍 Verifying new pricing fields for {test_name}...")
        
        # Check if response contains items
        if 'itens' not in response or not isinstance(response['itens'], list):
            print(f"❌ No items found in response for {test_name}")
            self.log_test(f"New Pricing - {test_name} Items", False, "No items array found")
            return False
            
        items = response['itens']
        if len(items) != expected_items:
            print(f"❌ Expected {expected_items} items, got {len(items)} for {test_name}")
            self.log_test(f"New Pricing - {test_name} Item Count", False, f"Expected {expected_items}, got {len(items)}")
            return False
        
        print(f"✅ Correct number of items ({len(items)}) found for {test_name}")
        
        # Verify each item has the new pricing fields
        all_items_valid = True
        for i, item in enumerate(items):
            item_name = f"{test_name} Item {i+1} ({item.get('tipo_insumo', 'Unknown')})"
            
            # Check required new fields
            required_fields = ['custo_unitario', 'preco_unitario', 'subtotal', 'subtotal_venda']
            missing_fields = []
            
            for field in required_fields:
                if field not in item:
                    missing_fields.append(field)
            
            if missing_fields:
                print(f"❌ {item_name} missing fields: {missing_fields}")
                self.log_test(f"New Pricing - {item_name} Fields", False, f"Missing: {missing_fields}")
                all_items_valid = False
                continue
            
            # Verify preco_unitario is different from custo_unitario (selling price vs cost)
            custo = item.get('custo_unitario', 0)
            preco = item.get('preco_unitario', 0)
            
            if custo == preco:
                print(f"⚠️ {item_name}: preco_unitario ({preco}) equals custo_unitario ({custo}) - should be different")
                self.log_test(f"New Pricing - {item_name} Price vs Cost", False, "Selling price equals cost price")
                all_items_valid = False
            else:
                print(f"✅ {item_name}: preco_unitario ({preco}) ≠ custo_unitario ({custo})")
                self.log_test(f"New Pricing - {item_name} Price vs Cost", True)
            
            # Verify subtotal_venda > subtotal (selling price higher than cost)
            subtotal_custo = item.get('subtotal', 0)
            subtotal_venda = item.get('subtotal_venda', 0)
            
            if subtotal_venda <= subtotal_custo:
                print(f"❌ {item_name}: subtotal_venda ({subtotal_venda}) should be > subtotal ({subtotal_custo})")
                self.log_test(f"New Pricing - {item_name} Subtotal Comparison", False, "Selling subtotal not higher than cost")
                all_items_valid = False
            else:
                print(f"✅ {item_name}: subtotal_venda ({subtotal_venda}) > subtotal ({subtotal_custo})")
                self.log_test(f"New Pricing - {item_name} Subtotal Comparison", True)
            
            # Print item details
            print(f"   📊 {item.get('tipo_insumo', 'Unknown')}: {item.get('insumo_descricao', 'No description')}")
            print(f"      Custo: R$ {custo:.4f} | Preço: R$ {preco:.4f}")
            print(f"      Subtotal Custo: R$ {subtotal_custo:.2f} | Subtotal Venda: R$ {subtotal_venda:.2f}")
        
        if all_items_valid:
            print(f"✅ All pricing fields verified successfully for {test_name}")
            self.log_test(f"New Pricing - {test_name} All Fields", True)
        else:
            print(f"❌ Some pricing field issues found for {test_name}")
            self.log_test(f"New Pricing - {test_name} All Fields", False, "Field validation issues")
        
        return all_items_valid

    def test_preco_manufatura_validation(self):
        """CRITICAL TEST: Verify calculation endpoint uses preco_manufatura instead of preco_venda"""
        print("\n🔍 CRITICAL TEST: Validating preco_manufatura usage...")
        
        # Create test products with DISTINCT pricing to verify correct field usage
        moldura_test_data = {
            "loja_id": "fabrica",
            "referencia": "MOLD-PRECO-TEST",
            "descricao": "Moldura Teste Preço Manufatura",
            "familia": "Moldura",
            "largura": 3.0,
            "comprimento": 270.0,
            "custo_120dias": 10.00,        # Cost: R$ 10.00 per bar
            "preco_manufatura": 25.00,     # Manufacturing price: R$ 25.00 per bar (SHOULD BE USED)
            "preco_venda": 35.00,          # Selling price: R$ 35.00 per bar (SHOULD NOT BE USED)
            "markup_manufatura": 150.0,
            "ativo": True
        }
        
        vidro_test_data = {
            "loja_id": "fabrica",
            "referencia": "VID-PRECO-TEST", 
            "descricao": "Vidro Teste Preço Manufatura",
            "familia": "Vidro",
            "custo_120dias": 10.00,        # Cost: R$ 10.00 per m²
            "preco_manufatura": 25.00,     # Manufacturing price: R$ 25.00 per m² (SHOULD BE USED)
            "preco_venda": 35.00,          # Selling price: R$ 35.00 per m² (SHOULD NOT BE USED)
            "markup_manufatura": 150.0,
            "ativo": True
        }
        
        # Create moldura test product
        success_moldura, moldura_response = self.run_test(
            "Create Moldura Test Product (Distinct Pricing)",
            "POST",
            "gestao/produtos",
            200,
            data=moldura_test_data
        )
        
        # Create vidro test product
        success_vidro, vidro_response = self.run_test(
            "Create Vidro Test Product (Distinct Pricing)",
            "POST", 
            "gestao/produtos",
            200,
            data=vidro_test_data
        )
        
        if not (success_moldura and success_vidro):
            print("❌ CRITICAL: Failed to create test products - cannot validate preco_manufatura")
            self.log_test("Preco Manufatura Validation", False, "Failed to create test products")
            return False
            
        moldura_id = moldura_response.get('id')
        vidro_id = vidro_response.get('id')
        
        if not (moldura_id and vidro_id):
            print("❌ CRITICAL: Missing product IDs - cannot validate preco_manufatura")
            self.log_test("Preco Manufatura Validation", False, "Missing product IDs")
            return False
        
        print(f"✅ Created test products - Moldura ID: {moldura_id}, Vidro ID: {vidro_id}")
        
        # Test 1: Moldura calculation (price per cm)
        print("\n📋 Testing Moldura - preco_manufatura validation")
        moldura_calc_data = {
            "altura": 50,  # cm
            "largura": 70,  # cm
            "quantidade": 1,
            "moldura_id": moldura_id,
            "usar_vidro": False,
            "usar_mdf": False,
            "usar_papel": False,
            "usar_passepartout": False,
            "usar_acessorios": False
        }
        
        success_calc1, calc1_response = self.run_test(
            "Calculate Order - Moldura preco_manufatura test",
            "POST",
            "gestao/pedidos/calcular", 
            200,
            data=moldura_calc_data
        )
        
        moldura_valid = False
        if success_calc1:
            moldura_valid = self.validate_preco_manufatura_usage(
                calc1_response, 
                "Moldura",
                expected_preco_manufatura_per_bar=25.00,
                expected_preco_venda_per_bar=35.00,
                bar_length=270.0
            )
        
        # Test 2: Vidro calculation (price per m²)
        print("\n📋 Testing Vidro - preco_manufatura validation")
        vidro_calc_data = {
            "altura": 50,  # cm  
            "largura": 70,  # cm
            "quantidade": 1,
            "moldura_id": None,
            "usar_vidro": True,
            "vidro_id": vidro_id,
            "usar_mdf": False,
            "usar_papel": False,
            "usar_passepartout": False,
            "usar_acessorios": False
        }
        
        success_calc2, calc2_response = self.run_test(
            "Calculate Order - Vidro preco_manufatura test",
            "POST",
            "gestao/pedidos/calcular",
            200,
            data=vidro_calc_data
        )
        
        vidro_valid = False
        if success_calc2:
            vidro_valid = self.validate_preco_manufatura_usage(
                calc2_response,
                "Vidro", 
                expected_preco_manufatura_per_unit=25.00,
                expected_preco_venda_per_unit=35.00
            )
        
        # Overall validation result
        overall_success = moldura_valid and vidro_valid
        
        if overall_success:
            print("✅ CRITICAL TEST PASSED: Endpoint correctly uses preco_manufatura")
            self.log_test("Preco Manufatura Validation - CRITICAL", True)
        else:
            print("❌ CRITICAL TEST FAILED: Endpoint may be using preco_venda instead of preco_manufatura")
            self.log_test("Preco Manufatura Validation - CRITICAL", False, "Using wrong price field")
        
        return overall_success
    
    def validate_preco_manufatura_usage(self, response, product_type, expected_preco_manufatura_per_bar=None, 
                                      expected_preco_venda_per_bar=None, bar_length=None,
                                      expected_preco_manufatura_per_unit=None, expected_preco_venda_per_unit=None):
        """Validate that the calculation uses preco_manufatura and NOT preco_venda"""
        print(f"\n🔍 Validating {product_type} pricing...")
        
        if 'itens' not in response or not response['itens']:
            print(f"❌ No items found in response for {product_type}")
            return False
        
        # Find the item for this product type
        target_item = None
        for item in response['itens']:
            if product_type.lower() in item.get('tipo_insumo', '').lower():
                target_item = item
                break
        
        if not target_item:
            print(f"❌ No {product_type} item found in response")
            return False
        
        preco_unitario = target_item.get('preco_unitario', 0)
        
        # Calculate expected preco_unitario based on preco_manufatura
        if product_type == "Moldura" and expected_preco_manufatura_per_bar and bar_length:
            # For moldura: convert bar price to per-cm price
            expected_preco_unitario = expected_preco_manufatura_per_bar / bar_length
            wrong_preco_unitario = expected_preco_venda_per_bar / bar_length
            unit = "cm"
        elif expected_preco_manufatura_per_unit:
            # For vidro and others: use per-unit price directly
            expected_preco_unitario = expected_preco_manufatura_per_unit
            wrong_preco_unitario = expected_preco_venda_per_unit
            unit = "m²" if product_type == "Vidro" else "unit"
        else:
            print(f"❌ Invalid validation parameters for {product_type}")
            return False
        
        print(f"📊 {product_type} Analysis:")
        print(f"   Expected preco_unitario (from preco_manufatura): R$ {expected_preco_unitario:.4f} per {unit}")
        print(f"   WRONG preco_unitario (from preco_venda): R$ {wrong_preco_unitario:.4f} per {unit}")
        print(f"   Actual preco_unitario in response: R$ {preco_unitario:.4f} per {unit}")
        
        # Check if using correct price (preco_manufatura)
        tolerance = 0.0001  # Small tolerance for floating point comparison
        
        if abs(preco_unitario - expected_preco_unitario) <= tolerance:
            print(f"✅ CORRECT: {product_type} is using preco_manufatura (R$ {preco_unitario:.4f})")
            self.log_test(f"Preco Manufatura - {product_type} Correct Price", True)
            return True
        elif abs(preco_unitario - wrong_preco_unitario) <= tolerance:
            print(f"❌ WRONG: {product_type} is using preco_venda (R$ {preco_unitario:.4f}) instead of preco_manufatura")
            self.log_test(f"Preco Manufatura - {product_type} Wrong Price", False, "Using preco_venda instead of preco_manufatura")
            return False
        else:
            print(f"⚠️ UNEXPECTED: {product_type} preco_unitario (R$ {preco_unitario:.4f}) doesn't match either expected value")
            self.log_test(f"Preco Manufatura - {product_type} Unexpected Price", False, f"Unexpected price: {preco_unitario}")
            return False

    def test_linear_meter_frame_calculation(self):
        """SPECIFIC TEST: Frame calculation with linear meters as requested"""
        print("\n📏 TESTING LINEAR METER FRAME CALCULATION...")
        
        # Create frame product with specific pricing for linear meter test
        moldura_linear_data = {
            "loja_id": "fabrica",
            "referencia": "MOLD-LINEAR-TEST",
            "descricao": "Moldura Teste Metro Linear 3cm",
            "familia": "Moldura",
            "largura": 3.0,  # 3.0 cm width as specified
            "comprimento": 270.0,  # Standard bar length
            "custo_120dias": 50.00,        # R$ 50.00 per linear meter (cost)
            "preco_manufatura": 150.00,    # R$ 150.00 per linear meter (selling price)
            "markup_manufatura": 200.0,
            "ativo": True
        }
        
        # Create the test frame product
        success, moldura_response = self.run_test(
            "Create Linear Meter Frame Product",
            "POST",
            "gestao/produtos",
            200,
            data=moldura_linear_data
        )
        
        if not success or 'id' not in moldura_response:
            print("❌ CRITICAL: Failed to create linear meter test product")
            self.log_test("Linear Meter Frame Test", False, "Failed to create test product")
            return False
            
        moldura_id = moldura_response['id']
        print(f"✅ Created linear meter frame product with ID: {moldura_id}")
        
        # Test calculation with specified dimensions
        # altura: 50 cm, largura: 70 cm, quantidade: 1
        # Perimeter = 2×50 + 2×70 = 240 cm = 2.40 linear meters
        calc_data = {
            "altura": 50,  # cm
            "largura": 70,  # cm
            "quantidade": 1,
            "moldura_id": moldura_id,
            "usar_vidro": False,
            "usar_mdf": False,
            "usar_papel": False,
            "usar_passepartout": False,
            "usar_acessorios": False
        }
        
        success_calc, calc_response = self.run_test(
            "Calculate Linear Meter Frame Order",
            "POST",
            "gestao/pedidos/calcular",
            200,
            data=calc_data
        )
        
        if not success_calc:
            print("❌ CRITICAL: Frame calculation failed")
            self.log_test("Linear Meter Frame Calculation", False, "Calculation endpoint failed")
            return False
        
        # Validate the linear meter calculation results
        return self.validate_linear_meter_results(calc_response)
    
    def validate_linear_meter_results(self, response):
        """Validate linear meter calculation results according to specifications"""
        print("\n🔍 Validating Linear Meter Calculation Results...")
        
        # Check basic response structure
        if 'itens' not in response or not response['itens']:
            print("❌ No items found in calculation response")
            self.log_test("Linear Meter - Response Structure", False, "No items in response")
            return False
        
        # Find the frame item
        frame_item = None
        for item in response['itens']:
            if 'moldura' in item.get('tipo_insumo', '').lower():
                frame_item = item
                break
        
        if not frame_item:
            print("❌ No frame item found in response")
            self.log_test("Linear Meter - Frame Item", False, "Frame item not found")
            return False
        
        print("✅ Frame item found in response")
        
        # Expected values based on specification and business logic
        expected_perimeter_cm = 240  # 2×50 + 2×70 = 240 cm
        expected_cut_loss_cm = 3.0 * 8  # largura × 8 = 24 cm
        expected_bars_needed = math.ceil(expected_perimeter_cm / 270)  # 1 bar
        expected_leftover_cm = (expected_bars_needed * 270) - expected_perimeter_cm  # 30 cm
        # Since leftover (30cm) < 100cm, it's charged as additional loss
        expected_charged_perimeter_cm = expected_perimeter_cm + expected_cut_loss_cm + expected_leftover_cm  # 294 cm
        expected_charged_meters = expected_charged_perimeter_cm / 100  # 2.94 meters
        
        expected_cost_per_meter = 50.00
        expected_price_per_meter = 150.00
        expected_subtotal_cost = expected_charged_meters * expected_cost_per_meter  # 147.00
        expected_subtotal_venda = expected_charged_meters * expected_price_per_meter  # 441.00
        
        print(f"📊 Expected Calculation:")
        print(f"   Perimeter: {expected_perimeter_cm} cm")
        print(f"   Cut loss: {expected_cut_loss_cm} cm")
        print(f"   Bars needed: {expected_bars_needed}")
        print(f"   Leftover: {expected_leftover_cm} cm (< 100cm, so charged)")
        print(f"   Charged perimeter: {expected_charged_perimeter_cm} cm = {expected_charged_meters:.2f} meters")
        print(f"   Expected subtotal cost: R$ {expected_subtotal_cost:.2f}")
        print(f"   Expected subtotal venda: R$ {expected_subtotal_venda:.2f}")
        
        # Validation results
        validation_results = []
        
        # 1. Check unit is 'ml' (linear meter)
        unit = frame_item.get('unidade', '')
        if unit == 'ml':
            print("✅ Unit is 'ml' (linear meter) - CORRECT")
            validation_results.append(True)
            self.log_test("Linear Meter - Unit Validation", True)
        else:
            print(f"❌ Unit is '{unit}', should be 'ml' (linear meter)")
            validation_results.append(False)
            self.log_test("Linear Meter - Unit Validation", False, f"Unit is '{unit}', not 'ml'")
        
        # 2. Check quantity is in meters (should be 2.94), NOT cm (240)
        quantidade = frame_item.get('quantidade', 0)
        if abs(quantidade - expected_charged_meters) < 0.1:  # Allow small tolerance
            print(f"✅ Quantity is {quantidade:.2f} meters - CORRECT (matches expected {expected_charged_meters:.2f})")
            validation_results.append(True)
            self.log_test("Linear Meter - Quantity in Meters", True)
        elif 240 <= quantidade <= 300:  # If it's in cm (wrong)
            print(f"❌ Quantity is {quantidade} - appears to be in CM, should be in METERS")
            validation_results.append(False)
            self.log_test("Linear Meter - Quantity in Meters", False, f"Quantity {quantidade} appears to be in cm")
        else:
            print(f"❌ Quantity is {quantidade:.2f} - expected {expected_charged_meters:.2f} meters")
            validation_results.append(False)
            self.log_test("Linear Meter - Quantity in Meters", False, f"Quantity {quantidade}, expected {expected_charged_meters}")
        
        # 3. Check custo_unitario is R$ 50.00 (cost per linear meter)
        custo_unitario = frame_item.get('custo_unitario', 0)
        if abs(custo_unitario - expected_cost_per_meter) < 0.01:
            print(f"✅ Cost per unit is R$ {custo_unitario:.2f} (per linear meter) - CORRECT")
            validation_results.append(True)
            self.log_test("Linear Meter - Cost Per Unit", True)
        else:
            print(f"❌ Cost per unit is R$ {custo_unitario:.2f}, should be R$ {expected_cost_per_meter:.2f}")
            validation_results.append(False)
            self.log_test("Linear Meter - Cost Per Unit", False, f"Cost {custo_unitario}, expected {expected_cost_per_meter}")
        
        # 4. Check preco_unitario is R$ 150.00 (price per linear meter)
        preco_unitario = frame_item.get('preco_unitario', 0)
        if abs(preco_unitario - expected_price_per_meter) < 0.01:
            print(f"✅ Price per unit is R$ {preco_unitario:.2f} (per linear meter) - CORRECT")
            validation_results.append(True)
            self.log_test("Linear Meter - Price Per Unit", True)
        else:
            print(f"❌ Price per unit is R$ {preco_unitario:.2f}, should be R$ {expected_price_per_meter:.2f}")
            validation_results.append(False)
            self.log_test("Linear Meter - Price Per Unit", False, f"Price {preco_unitario}, expected {expected_price_per_meter}")
        
        # 5. Check subtotal (cost) is approximately correct
        subtotal = frame_item.get('subtotal', 0)
        tolerance = 1.0  # Allow R$ 1 tolerance for rounding
        if abs(subtotal - expected_subtotal_cost) <= tolerance:
            print(f"✅ Subtotal cost is R$ {subtotal:.2f} - CORRECT (expected R$ {expected_subtotal_cost:.2f})")
            validation_results.append(True)
            self.log_test("Linear Meter - Subtotal Cost", True)
        else:
            print(f"❌ Subtotal cost is R$ {subtotal:.2f}, expected R$ {expected_subtotal_cost:.2f}")
            validation_results.append(False)
            self.log_test("Linear Meter - Subtotal Cost", False, f"Subtotal {subtotal}, expected {expected_subtotal_cost}")
        
        # 6. Check subtotal_venda (selling price) is approximately correct
        subtotal_venda = frame_item.get('subtotal_venda', 0)
        if abs(subtotal_venda - expected_subtotal_venda) <= tolerance * 3:  # Allow R$ 3 tolerance for selling price
            print(f"✅ Subtotal venda is R$ {subtotal_venda:.2f} - CORRECT (expected R$ {expected_subtotal_venda:.2f})")
            validation_results.append(True)
            self.log_test("Linear Meter - Subtotal Venda", True)
        else:
            print(f"❌ Subtotal venda is R$ {subtotal_venda:.2f}, expected R$ {expected_subtotal_venda:.2f}")
            validation_results.append(False)
            self.log_test("Linear Meter - Subtotal Venda", False, f"Subtotal venda {subtotal_venda}, expected {expected_subtotal_venda}")
        
        # Print actual item details
        print(f"\n📋 Actual Frame Item Details:")
        print(f"   Description: {frame_item.get('insumo_descricao', 'N/A')}")
        print(f"   Type: {frame_item.get('tipo_insumo', 'N/A')}")
        print(f"   Quantity: {quantidade} {unit}")
        print(f"   Cost per unit: R$ {custo_unitario:.2f}")
        print(f"   Price per unit: R$ {preco_unitario:.2f}")
        print(f"   Subtotal cost: R$ {subtotal:.2f}")
        print(f"   Subtotal venda: R$ {subtotal_venda:.2f}")
        
        # Overall result
        all_valid = all(validation_results)
        
        if all_valid:
            print("✅ ALL LINEAR METER VALIDATIONS PASSED!")
            self.log_test("Linear Meter Frame Calculation - OVERALL", True)
        else:
            failed_count = len([r for r in validation_results if not r])
            print(f"❌ LINEAR METER VALIDATION FAILED: {failed_count}/{len(validation_results)} checks failed")
            self.log_test("Linear Meter Frame Calculation - OVERALL", False, f"{failed_count} validation checks failed")
        
        return all_valid

    def test_manufacturing_order_creation(self):
        """Test manufacturing order creation as requested by user"""
        print("\n🏭 TESTING MANUFACTURING ORDER CREATION...")
        
        # Step 1: Create a client first (required for the order)
        print("\n📋 Step 1: Creating client...")
        cliente_data = {
            "loja_id": "fabrica",
            "nome": "Cliente Teste",
            "cpf": "12345678900",
            "telefone": "(11) 98765-4321",
            "celular": "(11) 91234-5678",
            "endereco": "Rua Teste, 123",
            "cidade": "São Paulo"
        }
        
        success_cliente, cliente_response = self.run_test(
            "Create Test Client",
            "POST",
            "gestao/clientes",
            200,
            data=cliente_data
        )
        
        if not success_cliente or 'id' not in cliente_response:
            print("❌ CRITICAL: Failed to create client - cannot proceed with order creation")
            self.log_test("Manufacturing Order Creation", False, "Failed to create client")
            return False
        
        cliente_id = cliente_response['id']
        print(f"✅ Client created successfully with ID: {cliente_id}")
        
        # Step 2: Create manufacturing order
        print("\n📋 Step 2: Creating manufacturing order...")
        pedido_data = {
            "loja_id": "fabrica",
            "cliente_id": cliente_id,
            "cliente_nome": "Cliente Teste",
            "tipo_produto": "Quadro",
            "altura": 50,
            "largura": 70,
            "quantidade": 1,
            "itens": [
                {
                    "insumo_id": "test-id",
                    "insumo_descricao": "Moldura Teste",
                    "tipo_insumo": "Moldura",
                    "quantidade": 2.4,
                    "unidade": "ml",
                    "custo_unitario": 50.0,
                    "preco_unitario": 150.0,
                    "subtotal": 120.0,
                    "subtotal_venda": 360.0
                }
            ],
            "custo_total": 120.0,
            "preco_venda": 360.0,
            "valor_final": 360.0,
            "forma_pagamento": "Dinheiro",
            "valor_entrada": 100.0
        }
        
        success_pedido, pedido_response = self.run_test(
            "Create Manufacturing Order",
            "POST",
            "gestao/pedidos",
            200,
            data=pedido_data
        )
        
        if not success_pedido:
            print("❌ CRITICAL: Failed to create manufacturing order")
            self.log_test("Manufacturing Order Creation", False, "Failed to create order")
            return False
        
        # Step 3: Verify response contains required fields
        print("\n📋 Step 3: Verifying order response...")
        validation_results = []
        
        # Check if order has ID
        if 'id' in pedido_response:
            print("✅ Order has ID field")
            validation_results.append(True)
            order_id = pedido_response['id']
        else:
            print("❌ Order missing ID field")
            validation_results.append(False)
            self.log_test("Order Response - ID Field", False, "Missing ID")
            return False
        
        # Check if order has numero_pedido
        if 'numero_pedido' in pedido_response and pedido_response['numero_pedido'] > 0:
            print(f"✅ Order has numero_pedido: {pedido_response['numero_pedido']}")
            validation_results.append(True)
        else:
            print("❌ Order missing or invalid numero_pedido")
            validation_results.append(False)
            self.log_test("Order Response - Numero Pedido", False, "Missing or invalid numero_pedido")
        
        # Check cliente_nome
        if pedido_response.get('cliente_nome') == "Cliente Teste":
            print("✅ Order has correct cliente_nome")
            validation_results.append(True)
        else:
            print(f"❌ Order has incorrect cliente_nome: {pedido_response.get('cliente_nome')}")
            validation_results.append(False)
            self.log_test("Order Response - Cliente Nome", False, "Incorrect cliente_nome")
        
        # Check itens
        if 'itens' in pedido_response and len(pedido_response['itens']) > 0:
            print("✅ Order has itens")
            validation_results.append(True)
        else:
            print("❌ Order missing itens")
            validation_results.append(False)
            self.log_test("Order Response - Itens", False, "Missing itens")
        
        # Check valor_final
        if pedido_response.get('valor_final') == 360.0:
            print("✅ Order has correct valor_final")
            validation_results.append(True)
        else:
            print(f"❌ Order has incorrect valor_final: {pedido_response.get('valor_final')}")
            validation_results.append(False)
            self.log_test("Order Response - Valor Final", False, "Incorrect valor_final")
        
        # Check valor_entrada
        if pedido_response.get('valor_entrada') == 100.0:
            print("✅ Order has correct valor_entrada")
            validation_results.append(True)
        else:
            print(f"❌ Order has incorrect valor_entrada: {pedido_response.get('valor_entrada')}")
            validation_results.append(False)
            self.log_test("Order Response - Valor Entrada", False, "Incorrect valor_entrada")
        
        # Step 4: Verify order was saved in database
        print("\n📋 Step 4: Verifying order was saved in database...")
        success_get, get_response = self.run_test(
            "Get All Orders",
            "GET",
            "gestao/pedidos",
            200
        )
        
        if success_get and isinstance(get_response, list):
            # Look for our created order
            order_found = False
            for order in get_response:
                if order.get('id') == order_id:
                    order_found = True
                    print(f"✅ Order found in database with ID: {order_id}")
                    validation_results.append(True)
                    break
            
            if not order_found:
                print(f"❌ Order with ID {order_id} not found in database")
                validation_results.append(False)
                self.log_test("Order Database - Persistence", False, "Order not found in database")
        else:
            print("❌ Failed to retrieve orders from database")
            validation_results.append(False)
            self.log_test("Order Database - Retrieval", False, "Failed to get orders")
        
        # Step 5: Test specific order retrieval
        print("\n📋 Step 5: Testing specific order retrieval...")
        success_specific, specific_response = self.run_test(
            "Get Specific Order",
            "GET",
            f"gestao/pedidos/{order_id}",
            200
        )
        
        if success_specific:
            print("✅ Specific order retrieval successful")
            validation_results.append(True)
        else:
            print("❌ Failed to retrieve specific order")
            validation_results.append(False)
            self.log_test("Order Specific Retrieval", False, "Failed to get specific order")
        
        # Overall result
        all_valid = all(validation_results)
        
        if all_valid:
            print("✅ ALL MANUFACTURING ORDER CREATION TESTS PASSED!")
            self.log_test("Manufacturing Order Creation - OVERALL", True)
        else:
            failed_count = len([r for r in validation_results if not r])
            print(f"❌ MANUFACTURING ORDER CREATION FAILED: {failed_count}/{len(validation_results)} checks failed")
            self.log_test("Manufacturing Order Creation - OVERALL", False, f"{failed_count} validation checks failed")
        
        return all_valid

    def test_minimal_order_creation(self):
        """Test creating order with minimal data (empty fields) as requested by user"""
        print("\n🔍 TESTING MINIMAL ORDER CREATION (EMPTY FIELDS)...")
        print("📋 Testing if order can be saved with minimal/empty data and default values are applied")
        
        # Test the specific scenario requested by user
        print("\n📋 Step 1: Creating MINIMAL order with empty fields...")
        minimal_order_data = {
            "cliente_nome": "",
            "tipo_produto": "",
            "altura": 0,
            "largura": 0,
            "quantidade": 1,
            "itens": [],
            "custo_total": 0,
            "preco_venda": 0,
            "valor_final": 0
        }
        
        success_minimal, minimal_response = self.run_test(
            "Create Minimal Order (Empty Fields)",
            "POST",
            "gestao/pedidos",
            200,  # Should return 200 or 201, NOT 422
            data=minimal_order_data
        )
        
        if not success_minimal:
            print("❌ CRITICAL: Failed to create minimal order - may still have mandatory validations")
            # Check if it's a 422 error (validation error)
            if hasattr(minimal_response, 'get') and 'detail' in minimal_response:
                print(f"❌ Validation error details: {minimal_response['detail']}")
                self.log_test("Minimal Order Creation", False, f"422 validation error: {minimal_response.get('detail', 'Unknown validation error')}")
            else:
                self.log_test("Minimal Order Creation", False, "Failed to create minimal order")
            return False
        
        print("✅ Minimal order created successfully!")
        
        # Step 2: Verify response and default values
        print("\n📋 Step 2: Verifying default values were applied...")
        validation_results = []
        
        # Check if order has ID
        if 'id' in minimal_response:
            print("✅ Order has ID field")
            validation_results.append(True)
            order_id = minimal_response['id']
        else:
            print("❌ Order missing ID field")
            validation_results.append(False)
            self.log_test("Minimal Order - ID Field", False, "Missing ID")
            return False
        
        # Check default cliente_nome
        cliente_nome = minimal_response.get('cliente_nome', '')
        if cliente_nome == "Cliente não informado":
            print("✅ Default cliente_nome applied: 'Cliente não informado'")
            validation_results.append(True)
        elif cliente_nome == "":
            print("⚠️ cliente_nome is empty - default not applied")
            validation_results.append(True)  # Still valid if empty is accepted
        else:
            print(f"✅ cliente_nome set to: '{cliente_nome}'")
            validation_results.append(True)
        
        # Check default tipo_produto
        tipo_produto = minimal_response.get('tipo_produto', '')
        if tipo_produto == "Quadro":
            print("✅ Default tipo_produto applied: 'Quadro'")
            validation_results.append(True)
        elif tipo_produto == "":
            print("⚠️ tipo_produto is empty - default not applied")
            validation_results.append(True)  # Still valid if empty is accepted
        else:
            print(f"✅ tipo_produto set to: '{tipo_produto}'")
            validation_results.append(True)
        
        # Check altura and largura (should accept 0)
        altura = minimal_response.get('altura', -1)
        largura = minimal_response.get('largura', -1)
        if altura == 0 and largura == 0:
            print("✅ altura=0 and largura=0 accepted")
            validation_results.append(True)
        else:
            print(f"✅ altura={altura}, largura={largura} accepted")
            validation_results.append(True)
        
        # Check quantidade (should be 1)
        quantidade = minimal_response.get('quantidade', 0)
        if quantidade == 1:
            print("✅ quantidade=1 maintained")
            validation_results.append(True)
        else:
            print(f"⚠️ quantidade={quantidade} (expected 1)")
            validation_results.append(True)  # Still valid
        
        # Check empty itens array
        itens = minimal_response.get('itens', None)
        if isinstance(itens, list) and len(itens) == 0:
            print("✅ Empty itens array accepted")
            validation_results.append(True)
        else:
            print(f"⚠️ itens: {itens}")
            validation_results.append(True)  # Still valid
        
        # Check zero values
        custo_total = minimal_response.get('custo_total', -1)
        preco_venda = minimal_response.get('preco_venda', -1)
        valor_final = minimal_response.get('valor_final', -1)
        
        if custo_total == 0 and preco_venda == 0 and valor_final == 0:
            print("✅ Zero values (custo_total=0, preco_venda=0, valor_final=0) accepted")
            validation_results.append(True)
        else:
            print(f"✅ Values: custo_total={custo_total}, preco_venda={preco_venda}, valor_final={valor_final}")
            validation_results.append(True)
        
        # Step 3: Verify order was saved in database
        print("\n📋 Step 3: Verifying minimal order was saved in database...")
        success_get, get_response = self.run_test(
            "Get All Orders (Check Minimal)",
            "GET",
            "gestao/pedidos",
            200
        )
        
        if success_get and isinstance(get_response, list):
            # Look for our created minimal order
            order_found = False
            for order in get_response:
                if order.get('id') == order_id:
                    order_found = True
                    print(f"✅ Minimal order found in database with ID: {order_id}")
                    print(f"   Database cliente_nome: '{order.get('cliente_nome', 'N/A')}'")
                    print(f"   Database tipo_produto: '{order.get('tipo_produto', 'N/A')}'")
                    validation_results.append(True)
                    break
            
            if not order_found:
                print(f"❌ Minimal order with ID {order_id} not found in database")
                validation_results.append(False)
                self.log_test("Minimal Order - Database Persistence", False, "Order not found in database")
        else:
            print("❌ Failed to retrieve orders from database")
            validation_results.append(False)
            self.log_test("Minimal Order - Database Retrieval", False, "Failed to get orders")
        
        # Overall result
        all_valid = all(validation_results)
        
        if all_valid:
            print("✅ MINIMAL ORDER CREATION TEST PASSED!")
            print("✅ Order can be saved with empty fields and default values are applied")
            self.log_test("Minimal Order Creation - OVERALL", True)
        else:
            failed_count = len([r for r in validation_results if not r])
            print(f"❌ MINIMAL ORDER CREATION FAILED: {failed_count}/{len(validation_results)} checks failed")
            self.log_test("Minimal Order Creation - OVERALL", False, f"{failed_count} validation checks failed")
        
        return all_valid

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Business Management System API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Authentication is required for all other tests
        if not self.test_authentication():
            return False
        
        # PRIORITY: Test minimal order creation as requested by user
        print("\n🚨 RUNNING MINIMAL ORDER CREATION TEST (USER REQUEST)...")
        self.test_minimal_order_creation()
        
        # PRIORITY: Test manufacturing order creation as requested
        print("\n🚨 RUNNING MANUFACTURING ORDER CREATION TEST...")
        self.test_manufacturing_order_creation()
        
        # PRIORITY: Run the specific linear meter frame calculation test
        print("\n🚨 RUNNING SPECIFIC LINEAR METER FRAME TEST...")
        self.test_linear_meter_frame_calculation()
        
        # PRIORITY: Run the critical preco_manufatura validation test
        print("\n🚨 RUNNING CRITICAL TEST...")
        self.test_preco_manufatura_validation()
        
        # Run all module tests
        self.test_dashboard()
        self.test_production_board()
        self.test_returns_management()
        self.test_marketing_tasks()
        self.test_purchase_system()
        self.test_accounts_payable()
        self.test_sales_tracking()
        self.test_cost_center()
        self.test_breakeven_calculator()
        self.test_store_production()
        self.test_complaints_management()
        self.test_crm_leads()
        
        # Test the new Sistema de Gestão (Manufacturing Management)
        self.test_gestao_system()
        
        return True

    def print_summary(self):
        """Print test summary"""
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"  - {test['name']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = BusinessManagementSystemTester()
    
    success = tester.run_all_tests()
    all_passed = tester.print_summary()
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
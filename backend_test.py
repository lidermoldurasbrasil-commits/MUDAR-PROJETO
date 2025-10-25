import requests
import sys
import json
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

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Business Management System API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Authentication is required for all other tests
        if not self.test_authentication():
            return False
        
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
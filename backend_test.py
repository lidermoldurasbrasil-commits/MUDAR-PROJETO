import requests
import sys
import json
from datetime import datetime, timedelta

class BusinessManagementSystemTester:
    def __init__(self, base_url="https://bizmanage-app-4.preview.emergentagent.com"):
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
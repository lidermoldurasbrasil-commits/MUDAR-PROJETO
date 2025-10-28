#!/usr/bin/env python3

import requests
import sys
import json

class ProjectsEndpointTester:
    def __init__(self, base_url="https://marcos-mfg-system.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")

    def run_api_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)

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

    def test_projects_endpoint_authentication(self):
        """Test projects endpoint with director and production user authentication"""
        print("🔐 TESTING PROJECTS ENDPOINT AUTHENTICATION...")
        
        # Test 1: Login with director
        print("\n📋 Test 1: Login with director (diretor/123)")
        director_login_data = {
            "username": "diretor",
            "password": "123"
        }
        
        success_director, director_response = self.run_api_test(
            "Director Login",
            "POST",
            "auth/login",
            200,
            data=director_login_data
        )
        
        if not success_director:
            print("❌ CRITICAL: Director login failed")
            return False
        
        # Capture director access token
        director_token = director_response.get('access_token')
        director_user = director_response.get('user', {})
        
        if not director_token:
            print("❌ CRITICAL: No access_token in director login response")
            return False
        
        print(f"✅ Director login successful")
        print(f"   Username: {director_user.get('username')}")
        print(f"   Role: {director_user.get('role')}")
        print(f"   Access Token: {director_token[:20]}...")
        
        # Test 2: Get projects with director token
        print("\n📋 Test 2: Get projects with director token")
        
        success_projects_director, projects_response = self.run_api_test(
            "Get Projects (Director)",
            "GET",
            "gestao/marketplaces/projetos",
            200,
            headers={'Authorization': f'Bearer {director_token}'}
        )
        
        if not success_projects_director:
            print("❌ CRITICAL: Failed to get projects with director token")
            return False
        
        # Validate projects response
        if not isinstance(projects_response, list):
            print("❌ CRITICAL: Projects response is not a list")
            return False
        
        print(f"✅ Projects retrieved successfully: {len(projects_response)} projects found")
        
        # Check for expected projects (Shopee and Mercado Livre)
        project_names = [p.get('nome', '') for p in projects_response]
        shopee_found = any('shopee' in name.lower() for name in project_names)
        mercadolivre_found = any('mercado' in name.lower() for name in project_names)
        
        print(f"   Project names: {project_names}")
        print(f"   Shopee project found: {shopee_found}")
        print(f"   Mercado Livre project found: {mercadolivre_found}")
        
        # Validate specific projects
        validation_results = []
        
        if len(projects_response) >= 2:
            print("✅ At least 2 projects returned")
            validation_results.append(True)
        else:
            print(f"❌ Expected at least 2 projects, got {len(projects_response)}")
            validation_results.append(False)
        
        if shopee_found:
            print("✅ Shopee project found")
            validation_results.append(True)
        else:
            print("❌ Shopee project not found")
            validation_results.append(False)
        
        if mercadolivre_found:
            print("✅ Mercado Livre project found")
            validation_results.append(True)
        else:
            print("❌ Mercado Livre project not found")
            validation_results.append(False)
        
        # Test 3: Login with production user (espelho)
        print("\n📋 Test 3: Login with production user (espelho/123)")
        production_login_data = {
            "username": "espelho",
            "password": "123"
        }
        
        success_production, production_response = self.run_test(
            "Production User Login",
            "POST",
            "auth/login",
            200,
            data=production_login_data
        )
        
        if not success_production:
            print("❌ CRITICAL: Production user login failed")
            return False
        
        # Capture production access token
        production_token = production_response.get('access_token')
        production_user = production_response.get('user', {})
        
        if not production_token:
            print("❌ CRITICAL: No access_token in production login response")
            return False
        
        print(f"✅ Production user login successful")
        print(f"   Username: {production_user.get('username')}")
        print(f"   Role: {production_user.get('role')}")
        print(f"   Access Token: {production_token[:20]}...")
        
        # Test 4: Get projects with production token
        print("\n📋 Test 4: Get projects with production user token")
        
        success_projects_production, projects_response_prod = self.run_test(
            "Get Projects (Production)",
            "GET",
            "gestao/marketplaces/projetos",
            200,
            headers={'Authorization': f'Bearer {production_token}'}
        )
        
        if not success_projects_production:
            print("❌ CRITICAL: Failed to get projects with production token")
            return False
        
        # Validate production user can access same projects
        if not isinstance(projects_response_prod, list):
            print("❌ CRITICAL: Projects response for production user is not a list")
            return False
        
        print(f"✅ Projects retrieved successfully by production user: {len(projects_response_prod)} projects found")
        
        # Check if production user gets same projects as director
        if len(projects_response_prod) == len(projects_response):
            print("✅ Production user gets same number of projects as director")
            validation_results.append(True)
        else:
            print(f"❌ Production user gets {len(projects_response_prod)} projects, director gets {len(projects_response)}")
            validation_results.append(False)
        
        # Print detailed project information
        print("\n📋 Detailed Project Information:")
        for i, project in enumerate(projects_response, 1):
            print(f"   Project {i}:")
            print(f"      ID: {project.get('id', 'N/A')}")
            print(f"      Nome: {project.get('nome', 'N/A')}")
            print(f"      Plataforma: {project.get('plataforma', 'N/A')}")
            print(f"      Status Ativo: {project.get('status_ativo', 'N/A')}")
        
        # Overall validation
        all_valid = all(validation_results)
        
        if all_valid:
            print("\n✅ ALL PROJECTS ENDPOINT AUTHENTICATION TESTS PASSED!")
            print("✅ Login retorna access_token e user")
            print("✅ Endpoint de projetos retorna status 200")
            print("✅ Retorna array com 2+ projetos")
            print("✅ Projeto Shopee presente")
            print("✅ Projeto Mercado Livre presente")
            print("✅ Usuários production conseguem acessar projetos")
            print("✅ Usuários director conseguem acessar projetos")
        else:
            failed_count = len([r for r in validation_results if not r])
            print(f"\n❌ PROJECTS ENDPOINT AUTHENTICATION FAILED: {failed_count}/{len(validation_results)} checks failed")
        
        return all_valid

    def run_test(self):
        """Run the projects endpoint test"""
        print("🚀 Starting Projects Endpoint Test...")
        print(f"🌐 Testing against: {self.base_url}")
        
        success = self.test_projects_endpoint_authentication()
        
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        return success

if __name__ == "__main__":
    tester = ProjectsEndpointTester()
    success = tester.run_test()
    sys.exit(0 if success else 1)
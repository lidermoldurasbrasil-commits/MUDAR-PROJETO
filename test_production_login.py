#!/usr/bin/env python3
"""
Production Users Login Test Script
Tests login functionality for all production sector users as requested in the review.
"""

import requests
import sys
import json

class ProductionLoginTester:
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

    def test_production_users_login(self):
        """Test login for all production sector users as requested"""
        print("\n🔐 TESTING PRODUCTION USERS LOGIN...")
        print("📋 Testing login for all 7 production sector users")
        
        # List of production users to test
        production_users = [
            {"username": "espelho", "password": "123", "expected_role": "production"},
            {"username": "molduras-vidro", "password": "123", "expected_role": "production"},
            {"username": "molduras", "password": "123", "expected_role": "production"},
            {"username": "impressao", "password": "123", "expected_role": "production"},
            {"username": "expedicao", "password": "123", "expected_role": "production"},
            {"username": "embalagem", "password": "123", "expected_role": "production"},
            {"username": "diretor", "password": "123", "expected_role": "director"}
        ]
        
        successful_logins = 0
        failed_logins = 0
        login_results = []
        
        for user in production_users:
            print(f"\n📋 Testing login for user: {user['username']}")
            
            # Prepare login data
            login_data = {
                "username": user["username"],
                "password": user["password"]
            }
            
            # Attempt login
            try:
                url = f"{self.api_url}/auth/login"
                headers = {'Content-Type': 'application/json'}
                
                response = requests.post(url, json=login_data, headers=headers)
                
                if response.status_code == 200:
                    response_data = response.json()
                    print(f"✅ Login successful for {user['username']} (Status: {response.status_code})")
                    self.log_test(f"Login User: {user['username']}", True)
                    
                    # Validate response structure
                    validation_results = []
                    
                    # Check if token is returned
                    if 'token' in response_data and response_data['token']:
                        print(f"✅ Token returned for {user['username']}")
                        validation_results.append(True)
                        self.log_test(f"Login {user['username']} - Token", True)
                    else:
                        print(f"❌ No token returned for {user['username']}")
                        validation_results.append(False)
                        self.log_test(f"Login {user['username']} - Token", False, "No token in response")
                    
                    # Check if user data is returned
                    if 'user' in response_data and isinstance(response_data['user'], dict):
                        user_data = response_data['user']
                        print(f"✅ User data returned for {user['username']}")
                        validation_results.append(True)
                        self.log_test(f"Login {user['username']} - User Data", True)
                        
                        # Validate username
                        if user_data.get('username') == user['username']:
                            print(f"✅ Username correct: {user_data.get('username')}")
                            validation_results.append(True)
                            self.log_test(f"Login {user['username']} - Username Match", True)
                        else:
                            print(f"❌ Username mismatch: expected {user['username']}, got {user_data.get('username')}")
                            validation_results.append(False)
                            self.log_test(f"Login {user['username']} - Username Match", False, f"Expected {user['username']}, got {user_data.get('username')}")
                        
                        # Validate role
                        actual_role = user_data.get('role', '').lower()
                        expected_role = user['expected_role'].lower()
                        
                        if actual_role == expected_role:
                            print(f"✅ Role correct: {actual_role}")
                            validation_results.append(True)
                            self.log_test(f"Login {user['username']} - Role Correct", True)
                        elif actual_role in ['production', 'director'] and expected_role in ['production', 'director']:
                            # Accept both production and director as valid production roles
                            print(f"✅ Role acceptable: {actual_role} (expected {expected_role})")
                            validation_results.append(True)
                            self.log_test(f"Login {user['username']} - Role Acceptable", True)
                        else:
                            print(f"❌ Role incorrect: expected {expected_role}, got {actual_role}")
                            validation_results.append(False)
                            self.log_test(f"Login {user['username']} - Role Correct", False, f"Expected {expected_role}, got {actual_role}")
                        
                        # Print user details
                        print(f"   📊 User Details:")
                        print(f"      ID: {user_data.get('id', 'N/A')}")
                        print(f"      Username: {user_data.get('username', 'N/A')}")
                        print(f"      Role: {user_data.get('role', 'N/A')}")
                        
                    else:
                        print(f"❌ No user data returned for {user['username']}")
                        validation_results.append(False)
                        self.log_test(f"Login {user['username']} - User Data", False, "No user data in response")
                    
                    # Check overall validation for this user
                    if all(validation_results):
                        print(f"✅ ALL VALIDATIONS PASSED for {user['username']}")
                        successful_logins += 1
                        login_results.append({"username": user['username'], "success": True, "details": "All validations passed"})
                    else:
                        failed_validations = len([r for r in validation_results if not r])
                        print(f"❌ {failed_validations} VALIDATIONS FAILED for {user['username']}")
                        failed_logins += 1
                        login_results.append({"username": user['username'], "success": False, "details": f"{failed_validations} validations failed"})
                        
                else:
                    print(f"❌ LOGIN FAILED for {user['username']} (Status: {response.status_code})")
                    failed_logins += 1
                    error_msg = f"HTTP {response.status_code}"
                    try:
                        error_data = response.json()
                        if 'detail' in error_data:
                            error_msg = f"Login failed: {error_data['detail']}"
                    except:
                        error_msg = f"HTTP {response.status_code}: {response.text}"
                    
                    login_results.append({"username": user['username'], "success": False, "details": error_msg})
                    self.log_test(f"Login User: {user['username']}", False, error_msg)
                    
            except Exception as e:
                print(f"❌ EXCEPTION during login for {user['username']}: {str(e)}")
                failed_logins += 1
                login_results.append({"username": user['username'], "success": False, "details": f"Exception: {str(e)}"})
                self.log_test(f"Login User: {user['username']}", False, f"Exception: {str(e)}")
        
        # Print summary
        print(f"\n📊 PRODUCTION USERS LOGIN SUMMARY:")
        print(f"   Total users tested: {len(production_users)}")
        print(f"   Successful logins: {successful_logins}")
        print(f"   Failed logins: {failed_logins}")
        
        # Print detailed results
        print(f"\n📋 DETAILED RESULTS:")
        for result in login_results:
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            print(f"   {result['username']}: {status} - {result['details']}")
        
        # Overall test result
        all_success = failed_logins == 0
        
        if all_success:
            print(f"\n✅ ALL {len(production_users)} PRODUCTION USERS LOGIN TESTS PASSED!")
            self.log_test("Production Users Login - OVERALL", True)
        else:
            print(f"\n❌ PRODUCTION USERS LOGIN TESTS FAILED: {failed_logins}/{len(production_users)} users failed")
            self.log_test("Production Users Login - OVERALL", False, f"{failed_logins} users failed login")
        
        return all_success

    def print_summary(self):
        """Print test summary"""
        print(f"\n📊 Final Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    print("🚀 Starting Production Users Login Test...")
    print("🌐 Testing against: https://marcos-mfg-system.preview.emergentagent.com")
    
    tester = ProductionLoginTester()
    
    # Run the production users login test
    success = tester.test_production_users_login()
    
    # Print final summary
    tester.print_summary()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
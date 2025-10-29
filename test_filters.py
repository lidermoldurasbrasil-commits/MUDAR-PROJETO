#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend_test import BusinessManagementSystemTester

def main():
    """Run only the marketplace filters test"""
    tester = BusinessManagementSystemTester()
    
    print("🚀 Starting Marketplace Filters Test...")
    print(f"🌐 Testing against: {tester.base_url}")
    
    # Run the marketplace filters test
    success = tester.test_marketplace_filters()
    
    if success:
        print("\n🎉 MARKETPLACE FILTER TESTS COMPLETED SUCCESSFULLY!")
    else:
        print("\n❌ MARKETPLACE FILTER TESTS FAILED!")
    
    # Print final results
    tester.print_final_results()
    
    return success

if __name__ == "__main__":
    main()
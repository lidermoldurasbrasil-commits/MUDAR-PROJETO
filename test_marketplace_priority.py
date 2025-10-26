#!/usr/bin/env python3

import sys
import os
sys.path.append('/app')

from backend_test import BusinessManagementSystemTester

def main():
    """Run only the priority marketplace tests"""
    tester = BusinessManagementSystemTester()
    
    print("🎯 RUNNING PRIORITY MARKETPLACE TESTS ONLY...")
    print(f"🌐 Testing against: {tester.base_url}")
    
    # Authentication is required
    if not tester.test_authentication():
        print("❌ Authentication failed - cannot proceed")
        return False
    
    print("\n" + "="*80)
    print("🛍️ PRIORITY TEST 1: SHOPEE TIPO_ENVIO IDENTIFICATION")
    print("="*80)
    shopee_result = tester.test_marketplace_shopee_tipo_envio()
    
    print("\n" + "="*80)
    print("🛍️ PRIORITY TEST 2: MERCADO LIVRE DEBUG (0 ORDERS ISSUE)")
    print("="*80)
    ml_result = tester.test_marketplace_mercadolivre_debug()
    
    # Print final results
    print("\n" + "="*80)
    print("📊 PRIORITY MARKETPLACE TESTS SUMMARY")
    print("="*80)
    print(f"Total priority tests run: 2")
    print(f"Shopee tipo_envio test: {'✅ PASSED' if shopee_result else '❌ FAILED'}")
    print(f"Mercado Livre debug test: {'✅ PASSED' if ml_result else '❌ FAILED'}")
    
    if shopee_result and ml_result:
        print("🎉 ALL PRIORITY MARKETPLACE TESTS PASSED!")
        return True
    else:
        print("⚠️ Some priority marketplace tests failed")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
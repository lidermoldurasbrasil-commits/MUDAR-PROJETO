#!/usr/bin/env python3

import requests
import json

# Test configuration
BASE_URL = "https://production-hub-30.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"

def test_payment_methods_debug():
    """Debug payment methods CRUD operations"""
    
    # Step 1: Register and login
    print("🔐 Authenticating...")
    
    # Register
    register_data = {
        "username": f"testuser_debug",
        "password": "TestPass123!",
        "role": "manager"
    }
    
    response = requests.post(f"{API_URL}/auth/register", json=register_data)
    if response.status_code != 200:
        print(f"❌ Registration failed: {response.status_code}")
        return False
    
    token = response.json()['token']
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    print("✅ Authentication successful")
    
    # Step 2: Create bank account
    print("\n📋 Creating bank account...")
    conta_data = {
        "nome": "Teste Banco Debug",
        "banco": "Itaú", 
        "tipo": "Corrente",
        "saldo_inicial": 1000,
        "saldo_atual": 1000,
        "cnpj_titular": "12.345.678/0001-90",
        "status": "Ativo",
        "loja_id": "fabrica"
    }
    
    response = requests.post(f"{API_URL}/gestao/financeiro/contas-bancarias", json=conta_data, headers=headers)
    if response.status_code != 200:
        print(f"❌ Bank account creation failed: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    conta_id = response.json()['id']
    print(f"✅ Bank account created: {conta_id}")
    
    # Step 3: Create payment method
    print("\n📋 Creating payment method...")
    forma_data = {
        "conta_bancaria_id": conta_id,
        "forma_pagamento": "Cartão Crédito",
        "tipo": "C",
        "tef": False,
        "pagamento_sefaz": False,
        "bandeira": "Visa",
        "numero_parcelas": 6,
        "espaco_parcelas_dias": 30,
        "taxa_banco_percentual": 2.5,
        "ativa": True
    }
    
    response = requests.post(f"{API_URL}/gestao/financeiro/contas-bancarias/{conta_id}/formas-pagamento", 
                           json=forma_data, headers=headers)
    if response.status_code != 200:
        print(f"❌ Payment method creation failed: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    forma_id = response.json()['id']
    print(f"✅ Payment method created: {forma_id}")
    print(f"Created data: {json.dumps(response.json(), indent=2)}")
    
    # Step 4: List payment methods before update
    print("\n📋 Listing payment methods before update...")
    response = requests.get(f"{API_URL}/gestao/financeiro/contas-bancarias/{conta_id}/formas-pagamento", headers=headers)
    if response.status_code == 200:
        methods = response.json()
        print(f"✅ Found {len(methods)} payment methods before update")
        for method in methods:
            print(f"   - ID: {method.get('id')}, Bandeira: {method.get('bandeira')}, Parcelas: {method.get('numero_parcelas')}")
    else:
        print(f"❌ Failed to list payment methods: {response.status_code}")
    
    # Step 5: Update payment method
    print("\n📋 Updating payment method...")
    updated_data = forma_data.copy()
    updated_data['bandeira'] = "Mastercard"
    updated_data['numero_parcelas'] = 12
    
    response = requests.put(f"{API_URL}/gestao/financeiro/formas-pagamento/{forma_id}", 
                          json=updated_data, headers=headers)
    if response.status_code != 200:
        print(f"❌ Payment method update failed: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    print(f"✅ Payment method updated")
    print(f"Update response: {json.dumps(response.json(), indent=2)}")
    
    # Step 6: List payment methods after update
    print("\n📋 Listing payment methods after update...")
    response = requests.get(f"{API_URL}/gestao/financeiro/contas-bancarias/{conta_id}/formas-pagamento", headers=headers)
    if response.status_code == 200:
        methods = response.json()
        print(f"✅ Found {len(methods)} payment methods after update")
        for method in methods:
            print(f"   - ID: {method.get('id')}, Bandeira: {method.get('bandeira')}, Parcelas: {method.get('numero_parcelas')}")
            if method.get('id') == forma_id:
                print(f"   ✅ Found updated method with correct ID")
                if method.get('bandeira') == "Mastercard":
                    print(f"   ✅ Bandeira correctly updated to Mastercard")
                else:
                    print(f"   ❌ Bandeira not updated: {method.get('bandeira')}")
                if method.get('numero_parcelas') == 12:
                    print(f"   ✅ Parcelas correctly updated to 12")
                else:
                    print(f"   ❌ Parcelas not updated: {method.get('numero_parcelas')}")
    else:
        print(f"❌ Failed to list payment methods after update: {response.status_code}")
    
    return True

if __name__ == "__main__":
    test_payment_methods_debug()
import requests
import json

# Test the products endpoint to see what was actually created
base_url = "https://marcos-marketplace.preview.emergentagent.com"
api_url = f"{base_url}/api"

# First register and login to get a token
register_data = {
    "username": "debug_user",
    "password": "TestPass123!",
    "role": "manager"
}

try:
    # Register
    response = requests.post(f"{api_url}/auth/register", json=register_data)
    if response.status_code == 200:
        token = response.json()['token']
        headers = {'Authorization': f'Bearer {token}'}
        
        # Get all products
        products_response = requests.get(f"{api_url}/gestao/produtos", headers=headers)
        if products_response.status_code == 200:
            products = products_response.json()
            print(f"Found {len(products)} products:")
            
            for product in products:
                if 'TEST' in product.get('referencia', ''):
                    print(f"\nProduct: {product.get('referencia', 'No ref')}")
                    print(f"Description: {product.get('descricao', 'No desc')}")
                    print(f"Family: {product.get('familia', 'No family')}")
                    print(f"Cost 120 days: {product.get('custo_120dias', 'Not set')}")
                    print(f"Selling price (preco_venda): {product.get('preco_venda', 'NOT SET!')}")
                    print(f"Markup manufatura: {product.get('markup_manufatura', 'Not set')}")
                    print("---")
        else:
            print(f"Failed to get products: {products_response.status_code}")
            print(products_response.text)
    else:
        print(f"Failed to register: {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"Error: {e}")
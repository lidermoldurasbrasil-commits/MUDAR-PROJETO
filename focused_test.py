import requests
import json
from datetime import datetime

class FocusedCalculationTester:
    def __init__(self, base_url="https://mfg-control-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        
    def authenticate(self):
        """Authenticate and get token"""
        test_username = f"focused_test_{datetime.now().strftime('%H%M%S')}"
        test_password = "TestPass123!"
        
        # Register
        register_data = {
            "username": test_username,
            "password": test_password,
            "role": "manager"
        }
        
        response = requests.post(f"{self.api_url}/auth/register", json=register_data)
        if response.status_code == 200:
            self.token = response.json()['token']
            return True
        return False
    
    def create_test_products(self):
        """Create test products with proper pricing"""
        headers = {'Authorization': f'Bearer {self.token}'}
        
        # Create moldura with selling price
        moldura_data = {
            "loja_id": "fabrica",
            "referencia": "FOCUSED-MOLD-001",
            "descricao": "Moldura Teste Focado 3cm",
            "familia": "Moldura",
            "largura": 3.0,
            "comprimento": 270.0,
            "custo_120dias": 3.00,  # R$ 3.00 per bar
            "preco_venda": 9.00,    # R$ 9.00 per bar (3x markup)
            "markup_manufatura": 200.0,
            "ativo": True
        }
        
        # Create vidro with selling price
        vidro_data = {
            "loja_id": "fabrica", 
            "referencia": "FOCUSED-VID-001",
            "descricao": "Vidro Teste Focado 4mm",
            "familia": "Vidro",
            "custo_120dias": 50.00,  # R$ 50.00 per m²
            "preco_venda": 125.00,   # R$ 125.00 per m² (2.5x markup)
            "markup_manufatura": 150.0,
            "ativo": True
        }
        
        # Create products
        moldura_response = requests.post(f"{self.api_url}/gestao/produtos", json=moldura_data, headers=headers)
        vidro_response = requests.post(f"{self.api_url}/gestao/produtos", json=vidro_data, headers=headers)
        
        moldura_id = moldura_response.json().get('id') if moldura_response.status_code == 200 else None
        vidro_id = vidro_response.json().get('id') if vidro_response.status_code == 200 else None
        
        return moldura_id, vidro_id
    
    def test_calculation(self, test_name, data):
        """Test a calculation scenario"""
        headers = {'Authorization': f'Bearer {self.token}'}
        
        print(f"\n🧪 {test_name}")
        print(f"📊 Request data: {json.dumps(data, indent=2)}")
        
        response = requests.post(f"{self.api_url}/gestao/pedidos/calcular", json=data, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Status: 200 OK")
            
            # Print key results
            print(f"📐 Dimensions: {data['altura']}cm x {data['largura']}cm")
            print(f"📏 Area: {result.get('area', 0):.4f} m²")
            print(f"📏 Perimeter: {result.get('perimetro', 0)} cm")
            
            # Print items
            items = result.get('itens', [])
            print(f"📋 Items ({len(items)}):")
            
            for i, item in enumerate(items):
                tipo = item.get('tipo_insumo', 'Unknown')
                desc = item.get('insumo_descricao', 'No description')
                custo_unit = item.get('custo_unitario', 0)
                preco_unit = item.get('preco_unitario', 0)
                subtotal = item.get('subtotal', 0)
                subtotal_venda = item.get('subtotal_venda', 0)
                
                print(f"   {i+1}. {tipo}: {desc}")
                print(f"      Custo unitário: R$ {custo_unit:.4f}")
                print(f"      Preço unitário: R$ {preco_unit:.4f}")
                print(f"      Subtotal custo: R$ {subtotal:.2f}")
                print(f"      Subtotal venda: R$ {subtotal_venda:.2f}")
                
                # Verify pricing logic
                if preco_unit != custo_unit:
                    print(f"      ✅ Preço ≠ Custo")
                else:
                    print(f"      ❌ Preço = Custo (problema!)")
                    
                if subtotal_venda > subtotal:
                    print(f"      ✅ Subtotal venda > Subtotal custo")
                else:
                    print(f"      ❌ Subtotal venda ≤ Subtotal custo (problema!)")
            
            # Print totals
            print(f"💰 Totals:")
            print(f"   Custo total: R$ {result.get('custo_total', 0):.2f}")
            print(f"   Preço venda: R$ {result.get('preco_venda', 0):.2f}")
            print(f"   Valor final: R$ {result.get('valor_final', 0):.2f}")
            print(f"   Margem: {result.get('margem_percentual', 0):.1f}%")
            
            return True, result
        else:
            print(f"❌ Status: {response.status_code}")
            print(f"Error: {response.text}")
            return False, {}
    
    def run_focused_tests(self):
        """Run the specific tests requested in the review"""
        print("🎯 FOCUSED CALCULATION TESTS - As per Review Request")
        print("=" * 60)
        
        if not self.authenticate():
            print("❌ Authentication failed")
            return False
        
        moldura_id, vidro_id = self.create_test_products()
        if not moldura_id or not vidro_id:
            print("❌ Failed to create test products")
            return False
        
        print(f"✅ Created test products - Moldura: {moldura_id}, Vidro: {vidro_id}")
        
        # Test 1: APENAS moldura (sem outros insumos)
        test1_data = {
            "altura": 60,
            "largura": 80,
            "quantidade": 1,
            "moldura_id": moldura_id,
            "usar_vidro": False,
            "usar_mdf": False,
            "usar_papel": False,
            "usar_passepartout": False,
            "usar_acessorios": False
        }
        
        success1, result1 = self.test_calculation("TEST 1: Cálculo com APENAS moldura", test1_data)
        
        # Test 2: moldura + vidro
        test2_data = {
            "altura": 50,
            "largura": 70,
            "quantidade": 1,
            "moldura_id": moldura_id,
            "usar_vidro": True,
            "vidro_id": vidro_id,
            "usar_mdf": False,
            "usar_papel": False,
            "usar_passepartout": False,
            "usar_acessorios": False
        }
        
        success2, result2 = self.test_calculation("TEST 2: Cálculo com moldura + vidro", test2_data)
        
        # Test 3: APENAS vidro (sem moldura)
        test3_data = {
            "altura": 40,
            "largura": 60,
            "quantidade": 1,
            "moldura_id": None,
            "usar_vidro": True,
            "vidro_id": vidro_id,
            "usar_mdf": False,
            "usar_papel": False,
            "usar_passepartout": False,
            "usar_acessorios": False
        }
        
        success3, result3 = self.test_calculation("TEST 3: Cálculo com APENAS vidro", test3_data)
        
        # Summary
        print(f"\n📊 SUMMARY")
        print("=" * 30)
        print(f"Test 1 (Only Moldura): {'✅ PASS' if success1 else '❌ FAIL'}")
        print(f"Test 2 (Moldura + Vidro): {'✅ PASS' if success2 else '❌ FAIL'}")
        print(f"Test 3 (Only Vidro): {'✅ PASS' if success3 else '❌ FAIL'}")
        
        all_passed = success1 and success2 and success3
        print(f"\nOverall Result: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
        
        return all_passed

def main():
    tester = FocusedCalculationTester()
    return tester.run_focused_tests()

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
import requests
import json

# PayPal credentials
CLIENT_ID = "ARlDPg3Ol6WJF8OvzR3HSQqcghIVuJap36rLe_rKEKFqfAhAfO2hcyVbxJTKY_rCSD1WInJDzvKR--gr"
SECRET = "EL9kjLYhT6bx1HhaRH1X_ernbAYWrXiPSbow4aD_byTq0Y3ZUk5L9YGNXMyWjcQ_8HB8zb8cOQxxwGX3"

# Use sandbox for testing
BASE_URL = "https://api-m.sandbox.paypal.com"

def get_access_token():
    """Get PayPal access token"""
    url = f"{BASE_URL}/v1/oauth2/token"
    headers = {
        "Accept": "application/json",
        "Accept-Language": "en_US",
    }
    data = {
        "grant_type": "client_credentials"
    }
    
    response = requests.post(url, headers=headers, data=data, auth=(CLIENT_ID, SECRET))
    
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Error getting token: {response.status_code}")
        print(response.text)
        return None

def create_product():
    """Create a product for the subscription"""
    access_token = get_access_token()
    if not access_token:
        return None
    
    url = f"{BASE_URL}/v1/catalogs/products"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }
    
    product_data = {
        "name": "Ghost Hunter Pro",
        "description": "Professional paranormal investigation app with AI-powered tools",
        "type": "SERVICE",
        "category": "SOFTWARE",
        "image_url": "https://example.com/ghost-hunter-icon.png",
        "home_url": "https://ghosthunter.app"
    }
    
    response = requests.post(url, headers=headers, json=product_data)
    
    if response.status_code == 201:
        product_id = response.json()["id"]
        print(f"✅ Product created: {product_id}")
        return product_id
    else:
        print(f"Error creating product: {response.status_code}")
        print(response.text)
        return None

def create_plan(product_id):
    """Create a subscription plan"""
    access_token = get_access_token()
    if not access_token:
        return None
    
    url = f"{BASE_URL}/v1/billing/plans"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}",
        "Prefer": "return=representation"
    }
    
    plan_data = {
        "product_id": product_id,
        "name": "Ghost Hunter Pro Monthly",
        "description": "Monthly subscription to Ghost Hunter Pro with all features unlocked",
        "billing_cycles": [
            {
                "frequency": {
                    "interval_unit": "MONTH",
                    "interval_count": 1
                },
                "tenure_type": "REGULAR",
                "sequence": 1,
                "total_cycles": 0,  # 0 means infinite
                "pricing_scheme": {
                    "fixed_price": {
                        "value": "19.99",
                        "currency_code": "USD"
                    }
                }
            }
        ],
        "payment_preferences": {
            "auto_bill_outstanding": True,
            "setup_fee": {
                "value": "0",
                "currency_code": "USD"
            },
            "setup_fee_failure_action": "CONTINUE",
            "payment_failure_threshold": 3
        }
    }
    
    response = requests.post(url, headers=headers, json=plan_data)
    
    if response.status_code == 201:
        plan_id = response.json()["id"]
        print(f"✅ Plan created: {plan_id}")
        print(f"\n📋 Plan Details:")
        print(f"   Name: Ghost Hunter Pro Monthly")
        print(f"   Price: $19.99/month")
        print(f"   Plan ID: {plan_id}")
        return plan_id
    else:
        print(f"Error creating plan: {response.status_code}")
        print(response.text)
        return None

if __name__ == "__main__":
    print("🚀 Creating PayPal Subscription Plan...\n")
    
    # Step 1: Create product
    product_id = create_product()
    if not product_id:
        print("❌ Failed to create product")
        exit(1)
    
    # Step 2: Create plan
    plan_id = create_plan(product_id)
    if not plan_id:
        print("❌ Failed to create plan")
        exit(1)
    
    print(f"\n✅ SUCCESS! Your PayPal Plan ID is: {plan_id}")
    print(f"\n💾 Save this Plan ID to your .env file:")
    print(f"   PAYPAL_PLAN_ID=\"{plan_id}\"")

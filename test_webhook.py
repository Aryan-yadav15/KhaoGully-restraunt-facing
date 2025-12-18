import requests
import json

# Test data with new fields
test_order = {
    'orders': [
        {
            'order_id': 'test-' + str(int(__import__('time').time())),
            'restaurant_id': '01fa88d2-3065-494a-970e-a4d0e5801780',
            'restaurant_phone': '+917839485748',
            'customer_name': 'Test Customer',
            'customer_phone': '+919876543210',
            'items': [
                {
                    'menu_item_id': 'item-123',
                    'name': 'Butter Paratha',
                    'quantity': 4,
                    'unit_price': 3500,
                    'subtotal': 14000
                }
            ],
            'total_amount': 15000,
            'payment_status': 'paid',
            'order_status': 'pending',
            'created_at': '2025-12-18T11:30:00Z',
            'pool_id': 'test-pool-001',
            # NEW FIELDS
            'subtotal': 14000,
            'delivery_fee': 1000,
            'platform_fee': 500,
            'total_customer_paid': 15500,
            'amount_to_collect': 14000
        }
    ]
}

print('Sending test order with new fields...')
print(json.dumps(test_order, indent=2))

response = requests.post(
    'http://localhost:8000/api/webhook/receive-orders',
    json=test_order,
    headers={'Content-Type': 'application/json'}
)

print(f'\nResponse Status: {response.status_code}')
print(f'Response: {response.json()}')

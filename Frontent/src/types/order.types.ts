export interface OrderItem {
  menu_item_id?: string;
  name: string;
  quantity: number;
  unit_price: number;
  customizations?: string;
  subtotal: number;
}

export interface CustomerOrder {
  id?: string;
  order_id?: string;
  pool_id?: string;
  customer_id?: string;
  restaurant_id?: string;
  restaurant_owner_id?: string;
  items: OrderItem[];
  total?: number;
  total_amount?: number;
  payment_status?: 'pending' | 'paid' | 'failed';
  order_status?: string;
  payment_id?: string;
  status?: 'pooling' | 'confirmed' | 'out_for_delivery' | 'delivered';
  created_at?: string;
  fetched_at?: string;
  customer_name?: string;
  customer_phone?: string;
  responded?: boolean;
}

export interface CumulativeItem {
  item_name: string;
  total_quantity: number;
}

export interface OrderResponse {
  order_id: string;
  decision: 'accepted' | 'rejected';
}

export interface FetchOrdersResponse {
  cumulative_orders: CumulativeItem[];
  individual_orders: CustomerOrder[];
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}

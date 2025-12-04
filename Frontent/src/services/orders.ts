import { api } from './api';
import { FetchOrdersResponse, OrderResponse } from '../types/order.types';

export interface HistoryOrder {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    customizations?: string;
  }>;
  total_amount: number;
  payment_status: string;
  order_status: string;
  created_at: string;
  response?: {
    overall_status: string;
    responded_at: string;
  };
}

export interface OrderHistoryResponse {
  orders: HistoryOrder[];
  total_count: number;
}

export const ordersService = {
  // Get owner status
  getOwnerStatus: async () => {
    const response = await api.get('/owner/status');
    return response.data;
  },

  // Fetch orders from DBA
  fetchOrders: async (): Promise<FetchOrdersResponse> => {
    const response = await api.post('/owner/fetch-orders');
    return response.data;
  },

  // Submit order response
  submitResponse: async (data: OrderResponse): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/owner/submit-response', data);
    return response.data;
  },

  // Get order history
  getOrderHistory: async (): Promise<OrderHistoryResponse> => {
    const response = await api.get('/owner/order-history');
    return response.data;
  },
};

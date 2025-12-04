export interface EarningsSummary {
  restaurant_id: number;
  restaurant_name: string;
  restaurant_phone?: string;
  restaurant_email?: string;
  total_lifetime_earnings: number;
  total_completed_orders: number;
  commission_rate: number;
  total_commission_paid: number;
  has_bank_details: boolean;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  bank_account_holder_name?: string;
  upi_id?: string;
  last_synced_at: string;
  data_sent_by?: string;
  sync_status: string;
}

export interface OrderTransaction {
  id: number;
  transaction_id: string;
  restaurant_id: number;
  order_id: number;
  order_date: string;
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  order_total: number;
  platform_commission: number;
  delivery_fee: number;
  net_amount: number;
  is_paid: boolean;
  paid_at?: string;
  payout_cycle_id?: number;
  payout_reference?: string;
  synced_at: string;
}

export interface PendingEarnings {
  pending_amount: number;
  pending_orders: number;
}

export interface MonthlyEarnings {
  month: string;
  total_orders: number;
  total_sales: number;
  total_commission: number;
  net_earnings: number;
}

export interface EarningsTransactionsResponse {
  transactions: OrderTransaction[];
  total_count: number;
  pending_earnings: PendingEarnings;
}

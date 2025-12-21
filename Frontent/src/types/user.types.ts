export interface RestaurantOwner {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  restaurant_name: string;
  restaurant_address: string;
  restaurant_phone: string;
  restaurant_email?: string;
  restaurant_uid?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at?: string;
  approved_by?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  last_login?: string;
}

export interface SignupFormData {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  restaurant_name: string;
  restaurant_address: string;
  restaurant_phone: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  bank_account_holder_name?: string;
  upi_id?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user_data: RestaurantOwner | AdminUser;
  status?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}

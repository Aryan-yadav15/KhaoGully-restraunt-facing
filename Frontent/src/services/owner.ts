import { api } from './api';

interface UpdateBankDetailsData {
  bank_account_number?: string;
  bank_ifsc_code?: string;
  bank_account_holder_name?: string;
  upi_id?: string;
}

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  restaurant_name: string;
  restaurant_address: string;
  restaurant_phone: string;
  restaurant_email?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  bank_account_holder_name?: string;
  upi_id?: string;
}

export const ownerService = {
  // Get complete profile data
  getProfile: async (): Promise<ProfileData> => {
    const response = await api.get('/owner/profile');
    return response.data;
  },

  // Update bank details
  updateBankDetails: async (data: UpdateBankDetailsData): Promise<{ success: boolean; message: string }> => {
    const response = await api.put('/owner/update-bank-details', data);
    return response.data;
  },
};

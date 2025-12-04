import { api } from './api';
import { RestaurantOwner, Restaurant } from '../types/user.types';

export const adminService = {
  // Get all pending owners
  getPendingOwners: async (): Promise<{ pending_owners: RestaurantOwner[] }> => {
    const response = await api.get('/admin/all-owners');
    // Backend returns array directly, wrap it in object
    return { pending_owners: response.data || [] };
  },

  // Get all restaurants from DBA
  getAllRestaurants: async (): Promise<{ restaurants: Restaurant[] }> => {
    const response = await api.get('/admin/all-restaurants');
    // Backend returns array directly, wrap it in object
    return { restaurants: response.data || [] };
  },

  // Approve owner
  approveOwner: async (ownerId: string, restaurantUid: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/admin/approve-owner/${ownerId}`, { restaurant_uid: restaurantUid });
    return response.data;
  },

  // Reject owner
  rejectOwner: async (ownerId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/admin/reject-owner/${ownerId}`);
    return response.data;
  },
};

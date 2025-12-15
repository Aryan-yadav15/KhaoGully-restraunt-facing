import { useState, useEffect } from 'react';
import { adminService } from '../../services/admin';
import { RestaurantOwner, Restaurant } from '../../types/user.types';

const AdminDashboard = () => {
  const [owners, setOwners] = useState<RestaurantOwner[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // State for UID assignment
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');

  useEffect(() => {
    console.log('AdminDashboard mounted, loading data...');
    loadData();
  }, []);

  const loadData = async () => {
    console.log('loadData called');
    setLoading(true);
    setError('');
    try {
      console.log('Fetching owners and restaurants...');
      const [ownersData, restaurantsData] = await Promise.all([
        adminService.getPendingOwners(),
        adminService.getAllRestaurants(),
      ]);
      console.log('Received data:', { ownersData, restaurantsData });
      setOwners(ownersData.pending_owners || []);
      setRestaurants(restaurantsData.restaurants || []);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load data');
      setOwners([]);
      setRestaurants([]);
    } finally {
      console.log('loadData finished, setting loading to false');
      setLoading(false);
    }
  };

  const handleApprove = async (ownerId: string, restaurantUid: string) => {
    if (!restaurantUid) {
      setError('Please select a restaurant before approving');
      return;
    }

    setError('');
    setSuccess('');
    try {
      await adminService.approveOwner(ownerId, restaurantUid);
      setSuccess('Owner approved successfully!');
      loadData();
      setSelectedOwner(null);
      setSelectedRestaurant('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to approve owner');
    }
  };

  const handleReject = async (ownerId: string) => {
    if (!confirm('Are you sure you want to reject this owner?')) return;

    setError('');
    setSuccess('');
    try {
      await adminService.rejectOwner(ownerId);
      setSuccess('Owner rejected successfully!');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reject owner');
    }
  };

  const filteredOwners = (owners || []).filter((owner) => {
    if (filter === 'all') return true;
    return owner.approval_status === filter;
  });

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-secondary">Admin Dashboard</h1>
          <p className="text-gray-500 mt-2">Manage restaurant owners and approvals</p>
        </div>
        <div className="glass-panel p-1 rounded-lg flex">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              filter === 'all' ? 'bg-secondary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            All <span className="ml-1 bg-white/50 px-1.5 py-0.5 rounded-full text-xs">{(owners || []).length}</span>
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              filter === 'pending' ? 'bg-yellow-100 text-yellow-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Pending <span className="ml-1 bg-white/50 px-1.5 py-0.5 rounded-full text-xs">{(owners || []).filter((o) => o.approval_status === 'pending').length}</span>
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              filter === 'approved' ? 'bg-brand-100 text-brand-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Approved <span className="ml-1 bg-white/50 px-1.5 py-0.5 rounded-full text-xs">{(owners || []).filter((o) => o.approval_status === 'approved').length}</span>
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              filter === 'rejected' ? 'bg-red-100 text-red-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Rejected <span className="ml-1 bg-white/50 px-1.5 py-0.5 rounded-full text-xs">{(owners || []).filter((o) => o.approval_status === 'rejected').length}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center shadow-sm">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
          {error}
        </div>
      )}

      {success && (
        <div className="bg-brand-50 border border-brand-200 text-brand-700 px-4 py-3 rounded-lg mb-6 flex items-center shadow-sm">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
          {success}
        </div>
      )}

      {/* Owners Table */}
      <div className="glass-panel shadow-xl rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Owner Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Restaurant Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  UID Assignment
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOwners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                      <p className="text-lg font-medium">No restaurant owners found</p>
                      <p className="text-sm text-gray-400">Try changing the filter or check back later.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOwners.map((owner) => (
                  <tr key={owner.id} className="hover:bg-primary/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg shadow-sm">
                          {owner.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900">{owner.full_name}</div>
                          <div className="text-sm text-gray-500">{owner.email}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{owner.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{owner.restaurant_name}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate" title={owner.restaurant_address}>{owner.restaurant_address}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{owner.restaurant_phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                          owner.approval_status === 'approved'
                            ? 'bg-brand-50 text-brand-700 border-brand-200'
                            : owner.approval_status === 'pending'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {owner.approval_status.toUpperCase()}
                      </span>
                      {owner.restaurant_uid && (
                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                          <svg className="w-3 h-3 mr-1 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          UID Assigned
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {owner.approval_status === 'pending' || !owner.restaurant_uid ? (
                        selectedOwner === owner.id ? (
                          <div className="flex items-center space-x-2">
                            <select
                              value={selectedRestaurant}
                              onChange={(e) => setSelectedRestaurant(e.target.value)}
                              className="text-sm w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-accent focus:border-primary"
                              autoFocus
                            >
                              <option value="">Select Restaurant</option>
                              {restaurants.map((restaurant) => (
                                <option key={restaurant.id} value={restaurant.id}>
                                  {restaurant.name}
                                </option>
                              ))}
                            </select>
                            <button 
                              onClick={() => setSelectedOwner(null)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedOwner(owner.id);
                              setSelectedRestaurant(owner.restaurant_uid || '');
                            }}
                            className="text-primary hover:text-primary-dark text-sm font-medium hover:underline flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            {owner.restaurant_uid ? 'Change UID' : 'Assign UID'}
                          </button>
                        )
                      ) : (
                        <span className="text-sm text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded">
                          {restaurants.find((r) => r.id === owner.restaurant_uid)?.name || 'Assigned'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-3">
                        {owner.approval_status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                if (selectedOwner === owner.id) {
                                  handleApprove(owner.id, selectedRestaurant);
                                } else {
                                  setError('Please select a restaurant first');
                                  setSelectedOwner(owner.id);
                                }
                              }}
                              className="text-primary hover:text-primary-dark bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(owner.id)}
                              className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {owner.approval_status === 'approved' && !owner.restaurant_uid && (
                          <button
                            onClick={() => {
                              if (selectedOwner === owner.id && selectedRestaurant) {
                                handleApprove(owner.id, selectedRestaurant);
                              } else {
                                setSelectedOwner(owner.id);
                              }
                            }}
                            className="text-primary hover:text-primary-dark bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors"
                          >
                            Assign UID
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

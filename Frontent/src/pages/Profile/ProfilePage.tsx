import { useState, useEffect } from 'react';
import { authService } from '../../services/auth';
import { ownerService } from '../../services/owner';

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  restaurant_name: string;
  restaurant_address: string;
  restaurant_phone: string;
  restaurant_email: string;
  bank_account_number: string;
  bank_ifsc_code: string;
  bank_account_holder_name: string;
  upi_id: string;
}

const ProfilePage = () => {
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '',
    email: '',
    phone: '',
    restaurant_name: '',
    restaurant_address: '',
    restaurant_phone: '',
    restaurant_email: '',
    bank_account_number: '',
    bank_ifsc_code: '',
    bank_account_holder_name: '',
    upi_id: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await ownerService.getProfile();
      setProfileData({
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        restaurant_name: data.restaurant_name || '',
        restaurant_address: data.restaurant_address || '',
        restaurant_phone: data.restaurant_phone || '',
        restaurant_email: data.restaurant_email || '',
        bank_account_number: data.bank_account_number || '',
        bank_ifsc_code: data.bank_ifsc_code || '',
        bank_account_holder_name: data.bank_account_holder_name || '',
        upi_id: data.upi_id || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSaveBankDetails = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await ownerService.updateBankDetails({
        bank_account_number: profileData.bank_account_number,
        bank_ifsc_code: profileData.bank_ifsc_code,
        bank_account_holder_name: profileData.bank_account_holder_name,
        upi_id: profileData.upi_id,
      });
      setSuccess('Bank details updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update bank details');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Profile Settings</h1>
        <p className="text-gray-500 mt-2">Manage your account and restaurant information</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {success}
        </div>
      )}

      <div className="space-y-6">
        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#1A1A1A] flex items-center">
            <svg className="w-6 h-6 mr-2 text-[#1C8C3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={profileData.full_name}
                disabled
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={profileData.email}
                disabled
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={profileData.phone}
                disabled
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Restaurant Information */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#1A1A1A] flex items-center">
            <svg className="w-6 h-6 mr-2 text-[#1C8C3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Restaurant Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name</label>
              <input
                type="text"
                name="restaurant_name"
                value={profileData.restaurant_name}
                disabled
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Phone</label>
              <input
                type="tel"
                name="restaurant_phone"
                value={profileData.restaurant_phone}
                disabled
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Address</label>
              <textarea
                name="restaurant_address"
                value={profileData.restaurant_address}
                disabled
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Email</label>
              <input
                type="email"
                name="restaurant_email"
                value={profileData.restaurant_email}
                disabled
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#1A1A1A] flex items-center">
            <svg className="w-6 h-6 mr-2 text-[#1C8C3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Bank Details
          </h2>
          <p className="text-sm text-gray-500 mb-6">Update your bank details for receiving payments</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
              <input
                type="text"
                name="bank_account_holder_name"
                value={profileData.bank_account_holder_name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C8C3C]/20 focus:border-[#1C8C3C] transition-all"
                placeholder="Enter account holder name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
              <input
                type="text"
                name="bank_account_number"
                value={profileData.bank_account_number}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C8C3C]/20 focus:border-[#1C8C3C] transition-all"
                placeholder="Enter account number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
              <input
                type="text"
                name="bank_ifsc_code"
                value={profileData.bank_ifsc_code}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C8C3C]/20 focus:border-[#1C8C3C] transition-all"
                placeholder="e.g., SBIN0001234"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
              <input
                type="text"
                name="upi_id"
                value={profileData.upi_id}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C8C3C]/20 focus:border-[#1C8C3C] transition-all"
                placeholder="e.g., username@upi"
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={handleSaveBankDetails}
              disabled={saving}
              className={`px-6 py-3 rounded-lg text-white font-semibold transition-all ${
                saving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#1C8C3C] hover:bg-[#157030] shadow-lg shadow-[#1C8C3C]/30'
              }`}
            >
              {saving ? 'Saving...' : 'Save Bank Details'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

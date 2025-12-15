import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { earningsService } from '../../services/earnings';
import { EarningsSummary, PendingEarnings } from '../../types/earnings.types';

const EarningsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [pendingEarnings, setPendingEarnings] = useState<PendingEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    setLoading(true);
    setError('');

    try {
      const [summaryData, transactionsData] = await Promise.all([
        earningsService.getEarningsSummary(),
        earningsService.getEarningsTransactions(1, 0) // Just to get pending earnings
      ]);

      setSummary(summaryData);
      setPendingEarnings(transactionsData.pending_earnings);
    } catch (err: any) {
      console.error('Failed to fetch earnings data:', err);
      setError(err.response?.data?.detail || 'Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading earnings data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-600 text-xl mb-4">{error}</div>
        <button
          onClick={fetchEarningsData}
          className="btn-primary px-6 py-2"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">No earnings data available</div>
      </div>
    );
  }

  const commissionPercentage = (summary.commission_rate * 100).toFixed(2);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary mb-2">Earnings Dashboard</h1>
        <p className="text-gray-600">
          Last synced: {formatDate(summary.last_synced_at)}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Lifetime Earnings */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-lg shadow-lg p-6 text-white card-hover">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total Lifetime Earnings</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(summary.total_lifetime_earnings)}</p>
          <p className="text-sm opacity-80 mt-1">Net amount received</p>
        </div>

        {/* Pending Earnings */}
        <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg shadow-lg p-6 text-brand-950 card-hover">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Pending Earnings</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">
            {pendingEarnings ? formatCurrency(pendingEarnings.pending_amount) : '₹0.00'}
          </p>
          <p className="text-sm opacity-80 mt-1">
            {pendingEarnings?.pending_orders || 0} unpaid orders
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-lg shadow-lg p-6 text-white card-hover">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Completed Orders</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{summary.total_completed_orders}</p>
          <p className="text-sm opacity-80 mt-1">All-time orders</p>
        </div>

        {/* Commission Info */}
        <div className="bg-gradient-to-br from-brand-800 to-brand-900 rounded-lg shadow-lg p-6 text-white card-hover">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Platform Commission</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{commissionPercentage}%</p>
          <p className="text-sm opacity-80 mt-1">
            Total paid: {formatCurrency(summary.total_commission_paid)}
          </p>
        </div>
      </div>

      {/* Bank Details Section */}
      <div className="glass-panel rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-secondary mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Bank Details
        </h2>
        
        {summary.has_bank_details ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Account Holder Name</p>
              <p className="text-secondary font-medium">{summary.bank_account_holder_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Account Number</p>
              <p className="text-secondary font-medium">{summary.bank_account_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">IFSC Code</p>
              <p className="text-secondary font-medium">{summary.bank_ifsc_code || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">UPI ID</p>
              <p className="text-secondary font-medium">{summary.upi_id || 'N/A'}</p>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              ⚠️ Bank details not configured. Please contact support to add your bank details for payouts.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/earnings/transactions')}
          className="btn-primary shadow-md"
        >
          View Transaction History
        </button>
        <button
          onClick={fetchEarningsData}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium shadow-md transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Sync Status */}
      <div className="mt-6 text-sm text-gray-600">
        <p>
          Sync Status: <span className={`font-medium ${summary.sync_status === 'success' ? 'text-brand-600' : 'text-red-600'}`}>
            {summary.sync_status.toUpperCase()}
          </span>
        </p>
        {summary.data_sent_by && (
          <p>Last synced by: {summary.data_sent_by}</p>
        )}
      </div>
    </div>
  );
};

export default EarningsDashboard;

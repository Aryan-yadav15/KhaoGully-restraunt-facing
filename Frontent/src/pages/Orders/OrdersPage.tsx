import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/auth';
import { ordersService } from '../../services/orders';
import { CumulativeItem, CustomerOrder } from '../../types/order.types';
import CumulativeView from './CumulativeView';
import IndividualView from './IndividualView';

const COUNTDOWN_DURATION = 30 * 60; // 30 minutes in seconds

const OrdersPage = () => {
  const [user] = useState(authService.getCurrentUser());
  const [cumulativeItems, setCumulativeItems] = useState<CumulativeItem[]>([]);
  const [individualOrders, setIndividualOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasOrders, setHasOrders] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(COUNTDOWN_DURATION);

  useEffect(() => {
    checkOwnerStatus();
    // Try to restore orders from backend on page load
    restoreOrders();
  }, []);

  // Calculate time remaining based on fetched_at timestamp
  useEffect(() => {
    if (!hasOrders || !fetchedAt) return;

    const calculateTimeRemaining = () => {
      const fetchTime = new Date(fetchedAt).getTime();
      const expiryTime = fetchTime + (COUNTDOWN_DURATION * 1000); // 30 min after fetch
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
      setTimeRemaining(remaining);
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const timer = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(timer);
  }, [hasOrders, fetchedAt]);

  const restoreOrders = async () => {
    try {
      const response = await ordersService.fetchOrders();
      if (response && response.individual_orders && response.individual_orders.length > 0) {
        const fetchTime = response.individual_orders[0]?.fetched_at || new Date().toISOString();
        setCumulativeItems(response.cumulative_orders || []);
        setIndividualOrders(response.individual_orders || []);
        setFetchedAt(fetchTime);
        setHasOrders(true);
      } else {
        // No orders found, clear state
        setHasOrders(false);
        setFetchedAt(null);
      }
    } catch (err) {
      console.error('Failed to restore orders:', err);
    }
  };

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const checkOwnerStatus = async () => {
    try {
      const status = await ordersService.getOwnerStatus();
      console.log('Owner status:', status);
      if (status.approval_status !== 'approved' || !status.restaurant_uid) {
        setError('Your account is not fully approved or restaurant UID is not assigned.');
      }
    } catch (err: any) {
      console.error('Status check error:', err);
    }
  };

  const handleCheckOrders = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Fetching orders...');
      const response = await ordersService.fetchOrders();
      console.log('Orders response:', response);
      
      if (!response || !response.cumulative_orders || response.cumulative_orders.length === 0) {
        setError('No orders found for your restaurant at this time.');
        setLoading(false);
        return;
      }

      // Get the fetched_at timestamp from the first order (they should all have the same time)
      const fetchTime = response.individual_orders[0]?.fetched_at || new Date().toISOString();
      
      setCumulativeItems(response.cumulative_orders || []);
      setIndividualOrders(response.individual_orders || []);
      setFetchedAt(fetchTime);
      setHasOrders(true);
      setSuccess('Orders loaded successfully!');
    } catch (err: any) {
      console.error('Fetch orders error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderResponse = async (orderId: string, decision: 'accepted' | 'rejected') => {
    setError('');
    setSuccess('');

    try {
      await ordersService.submitResponse({
        order_id: orderId,
        decision: decision
      });

      setSuccess(`Order ${decision} successfully!`);
      
      // Update the order locally to show its decision status immediately
      const updatedOrders = individualOrders.map(order => {
        if ((order.id || order.order_id) === orderId) {
          return {
            ...order,
            order_status: decision,
            responded: true
          };
        }
        return order;
      });
      setIndividualOrders(updatedOrders);

      // Keep displaying even when all orders are processed
      // Don't reset or clear anything
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit response');
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="glass-panel rounded-2xl p-8 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-secondary mb-2">Orders Dashboard</h1>
            <p className="text-gray-500">Manage your incoming orders</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-4">
            <Link
              to="/orders/history"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Order History
            </Link>
            <div className="inline-block bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
              <p className="text-sm text-primary font-semibold">{user?.restaurant_name || 'N/A'}</p>
              <p className="text-xs text-primary/70">{user?.full_name || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-100 pt-6">
          {!hasOrders && !loading && (
            <div className="text-center py-8">
              <div className="mb-6">
                <svg className="w-16 h-16 mx-auto text-gray-300" style={{ width: '4rem', height: '4rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                <p className="text-gray-500 mt-2">Ready to receive orders?</p>
              </div>
              <button
                onClick={handleCheckOrders}
                disabled={loading}
                className="btn-primary px-8 py-3.5 text-lg shadow-lg shadow-primary/30 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Check for New Orders
              </button>
            </div>
          )}
          
          {loading && (
            <div className="text-center py-12">
              <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-primary transition ease-in-out duration-150 cursor-not-allowed">
                <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking for orders...
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-center shadow-sm animate-fade-in">
          <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
          {error}
        </div>
      )}

      {success && (
        <div className="bg-brand-50 border border-brand-200 text-brand-700 px-6 py-4 rounded-xl mb-6 flex items-center shadow-sm animate-fade-in">
          <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
          {success}
        </div>
      )}

      {hasOrders && cumulativeItems && cumulativeItems.length > 0 && (
        <div className="space-y-8 animate-fade-in-up">
          {/* Timestamp and Countdown Display */}
          <div className="bg-gradient-to-r from-primary/10 to-brand-50 rounded-2xl border border-primary/20 p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              {/* Refresh Button */}
              <button
                onClick={handleCheckOrders}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-lg border border-primary/30 text-primary font-semibold transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                title="Check for new orders"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Orders
              </button>

              {/* Orders Received Time */}
              <div className="flex items-center gap-3">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Orders Received</p>
                  <p className="text-lg font-bold text-gray-900">
                    {fetchedAt ? formatTimestamp(fetchedAt) : 'Just now'}
                  </p>
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center gap-3">
                <div className={`bg-white p-3 rounded-lg shadow-sm ${timeRemaining <= 300 ? 'animate-pulse' : ''}`}>
                  <svg className={`w-6 h-6 ${timeRemaining <= 300 ? 'text-red-600' : 'text-orange-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Time Remaining</p>
                  <p className={`text-2xl font-bold ${timeRemaining <= 300 ? 'text-red-600' : 'text-orange-600'}`}>
                    {formatCountdown(timeRemaining)}
                  </p>
                </div>
              </div>

              {/* Order Count */}
              <div className="flex items-center gap-3">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Pending Orders</p>
                  <p className="text-2xl font-bold text-brand-600">
                    {individualOrders.filter(order => !order.responded).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <CumulativeView items={cumulativeItems} />

          <IndividualView orders={individualOrders || []} onOrderResponse={handleOrderResponse} />
        </div>
      )}
    </div>
  );
};

export default OrdersPage;

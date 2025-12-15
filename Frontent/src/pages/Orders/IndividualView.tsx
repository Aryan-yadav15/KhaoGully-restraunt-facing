import { useState } from 'react';
import { CustomerOrder } from '../../types/order.types';
import { formatPrice, formatPhone } from '../../utils/formatters';

interface IndividualViewProps {
  orders: CustomerOrder[];
  onOrderResponse: (orderId: string, decision: 'accepted' | 'rejected') => Promise<void>;
}

const IndividualView: React.FC<IndividualViewProps> = ({ orders, onOrderResponse }) => {
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());

  const handleOrderResponse = async (orderId: string, decision: 'accepted' | 'rejected') => {
    setProcessingOrders(prev => new Set(prev).add(orderId));
    try {
      await onOrderResponse(orderId, decision);
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // Filter out any invalid orders
  const validOrders = (orders || []).filter(order => order && (order.id || order.order_id));

  return (
    <div className="glass-panel rounded-2xl p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-secondary flex items-center">
          <span className="bg-secondary/10 text-secondary p-2 rounded-lg mr-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
          </span>
          Individual Orders
        </h2>
        <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm font-medium border border-secondary/20">
          {validOrders.length} Orders
        </span>
      </div>

      {validOrders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
          <p className="text-gray-500 font-medium">No individual orders available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {validOrders.map((order, index) => {
            const orderId = order.id || order.order_id || `order-${index}`;
            
            return (
              <div
                key={orderId}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-primary/30 transition-all duration-200 group"
              >
                <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
                  <div>
                    <div className="flex items-center">
                      <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded mr-2">#{index + 1}</span>
                      <h3 className="text-sm font-medium text-gray-500">
                        ID: <span className="text-gray-800 font-mono text-xs">{orderId}</span>
                      </h3>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-bold text-gray-900">{order.customer_name || 'Guest Customer'}</p>
                      <p className="text-xs text-gray-500 flex items-center mt-0.5">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                        {order.customer_phone ? formatPhone(order.customer_phone) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  {order.payment_status && (
                    <span
                      className={`px-2 py-1 text-xs font-bold rounded-md uppercase tracking-wide ${
                        order.payment_status === 'paid'
                          ? 'bg-brand-50 text-brand-700 border border-brand-100'
                          : order.payment_status === 'pending'
                          ? 'bg-brand-50 text-brand-800 border border-brand-100'
                          : 'bg-red-50 text-red-700 border border-red-100'
                      }`}
                    >
                      {order.payment_status}
                    </span>
                  )}
                </div>

                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {(order.items || []).map((item, itemIndex) => (
                    <div key={itemIndex} className="flex justify-between items-start text-sm">
                      <div className="flex-1">
                        <div className="flex items-start">
                          <span className="font-bold text-gray-400 mr-2 text-xs mt-0.5">{item.quantity || 1}x</span>
                          <div>
                            <p className="font-medium text-gray-800 leading-tight">
                              {item.name || 'Unknown Item'}
                            </p>
                            {item.customizations && (
                              <p className="text-xs text-gray-500 mt-0.5 italic">
                                {item.customizations}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="font-medium text-gray-600 ml-2 whitespace-nowrap">{formatPrice(item.subtotal || 0)}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-3 bg-gray-50 -mx-5 -mb-5 px-5 py-3 rounded-b-xl mt-auto">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-medium text-gray-500">Total Amount</p>
                    <p className="text-lg font-bold text-gray-900">{formatPrice(order.total || order.total_amount || 0)}</p>
                  </div>
                  
                  {/* Customer Contact */}
                  <div className="mb-3 flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200">
                    <div className="flex items-center text-xs text-gray-600">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                      </svg>
                      {order.customer_phone ? formatPhone(order.customer_phone) : 'N/A'}
                    </div>
                    {order.customer_phone && (
                      <a
                        href={`tel:${order.customer_phone}`}
                        className="text-xs font-semibold text-primary hover:text-primary-dark flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                        </svg>
                        Call
                      </a>
                    )}
                  </div>

                  {/* Action Buttons or Status Display */}
                  {order.responded ? (
                    // Show decision status
                    <div className={`flex items-center justify-center px-4 py-3 rounded-lg font-bold text-sm ${
                      order.order_status === 'accepted' 
                        ? 'bg-brand-100 text-brand-800 border-2 border-brand-300' 
                        : 'bg-red-100 text-red-800 border-2 border-red-300'
                    }`}>
                      {order.order_status === 'accepted' ? (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                          </svg>
                          ORDER ACCEPTED
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                          ORDER REJECTED
                        </>
                      )}
                    </div>
                  ) : (
                    // Show action buttons
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOrderResponse(orderId, 'accepted')}
                        disabled={processingOrders.has(orderId)}
                        className="flex-1 bg-primary text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {processingOrders.has(orderId) ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Accept
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleOrderResponse(orderId, 'rejected')}
                        disabled={processingOrders.has(orderId)}
                        className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {processingOrders.has(orderId) ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IndividualView;

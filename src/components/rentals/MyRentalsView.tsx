import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatPHP, formatDisplayDateShort } from '../../utils/formatters';
import { OrderTrackingDetail } from './OrderTrackingDetail';
import {
  Clock,
  Package,
  ArrowRight,
  Sparkles,
  Calendar,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const MyRentalsView: React.FC = () => {
  const {
    orders,
    activeOrderId,
    setActiveOrderId,
    setActiveTab,
    rentalsFilter,
    setRentalsFilter,
  } = useApp();

  // If an active order is selected, show detail view
  if (activeOrderId) {
    const selectedOrder = orders.find((o) => o.id === activeOrderId);
    if (selectedOrder) {
      return (
        <OrderTrackingDetail
          order={selectedOrder}
          onBack={() => setActiveOrderId(null)}
        />
      );
    }
  }

  const currentOrders = orders.filter(
    (o) => !['Completed / Deposit Refunded', 'Payment Rejected'].includes(o.status)
  );

  const previousOrders = orders.filter(
    (o) => ['Completed / Deposit Refunded', 'Payment Rejected'].includes(o.status)
  );

  const displayedOrders =
    rentalsFilter === 'current'
      ? currentOrders
      : rentalsFilter === 'previous'
      ? previousOrders
      : orders;

  if (orders.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 pt-12 pb-24 text-center">
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E8E4DF] p-8">
          <div className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-[#E8E4DF] flex items-center justify-center mx-auto mb-4 text-[#141312]">
            <Clock className="w-5 h-5 stroke-[1.5]" />
          </div>
          <h2 className="font-serif text-lg font-semibold text-[#141312]">
            No Rentals Yet
          </h2>
          <p className="text-xs text-[#5C5854] mt-1.5 leading-relaxed max-w-xs mx-auto">
            You haven't booked any designer gowns yet. Explore our curated collections for your upcoming galas, weddings, and balls.
          </p>
          <button
            onClick={() => setActiveTab('explore')}
            className="mt-5 px-5 py-2.5 bg-[#141312] hover:bg-[#2A2725] text-white text-xs font-medium rounded-md transition-colors inline-flex items-center gap-2"
          >
            <span>Browse Catalog</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-32 space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[#E8E4DF] pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="font-serif text-xl font-semibold text-[#141312]">
            {rentalsFilter === 'current'
              ? `Current Rentals (${currentOrders.length})`
              : rentalsFilter === 'previous'
              ? `Previous Rentals (${previousOrders.length})`
              : `My Rentals & Bookings (${orders.length})`}
          </h1>
          <p className="text-xs text-[#5C5854] mt-0.5">
            Track verification status, delivery schedule, and deposit refunds
          </p>
        </div>

        <span className="text-[11px] text-[#78716C]">
          {currentOrders.length} active • {previousOrders.length} previous
        </span>
      </div>

      {/* Segmented Filter Bar for Current vs Previous Rentals */}
      <div className="flex items-center gap-1.5 p-1 bg-[#F5F3EF] border border-[#E8E4DF] rounded-xl text-xs">
        <button
          id="btn-filter-rentals-current"
          onClick={() => setRentalsFilter('current')}
          className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            rentalsFilter === 'current'
              ? 'bg-[#141312] text-white shadow-xs'
              : 'text-[#5C5854] hover:text-[#141312] hover:bg-white/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5 stroke-[1.75]" />
          <span>Current Rentals</span>
          {currentOrders.length > 0 && (
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                rentalsFilter === 'current'
                  ? 'bg-[#80232F] text-white'
                  : 'bg-[#E8E4DF] text-[#141312]'
              }`}
            >
              {currentOrders.length}
            </span>
          )}
        </button>

        <button
          id="btn-filter-rentals-previous"
          onClick={() => setRentalsFilter('previous')}
          className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            rentalsFilter === 'previous'
              ? 'bg-[#141312] text-white shadow-xs'
              : 'text-[#5C5854] hover:text-[#141312] hover:bg-white/60'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.75]" />
          <span>Previous Rentals</span>
          {previousOrders.length > 0 && (
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                rentalsFilter === 'previous'
                  ? 'bg-white text-[#141312]'
                  : 'bg-[#E8E4DF] text-[#141312]'
              }`}
            >
              {previousOrders.length}
            </span>
          )}
        </button>

        <button
          id="btn-filter-rentals-all"
          onClick={() => setRentalsFilter('all')}
          className={`py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1 cursor-pointer ${
            rentalsFilter === 'all'
              ? 'bg-[#141312] text-white shadow-xs'
              : 'text-[#5C5854] hover:text-[#141312] hover:bg-white/60'
          }`}
          title="View all bookings"
        >
          <span>All</span>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
              rentalsFilter === 'all'
                ? 'bg-white text-[#141312]'
                : 'bg-[#E8E4DF] text-[#141312]'
            }`}
          >
            {orders.length}
          </span>
        </button>
      </div>

      {/* Filter-specific Empty States */}
      {displayedOrders.length === 0 ? (
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E8E4DF] p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#FAF9F6] border border-[#E8E4DF] flex items-center justify-center mx-auto text-[#78716C]">
            {rentalsFilter === 'current' ? (
              <Clock className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
          </div>
          <h3 className="font-serif text-base font-semibold text-[#141312]">
            {rentalsFilter === 'current'
              ? 'No Current Active Rentals'
              : 'No Previous Rentals'}
          </h3>
          <p className="text-xs text-[#5C5854] max-w-sm mx-auto leading-relaxed">
            {rentalsFilter === 'current'
              ? "You don't have any gowns currently rented, in dispatch, or under verification."
              : 'Completed gown rentals, returned garments, and security deposit refunds will appear here once fulfilled.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              onClick={() =>
                setRentalsFilter(rentalsFilter === 'current' ? 'previous' : 'all')
              }
              className="px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs font-medium text-[#141312] hover:bg-[#FAF9F6]"
            >
              {rentalsFilter === 'current'
                ? `View Previous Rentals (${previousOrders.length})`
                : `View All Bookings (${orders.length})`}
            </button>
            <button
              onClick={() => setActiveTab('explore')}
              className="px-3 py-1.5 bg-[#141312] text-white rounded-md text-xs font-medium hover:bg-[#2A2725]"
            >
              Browse Catalog
            </button>
          </div>
        </div>
      ) : (
        /* Orders List */
        <div className="space-y-3">
          {displayedOrders.map((order) => {
            const isUnderVerification = order.status === 'Under Verification';
            const isApproved = order.status === 'Approved & Ready for Dispatch';
            const isCompleted = order.status === 'Completed / Deposit Refunded';

            return (
              <div
                key={order.id}
                id={`order-card-${order.id}`}
                onClick={() => setActiveOrderId(order.id)}
                className="bg-[#FFFFFF] rounded-xl border border-[#E8E4DF] p-4 hover:border-[#141312] transition-colors cursor-pointer space-y-3"
              >
                {/* Top row */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-medium uppercase tracking-wider text-[#948E88]">
                      Order Reference
                    </span>
                    <h3 className="font-mono text-xs font-semibold text-[#141312]">
                      {order.id}
                    </h3>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1.5 border ${
                      isUnderVerification
                        ? 'bg-[#FAF9F6] text-[#5C5854] border-[#E8E4DF]'
                        : isApproved || isCompleted
                        ? 'bg-[#141312] text-white border-[#141312]'
                        : 'bg-[#FAF9F6] text-[#141312] border-[#E8E4DF]'
                    }`}
                  >
                    {isUnderVerification ? (
                      <Clock className="w-3 h-3" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                    <span>{order.status}</span>
                  </span>
                </div>

                {/* Items summary */}
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-11 aspect-[3/4] rounded-md overflow-hidden bg-[#FAF9F6] border border-[#E8E4DF] shrink-0">
                        <img
                          src={item.garment.images[0]}
                          alt={item.garment.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 text-xs">
                        <p className="font-serif font-medium text-[#141312] line-clamp-1">
                          {item.garment.name}
                        </p>
                        <p className="text-[11px] text-[#5C5854]">
                          Size {item.selectedSize} • {item.selectedColor} • {item.durationDays} Days
                        </p>
                        <p className="text-[10px] text-[#948E88] font-medium flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {formatDisplayDateShort(item.startDate)} – {formatDisplayDateShort(item.endDate)}
                          </span>
                        </p>
                      </div>
                      <div className="text-right text-xs font-medium text-[#141312]">
                        {formatPHP(item.rentalPrice)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom bar */}
                <div className="pt-2 border-t border-[#E8E4DF] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#5C5854]">Total: </span>
                    <span className="font-semibold text-[#141312]">
                      {formatPHP(order.grandTotal)}
                    </span>
                    <span className="text-[10px] text-[#948E88] ml-1">
                      (Deposit {formatPHP(order.totalDeposit)})
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[#141312] font-medium text-xs">
                    <span>Track Status</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

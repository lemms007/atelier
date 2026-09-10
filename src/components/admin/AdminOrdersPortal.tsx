import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { RentalOrder, OrderStatus } from '../../types';
import { formatPHP, formatDisplayDateShort, formatFullName } from '../../utils/formatters';
import { AdminInventoryView } from './AdminInventoryView';
import { AdminLedgerView } from './AdminLedgerView';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  Maximize2,
  X,
  Truck,
  FileCheck,
  Calendar,
  CreditCard,
  UserCheck,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const AdminOrdersPortal: React.FC = () => {
  const {
    orders,
    updateOrderStatus,
    deleteOrder,
    showToast,
    adminTab,
    switchToUser,
    setActiveTab,
    setActiveOrderId,
  } = useApp();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    orders[0]?.id || null
  );
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [adminNoteInput, setAdminNoteInput] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Lock body scroll when inspection zoom is active
  useEffect(() => {
    if (previewImage) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [previewImage]);

  // If sub-tab is inventory or ledger, render their dedicated backoffice view
  if (adminTab === 'inventory') {
    return <AdminInventoryView />;
  }

  if (adminTab === 'ledger') {
    return <AdminLedgerView />;
  }

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'All') return true;
    if (filterStatus === 'Under Verification') return o.status === 'Under Verification';
    if (filterStatus === 'Approved') return o.status === 'Approved & Ready for Dispatch';
    if (filterStatus === 'Active') return ['Out for Delivery', 'Active Rental', 'Return in Transit'].includes(o.status);
    if (filterStatus === 'Completed') return o.status === 'Completed / Deposit Refunded';
    return true;
  });

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || filteredOrders[0];

  const handleApprove = (orderId: string) => {
    updateOrderStatus(
      orderId,
      'Approved & Ready for Dispatch',
      adminNoteInput || 'KYC Government ID & Payment certified by Sinta Lead Inspector.'
    );
    setAdminNoteInput('');
  };

  const handleAdvanceStage = (orderId: string, currentStatus: OrderStatus) => {
    let nextStatus: OrderStatus = 'Approved & Ready for Dispatch';
    if (currentStatus === 'Approved & Ready for Dispatch') nextStatus = 'Out for Delivery';
    else if (currentStatus === 'Out for Delivery') nextStatus = 'Active Rental';
    else if (currentStatus === 'Active Rental') nextStatus = 'Return in Transit';
    else if (currentStatus === 'Return in Transit') nextStatus = 'Completed / Deposit Refunded';

    updateOrderStatus(orderId, nextStatus, adminNoteInput || undefined);
    setAdminNoteInput('');
  };

  const handleRequestReupload = (orderId: string) => {
    updateOrderStatus(
      orderId,
      'ID Re-upload Requested',
      adminNoteInput || 'ID photo blurry or name mismatch. Please re-upload your valid government ID.'
    );
    setAdminNoteInput('');
  };

  const handleRejectPayment = (orderId: string) => {
    updateOrderStatus(
      orderId,
      'Payment Rejected',
      adminNoteInput || 'Payment reference could not be verified on banking gateway.'
    );
    setAdminNoteInput('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-32 space-y-4 animate-fadeIn">
      {/* Portal Top Announcement */}
      <div className="bg-[#141312] text-white p-4 sm:p-5 rounded-xl border border-[#141312] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[#948E88] text-[10px] font-medium uppercase tracking-wider mb-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-white stroke-[1.5]" />
            <span>Verification & Orders Desk</span>
          </div>
          <h1 className="font-serif text-lg sm:text-xl font-semibold">
            KYC & Payment Inspection Portal
          </h1>
          <p className="text-xs text-[#FAF9F6]/70 mt-0.5 max-w-xl">
            Inspect side-by-side government credentials, selfie biometrics, and GCash/Bank transaction slips before authorizing dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              switchToUser();
              setActiveTab('my-rentals');
            }}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-md transition-colors border border-white/20 flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Customer Renter View</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {['All', 'Under Verification', 'Approved', 'Active', 'Completed'].map((tab) => (
          <button
            key={tab}
            id={`admin-filter-${tab.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => setFilterStatus(tab)}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors border ${
              filterStatus === tab
                ? 'bg-[#141312] text-white border-[#141312]'
                : 'bg-white text-[#5C5854] border-[#E8E4DF] hover:text-[#141312]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-[#E8E4DF] text-center">
          <p className="text-xs text-[#5C5854]">No rental bookings in the database.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Order Queue List */}
          <div className="lg:col-span-5 space-y-2">
            <h3 className="font-serif text-xs font-semibold text-[#141312] px-1">
              Order Queue ({filteredOrders.length})
            </h3>

            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
              {filteredOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                const isUnderVerification = order.status === 'Under Verification';

                return (
                  <div
                    key={order.id}
                    id={`admin-order-card-${order.id}`}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#FFFFFF] border-[#141312]'
                        : 'bg-[#FFFFFF] border-[#E8E4DF] hover:border-[#141312]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-medium text-xs text-[#141312]">
                        {order.id}
                      </span>
                      <span
                        className={`text-[9px] font-medium px-2 py-0.5 rounded border ${
                          isUnderVerification
                            ? 'bg-[#FAF9F6] text-[#5C5854] border-[#E8E4DF]'
                            : 'bg-[#FAF9F6] text-[#141312] border-[#E8E4DF]'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-[#5C5854] space-y-0.5">
                      <p className="font-medium text-[#141312]">
                        {formatFullName(order.shipping.firstName, order.shipping.middleName, order.shipping.lastName) || order.shipping.fullName}
                      </p>
                      <p>{order.items.length} Garment(s) • Total: {formatPHP(order.grandTotal)}</p>
                      <p className="text-[10px] text-[#948E88]">
                        Payment: <strong className="uppercase font-medium text-[#5C5854]">{order.payment.method}</strong> (Ref: {order.payment.referenceNumber})
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Side-by-Side Inspection Deck */}
          {selectedOrder && (
            <div className="lg:col-span-7 bg-[#FFFFFF] rounded-xl border border-[#E8E4DF] p-4 space-y-4">
              {/* Inspection Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E4DF] pb-3">
                <div>
                  <span className="text-[9px] font-medium uppercase text-[#948E88] tracking-wider">
                    Inspecting Verification Record
                  </span>
                  <h2 className="font-serif text-base font-semibold text-[#141312]">
                    {selectedOrder.id} — {formatFullName(selectedOrder.shipping.firstName, selectedOrder.shipping.middleName, selectedOrder.shipping.lastName) || selectedOrder.shipping.fullName}
                  </h2>
                  {(selectedOrder.shipping.firstName || selectedOrder.shipping.lastName) && (
                    <p className="text-[11px] text-[#78716C]">
                      First: <span className="font-medium text-[#141312]">{selectedOrder.shipping.firstName || '—'}</span>
                      {selectedOrder.shipping.middleName ? <> • Middle: <span className="font-medium text-[#141312]">{selectedOrder.shipping.middleName}</span></> : null}
                      {' '}• Last: <span className="font-medium text-[#141312]">{selectedOrder.shipping.lastName || '—'}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-[#5C5854]">
                    Submitted {new Date(selectedOrder.createdAt).toLocaleDateString()} at {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveOrderId(selectedOrder.id);
                      setActiveTab('my-rentals');
                    }}
                    className="text-xs text-[#141312] font-medium underline hover:text-[#5C5854]"
                  >
                    View in Customer Mode
                  </button>
                </div>
              </div>

              {/* 1. KYC Credential Inspection (Front ID & Live Selfie) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-xs font-semibold text-[#141312] flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#141312] stroke-[1.5]" />
                    <span>Identity Verification Inspection</span>
                  </h4>
                  <span className="text-[10px] font-medium text-[#5C5854] bg-[#FAF9F6] border border-[#E8E4DF] px-2 py-0.5 rounded">
                    {selectedOrder.kyc.idType}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Front ID */}
                  <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-lg p-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-medium text-[#141312]">Front of Government ID</span>
                      <button
                        onClick={() =>
                          setPreviewImage({
                            url: selectedOrder.kyc.frontIdImage,
                            title: `Front of ID - ${selectedOrder.shipping.fullName}`,
                          })
                        }
                        className="text-[#5C5854] hover:text-[#141312] flex items-center gap-0.5 text-[10px] font-medium"
                      >
                        <Maximize2 className="w-3 h-3" /> Zoom
                      </button>
                    </div>

                    <div
                      onClick={() =>
                        setPreviewImage({
                          url: selectedOrder.kyc.frontIdImage,
                          title: `Front of ID - ${selectedOrder.shipping.fullName}`,
                        })
                      }
                      className="aspect-[16/10] rounded overflow-hidden bg-[#FAF9F6] border border-[#E8E4DF] cursor-pointer group relative"
                    >
                      <img
                        src={selectedOrder.kyc.frontIdImage}
                        alt="Front ID"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                        <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                      </div>
                    </div>
                  </div>

                  {/* Selfie with ID */}
                  <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-lg p-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-medium text-[#141312]">Live Biometric Selfie with ID</span>
                      <button
                        onClick={() =>
                          setPreviewImage({
                            url: selectedOrder.kyc.selfieWithIdImage,
                            title: `Biometric Selfie - ${selectedOrder.shipping.fullName}`,
                          })
                        }
                        className="text-[#5C5854] hover:text-[#141312] flex items-center gap-0.5 text-[10px] font-medium cursor-pointer"
                      >
                        <Maximize2 className="w-3 h-3" /> Zoom
                      </button>
                    </div>

                    <div
                      onClick={() =>
                        setPreviewImage({
                          url: selectedOrder.kyc.selfieWithIdImage,
                          title: `Biometric Selfie - ${selectedOrder.shipping.fullName}`,
                        })
                      }
                      className="aspect-[16/10] rounded overflow-hidden bg-[#FAF9F6] border border-[#E8E4DF] cursor-pointer group relative"
                    >
                      <img
                        src={selectedOrder.kyc.selfieWithIdImage}
                        alt="Selfie"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                        <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Payment Proof Inspection (Slip + Reference code) */}
              <div className="space-y-2.5 pt-2 border-t border-[#E8E4DF]">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-xs font-semibold text-[#141312] flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#141312] stroke-[1.5]" />
                    <span>Payment Proof & Rail Verification</span>
                  </h4>
                  <span className="text-xs font-semibold text-[#141312]">
                    Due: {formatPHP(selectedOrder.grandTotal)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center bg-[#FAF9F6] p-2.5 rounded-lg border border-[#E8E4DF]">
                  {/* Payment Receipt Image */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-medium text-[#141312]">Transaction Slip</span>
                      <button
                        onClick={() =>
                          setPreviewImage({
                            url: selectedOrder.payment.receiptImage,
                            title: `Payment Receipt - Ref: ${selectedOrder.payment.referenceNumber}`,
                          })
                        }
                        className="text-[#5C5854] hover:text-[#141312] flex items-center gap-0.5 text-[10px] font-medium cursor-pointer"
                      >
                        <Maximize2 className="w-3 h-3" /> Zoom
                      </button>
                    </div>
                    <div
                      onClick={() =>
                        setPreviewImage({
                          url: selectedOrder.payment.receiptImage,
                          title: `Payment Receipt - Ref: ${selectedOrder.payment.referenceNumber}`,
                        })
                      }
                      className="aspect-[16/10] rounded overflow-hidden bg-[#FAF9F6] border border-[#E8E4DF] cursor-pointer group relative"
                    >
                      <img
                        src={selectedOrder.payment.receiptImage}
                        alt="Receipt"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                        <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="text-xs space-y-1.5">
                    <div>
                      <span className="text-[9px] uppercase font-medium text-[#948E88]">
                        Payment Rail & Channel
                      </span>
                      <p className="font-medium text-[#141312] uppercase text-xs">
                        {selectedOrder.payment.method} {selectedOrder.payment.bankName ? `(${selectedOrder.payment.bankName})` : ''}
                      </p>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase font-medium text-[#948E88]">
                        Submitted Reference Number
                      </span>
                      <p className="font-mono font-semibold text-xs text-[#141312]">
                        {selectedOrder.payment.referenceNumber}
                      </p>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase font-medium text-[#948E88]">
                        Account Name / Sender
                      </span>
                      <p className="text-[#141312] font-medium text-xs">
                        {selectedOrder.payment.accountName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Operator Audit Notes Input */}
              <div className="space-y-1 pt-2 border-t border-[#E8E4DF]">
                <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block">
                  Inspector Audit Note (Optional)
                </label>
                <input
                  type="text"
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  placeholder="e.g. Identity certified against government registry. Approved for white-glove courier."
                  className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                />
              </div>

              {/* 4. Operator Action Buttons */}
              <div className="pt-2 border-t border-[#E8E4DF] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    id="btn-admin-request-reupload"
                    type="button"
                    onClick={() => handleRequestReupload(selectedOrder.id)}
                    className="px-2.5 py-1.5 bg-white border border-[#E8E4DF] text-[#5C5854] hover:text-[#141312] hover:bg-[#FAF9F6] text-xs font-medium rounded-md flex items-center gap-1 transition-colors"
                  >
                    <AlertTriangle className="w-3 h-3 stroke-[1.5]" />
                    <span>Request Re-upload of ID</span>
                  </button>

                  <button
                    id="btn-admin-reject-payment"
                    type="button"
                    onClick={() => handleRejectPayment(selectedOrder.id)}
                    className="px-2.5 py-1.5 bg-white border border-[#E8E4DF] text-[#5C5854] hover:text-[#141312] hover:bg-[#FAF9F6] text-xs font-medium rounded-md flex items-center gap-1 transition-colors"
                  >
                    <XCircle className="w-3 h-3 stroke-[1.5]" />
                    <span>Reject Payment</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {selectedOrder.status === 'Under Verification' ? (
                    <button
                      id="btn-admin-approve-order"
                      type="button"
                      onClick={() => handleApprove(selectedOrder.id)}
                      className="px-4 py-2 bg-[#141312] hover:bg-[#2A2725] text-white text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Mark for Shipment</span>
                    </button>
                  ) : selectedOrder.status !== 'Completed / Deposit Refunded' ? (
                    <button
                      id="btn-admin-advance-stage"
                      type="button"
                      onClick={() => handleAdvanceStage(selectedOrder.id, selectedOrder.status)}
                      className="px-4 py-2 bg-[#141312] hover:bg-[#2A2725] text-white text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Advance to Next Stage</span>
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-[#141312] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Completed & Deposit Refunded
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lightbox Zoom for Inspection Proofs */}
      {previewImage &&
        createPortal(
          <div
            className="fixed inset-0 z-60 bg-black/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 animate-fadeIn select-none"
            onClick={() => setPreviewImage(null)}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer z-10"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
            <div
              className="relative max-h-[85vh] max-w-[92vw] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl border border-white/10"
                referrerPolicy="no-referrer"
              />
              <p className="text-white/90 font-serif text-xs mt-3 text-center bg-black/60 px-3 py-1 rounded-full border border-white/10">
                {previewImage.title}
              </p>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

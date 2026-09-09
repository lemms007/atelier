import React, { useState } from 'react';
import { RentalOrder, OrderStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatPHP, formatDisplayDateShort } from '../../utils/formatters';
import { ConciergeModal } from '../common/ConciergeModal';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Package,
  ShieldCheck,
  Calendar,
  MessageCircle,
  Copy,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { GarmentImage } from '../common/GarmentImage';

const ORDER_STAGES: OrderStatus[] = [
  'Payment Pending',
  'Under Verification',
  'Approved & Ready for Dispatch',
  'Out for Delivery',
  'Active Rental',
  'Return in Transit',
  'Completed / Deposit Refunded',
];

interface OrderTrackingDetailProps {
  order: RentalOrder;
  onBack?: () => void;
}

export const OrderTrackingDetail: React.FC<OrderTrackingDetailProps> = ({
  order,
  onBack,
}) => {
  const { showToast, setSelectedGarment } = useApp();
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);

  const currentStageIndex = ORDER_STAGES.indexOf(order.status);

  const isUnderVerification = order.status === 'Under Verification';
  const isApproved = order.status === 'Approved & Ready for Dispatch';
  const isOutForDelivery = order.status === 'Out for Delivery';
  const isActiveRental = order.status === 'Active Rental';
  const isReturnInTransit = order.status === 'Return in Transit';
  const isCompleted = order.status === 'Completed / Deposit Refunded';

  const copyRef = () => {
    navigator.clipboard.writeText(order.id);
    showToast(`Order reference ${order.id} copied!`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-2 pb-32 space-y-4 animate-fadeIn">
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-[#5C5854] hover:text-[#141312] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Rentals</span>
        </button>
      )}

      {/* Header with Reference & Status */}
      <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E8E4DF] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E4DF] pb-3">
          <div>
            <span className="text-[9px] uppercase font-medium text-[#948E88] tracking-wider block">
              Rental Order Reference
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="font-mono text-sm font-semibold text-[#141312]">
                {order.id}
              </h2>
              <button
                onClick={copyRef}
                className="p-1 text-[#948E88] hover:text-[#141312] rounded"
                title="Copy Reference Number"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
        </div>

        {/* Dynamic Verification Alert Banner */}
        {isUnderVerification && (
          <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-lg p-3 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-[#141312] shrink-0 mt-0.5 stroke-[1.5]" />
            <div className="text-xs text-[#5C5854]">
              <strong className="block font-medium text-[#141312]">Under Verification</strong>
              <span>
                Our concierge team typically verifies government IDs and payment slips within 1–2 hours during business hours (9AM–9PM PHT). You will be notified immediately upon dispatch approval.
              </span>
            </div>
          </div>
        )}

        {isApproved && (
          <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-lg p-3 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#141312] shrink-0 mt-0.5 stroke-[1.5]" />
            <div className="text-xs text-[#5C5854]">
              <strong className="block font-medium text-[#141312]">Approved & Ready for Dispatch</strong>
              <span>
                Your identity and payment have been certified. The garments are professionally steamed, sealed in luxury hanging dust bags, and staged for courier handover.
              </span>
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-lg p-3 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#141312] shrink-0 mt-0.5 stroke-[1.5]" />
            <div className="text-xs text-[#5C5854]">
              <strong className="block font-medium text-[#141312]">Rental Completed • Deposit Refunded</strong>
              <span>
                The garment was returned in pristine condition. Your security deposit of {formatPHP(order.totalDeposit)} has been refunded to your original payment channel.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Visual Horizontal Lifecycle Stepper */}
      <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E8E4DF] space-y-3">
        <h3 className="font-serif text-xs font-semibold text-[#141312]">
          Rental Lifecycle Progress
        </h3>

        {/* Horizontal Desktop / Tablet & Mobile Stepper */}
        <div className="relative overflow-x-auto no-scrollbar pb-2">
          <div className="flex items-start justify-between min-w-[560px] relative">
            {/* Connecting line */}
            <div className="absolute top-3 left-4 right-4 h-px bg-[#E8E4DF] -z-0" />

            {ORDER_STAGES.map((stage, idx) => {
              const isPast = currentStageIndex > idx;
              const isCurrent = currentStageIndex === idx;

              return (
                <div key={stage} className="flex flex-col items-center relative z-10 w-20 text-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-all border ${
                      isPast
                        ? 'bg-[#141312] text-white border-[#141312]'
                        : isCurrent
                        ? 'bg-[#141312] text-white border-[#141312] ring-2 ring-[#141312]/20'
                        : 'bg-[#FAF9F6] text-[#948E88] border-[#E8E4DF]'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[9px] mt-1.5 leading-tight ${
                      isCurrent
                        ? 'font-medium text-[#141312]'
                        : isPast
                        ? 'font-medium text-[#5C5854]'
                        : 'text-[#948E88]'
                    }`}
                  >
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rented Items */}
      <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E8E4DF] space-y-3">
        <h3 className="font-serif text-xs font-semibold text-[#141312]">
          Garment Reservation
        </h3>

        <div className="divide-y divide-[#E8E4DF]">
          {order.items.map((item) => (
            <div key={item.id} className="py-3 flex gap-3 items-center">
              <div
                onClick={() => setSelectedGarment(item.garment)}
                className="w-12 aspect-[3/4] bg-[#FAF9F6] rounded-md overflow-hidden shrink-0 cursor-pointer border border-[#E8E4DF]"
              >
                <GarmentImage
                  src={item.garment.images[0]}
                  alt={item.garment.name}
                  garmentName={item.garment.name}
                  designerName={item.garment.designer}
                  categoryName={item.garment.category}
                  aspectRatio="aspect-auto"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 text-xs">
                <span className="text-[9px] font-medium uppercase text-[#948E88] tracking-wider">
                  {item.garment.designer}
                </span>
                <h4
                  onClick={() => setSelectedGarment(item.garment)}
                  className="font-serif font-medium text-[#141312] cursor-pointer hover:underline"
                >
                  {item.garment.name}
                </h4>
                <div className="text-[11px] text-[#5C5854] mt-0.5">
                  Size: <strong>{item.selectedSize}</strong> • Color: <strong>{item.selectedColor}</strong>
                </div>
                <div className="text-[10px] text-[#948E88] font-medium mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {formatDisplayDateShort(item.startDate)} – {formatDisplayDateShort(item.endDate)} ({item.durationDays} Days)
                  </span>
                </div>
              </div>

              <div className="text-right text-xs">
                <span className="font-medium text-[#141312] block">
                  {formatPHP(item.rentalPrice)}
                </span>
                <span className="text-[10px] text-[#948E88]">
                  +{formatPHP(item.securityDeposit)} deposit
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery & Payment Ledger */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Delivery Details */}
        <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E8E4DF] text-xs space-y-2">
          <h4 className="font-serif font-semibold text-[#141312] flex items-center gap-1.5 border-b border-[#E8E4DF] pb-2">
            <Truck className="w-3.5 h-3.5 text-[#141312] stroke-[1.5]" />
            <span>Delivery Destination</span>
          </h4>
          <p className="font-medium text-[#141312]">{order.shipping.fullName}</p>
          <p className="text-[#5C5854]">{order.shipping.mobileNumber}</p>
          <p className="text-[#5C5854] leading-relaxed">{order.shipping.deliveryAddress}</p>
          {order.shipping.landmarkNotes && (
            <p className="text-[11px] text-[#5C5854] bg-[#FAF9F6] p-2 rounded border border-[#E8E4DF]">
              Note: {order.shipping.landmarkNotes}
            </p>
          )}
        </div>

        {/* Payment & Refund Terms */}
        <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E8E4DF] text-xs space-y-2">
          <h4 className="font-serif font-semibold text-[#141312] flex items-center gap-1.5 border-b border-[#E8E4DF] pb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#141312] stroke-[1.5]" />
            <span>Payment Breakdown</span>
          </h4>
          <div className="flex justify-between text-[#5C5854]">
            <span>Rental Subtotal:</span>
            <span className="font-medium text-[#141312]">{formatPHP(order.subtotalRental)}</span>
          </div>
          <div className="flex justify-between text-[#5C5854]">
            <span>Courier Delivery & Return:</span>
            <span className="font-medium text-[#141312]">
              {order.shippingFee > 0 ? formatPHP(order.shippingFee) : 'Lalamove (Shouldered by Renter)'}
            </span>
          </div>
          <div className="flex justify-between text-[#5C5854]">
            <span>Refundable Deposit:</span>
            <span className="font-medium text-[#141312]">{formatPHP(order.totalDeposit)}</span>
          </div>
          <div className="pt-2 border-t border-[#E8E4DF] flex justify-between font-medium text-xs">
            <span className="text-[#141312]">Total Paid:</span>
            <span className="font-semibold text-[#141312]">{formatPHP(order.grandTotal)}</span>
          </div>
          <p className="text-[10px] text-[#948E88]">
            Method: <strong className="uppercase font-medium text-[#5C5854]">{order.payment.method.replace('_', ' ')}</strong> (Ref: {order.payment.referenceNumber})
          </p>
        </div>
      </div>

      {/* Concierge Action */}
      <div className="pt-1">
        <button
          id="btn-concierge-support"
          onClick={() => setIsConciergeOpen(true)}
          className="w-full h-10 bg-[#FFFFFF] hover:bg-[#FAF9F6] border border-[#E8E4DF] text-[#141312] font-medium text-xs rounded-md flex items-center justify-center gap-2 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5 text-[#141312] stroke-[1.5]" />
          <span>Concierge Support via WhatsApp / Viber</span>
        </button>
      </div>

      <ConciergeModal
        isOpen={isConciergeOpen}
        onClose={() => setIsConciergeOpen(false)}
        orderReference={order.id}
      />
    </div>
  );
};

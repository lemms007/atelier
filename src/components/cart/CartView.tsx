import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatPHP, formatDisplayDateShort } from '../../utils/formatters';
import {
  ShoppingBag,
  Trash2,
  Calendar,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { GarmentImage } from '../common/GarmentImage';

export const CartView: React.FC = () => {
  const {
    cart,
    removeFromCart,
    clearCart,
    cartRentalSubtotal,
    cartDepositSubtotal,
    cartGrandTotal,
    setIsCheckoutOpen,
    setActiveTab,
    setSelectedGarment,
    openFaqModal,
  } = useApp();

  // Courier shipping is calculated live via the Lalamove app and shouldered directly by the renter
  const estimatedShipping = 0;
  const totalDueNow = cartRentalSubtotal;

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 pt-16 pb-28 text-center">
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E8E4DF] p-8">
          <div className="w-12 h-12 rounded-full bg-[#F5F3EF] flex items-center justify-center mx-auto mb-3 text-[#141312]">
            <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
          </div>
          <h2 className="font-serif text-lg font-semibold text-[#141312]">
            Your Rental Bag is Empty
          </h2>
          <p className="text-xs text-[#5C5854] mt-1.5 leading-relaxed max-w-xs mx-auto">
            Discover our curated archive of designer couture gowns and Filipiniana pieces available for 4 to 14-day hire.
          </p>
          <button
            id="btn-cart-empty-explore"
            onClick={() => setActiveTab('explore')}
            className="mt-5 px-5 py-2.5 bg-[#141312] text-white text-xs font-medium rounded-md hover:opacity-90 active:scale-95 transition-all inline-flex items-center gap-2"
          >
            <span>Explore Collection</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-32 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-3">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-semibold text-[#141312]">
            Rental Bag ({cart.length})
          </h1>
          <p className="text-[11px] text-[#948E88]">
            Reserved for your selected dates
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-[#948E88] hover:text-[#141312] flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      {/* Item List */}
      <div className="space-y-3">
        {cart.map((item) => (
          <div
            key={item.id}
            id={`cart-item-${item.id}`}
            className="bg-[#FFFFFF] rounded-xl border border-[#E8E4DF] p-3.5 flex gap-3.5 sm:gap-4 relative"
          >
            {/* Thumbnail */}
            <div
              onClick={() => setSelectedGarment(item.garment)}
              className="w-18 sm:w-20 aspect-[3/4] bg-[#F5F3EF] rounded-lg overflow-hidden shrink-0 cursor-pointer border border-[#E8E4DF]"
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

            {/* Details */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between pr-6">
                  <div>
                    <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-[#948E88]">
                      {item.garment.designer}
                    </span>
                    <h3
                      onClick={() => setSelectedGarment(item.garment)}
                      className="font-serif text-sm font-semibold text-[#141312] line-clamp-1 cursor-pointer hover:text-[#80232F]"
                    >
                      {item.garment.name}
                    </h3>
                  </div>
                </div>

                {/* Variant tags */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-[#5C5854]">
                  <span className="bg-[#F5F3EF] border border-[#E8E4DF] px-2 py-0.5 rounded text-[#141312] font-medium">
                    Size {item.selectedSize}
                  </span>
                  <span className="bg-[#F5F3EF] border border-[#E8E4DF] px-2 py-0.5 rounded">
                    {item.selectedColor}
                  </span>
                </div>

                {/* Rental Date pill */}
                <div className="mt-1.5 bg-[#F5F3EF] border border-[#E8E4DF] rounded px-2 py-0.5 flex items-center gap-1.5 text-[10px] text-[#141312] font-medium w-fit">
                  <Calendar className="w-3 h-3 text-[#948E88]" />
                  <span>
                    {formatDisplayDateShort(item.startDate)} – {formatDisplayDateShort(item.endDate)} ({item.durationDays} Days)
                  </span>
                </div>
              </div>

              {/* Pricing breakdown per item */}
              <div className="mt-2.5 pt-2 border-t border-[#E8E4DF] flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] text-[#5C5854]">Price: </span>
                  <span className="font-semibold text-[#141312] text-xs">
                    {formatPHP(item.rentalPrice)}
                  </span>
                </div>
                <div className="text-[10px] text-[#5C5854]">
                  <span>Refundable: </span>
                  <span className="font-medium text-[#141312]">
                    {formatPHP(item.securityDeposit)}
                  </span>
                  <span className="text-[#948E88]"> (50%)</span>
                </div>
              </div>
            </div>

            {/* Remove item button */}
            <button
              id={`btn-remove-${item.id}`}
              onClick={() => removeFromCart(item.id)}
              className="absolute top-3 right-3 w-7 h-7 rounded flex items-center justify-center text-[#948E88] hover:text-[#141312] transition-colors"
              title="Remove item"
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E8E4DF] p-4 sm:p-5 space-y-3">
        <h3 className="font-serif text-sm font-semibold text-[#141312] border-b border-[#E8E4DF] pb-2">
          Summary
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-[#5C5854]">
            <span>Subtotal ({cart.length} {cart.length === 1 ? 'Garment' : 'Garments'})</span>
            <span className="font-medium text-[#141312]">
              {formatPHP(cartRentalSubtotal)}
            </span>
          </div>

          <div className="flex items-center justify-between text-[#5C5854]">
            <div className="flex items-center gap-1.5">
              <span>Refundable (50%)</span>
              <span className="text-[9px] text-[#141312] bg-[#F5F3EF] border border-[#E8E4DF] px-1.5 py-0.2 rounded font-medium">
                Refunded upon return
              </span>
            </div>
            <span className="font-medium text-[#141312]">
              {formatPHP(cartDepositSubtotal)}
            </span>
          </div>

          <div className="flex items-center justify-between text-[#5C5854]">
            <div className="flex items-center gap-1.5">
              <span>Lalamove Courier Delivery</span>
              <span className="text-[9px] text-[#141312] bg-[#F5F3EF] border border-[#E8E4DF] px-1.5 py-0.2 rounded font-medium">
                Shouldered by Renter
              </span>
            </div>
            <span className="font-medium text-[#141312] text-[11px]">
              Paid via Lalamove App
            </span>
          </div>

          <div className="pt-2 border-t border-[#E8E4DF] flex items-baseline justify-between text-sm">
            <div>
              <span className="font-semibold text-[#141312] block">
                Total
              </span>
              <span className="text-[10px] text-[#948E88]">
                {formatPHP(cartDepositSubtotal)} (50%) will be refunded upon garment return
              </span>
            </div>
            <span className="font-serif text-lg font-semibold text-[#141312]">
              {formatPHP(totalDueNow)}
            </span>
          </div>
        </div>

        {/* Deposit Trust Guarantee */}
        <div className="bg-[#F5F3EF] border border-[#E8E4DF] rounded-lg p-3 flex items-start justify-between gap-2 text-[11px] text-[#5C5854]">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#141312] shrink-0 mt-0.5 stroke-[1.5]" />
            <p>
              <strong className="text-[#141312]">Sinta Guarantee:</strong> Your 50% refundable amount of {formatPHP(cartDepositSubtotal)} is returned within 24 hours of garment return inspection.
            </p>
          </div>
          <button
            type="button"
            id="btn-cart-deposit-faq"
            onClick={() => openFaqModal('deposits')}
            className="text-[#80232F] hover:underline font-medium shrink-0 ml-1 cursor-pointer whitespace-nowrap"
            title="Read security deposit FAQs"
          >
            Deposit FAQs
          </button>
        </div>
      </div>

      {/* Checkout CTA */}
      <div className="pt-1">
        <button
          id="btn-cart-proceed-checkout"
          onClick={() => setIsCheckoutOpen(true)}
          className="w-full h-11 bg-[#141312] hover:bg-[#2A2725] text-white font-medium text-xs rounded-md active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <span>Proceed to Checkout</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

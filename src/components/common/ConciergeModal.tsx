import React from 'react';
import { X, MessageCircle, Phone, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderReference?: string;
}

export const ConciergeModal: React.FC<ConciergeModalProps> = ({
  isOpen,
  onClose,
  orderReference,
}) => {
  const { showToast } = useApp();
  const [message, setMessage] = React.useState(
    orderReference
      ? `Hello Sinta Wardrobe Rental Concierge! I would like to inquire regarding my rental order #${orderReference}.`
      : 'Hello Sinta Wardrobe Rental! I would like assistance with sizing and date reservation.'
  );

  if (!isOpen) return null;

  const handleSendMessage = (channel: 'whatsapp' | 'viber') => {
    showToast(`Connecting to Sinta Concierge via ${channel === 'whatsapp' ? 'WhatsApp' : 'Viber'}...`);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FFFFFF] w-full max-w-md rounded-xl border border-[#E8E4DF] shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#141312] text-white p-4 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-sm font-semibold">Sinta Concierge</h3>
            <p className="text-[11px] text-[#FAF9F6]/70">Available 9:00 AM – 9:00 PM PHT</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 text-xs">
          <div className="bg-[#FAF9F6] p-3 rounded-lg border border-[#E8E4DF] text-[#5C5854]">
            <p>
              Direct contact with our Manila stylists for expedited verification, fitting inquiries, or scheduled courier pickups.
            </p>
          </div>

          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
              Your Message
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md p-2.5 text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
            />
          </div>

          {/* Quick Channels */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleSendMessage('whatsapp')}
              className="py-2.5 px-3 bg-[#141312] hover:bg-[#2A2725] text-white font-medium text-xs rounded-md flex items-center justify-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={() => handleSendMessage('viber')}
              className="py-2.5 px-3 bg-white border border-[#E8E4DF] hover:bg-[#FAF9F6] text-[#141312] font-medium text-xs rounded-md flex items-center justify-center gap-1.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Viber Chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

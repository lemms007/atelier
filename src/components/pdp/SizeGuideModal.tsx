import React, { useState } from 'react';
import { X, Ruler, Sparkles, Check } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSize: string;
  onSelectSize: (size: any) => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  onClose,
  selectedSize,
  onSelectSize,
}) => {
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches');

  if (!isOpen) return null;

  const sizeChartInches = [
    { size: 'XS', bust: '31 - 32', waist: '23 - 24', hips: '33 - 34', phSize: '0 - 2' },
    { size: 'S', bust: '33 - 34', waist: '25 - 26', hips: '35 - 36', phSize: '4 - 6' },
    { size: 'M', bust: '35 - 36', waist: '27 - 28', hips: '37 - 38', phSize: '8 - 10' },
    { size: 'L', bust: '37 - 39', waist: '29 - 31', hips: '39 - 41', phSize: '12 - 14' },
    { size: 'XL', bust: '40 - 42', waist: '32 - 34', hips: '42 - 44', phSize: '16' },
  ];

  const sizeChartCm = [
    { size: 'XS', bust: '78 - 81', waist: '58 - 61', hips: '84 - 86', phSize: '0 - 2' },
    { size: 'S', bust: '83 - 86', waist: '63 - 66', hips: '89 - 91', phSize: '4 - 6' },
    { size: 'M', bust: '89 - 91', waist: '68 - 71', hips: '94 - 96', phSize: '8 - 10' },
    { size: 'L', bust: '94 - 99', waist: '73 - 78', hips: '99 - 104', phSize: '12 - 14' },
    { size: 'XL', bust: '101 - 106', waist: '81 - 86', hips: '106 - 111', phSize: '16' },
  ];

  const chart = unit === 'inches' ? sizeChartInches : sizeChartCm;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FFFFFF] w-full max-w-md rounded-2xl border border-[#F2ECE4] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#F2ECE4] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-[#8C2D3B]" />
            <h3 className="font-serif text-lg font-bold text-[#191716]">
              Atelier Sizing Guide
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#9E9891] hover:text-[#191716] hover:bg-[#F2ECE4]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Unit Toggle */}
          <div className="flex items-center justify-between bg-[#FAF8F5] p-1.5 rounded-xl border border-[#F2ECE4]">
            <span className="text-xs font-medium text-[#6B6661] px-2">Measurement Unit:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setUnit('inches')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  unit === 'inches'
                    ? 'bg-[#8C2D3B] text-white shadow-sm'
                    : 'text-[#6B6661] hover:text-[#191716]'
                }`}
              >
                Inches (in)
              </button>
              <button
                onClick={() => setUnit('cm')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  unit === 'cm'
                    ? 'bg-[#8C2D3B] text-white shadow-sm'
                    : 'text-[#6B6661] hover:text-[#191716]'
                }`}
              >
                Centimeters (cm)
              </button>
            </div>
          </div>

          {/* Sizing Table */}
          <div className="overflow-x-auto border border-[#F2ECE4] rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF8F5] border-b border-[#F2ECE4] text-[#6B6661] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Bust</th>
                  <th className="py-2.5 px-3">Waist</th>
                  <th className="py-2.5 px-3">Hips</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE4]">
                {chart.map((row) => {
                  const isCurrent = selectedSize === row.size;
                  return (
                    <tr
                      key={row.size}
                      className={`hover:bg-[#FAF8F5] transition-colors ${
                        isCurrent ? 'bg-[#8C2D3B]/5 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-[#191716] flex items-center gap-1">
                        {row.size}
                        {isCurrent && <Check className="w-3 h-3 text-[#8C2D3B]" />}
                      </td>
                      <td className="py-2.5 px-3 text-[#6B6661]">{row.bust}</td>
                      <td className="py-2.5 px-3 text-[#6B6661]">{row.waist}</td>
                      <td className="py-2.5 px-3 text-[#6B6661]">{row.hips}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            onSelectSize(row.size);
                            onClose();
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border ${
                            isCurrent
                              ? 'bg-[#8C2D3B] text-white border-[#8C2D3B]'
                              : 'bg-white text-[#191716] border-[#F2ECE4] hover:border-[#8C2D3B]'
                          }`}
                        >
                          {isCurrent ? 'Selected' : 'Select'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Fitting Notes */}
          <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#F2ECE4] text-[11px] text-[#6B6661] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#8C2D3B] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#C8A27A]" />
              <span>Complimentary Fit Concierge</span>
            </div>
            <p>
              Not sure about your size? Our Manila atelier team provides complimentary virtual fitting consultations via WhatsApp or Viber prior to dispatch.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#F2ECE4] bg-[#FAF8F5] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#191716] text-white text-xs font-semibold rounded-xl"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

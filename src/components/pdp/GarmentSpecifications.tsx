import React from 'react';
import { ChevronDown, ChevronUp, Truck } from 'lucide-react';
import { Garment } from '../../types';
import { formatPHP } from '../../utils/formatters';

interface GarmentSpecificationsProps {
  garment: Garment;
  openSection: string | null;
  toggleSection: (section: string) => void;
  className?: string;
}

export const GarmentSpecifications: React.FC<GarmentSpecificationsProps> = ({
  garment,
  openSection,
  toggleSection,
  className = '',
}) => {
  return (
    <div
      className={`bg-[#FFFFFF] rounded-xl border border-[#E8E4DF] divide-y divide-[#E8E4DF] ${className}`}
    >
      {/* 1. Design & Silhouette Accordion */}
      <div>
        <button
          id="btn-spec-details"
          type="button"
          onClick={() => toggleSection('details')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-[#FAF9F6] transition-colors"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-[#141312]">
            Design & Silhouette
          </span>
          {openSection === 'details' ? (
            <ChevronUp className="w-4 h-4 text-[#5C5854]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#5C5854]" />
          )}
        </button>
        {openSection === 'details' && (
          <div className="p-4 pt-0 space-y-2 text-xs text-[#5C5854]">
            <p>
              <strong className="text-[#141312]">Fabric Composition:</strong> {garment.fabric}
            </p>
            <p>
              <strong className="text-[#141312]">Silhouette:</strong> {garment.silhouette}
            </p>
            <p>
              <strong className="text-[#141312]">Ideal Occasion:</strong> {garment.occasion}
            </p>
            {garment.details && garment.details.length > 0 && (
              <ul className="list-disc list-inside space-y-1 pt-1 text-[#141312]">
                {garment.details.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* 2. Model Fit & Proportions Accordion */}
      <div>
        <button
          id="btn-spec-measurements"
          type="button"
          onClick={() => toggleSection('measurements')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-[#FAF9F6] transition-colors"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-[#141312]">
            Model Fit & Proportions
          </span>
          {openSection === 'measurements' ? (
            <ChevronUp className="w-4 h-4 text-[#5C5854]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#5C5854]" />
          )}
        </button>
        {openSection === 'measurements' && (
          <div className="p-4 pt-0 text-xs text-[#5C5854] space-y-1.5">
            <div className="grid grid-cols-2 gap-2 bg-[#F5F3EF] p-3 rounded-lg border border-[#E8E4DF]">
              <div>
                <span className="text-[9px] text-[#948E88] uppercase block">Height</span>
                <span className="font-medium text-[#141312]">
                  {garment.modelMeasurements.height}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-[#948E88] uppercase block">Wearing Size</span>
                <span className="font-medium text-[#80232F]">
                  {garment.modelMeasurements.wearingSize}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-[#948E88] uppercase block">Bust & Waist</span>
                <span className="font-medium text-[#141312]">
                  {garment.modelMeasurements.bust} • {garment.modelMeasurements.waist}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-[#948E88] uppercase block">Hips</span>
                <span className="font-medium text-[#141312]">
                  {garment.modelMeasurements.hips}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Security Deposit & Guarantee Accordion */}
      <div>
        <button
          id="btn-spec-deposit"
          type="button"
          onClick={() => toggleSection('deposit')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-[#FAF9F6] transition-colors"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-[#141312]">
            Security Deposit & Guarantee
          </span>
          {openSection === 'deposit' ? (
            <ChevronUp className="w-4 h-4 text-[#5C5854]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#5C5854]" />
          )}
        </button>
        {openSection === 'deposit' && (
          <div className="p-4 pt-0 text-xs text-[#5C5854] space-y-2">
            <div className="bg-[#F5F3EF] border border-[#E8E4DF] p-3 rounded-lg text-[#141312]">
              <p className="font-semibold">
                100% Refundable Security Deposit: {formatPHP(garment.securityDeposit)}
              </p>
              <p className="text-[11px] text-[#5C5854] mt-1">
                Your deposit is returned via GCash or Bank Transfer within 24 hours of return inspection.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4. Dry Cleaning & Delivery Accordion */}
      <div>
        <button
          id="btn-spec-care"
          type="button"
          onClick={() => toggleSection('care')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-[#FAF9F6] transition-colors"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-[#141312]">
            Dry Cleaning & Delivery
          </span>
          {openSection === 'care' ? (
            <ChevronUp className="w-4 h-4 text-[#5C5854]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#5C5854]" />
          )}
        </button>
        {openSection === 'care' && (
          <div className="p-4 pt-0 text-xs text-[#5C5854] space-y-2">
            <p>{garment.careInstructions}</p>
            <div className="flex items-center gap-2 text-[#141312] font-medium pt-1">
              <Truck className="w-4 h-4 text-[#948E88]" />
              <span>Door-to-door courier service across the Philippines</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

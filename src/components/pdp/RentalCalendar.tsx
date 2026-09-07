import React, { useState } from 'react';
import { Garment } from '../../types';
import {
  formatPHP,
  formatDisplayDateShort,
  calculateDaysBetween,
  addDaysToDate,
  calculateRentalPrice,
} from '../../utils/formatters';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';

const FIXED_RENTAL_DURATIONS = [4, 8, 12, 14] as const;

interface RentalCalendarProps {
  garment: Garment;
  startDate: string;
  endDate: string;
  onChangeDates: (start: string, end: string, duration: number) => void;
}

export const RentalCalendar: React.FC<RentalCalendarProps> = ({
  garment,
  startDate,
  endDate,
  onChangeDates,
}) => {
  // Calendar month navigation state
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (startDate) {
      const [y, m] = startDate.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Derive duration (fixed to 4, 8, 12, or 14 days)
  const computedDuration =
    startDate && endDate ? calculateDaysBetween(startDate, endDate) : 4;
  const currentDuration = FIXED_RENTAL_DURATIONS.includes(
    computedDuration as (typeof FIXED_RENTAL_DURATIONS)[number]
  )
    ? computedDuration
    : 4;

  const nextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (
      prev.getFullYear() < today.getFullYear() ||
      (prev.getFullYear() === today.getFullYear() && prev.getMonth() < today.getMonth())
    ) {
      return;
    }
    setCurrentMonth(prev);
  };

  const toDateKey = (year: number, month: number, day: number): string => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthName = currentMonth.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: { key: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  for (let i = 0; i < firstDayIndex; i++) {
    days.push({ key: `filler-${i}`, dayNum: 0, isCurrentMonth: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const key = toDateKey(year, month, d);
    days.push({ key, dayNum: d, isCurrentMonth: true });
  }

  const currentRentalPrice = calculateRentalPrice(
    garment.price_min || garment.basePrice4Days,
    garment.dailyExtraRate,
    currentDuration
  );

  /**
   * Selection rule:
   * When a user selects a date, it sets the delivery date.
   * The return date is automatically and fixedly computed based on the selected duration.
   */
  const handleSelectDeliveryDate = (dateKey: string) => {
    if (dateKey < todayKey) return;
    const newStartDate = dateKey;
    const newEndDate = addDaysToDate(newStartDate, currentDuration - 1);
    onChangeDates(newStartDate, newEndDate, currentDuration);
  };

  /**
   * Switching rental days preset:
   * Changes the duration to 4, 8, 12, or 14 days and adjusts the fixed return date.
   */
  const handleSelectDuration = (daysCount: number) => {
    const baseStart = startDate || todayKey;
    const newEndDate = addDaysToDate(baseStart, daysCount - 1);
    onChangeDates(baseStart, newEndDate, daysCount);
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E8E4DF] rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-[#141312] stroke-[1.75]" />
          <div>
            <h4 className="font-serif text-sm font-semibold text-[#141312]">
              Rental Schedule
            </h4>
            <p className="text-[10px] text-[#948E88]">
              Select your delivery date · Return date is fixed to your duration
            </p>
          </div>
        </div>
      </div>

      {/* Duration Preset Selector */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-[#948E88] block">
          Rental Duration:
        </label>
        <div className="grid grid-cols-4 gap-2">
          {FIXED_RENTAL_DURATIONS.map((daysCount) => {
            const isSelected = currentDuration === daysCount;
            return (
              <button
                key={daysCount}
                type="button"
                id={`btn-preset-${daysCount}d`}
                onClick={() => handleSelectDuration(daysCount)}
                className={`py-2 rounded-lg text-xs font-medium text-center transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-[#141312] text-white border-[#141312] shadow-xs'
                    : 'bg-[#FAF9F6] text-[#5C5854] border-[#E8E4DF] hover:border-[#141312] hover:text-[#141312]'
                }`}
              >
                {daysCount} Days
              </button>
            );
          })}
        </div>
      </div>

      {/* Delivery & Return Date Status Display */}
      <div className="grid grid-cols-2 gap-2 bg-[#FAF9F6] p-2.5 rounded-lg border border-[#E8E4DF]">
        <div className="bg-white p-2 rounded border border-[#E8E4DF]/80">
          <span className="text-[9px] uppercase font-semibold text-[#80232F] tracking-wider block">
            1. Delivery Date
          </span>
          <span className="text-xs font-medium text-[#141312]">
            {startDate ? formatDisplayDateShort(startDate) : 'Choose date below'}
          </span>
        </div>
        <div className="bg-white p-2 rounded border border-[#E8E4DF]/80">
          <span className="text-[9px] uppercase font-semibold text-[#5C5854] tracking-wider block">
            2. Return Pickup
          </span>
          <span className="text-xs font-medium text-[#141312]">
            {endDate ? formatDisplayDateShort(endDate) : 'Auto-calculated'}
          </span>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between px-1 pt-1">
        <button
          type="button"
          id="btn-cal-prev-month"
          onClick={prevMonth}
          className="w-7 h-7 rounded-md flex items-center justify-center text-[#5C5854] hover:bg-[#F5F3EF] hover:text-[#141312] transition-colors cursor-pointer"
          title="Previous Month"
        >
          <ChevronLeft className="w-4 h-4 stroke-[1.75]" />
        </button>

        <span className="font-serif text-sm font-semibold text-[#141312]">
          {monthName}
        </span>

        <button
          type="button"
          id="btn-cal-next-month"
          onClick={nextMonth}
          className="w-7 h-7 rounded-md flex items-center justify-center text-[#5C5854] hover:bg-[#F5F3EF] hover:text-[#141312] transition-colors cursor-pointer"
          title="Next Month"
        >
          <ChevronRight className="w-4 h-4 stroke-[1.75]" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-medium text-[#948E88] uppercase tracking-[0.16em]">
        <span>Su</span>
        <span>Mo</span>
        <span>Tu</span>
        <span>We</span>
        <span>Th</span>
        <span>Fr</span>
        <span>Sa</span>
      </div>

      {/* Calendar Grid: Date selection sets Delivery Date, Return Date is fixed */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((item, idx) => {
          if (!item.isCurrentMonth) {
            return <div key={`empty-${idx}`} className="h-8 w-full" />;
          }

          const dateKey = item.key;
          const isPast = dateKey < todayKey;
          const isStart = dateKey === startDate;
          const isEnd = dateKey === endDate;
          const isInRange = Boolean(
            startDate && endDate && dateKey > startDate && dateKey < endDate
          );

          let cellStyle = 'text-[#141312] hover:bg-[#F5F3EF] cursor-pointer';
          let tooltip = '';

          if (isPast) {
            cellStyle = 'text-[#948E88]/30 cursor-not-allowed';
            tooltip = 'Date has passed';
          } else if (isStart && isEnd) {
            cellStyle = 'bg-[#141312] text-white font-medium rounded-md z-10 shadow-xs';
            tooltip = `Delivery & Return: ${formatDisplayDateShort(dateKey)}`;
          } else if (isStart) {
            cellStyle = 'bg-[#141312] text-white font-medium rounded-l-md z-10 shadow-xs';
            tooltip = `Delivery Arrival: ${formatDisplayDateShort(dateKey)}`;
          } else if (isEnd) {
            cellStyle = 'bg-[#141312] text-white font-medium rounded-r-md z-10 shadow-xs';
            tooltip = `Return Courier Pickup: ${formatDisplayDateShort(dateKey)}`;
          } else if (isInRange) {
            cellStyle =
              'bg-[#F5F3EF] text-[#141312] font-medium hover:bg-[#E8E4DF] cursor-pointer';
            const daysFromStart = calculateDaysBetween(startDate, dateKey);
            tooltip = `Day ${daysFromStart} of ${currentDuration} · Click to set as new delivery date`;
          } else {
            const previewReturn = addDaysToDate(dateKey, currentDuration - 1);
            tooltip = `Click to set Delivery: ${formatDisplayDateShort(
              dateKey
            )} → Return: ${formatDisplayDateShort(previewReturn)}`;
          }

          return (
            <div key={dateKey} className="relative group/day">
              <button
                type="button"
                id={`cal-day-${dateKey}`}
                disabled={isPast}
                onClick={() => handleSelectDeliveryDate(dateKey)}
                onMouseEnter={() => setHoveredDate(dateKey)}
                onMouseLeave={() => setHoveredDate(null)}
                className={`w-full h-8 rounded-sm text-xs flex items-center justify-center transition-colors ${cellStyle}`}
              >
                <span>{item.dayNum}</span>
              </button>

              {hoveredDate === dateKey && tooltip && !isPast && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-30 px-2 py-0.5 bg-[#141312] text-[#FAF9F6] text-[10px] rounded shadow-md whitespace-nowrap pointer-events-none">
                  {tooltip}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Date Range Summary Banner */}
      <div className="bg-[#F5F3EF] border border-[#E8E4DF] rounded-lg p-3 flex items-center justify-between text-xs">
        <div>
          <span className="text-[9px] uppercase font-medium text-[#948E88] tracking-wider block">
            Scheduled Rental Window
          </span>
          <span className="font-medium text-[#141312]">
            {startDate ? formatDisplayDateShort(startDate) : 'Select delivery'}
            {' → '}
            {endDate ? formatDisplayDateShort(endDate) : 'Auto-calculated'}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[9px] uppercase font-medium text-[#948E88] tracking-wider block">
            Rental Rate
          </span>
          <span className="font-semibold text-[#141312]">
            {formatPHP(currentRentalPrice)}
          </span>
        </div>
      </div>

      {/* Explanatory Rule Hint */}
      <div className="flex items-start gap-1.5 text-[11px] text-[#5C5854]">
        <Info className="w-3.5 h-3.5 text-[#948E88] shrink-0 mt-0.5" />
        <p>
          Clicking any date sets your delivery arrival. Return courier pickup is automatically scheduled on day {currentDuration}. Complimentary dry cleaning is included.
        </p>
      </div>
    </div>
  );
};

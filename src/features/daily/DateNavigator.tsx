
import React, { useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { format, addDays, isSameDay, isToday, addYears, getYear, getMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { PatientRecord, PatientType } from '@shared/types';
import { ChevronLeft, ChevronRight, Calendar, Disc } from 'lucide-react';

interface DateNavigatorProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  records: PatientRecord[];
}

const DateNavigator: React.FC<DateNavigatorProps> = ({ currentDate, onSelectDate, records }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const [days, setDays] = useState<Date[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(currentDate);

  useEffect(() => {
    const newDays: Date[] = [];
    // Generate 5 days before and 5 days after (11 total)
    // The logic relies on the selected day being exactly in the middle (index 5)
    for (let i = -5; i <= 5; i++) {
      newDays.push(addDays(currentDate, i));
    }
    setDays(newDays);
  }, [currentDate]);

  // Center the selected date (which is always in the middle of the array)
  const scrollToCenter = useCallback((smooth = false) => {
    if (scrollRef.current && !showPicker) {
      const container = scrollRef.current;

      // Each item is w-[54px] + mx-[3px] (6px total margin) = 60px
      // Use fixed value for consistency or measure DOM
      const itemWidth = 60;
      const containerWidth = container.clientWidth;
      const centerIndex = 5; // The selected date is always at index 5

      // Calculate scroll position to center the item:
      // (ItemStart + ItemHalf) - (ContainerHalf)
      const scrollPos = (centerIndex * itemWidth) + (itemWidth / 2) - (containerWidth / 2);

      container.scrollTo({ left: scrollPos, behavior: smooth ? 'smooth' : 'auto' });
    }
  }, [showPicker]);

  useLayoutEffect(() => {
    // Execute immediately on layout to prevent visual jump
    scrollToCenter(false);

    // Re-center on resize
    const handleResize = () => scrollToCenter(false);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [days, scrollToCenter, showPicker]);

  const recordsByDate = useMemo(() => {
    const map = new Map<string, PatientRecord[]>();
    records.forEach(record => {
      const key = record.date;
      const existing = map.get(key);
      if (existing) {
        existing.push(record);
      } else {
        map.set(key, [record]);
      }
    });
    return map;
  }, [records]);

  const getIndicators = useCallback((date: Date) => {
    const key = format(date, 'yyyy-MM-dd');
    const dayRecords = recordsByDate.get(key) || [];
    const hasHosp = dayRecords.some(r => r.typeId === 'hospitalizado' || (!r.typeId && r.type === PatientType.HOSPITALIZADO));
    const hasPoli = dayRecords.some(r => r.typeId === 'policlinico' || (!r.typeId && r.type === PatientType.POLICLINICO));
    const hasExtra = dayRecords.some(r => r.typeId === 'extra' || (!r.typeId && r.type === PatientType.EXTRA));
    const hasTurno = dayRecords.some(r => r.typeId === 'turno' || (!r.typeId && r.type === PatientType.TURNO));
    return { hasHosp, hasPoli, hasExtra, hasTurno, count: dayRecords.length };
  }, [recordsByDate]);

  const handleMonthJump = useCallback((monthIndex: number) => {
    const d = new Date();
    d.setFullYear(getYear(pickerDate));
    d.setMonth(monthIndex);
    onSelectDate(d);
    setShowPicker(false);
  }, [onSelectDate, pickerDate]);

  const handleYearChange = useCallback((increment: number) => {
    setPickerDate(prev => addYears(prev, increment));
  }, []);

  // Handle Scroll Wheel to move dates
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      if (e.deltaX > 0) onSelectDate(addDays(currentDate, 1));
      else onSelectDate(addDays(currentDate, -1));
    } else {
      if (e.deltaY > 0) onSelectDate(addDays(currentDate, 1));
      else onSelectDate(addDays(currentDate, -1));
    }
  }, [currentDate, onSelectDate]);

  return (
    <div className="flex flex-col w-full max-w-lg mx-auto relative group">
      <div className="flex items-center justify-between mb-0 px-1 pt-0.5 relative z-20">
        <button onClick={() => onSelectDate(addDays(currentDate, -1))} className="p-2 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-700/50 text-gray-400 transition-colors active:scale-95"><ChevronLeft className="w-4 h-4" /></button>

        <div className="flex items-center gap-2">
          <button onClick={() => { setPickerDate(currentDate); setShowPicker(!showPicker); }} className="group/btn relative px-2.5 py-0.5 rounded-lg bg-white dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-700 transition-all">
            <h2 className="text-[12px] font-bold text-gray-800 dark:text-gray-200 capitalize flex items-center gap-2">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
              <Calendar className={`w-3 h-3 text-blue-500 transition-transform duration-300 ${showPicker ? 'rotate-180' : ''}`} />
            </h2>
          </button>
          {!isSameDay(currentDate, new Date()) && (
            <button
              onClick={() => onSelectDate(new Date())}
              className="p-1.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors animate-fade-in active:scale-95"
              title="Ir a Hoy"
            >
              <Disc className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button onClick={() => onSelectDate(addDays(currentDate, 1))} className="p-2 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-700/50 text-gray-400 transition-colors active:scale-95"><ChevronRight className="w-4 h-4" /></button>
      </div>

      {showPicker && (
        <>
          <div className="absolute top-10 left-0 right-0 z-[60] animate-fade-in px-2">
            <div className="glass-panel bg-white/95 dark:bg-gray-900/95 rounded-2xl p-4 shadow-2xl border border-gray-200 dark:border-gray-700 relative backdrop-blur-xl">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-gray-700/50">
                <button onClick={() => handleYearChange(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ChevronLeft className="w-4 h-4" /></button>
                <span className="font-bold text-lg text-gray-800 dark:text-white">{format(pickerDate, 'yyyy')}</span>
                <button onClick={() => handleYearChange(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <button key={i} onClick={() => handleMonthJump(i)} className={`p-2 rounded-lg text-sm font-medium transition-all ${getMonth(currentDate) === i && getYear(currentDate) === getYear(pickerDate) ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>{format(new Date(2024, i, 1), 'MMM', { locale: es })}</button>
                ))}
              </div>
              <button onClick={() => { onSelectDate(new Date()); setShowPicker(false); }} className="w-full mt-4 py-3 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 transition-colors">Ir a Hoy</button>
            </div>
          </div>
          {/* Click Outside Backdrop - Positioned fixed to cover everything but below the picker z-index */}
          <div className="fixed inset-0 z-[55]" onClick={() => setShowPicker(false)}></div>
        </>
      )}

      <div
        ref={scrollRef}
        onWheel={handleWheel}
        className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory py-1 w-full select-none relative z-0 outline-none focus:outline-none px-0"
      >
        {days.map((date, index) => {
          const isSelected = isSameDay(date, currentDate);
          const isTodayDate = isToday(date);
          const { hasHosp, hasPoli, hasExtra, hasTurno, count } = getIndicators(date);

          // Distinctive color for Today when not selected
          const baseClasses = isSelected
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105 z-10 h-11 border-blue-600'
            : isTodayDate
              ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 border-amber-200 dark:border-amber-800/50 h-10'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 h-10 border-gray-100 dark:border-gray-700/50';

          return (
            <div
              key={date.toISOString()}
              ref={index === 5 ? itemRef : null}
              onClick={() => onSelectDate(date)}
              className={`snap-center shrink-0 w-[46px] mx-[1px] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 rounded-xl relative border ${baseClasses}`}
            >
              <span className={`text-[8px] font-bold uppercase tracking-wider ${isSelected ? 'text-blue-100' : isTodayDate ? 'text-amber-700 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'}`}>{format(date, 'EEE', { locale: es }).replace('.', '')}</span>
              <span className={`text-[13px] font-bold leading-none ${isSelected ? 'text-white' : isTodayDate ? 'text-amber-900 dark:text-amber-100' : 'text-gray-800 dark:text-gray-200'}`}>{format(date, 'd')}</span>
              <div className="flex gap-0.5 mt-0.5 h-1 items-end">
                {hasHosp && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-red-500'}`}></div>}
                {hasPoli && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-blue-200' : 'bg-blue-500'}`}></div>}
                {hasTurno && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-purple-200' : 'bg-purple-500'}`}></div>}
                {hasExtra && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-emerald-200' : 'bg-emerald-500'}`}></div>}
                {count === 0 && isSelected && <div className="w-1 h-1 rounded-full bg-blue-400/50"></div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DateNavigator;

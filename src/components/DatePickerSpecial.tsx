'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import moment from 'moment';

interface TimeSlot {
  _id: string;
  fromTime: string;
  toTime: string;
  duration: number;
  status: string;
}

interface SlotResponse {
  SlotDate: string;
  SlotTimeByDuration: {
    [key: string]: TimeSlot[];
  };
}

interface DatePickerProps {
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  astrologerId: string;
  duration?: number;
  setSlotsError: (slots: string | null) => void;
  isUrgentMode?: boolean;
}

const useClickOutside = (ref: React.RefObject<HTMLElement | null>, callback: () => void) => {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [ref, callback]);
};

const DatePickerSpecial: React.FC<DatePickerProps> = ({ 
  selectedDate, 
  onDateSelect, 
  astrologerId,
  duration = 30,
  setSlotsError,
  isUrgentMode = false
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);

  const calendarRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useClickOutside(calendarRef, () => {
    if (showCalendar) {
      setShowCalendar(false);
    }
  });

  const formatDateToLocalString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDateFromString = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Fetch available slot dates with modified date range
  const fetchAvailableDates = async () => {
    if (!astrologerId) return;
    const currentDate = new Date().toLocaleDateString('en-CA'); 
    const currentTime = moment().add(15, 'minutes').format('HH:mm');
    
    try {
      setLoadingDates(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/astrologer/get_slots_date_duration/${astrologerId}?duration=${duration}&currentDate=${currentDate}&currentTime=${currentTime}`
      );
      const data = await response.json();
      
      if (data.success && data.slotDates) {
        let filteredDates = data.slotDates;
        
        // REVERSED LOGIC: Filter dates to show ONLY after 2 weeks if NOT in urgent mode
        if (!isUrgentMode) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const oneMonthFromNow = new Date(today);
          oneMonthFromNow.setDate(today.getDate() + 30); // Day 30

          // Show only dates AFTER 30 days (from day 31 onwards)
          filteredDates = data.slotDates.filter((dateStr: string) => {
            const slotDate = parseDateFromString(dateStr);
            slotDate.setHours(0, 0, 0, 0);
            return slotDate > oneMonthFromNow; // Only dates AFTER day 30
          });
        }
        // If urgent mode is ON, show all dates (from today onwards)
        
        setAvailableDates(filteredDates);
        
        // Auto-select first available date
        if (filteredDates.length > 0) {
          onDateSelect(filteredDates[0]);
        }
        setSlotsError(null);
      }
    } catch (error) {
      console.error('Error fetching available dates:', error);
      setSlotsError('Failed to fetch available slots');
    } finally {
      setLoadingDates(false);
    }
  };

  useEffect(() => {
    fetchAvailableDates();
  }, [astrologerId, duration, isUrgentMode]);

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate date boundaries based on urgent mode
    const oneMonthFromToday = new Date(today);
    oneMonthFromToday.setDate(today.getDate() + 30);
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      currentDate.setHours(0, 0, 0, 0);
      
      const dateString = formatDateToLocalString(currentDate);
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = currentDate.toDateString() === today.toDateString();
      const isPast = currentDate < today;
      
      // REVERSED LOGIC: If NOT urgent mode, disable dates within 2 weeks
      const isWithinOneMonth = currentDate <= oneMonthFromToday && currentDate >= today;
      const isBlockedByPolicy = !isUrgentMode && isWithinOneMonth;

      const isAvailable = availableDates.includes(dateString) && !isBlockedByPolicy;
      const isSelected = selectedDate === dateString;
      
      days.push({
        date: currentDate,
        dateString,
        day: currentDate.getDate(),
        isCurrentMonth,
        isToday,
        isPast,
        isAvailable,
        isSelected,
        isBlockedByPolicy
      });
    }
    
    return days;
  };

  const handleDateClick = (dateString: string, isAvailable: boolean, isPast: boolean) => {
    if (isPast || !isAvailable) return;
    
    const localDate = parseDateFromString(dateString);
    const formattedDateString = formatDateToLocalString(localDate);
    
    onDateSelect(formattedDateString);
    setShowCalendar(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleButtonClick = (event: React.MouseEvent) => {
    event.preventDefault();
    setShowCalendar(!showCalendar);
  };

  const getSelectedDateDisplay = () => {
    if (!selectedDate) return 'Select a date';
    
    const localDate = parseDateFromString(selectedDate);
    return localDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-3 relative">
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-md bg-white hover:border-[#980d0d] transition-colors"
      >
        <span className={selectedDate ? 'text-gray-800' : 'text-gray-500'}>
          {getSelectedDateDisplay()}
        </span>
        <Calendar size={20} className="text-gray-400" />
      </button>

      {showCalendar && (
        <div 
          ref={calendarRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 border border-gray-200 rounded-lg bg-white shadow-lg p-4 space-y-4" 
          style={{ maxWidth: '320px' }}
        >
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-gray-100 rounded"
              disabled={loadingDates}
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="font-semibold text-gray-800">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-100 rounded"
              disabled={loadingDates}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {loadingDates && (
            <div className="text-center py-4 text-sm text-gray-500">
              Loading available dates...
            </div>
          )}

          {!loadingDates && (
            <>
              <div 
                className="text-center text-xs font-medium text-gray-500 mb-2"
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(7, 1fr)', 
                  gap: '4px' 
                }}
              >
                {weekDays.map(day => (
                  <div key={day} className="p-2">{day}</div>
                ))}
              </div>

              <div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(7, 1fr)', 
                  gap: '4px' 
                }}
              >
                {calendarDays.map((dayInfo, index) => (
                  <button
                    key={index}
                    onClick={() => handleDateClick(dayInfo.dateString, dayInfo.isAvailable, dayInfo.isPast)}
                    disabled={dayInfo.isPast || !dayInfo.isAvailable || dayInfo.isBlockedByPolicy}
                    className={`
                      relative p-2 text-sm rounded-md transition-colors flex items-center justify-center
                      ${!dayInfo.isCurrentMonth 
                        ? 'text-gray-300 cursor-default' 
                        : dayInfo.isPast || dayInfo.isBlockedByPolicy
                          ? 'text-gray-400 cursor-not-allowed'
                          : dayInfo.isAvailable
                            ? dayInfo.isSelected
                              ? 'bg-[#980d0d] text-white font-semibold'
                              : 'bg-amber-100 text-gray-800 hover:bg-amber-200 cursor-pointer'
                            : 'text-gray-400 cursor-not-allowed'
                      }
                    `}
                    style={{ minHeight: '36px', width: '36px' }}
                  >
                    {dayInfo.day}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-gray-600 pt-2 border-t">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-amber-100 rounded border"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-[#980d0d] rounded"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-200 rounded"></div>
              <span>Unavailable</span>
            </div>
          </div>
          
          {/* Show range indicator */}
          {!isUrgentMode && (
            <div className="text-xs text-center text-amber-600 bg-amber-50 p-2 rounded">
              Showing dates after 30 days only
            </div>
          )}
          {isUrgentMode && (
            <div className="text-xs text-center text-amber-600 bg-amber-50 p-2 rounded">
               Urgent mode: All dates available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatePickerSpecial;

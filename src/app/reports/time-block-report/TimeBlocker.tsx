"use client";

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar, CheckSquare, Square, User, Users, AlertCircle } from 'lucide-react';

const reportPrefixes = [
  { value: '#LJR-', label: 'Life Journey Report', code: 'LJR' },
  { value: '#LCR-', label: 'Life Changing Report', code: 'LCR' },
  { value: '#KM-', label: 'Kundli Matching Report', code: 'KM' },
  { value: '#LR-', label: 'Love Report', code: 'LR' },
  { value: '#VR-', label: 'Name Number Report' , code : 'VR' },
  { value: '#BNR-', label: 'Baby Name Report', code : 'BNR' }
  
];

interface Astrologer {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  reportTypes: string[];
}

interface Slot {
  time: string;
  capacity: number;
  availableAstrologers: Array<{ _id: string; name: string }>;
  isAvailable: boolean;
  isBlocked?: boolean;
  blockedSlotId?: string | null;
  reason?: string;
  blockedBy?: string;
  blockScope?: string;
}

export default function SlotBlockingManagement() {
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTomorrowDate());
  const [selectedPrefix, setSelectedPrefix] = useState('#LJR-');
  const [selectedAstrologer, setSelectedAstrologer] = useState<string>('all');
  const [allAstrologers, setAllAstrologers] = useState<Astrologer[]>([]);
  const [loadingAstrologers, setLoadingAstrologers] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingSlots, setProcessingSlots] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const getNext10Days = () => {
    const dates = [];
    for (let i = 0; i < 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i + 1);
      dates.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      });
    }
    return dates;
  };

  const next10Days = getNext10Days();

  const fetchAllAstrologers = async () => {
    setLoadingAstrologers(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/life-journey-report/report-astrologers`
      );
      const data = await response.json();
      if (data.success) {
        setAllAstrologers(data.astrologers || []);
      }
    } catch (error) {
      console.error('Error fetching astrologers:', error);
    } finally {
      setLoadingAstrologers(false);
    }
  };

  useEffect(() => {
    fetchAllAstrologers();
  }, []);

  const fetchSlots = async () => {
    if (!selectedDate || !selectedPrefix) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        prefix: selectedPrefix
      });

      if (selectedAstrologer !== 'all') {
        params.append('astrologerId', selectedAstrologer);
      }

      const availableResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/life-journey-report/available-consultation-slots?${params.toString()}`
      );
      const availableData = await availableResponse.json();

      if (!availableData.success) {
        toast.error(availableData.message || "Failed to fetch slots");
        setAvailableSlots([]);
        setBlockedSlots([]);
        setLoading(false);
        return;
      }

      const blockedParams = new URLSearchParams({
        date: selectedDate,
        astrologerId: selectedAstrologer,
        prefix: selectedPrefix
      });

      const blockedResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/life-journey-report/blocked-slots?${blockedParams.toString()}`
      );
      const blockedData = await blockedResponse.json();

      const available = (availableData.slots || []).map((slot: any) => ({
        ...slot,
        isAvailable: true,
        isBlocked: false,
        blockedSlotId: null
      }));

      const blocked = (blockedData.success ? blockedData.blockedSlots || [] : []).map((slot: any) => {
        const isGlobal = !slot.astrologerId && !slot.prefix;
        const isReportSpecific = slot.prefix && !slot.astrologerId;
        const isAstrologerSpecific = slot.astrologerId && !slot.prefix;

        return {
          time: slot.timeRange,
          capacity: 0,
          availableAstrologers: [],
          isAvailable: false,
          isBlocked: true,
          blockedSlotId: slot._id,
          reason: slot.reason,
          blockedBy: slot.blockedBy,
          blockScope: isGlobal 
            ? 'All Reports & Astrologers' 
            : isReportSpecific 
            ? `${slot.prefix} (All Astrologers)`
            : isAstrologerSpecific
            ? `${slot.astrologerId?.astrologerName || 'Astrologer'} (All Reports)`
            : `${slot.prefix} - ${slot.astrologerId?.astrologerName || 'Astrologer'}`
        };
      });

      setAvailableSlots(available);
      setBlockedSlots(blocked);
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error("Failed to fetch slots");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
    setSelectionMode(false);
    setSelectedSlots(new Set());
  }, [selectedDate, selectedPrefix, selectedAstrologer]);

  const handleBlock = async (timeRange: string) => {
    setProcessingSlots(prev => new Set(prev).add(timeRange));

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/life-journey-report/blocked-slots`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: selectedDate,
            timeRange,
            prefix: selectedPrefix,
            astrologerId: selectedAstrologer,
            blockedBy: 'Admin',
            reason: 'Blocked via slot management'
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchSlots();
        toast.success("Slot blocked successfully");
        return true;
      } else {
        toast.error(data.message || "Failed to block slot");
        return false;
      }
    } catch (error) {
      console.error('Error blocking slot:', error);
      toast.error("An error occurred while blocking slot");
      return false;
    } finally {
      setProcessingSlots(prev => {
        const newSet = new Set(prev);
        newSet.delete(timeRange);
        return newSet;
      });
    }
  };

  const handleUnblock = async (blockedSlotId: string, timeRange: string) => {
    if (!blockedSlotId) {
      toast.error("Invalid slot ID");
      return false;
    }

    setProcessingSlots(prev => new Set(prev).add(timeRange));

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/life-journey-report/blocked-slots/${blockedSlotId}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        await fetchSlots();
        toast.success("Slot unblocked successfully");
        return true;
      } else {
        toast.error(data.message || "Failed to unblock slot");
        return false;
      }
    } catch (error) {
      console.error('Error unblocking slot:', error);
      toast.error("An error occurred while unblocking");
      return false;
    } finally {
      setProcessingSlots(prev => {
        const newSet = new Set(prev);
        newSet.delete(timeRange);
        return newSet;
      });
    }
  };

  const toggleSelectionMode = () => {
    if (!selectionMode) {
      const allSlotTimes = [...availableSlots.map(s => s.time), ...blockedSlots.map(s => s.time)];
      setSelectedSlots(new Set(allSlotTimes));
      setSelectionMode(true);
    } else {
      setSelectionMode(false);
      setSelectedSlots(new Set());
    }
  };

  const toggleSlotSelection = (timeRange: string) => {
    setSelectedSlots(prev => {
      const newSet = new Set(prev);
      if (newSet.has(timeRange)) {
        newSet.delete(timeRange);
      } else {
        newSet.add(timeRange);
      }
      return newSet;
    });
  };

  const handleBulkAction = async (action: 'block' | 'unblock') => {
    if (selectedSlots.size === 0) {
      toast.error("Please select at least one slot");
      return;
    }

    setBulkProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const timeRange of Array.from(selectedSlots)) {
      const availableSlot = availableSlots.find(s => s.time === timeRange);
      const blockedSlot = blockedSlots.find(s => s.time === timeRange);

      if (action === 'block' && availableSlot) {
        const success = await handleBlock(timeRange);
        if (success) successCount++;
        else failCount++;
      } else if (action === 'unblock' && blockedSlot?.blockedSlotId) {
        const success = await handleUnblock(blockedSlot.blockedSlotId, timeRange);
        if (success) successCount++;
        else failCount++;
      }
    }

    setBulkProcessing(false);
    
    if (successCount > 0) {
      toast.success(`${successCount} slot(s) ${action === 'block' ? 'blocked' : 'unblocked'} successfully!`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} slot(s) failed to ${action}`);
    }

    setSelectedSlots(new Set());
    setSelectionMode(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const selectedBlockedCount = Array.from(selectedSlots).filter(timeRange =>
    blockedSlots.some(s => s.time === timeRange)
  ).length;

  const selectedUnblockedCount = selectedSlots.size - selectedBlockedCount;

  const getTargetDescription = () => {
    const reportText = reportPrefixes.find(p => p.value === selectedPrefix)?.label;
    const astroText = selectedAstrologer === 'all' ? 'All Astrologers' : allAstrologers.find(a => a._id === selectedAstrologer)?.name;
    return `${reportText} • ${astroText}`;
  };

  const sortSlotsByTime = (slots: Slot[]): Slot[] => {
    return slots.sort((a, b) => {
      const parseTime = (timeStr: string): number => {
        const match = timeStr.match(/(\d+):(\d+)(AM|PM)/);
        if (!match) return 0;
        
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const period = match[3];
        
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        return hours * 60 + minutes;
      };

      const timeA = parseTime(a.time.split('-')[0]);
      const timeB = parseTime(b.time.split('-')[0]);
      return timeA - timeB;
    });
  };

  const allSlots = sortSlotsByTime([...availableSlots, ...blockedSlots]);

  return (
    <div className="min-h-screen pb-8 px-4 bg-gray-50">
      <div className="container mx-auto max-w-7xl">

        <Card className="mb-6 p-6 border-gray-200 bg-white shadow-md">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-[#EF4444]">1.</span> Report Type
                </label>
                <Select value={selectedPrefix} onValueChange={setSelectedPrefix}>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {reportPrefixes.map((prefix) => (
                      <SelectItem key={prefix.value} value={prefix.value}>
                        {prefix.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-[#EF4444]">2.</span> Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getTomorrowDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EF4444]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-[#EF4444]">3.</span> Astrologer
                </label>
                <Select 
                  value={selectedAstrologer} 
                  onValueChange={setSelectedAstrologer}
                  disabled={loadingAstrologers}
                >
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Select astrologer" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        All Astrologers
                      </div>
                    </SelectItem>
                    {allAstrologers.map((astrologer) => (
                      <SelectItem key={astrologer._id} value={astrologer._id}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {astrologer.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Quick Select Next 10 Days
              </label>
              <div className="flex flex-wrap gap-2">
                {next10Days.map((day) => (
                  <Button
                    key={day.date}
                    variant={selectedDate === day.date ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDate(day.date)}
                    className={`${
                      selectedDate === day.date
                        ? 'bg-[#EF4444] text-white hover:bg-[#DC2626]'
                        : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-900 font-medium mb-1">
                    Currently viewing: <strong>{getTargetDescription()}</strong>
                  </p>
                  <p className="text-xs text-blue-700">
                    Date: {formatDate(selectedDate)}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Available: {availableSlots.length} | Blocked: {blockedSlots.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {!loading && allSlots.length > 0 && (
          <Card className="mb-4 p-4 border-gray-200 bg-white shadow-md">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={toggleSelectionMode}
                variant="outline"
                className="border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444] hover:text-white"
              >
                {selectionMode ? 'Cancel Selection' : 'Select All'}
              </Button>

              {selectionMode && (
                <>
                  <div className="text-sm text-gray-600">
                    Selected: <span className="font-semibold text-[#EF4444]">{selectedSlots.size}</span> slot(s)
                  </div>
                  
                  {selectedUnblockedCount > 0 && (
                    <Button
                      onClick={() => handleBulkAction('block')}
                      disabled={bulkProcessing}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      {bulkProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        `Block Selected (${selectedUnblockedCount})`
                      )}
                    </Button>
                  )}

                  {selectedBlockedCount > 0 && (
                    <Button
                      onClick={() => handleBulkAction('unblock')}
                      disabled={bulkProcessing}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      {bulkProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        `Unblock Selected (${selectedBlockedCount})`
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>
          </Card>
        )}

        {loading ? (
          <Card className="p-12 text-center border-gray-200 bg-white">
            <Loader2 className="w-12 h-12 animate-spin text-[#EF4444] mx-auto mb-4" />
            <p className="text-gray-600">Loading slots...</p>
          </Card>
        ) : allSlots.length === 0 ? (
          <Card className="p-12 text-center border-gray-200 bg-white">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Slots Available
            </h3>
            <p className="text-gray-600">
              No time slots found for the selected date and report type
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {allSlots.map((slot) => {
              const isProcessing = processingSlots.has(slot.time);
              const isSelected = selectedSlots.has(slot.time);
              
              return (
                <Card
                  key={slot.time}
                  className={`p-4 border-2 transition-all cursor-pointer hover:shadow-md ${
                    isSelected ? 'ring-2 ring-[#EF4444]' : ''
                  } ${
                    slot.isBlocked
                      ? 'bg-red-50 border-red-300'
                      : 'bg-green-50 border-green-300'
                  }`}
                  onClick={() => selectionMode && toggleSlotSelection(slot.time)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        {selectionMode && (
                          <div onClick={(e) => e.stopPropagation()}>
                            {isSelected ? (
                              <CheckSquare 
                                className="w-5 h-5 text-[#EF4444] cursor-pointer flex-shrink-0 mt-0.5" 
                                onClick={() => toggleSlotSelection(slot.time)}
                              />
                            ) : (
                              <Square 
                                className="w-5 h-5 text-gray-400 cursor-pointer flex-shrink-0 mt-0.5" 
                                onClick={() => toggleSlotSelection(slot.time)}
                              />
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-base leading-tight">
                            {slot.time}
                          </p>
                          {slot.isBlocked ? (
                            <p className="text-xs text-red-700 mt-1">
                              🚫 Blocked
                            </p>
                          ) : (
                            <p className="text-xs text-green-700 mt-1">
                              ✅ Available ({slot.capacity})
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {!selectionMode && (
                        <div className="ml-2 flex-shrink-0">
                          {slot.isBlocked ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (slot.blockedSlotId) {
                                  handleUnblock(slot.blockedSlotId, slot.time);
                                }
                              }}
                              disabled={isProcessing || !slot.blockedSlotId}
                              className="bg-green-500 hover:bg-green-600 text-white border-none text-xs px-2 py-1 h-auto"
                            >
                              {isProcessing ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Unblock'
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBlock(slot.time);
                              }}
                              disabled={isProcessing}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 h-auto"
                            >
                              {isProcessing ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Block'
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {slot.isBlocked && (slot.reason || slot.blockScope) && (
                      <div className="pt-2 border-t border-red-200">
                        
                        {slot.blockScope && (
                          <p className="text-xs text-red-600 mt-1">
                            <span className="font-medium">Scope:</span> {slot.blockScope}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

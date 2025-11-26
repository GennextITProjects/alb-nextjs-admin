"use client";

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar, Clock, Trash2, User, Users, AlertCircle, CalendarOff } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const reportPrefixes = [
  { value: 'all', label: 'All Reports', code: 'ALL' },
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

interface BlockedTimeRange {
  _id: string;
  date: string;
  timeRange: string;
  prefix: string | null;
  blockedBy: string;
  astrologerId: {
    _id: string;
    astrologerName: string;
    displayName: string;
  } | null;
  isActive: boolean;
  createdAt: string;
}

export default function TimeRangeBlocking() {
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTomorrowDate());
  const [selectedPrefix, setSelectedPrefix] = useState<string>('all');
  const [selectedAstrologer, setSelectedAstrologer] = useState<string>('all');
  const [allAstrologers, setAllAstrologers] = useState<Astrologer[]>([]);
  const [loadingAstrologers, setLoadingAstrologers] = useState(false);
  
  const [isFullDayBlock, setIsFullDayBlock] = useState(true);
  const [startTime, setStartTime] = useState('10:00AM');
  const [endTime, setEndTime] = useState('7:00PM');  
  const [blockedRanges, setBlockedRanges] = useState<BlockedTimeRange[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const timeOptions = [
    '10:00AM', '10:30AM', '11:00AM', '11:30AM',
    '12:00PM', '12:30PM', '1:00PM', '1:30PM',
    '2:00PM', '2:30PM', '3:00PM', '3:30PM',
    '4:00PM', '4:30PM', '5:00PM', '5:30PM',
    '6:00PM', '6:30PM', '7:00PM'
  ];

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

const fetchBlockedRanges = async () => {
  setLoading(true);
  try {
    const params = new URLSearchParams({
      date: selectedDate,
    });

    // ✅ Add prefix filter if not "all"
    if (selectedPrefix && selectedPrefix !== 'all') {
      params.append('prefix', selectedPrefix);
    }

    // ✅ Add astrologer filter if not "all"
    if (selectedAstrologer && selectedAstrologer !== 'all') {
      params.append('astrologerId', selectedAstrologer);
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/life-journey-report/blocked-slots?${params.toString()}`
    );
    const data = await response.json();

    if (data.success) {
      setBlockedRanges(data.blockedSlots || []);
    }
  } catch (error) {
    console.error('Error fetching blocked ranges:', error);
    toast.error("Failed to fetch blocked ranges");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchAllAstrologers();
  }, []);

useEffect(() => {
  fetchBlockedRanges();
}, [selectedDate, selectedPrefix, selectedAstrologer]); // ✅ Added these two

  const handleBlockTimeRange = async () => {
    if (!isFullDayBlock && (!startTime || !endTime)) {
      toast.error("Please select start and end time");
      return;
    }

    if (!isFullDayBlock && startTime >= endTime) {
      toast.error("End time must be after start time");
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/life-journey-report/block-astrologer-time-range`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: selectedDate,
            startTime: isFullDayBlock ? null : startTime,
            endTime: isFullDayBlock ? null : endTime,
            astrologerId: selectedAstrologer,
            prefix: selectedPrefix,          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || "Time range blocked successfully");
        await fetchBlockedRanges();
      } else {
        toast.error(data.message || "Failed to block time range");
      }
    } catch (error) {
      console.error('Error blocking time range:', error);
      toast.error("An error occurred while blocking");
    } finally {
      setProcessing(false);
    }
  };

  const handleUnblockRange = async (blockId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/life-journey-report/blocked-slots/${blockId}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Time range unblocked successfully");
        await fetchBlockedRanges();
      } else {
        toast.error(data.message || "Failed to unblock");
      }
    } catch (error) {
      console.error('Error unblocking:', error);
      toast.error("An error occurred while unblocking");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getBlockDescription = (block: BlockedTimeRange) => {
    const astroName = block.astrologerId 
      ? (block.astrologerId.astrologerName || block.astrologerId.displayName)
      : 'All Astrologers';
    
    const reportType = block.prefix || 'All Reports';
    
    return `${astroName} • ${reportType}`;
  };

  const getTargetDescription = () => {
    const reportText = selectedPrefix === 'all' ? 'All Reports' : reportPrefixes.find(p => p.value === selectedPrefix)?.label;
    const astroText = selectedAstrologer === 'all' ? 'All Astrologers' : allAstrologers.find(a => a._id === selectedAstrologer)?.name;
    return `${reportText} • ${astroText}`;
  };

  return (
    <div className="min-h-screen pb-8 px-4 bg-gray-50">
      <div className="container mx-auto max-w-7xl">

        <Card className="mb-6 p-6 border-gray-200 bg-white shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Block</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Select Date
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
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Report Type
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
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Astrologer
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="fullDay"
                checked={isFullDayBlock}
                onCheckedChange={(checked) => setIsFullDayBlock(checked as boolean)}
              />
              <label
                htmlFor="fullDay"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                Block entire day (10:00 AM - 7:00 PM)
              </label>
            </div>

            {!isFullDayBlock && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Start Time
                  </label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    End Time
                  </label>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-900 font-medium mb-1">
                    Will block for: <strong>{getTargetDescription()}</strong>
                  </p>
                  <p className="text-xs text-blue-700">
                    Date: {formatDate(selectedDate)}
                  </p>
                  {!isFullDayBlock && (
                    <p className="text-xs text-blue-700 mt-1">
                      Time: {startTime} to {endTime}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={handleBlockTimeRange}
              disabled={processing}
              className="w-full bg-[#EF4444] hover:bg-[#DC2626] text-white"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Blocking...
                </>
              ) : (
                <>
                  <CalendarOff className="w-4 h-4 mr-2" />
                  {isFullDayBlock ? 'Block Full Day' : 'Block Time Range'}
                </>
              )}
            </Button>
          </div>
        </Card>

        <Card className="p-6 border-gray-200 bg-white shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Blocked Time Ranges for {formatDate(selectedDate)}
            </h2>
            {blockedRanges.length > 0 && (
              <span className="text-sm text-gray-600">
                {blockedRanges.length} block(s)
              </span>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-[#EF4444] mx-auto mb-4" />
              <p className="text-gray-600">Loading blocked ranges...</p>
            </div>
          ) : blockedRanges.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                No Blocked Ranges
              </h3>
              <p className="text-gray-600">
                No time ranges are blocked for this date
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedRanges.map((block) => (
                <Card
                  key={block._id}
                  className="p-4 border-2 border-red-200 bg-red-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-red-600" />
                        <p className="font-bold text-gray-900">
                          {block.timeRange}
                        </p>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-1">
                        <span className="font-medium">For:</span> {getBlockDescription(block)}
                      </p>
                      
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnblockRange(block._id)}
                      className="ml-4 bg-green-500 hover:bg-green-600 text-white border-none"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Unblock
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { adminGenerateOpenLink, AdminGenerateOpenLinkResponse } from '@/lib/doorService';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { setHours, setMinutes, isSameDay } from 'date-fns';

export default function AdminDoorUnlock() {
    const { toast } = useToast();
  
  const [seatNumber, setSeatNumber] = useState('');
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [endTime, setEndTime] = useState<Date | null>(null);
  
  // Common state
  const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AdminGenerateOpenLinkResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

    // Generate seat options
    const seatOptions = Array.from({ length: 15 }, (_, i) => `S${i + 1}`);

    // Handle start time change - update end time min attribute
    const handleStartTimeChange = (date: Date | null) => {
        setStartTime(date);
        // If end time exists and is before the new start time, clear it
        if (endTime && date && endTime <= date) {
            setEndTime(null);
        }
    };

    const handleEndTimeChange = (date: Date | null) => {
        setEndTime(date);
    };

    // Filter time to only allow 15-minute intervals
    const filterTime = (time: Date): boolean => {
        const minutes = time.getMinutes();
        return minutes % 15 === 0; // Only allow :00, :15, :30, :45
    };

    // Get time constraints for DatePicker - same logic as BookingForm
    const getStartTimeConstraints = () => {
        const selectedDate = startTime || new Date();
        const today = new Date();

        // If booking for today, minimum time is current time
        if (isSameDay(selectedDate, today)) {
            return {
                minTime: new Date(),
                maxTime: setHours(setMinutes(new Date(), 59), 23) // Until 11:59 PM
            };
        }

        // For future dates, allow full day
        return {
            minTime: setHours(setMinutes(new Date(), 0), 0), // From 12:00 AM
            maxTime: setHours(setMinutes(new Date(), 59), 23) // Until 11:59 PM
        };
    };

    const getInitialEndTimeConstraints = () => {
        if (!startTime) {
            const now = new Date();
            return {
                minTime: setHours(setMinutes(now, 0), now.getHours()),
                maxTime: setHours(setMinutes(new Date(), 59), 23)
            };
        }

        // Minimum end time is start time + 1 hour (60 minutes)
        const minEndTime = new Date(startTime.getTime() + 60 * 60 * 1000);

        const now = new Date();
        // Get the actual minimum end time (current time or start + 1 hour, whichever is later)
        const actualMinTime = minEndTime > now ? minEndTime : now;

        // For today's date, start from the start time + 1 hour or now, whichever is later
        const today = new Date();
        if (isSameDay(startTime, today)) {
            return {
                minTime: actualMinTime,
                maxTime: setHours(setMinutes(today, 59), 23)
            };
        }

        // For future dates, still need 1 hour minimum
        return {
            minTime: minEndTime,
            maxTime: setHours(setMinutes(new Date(), 59), 23)
        };
    };

    const getEndTimeConstraints = () => {
        if (!startTime) {
            const now = new Date();
            return {
                minTime: setHours(setMinutes(now, 0), now.getHours()),
                maxTime: setHours(setMinutes(new Date(), 59), 23)
            };
        }

        const now = new Date();
        const minEndTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Start + 1 hour

        // Get the actual minimum end time (current time or start + 1 hour, whichever is later)
        const actualMinTime = minEndTime > now ? minEndTime : now;

        // If end date is same day as start date
        if (endTime && isSameDay(startTime, endTime)) {
            return {
                minTime: actualMinTime,
                maxTime: setHours(setMinutes(endTime, 59), 23) // Until 11:59 PM same day
            };
        }

        // Default fallback
        return {
            minTime: actualMinTime,
            maxTime: setHours(setMinutes(new Date(), 59), 23)
        };
    };

    const handleGenerateLink = async () => {

      // Admin form validation
      if (!seatNumber.trim()) {
            toast({
                title: "Error",
                description: "Please select a seat number",
                variant: "destructive",
            });
        return;
      }
        if (!startTime) {
            toast({
                title: "Error",
                description: "Please enter a start time",
                variant: "destructive",
            });
        return;
      }
        if (!endTime) {
            toast({
                title: "Error",
                description: "Please enter an end time",
                variant: "destructive",
            });
        return;
      }

      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
            const now = new Date();

            // Check if start time is in the past
            if (startTime < now) {
                toast({
                    title: "Error",
                    description: "Start time cannot be in the past",
                    variant: "destructive",
                });
                setIsLoading(false);
                return;
            }

            // Check if end time is in the past
            if (endTime < now) {
                toast({
                    title: "Error",
                    description: "End time cannot be in the past",
                    variant: "destructive",
                });
                setIsLoading(false);
          return;
        }

            // Check if end time is before or equal to start time
            if (endTime <= startTime) {
                toast({
                    title: "Error",
                    description: "End time must be after start time",
                    variant: "destructive",
                });
                setIsLoading(false);
          return;
        }

            // Check if duration is at least 1 hour
            const duration = endTime.getTime() - startTime.getTime();
            const minimumDuration = 60 * 60 * 1000; // 1 hour in milliseconds
            if (duration < minimumDuration) {
                toast({
                    title: "Error",
                    description: "End time must be at least 1 hour after start time",
                    variant: "destructive",
                });
                setIsLoading(false);
          return;
        }
        
            const startTimeISO = startTime.toISOString();
            const endTimeISO = endTime.toISOString();
        
        const response = await adminGenerateOpenLink(seatNumber.trim(), startTimeISO, endTimeISO);
        setResult(response);
        
            if (!response.success) {
                toast({
                    title: "Error",
                    description: response.message || 'Failed to generate admin access link',
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Access Link Generated!",
                    description: "Door access link has been generated successfully.",
                });
            }
      } catch (err) {
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : 'An unexpected error occurred',
                variant: "destructive",
            });
      } finally {
        setIsLoading(false);
      }

  };

  const handleCopyLink = () => {
    if (result?.data?.accessPath) {
      navigator.clipboard.writeText(result.data.accessPath);
            toast({
                title: "Link Copied!",
                description: "Access link has been copied to clipboard.",
            });
    }
  };

  const handleOpenLink = () => {
    if (result?.data?.accessPath) {
      window.open(result.data.accessPath, '_blank');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Generate Door Access Link</h2>
      
     
        <div className="space-y-4 mb-6">
          <div>
                    <Label htmlFor="seatNumber">Seat Number *</Label>
                    <Select value={seatNumber} onValueChange={setSeatNumber} disabled={isLoading}>
                        <SelectTrigger id="seatNumber" className="w-full">
                            <SelectValue placeholder="Select a seat" />
                        </SelectTrigger>
                        <SelectContent>
                            {seatOptions.map((seat) => (
                                <SelectItem key={seat} value={seat}>
                                    {seat}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">Select seat number (S1-S15)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="startTime">Start Time *</Label>
                        <DatePicker
                            selected={startTime}
                            onChange={handleStartTimeChange}
                            showTimeSelect
                            timeIntervals={15}
                            filterTime={filterTime}
                            dateFormat="MMM d, yyyy h:mm aa"
                            placeholderText="Select start time"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            minDate={new Date()}
              disabled={isLoading}
                            wrapperClassName="w-full"
                            {...getStartTimeConstraints()}
            />
          </div>
          
          <div>
                        <Label htmlFor="endTime">End Time *</Label>
                        <DatePicker
                            selected={endTime}
                            onChange={handleEndTimeChange}
                            showTimeSelect
                            timeIntervals={15}
                            filterTime={filterTime}
                            dateFormat="MMM d, yyyy h:mm aa"
                            placeholderText="Select end time"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            disabled={isLoading || !startTime}
                            minDate={startTime || new Date()}
                            wrapperClassName="w-full"
                            {...(endTime ? getEndTimeConstraints() : getInitialEndTimeConstraints())}
                        />
                        </div>
                </div>
            </div>
    

      {/* Generate Button */}
      <button
        onClick={handleGenerateLink}
                disabled={isLoading || (!seatNumber.trim() || !startTime || !endTime)}
                className="w-full bg-orange-600 cursor-pointer text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
                {isLoading ? 'Generating...' : `Generate Access Link`}
      </button>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Success Result */}
      {result?.success && result.data && (
        <div className="mt-6 p-4 bg-green-100 border border-green-400 rounded-md">
          <h3 className="text-lg font-semibold text-green-800 mb-3">Access Link Generated Successfully!</h3>
          
          {/* Access Path */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Access Link:
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={result.data.accessPath}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm font-mono"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Copy
              </button>
              <button
                onClick={handleOpenLink}
                className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Open
              </button>
            </div>
          </div>

         
        </div>
      )}
    </div>
  );
}
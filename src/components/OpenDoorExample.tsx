'use client';

import { useState } from 'react';
import { generateOpenLink, adminGenerateOpenLink, GenerateOpenLinkResponse, AdminGenerateOpenLinkResponse } from '@/lib/doorService';

export default function OpenDoorExample() {
  const [activeTab, setActiveTab] = useState<'regular' | 'admin'>('regular');
  
  // Regular booking form state
  const [bookingRef, setBookingRef] = useState('');
  
  // Admin form state
  const [seatNumber, setSeatNumber] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  // Common state
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerateOpenLinkResponse | AdminGenerateOpenLinkResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateLink = async () => {
    if (activeTab === 'regular') {
      if (!bookingRef.trim()) {
        setError('Please enter a booking reference');
        return;
      }

      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        const response = await generateOpenLink(bookingRef.trim());
        setResult(response);
        
        if (!response.success) {
          setError(response.message || 'Failed to generate access link');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Admin form validation
      if (!seatNumber.trim()) {
        setError('Please enter a seat number');
        return;
      }
      if (!startTime.trim()) {
        setError('Please enter a start time');
        return;
      }
      if (!endTime.trim()) {
        setError('Please enter an end time');
        return;
      }

      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        // Convert datetime-local format to ISO 8601 format
        const startDate = new Date(startTime.trim());
        const endDate = new Date(endTime.trim());
        
        // Validate dates
        if (isNaN(startDate.getTime())) {
          setError('Invalid start time format');
          return;
        }
        if (isNaN(endDate.getTime())) {
          setError('Invalid end time format');
          return;
        }
        if (startDate >= endDate) {
          setError('Start time must be before end time');
          return;
        }
        
        const startTimeISO = startDate.toISOString();
        const endTimeISO = endDate.toISOString();
        
        const response = await adminGenerateOpenLink(seatNumber.trim(), startTimeISO, endTimeISO);
        setResult(response);
        
        if (!response.success) {
          setError(response.message || 'Failed to generate admin access link');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCopyLink = () => {
    if (result?.data?.accessPath) {
      navigator.clipboard.writeText(result.data.accessPath);
      // You could add a toast notification here
      alert('Link copied to clipboard!');
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
      
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('regular')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'regular'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Regular Booking
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'admin'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Admin Manual
          </button>
        </div>
      </div>

      {/* Regular Booking Form */}
      {activeTab === 'regular' && (
        <div className="mb-6">
          <label htmlFor="bookingRef" className="block text-sm font-medium text-gray-700 mb-2">
            Booking Reference
          </label>
          <input
            id="bookingRef"
            type="text"
            value={bookingRef}
            onChange={(e) => setBookingRef(e.target.value)}
            placeholder="Enter your booking reference"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>
      )}

      {/* Admin Manual Form */}
      {activeTab === 'admin' && (
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="seatNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Seat Number
            </label>
            <input
              id="seatNumber"
              type="text"
              value={seatNumber}
              onChange={(e) => setSeatNumber(e.target.value)}
              placeholder="S1, S2, S3, ..., S15"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">Enter seat number in format S1-S15</p>
          </div>
          
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <input
              id="startTime"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
              End Time
            </label>
            <input
              id="endTime"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerateLink}
        disabled={isLoading || (activeTab === 'regular' ? !bookingRef.trim() : !seatNumber.trim() || !startTime.trim() || !endTime.trim())}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Generating...' : `Generate ${activeTab === 'regular' ? 'Regular' : 'Admin'} Access Link`}
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

          {/* Additional Info */}
          <div className="space-y-2 text-sm text-gray-600">
            <div>
              <span className="font-medium">Booking Reference:</span> {result.data.bookingRef || 'N/A (Manual Token)'}
            </div>
            <div>
              <span className="font-medium">Valid From:</span> {new Date(result.data.enableAt).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Expires At:</span> {new Date(result.data.expiresAt).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Access Count:</span> {result.data.currentAccessCount}
              {result.data.maxAccessCount && ` / ${result.data.maxAccessCount}`}
              {result.data.unlimitedAccess && ' (Unlimited)'}
            </div>
            <div>
              <span className="font-medium">Used:</span> {result.data.used ? 'Yes' : 'No'}
            </div>
            <div>
              <span className="font-medium">Created At:</span> {new Date(result.data.createdAt).toLocaleString()}
            </div>
            
            {/* Show admin-specific info if it's an admin token */}
            {'manualCreated' in result.data && result.data.manualCreated && (
              <>
                <div>
                  <span className="font-medium">Seat Number:</span> {result.data.seatNumber}
                </div>
                <div>
                  <span className="font-medium">Manual Start Time:</span> {new Date(result.data.manualStartTime!).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Manual End Time:</span> {new Date(result.data.manualEndTime!).toLocaleString()}
                </div>
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <span className="text-blue-800 font-medium">Admin Manual Token</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
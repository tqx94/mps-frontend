// src/components/packages/ApiResponseDebugger.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { authenticatedFetch } from '@/lib/apiClient';

export const ApiResponseDebugger: React.FC = () => {
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const testApiCall = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      console.log('🧪 Testing API call to admin packages endpoint...');
      
      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'https://productive-space-backend.vercel.app'}/new-packages/admin/all`);
      
      console.log('📡 Response status:', response.status, response.ok);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`HTTP ${response.status}: ${errorData.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      console.log('✅ Raw API Response:', data);
      
      setApiResponse(data);
      setSuccess(true);
      
      // Auto-hide success after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ API Test Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-test on component mount
    testApiCall();
  }, []);

  const getResponseStructure = (data: any): string => {
    if (!data) return 'No data';
    
    const structure = {
      success: typeof data.success,
      data: data.data ? {
        packages: Array.isArray(data.data.packages) ? `Array(${data.data.packages.length})` : typeof data.data.packages
      } : 'undefined',
      packages: Array.isArray(data.packages) ? `Array(${data.packages.length})` : typeof data.packages
    };
    
    return JSON.stringify(structure, null, 2);
  };

  const getPackageSample = (data: any) => {
    if (data.data?.packages?.[0]) {
      return data.data.packages[0];
    } else if (data.packages?.[0]) {
      return data.packages[0];
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            API Response Debugger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Button */}
          <div className="flex items-center gap-4">
            <Button 
              onClick={testApiCall} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Testing API...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Test API Call
                </>
              )}
            </Button>
            
            {success && (
              <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                API Call Successful
              </Badge>
            )}
            
            {error && (
              <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                API Call Failed
              </Badge>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Success Display */}
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <AlertDescription>
                <strong>Success:</strong> API call completed successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Response Structure */}
          {apiResponse && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Response Structure:</h4>
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                  {getResponseStructure(apiResponse)}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Package Count:</h4>
                <div className="flex gap-4">
                  <Badge variant="outline">
                    data.data.packages: {apiResponse.data?.packages?.length || 0}
                  </Badge>
                  <Badge variant="outline">
                    data.packages: {apiResponse.packages?.length || 0}
                  </Badge>
                </div>
              </div>

              {/* Sample Package */}
              {getPackageSample(apiResponse) && (
                <div>
                  <h4 className="font-semibold mb-2">Sample Package:</h4>
                  <pre className="bg-blue-50 p-4 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(getPackageSample(apiResponse), null, 2)}
                  </pre>
                </div>
              )}

              {/* Full Response */}
              <div>
                <h4 className="font-semibold mb-2">Full API Response:</h4>
                <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto max-h-96">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

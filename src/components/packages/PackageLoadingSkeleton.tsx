// src/components/packages/PackageLoadingSkeleton.tsx
'use client'

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const PackageLoadingSkeleton: React.FC = () => {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-5 w-16" />
      </CardHeader>
      
      <CardContent className="flex flex-col h-full">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-4" />
        
        {/* Package Contents Skeleton */}
        <div className="package-contents mb-4 space-y-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>

        {/* Validity Skeleton */}
        <div className="validity-info mb-4 p-2 bg-gray-50 rounded-lg">
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Pricing Skeleton */}
        <div className="pricing mb-6 space-y-3 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-4 w-40" />
        </div>

        {/* Button Skeleton */}
        <Skeleton className="mt-auto h-12 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
};

export const PackageGridSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <PackageLoadingSkeleton key={index} />
      ))}
    </div>
  );
};

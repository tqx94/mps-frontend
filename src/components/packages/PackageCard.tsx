// src/components/packages/PackageCard.tsx
'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NewPackage } from '@/lib/services/packageService';

interface PackageCardProps {
  package: NewPackage;
  onPurchase: (pkg: NewPackage) => void;
  userRole?: string;
}

export const PackageCard: React.FC<PackageCardProps> = ({ package: pkg, onPurchase, userRole }) => {
  const formatPrice = (price: number) => `SGD ${price.toFixed(2)}`;
  
  const formatDiscount = (original: number, current: number) => {
    const discount = Math.round(((original - current) / original) * 100);
    return `${discount}% OFF`;
  };

  const getPackageTypeBadge = (type: string) => {
    const badges = {
      'HALF_DAY': { variant: 'default' as const, text: 'Half-Day' },
      'FULL_DAY': { variant: 'secondary' as const, text: 'Full-Day' },
      'SEMESTER_BUNDLE': { variant: 'destructive' as const, text: 'Semester Bundle' }
    };
    return badges[type as keyof typeof badges] || { variant: 'outline' as const, text: type };
  };

  const badge = getPackageTypeBadge(pkg.packageType);

  return (
    <Card className={`h-full package-card hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
      userRole === 'MEMBER' ? 'role-member' : 
      userRole === 'TUTOR' ? 'role-tutor' : 
      userRole === 'STUDENT' ? 'role-student' : ''
    }`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-purple-50">
        <Badge variant={badge.variant} className="font-semibold">
          {badge.text}
        </Badge>
        {pkg.originalPrice && pkg.originalPrice > pkg.price && (
          <Badge variant="destructive" className="text-xs font-bold animate-pulse">
            {formatDiscount(pkg.originalPrice, pkg.price)}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="flex flex-col h-full">
        <CardTitle className="text-xl mb-2">{pkg.name}</CardTitle>
        <p className="text-muted-foreground mb-4 text-sm">{pkg.description}</p>
        
        {/* Package Contents - Count-based system */}
        <div className="package-contents mb-4 space-y-3">
          <div className="content-item text-sm flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
            <span className="text-blue-600 font-bold">{pkg.passCount}</span>
            <span>Counts</span>
            <span className="text-muted-foreground">(1 pass per booking)</span>
          </div>
          <div className="content-item text-sm flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
            <span className="text-green-600 font-bold">{pkg.validityDays}</span>
            <span>Days Validity</span>
          </div>
          <div className="content-item text-sm font-bold flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border-2 border-orange-200">
            <span>Package Type:</span>
            <span className="text-orange-600 text-lg">{pkg.packageType.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Validity */}
        <div className="validity-info mb-4 p-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-muted-foreground flex items-center">
            <span className="mr-1">⏰</span>
            Valid for {pkg.validityDays} days from activation
          </p>
        </div>

        {/* Pricing */}
        <div className="pricing mb-6 space-y-3 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="current-price text-3xl font-bold text-primary">
              {formatPrice(pkg.price)}
            </div>
            {pkg.originalPrice && pkg.originalPrice > pkg.price && (
              <div className="original-price text-lg text-muted-foreground line-through">
                {formatPrice(pkg.originalPrice)}
              </div>
            )}
          </div>
          <div className="outlet-fee text-sm text-muted-foreground flex items-center">
            <span className="mr-1">🏢</span>
            +{formatPrice(pkg.outletFee)} for all outlets
          </div>
        </div>

        {/* Purchase Button */}
        <Button 
          className="mt-auto w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
          onClick={() => onPurchase(pkg)}
        >
          <span className="mr-2">🛒</span>
          Buy Now
        </Button>
      </CardContent>
    </Card>
  );
};



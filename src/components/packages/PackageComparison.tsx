// src/components/packages/PackageComparison.tsx
'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NewPackage } from '@/lib/services/packageService';
import { Check, X, Star, Clock, Users, Zap } from 'lucide-react';

interface PackageComparisonProps {
  packages: NewPackage[];
  onPurchase: (pkg: NewPackage) => void;
  userRole?: string;
}

export const PackageComparison: React.FC<PackageComparisonProps> = ({ 
  packages, 
  onPurchase, 
  userRole 
}) => {
  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(new Set());

  const togglePackageSelection = (packageId: string) => {
    const newSelection = new Set(selectedPackages);
    if (newSelection.has(packageId)) {
      newSelection.delete(packageId);
    } else {
      newSelection.add(packageId);
    }
    setSelectedPackages(newSelection);
  };

  const formatPrice = (price: number) => `SGD ${price.toFixed(2)}`;

  const getFeatureIcon = (feature: string) => {
    if (feature.includes('WiFi') || feature.includes('internet')) return <Zap className="h-4 w-4" />;
    if (feature.includes('time') || feature.includes('hours')) return <Clock className="h-4 w-4" />;
    if (feature.includes('community') || feature.includes('network')) return <Users className="h-4 w-4" />;
    return <Check className="h-4 w-4" />;
  };

  const getPackageFeatures = (pkg: NewPackage) => {
    const features = [];
    
    if (pkg.packageContents.halfDayPasses) {
      features.push(`${pkg.packageContents.halfDayPasses} Half-Day Packages`);
    }
    if (pkg.packageContents.fullDayPasses) {
      features.push(`${pkg.packageContents.fullDayPasses} Full-Day Packages`);
    }
    if (pkg.packageContents.complimentaryHours) {
      features.push(`+${pkg.packageContents.complimentaryHours} Bonus Hours`);
    }
    
    features.push('High-speed WiFi');
    features.push('Ergonomic seating');
    features.push('Quiet environment');
    features.push('Access to common areas');
    
    if (pkg.packageType === 'FULL_DAY' || pkg.packageType === 'SEMESTER_BUNDLE') {
      features.push('Meeting room access');
      features.push('Printing facilities');
    }
    
    if (pkg.packageType === 'SEMESTER_BUNDLE') {
      features.push('Student community access');
      features.push('Priority booking');
    }
    
    return features;
  };

  const allFeatures = Array.from(
    new Set(packages.flatMap(pkg => getPackageFeatures(pkg)))
  );

  if (packages.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Compare Packages</h2>
        <p className="text-muted-foreground">
          Select packages to compare features and pricing
        </p>
      </div>

      {/* Package Selection */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <Card 
            key={pkg.id} 
            className={`cursor-pointer transition-all duration-200 ${
              selectedPackages.has(pkg.id) 
                ? 'ring-2 ring-orange-500 shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => togglePackageSelection(pkg.id)}
          >
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-2">
                <input
                  type="checkbox"
                  checked={selectedPackages.has(pkg.id)}
                  onChange={() => togglePackageSelection(pkg.id)}
                  className="mr-2 h-4 w-4 text-orange-600"
                />
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
              </div>
              <Badge variant="outline" className="mx-auto">
                {pkg.packageType.replace('_', ' ')}
              </Badge>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-2xl font-bold text-primary mb-2">
                {formatPrice(pkg.price)}
              </div>
              <p className="text-sm text-muted-foreground">
                {pkg.packageContents.totalHours} total hours
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Table */}
      {selectedPackages.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2" />
              Feature Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Features</th>
                    {packages
                      .filter(pkg => selectedPackages.has(pkg.id))
                      .map((pkg) => (
                        <th key={pkg.id} className="text-center p-4 font-semibold">
                          {pkg.name}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {allFeatures.map((feature, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-4 flex items-center">
                        {getFeatureIcon(feature)}
                        <span className="ml-2">{feature}</span>
                      </td>
                      {packages
                        .filter(pkg => selectedPackages.has(pkg.id))
                        .map((pkg) => {
                          const hasFeature = getPackageFeatures(pkg).includes(feature);
                          return (
                            <td key={pkg.id} className="text-center p-4">
                              {hasFeature ? (
                                <Check className="h-5 w-5 text-green-500 mx-auto" />
                              ) : (
                                <X className="h-5 w-5 text-red-500 mx-auto" />
                              )}
                            </td>
                          );
                        })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {selectedPackages.size > 0 && (
        <div className="flex justify-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => setSelectedPackages(new Set())}
          >
            Clear Selection
          </Button>
          {selectedPackages.size === 1 && (
            <Button 
              onClick={() => {
                const selectedPkg = packages.find(pkg => selectedPackages.has(pkg.id));
                if (selectedPkg) onPurchase(selectedPkg);
              }}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              Purchase Selected Package
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

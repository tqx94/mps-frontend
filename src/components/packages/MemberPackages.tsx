// src/components/packages/MemberPackages.tsx
'use client'

import React, { useState } from 'react';
// Container is not needed as we're using container mx-auto class
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { usePackages } from '@/hooks/useNewPackages';
import { PackageCard } from './PackageCard';
import { PackagePurchase } from './PackagePurchase';
import { NewPackage } from '@/lib/services/packageService';

interface MemberPackagesProps {
  userId: string;
}

export const MemberPackages: React.FC<MemberPackagesProps> = ({ userId }) => {
  const { packages, loading, error } = usePackages('MEMBER');
  const [selectedPackage, setSelectedPackage] = useState<NewPackage | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const handlePurchase = (pkg: NewPackage) => {
    setSelectedPackage(pkg);
    setShowPurchaseModal(true);
  };

  const handlePurchaseSuccess = (result: any) => {
    console.log('Purchase successful:', result);
    // Handle successful purchase - redirect to payment or show success message
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading packages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>Error loading packages: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Member Packages</h1>
        <p className="text-xl text-muted-foreground">
          Choose the perfect package for your productivity needs
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <PackageCard
            key={pkg.id}
            package={pkg}
            onPurchase={handlePurchase}
            userRole="MEMBER"
          />
        ))}
      </div>

      <PackagePurchase
        show={showPurchaseModal}
        onHide={() => setShowPurchaseModal(false)}
        package={selectedPackage}
        userId={userId}
        onSuccess={handlePurchaseSuccess}
      />
    </div>
  );
};

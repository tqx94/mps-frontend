// src/components/packages/TutorPackages.tsx
'use client'

import React, { useState } from 'react';
// Container is not needed as we're using container mx-auto class
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { usePackages } from '@/hooks/useNewPackages';
import { PackageCard } from './PackageCard';
import { PackagePurchase } from './PackagePurchase';
import { NewPackage } from '@/lib/services/packageService';

interface TutorPackagesProps {
  userId: string;
}

export const TutorPackages: React.FC<TutorPackagesProps> = ({ userId }) => {
  const { packages, loading, error } = usePackages('TUTOR');
  const [selectedPackage, setSelectedPackage] = useState<NewPackage | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const handlePurchase = (pkg: NewPackage) => {
    setSelectedPackage(pkg);
    setShowPurchaseModal(true);
  };

  const handlePurchaseSuccess = (result: any) => {
    console.log('Purchase successful:', result);
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
        <h1 className="text-4xl font-bold mb-4">Tutor Packages</h1>
        <p className="text-xl text-muted-foreground">
          Professional packages designed for tutors and educators
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <PackageCard
            key={pkg.id}
            package={pkg}
            onPurchase={handlePurchase}
            userRole="TUTOR"
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

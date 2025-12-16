// src/components/packages/StudentPackages.tsx
'use client'

import React, { useState } from 'react';
// Container is not needed as we're using container mx-auto class
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { usePackages } from '@/hooks/useNewPackages';
import { PackageCard } from './PackageCard';
import { PackagePurchase } from './PackagePurchase';
import { NewPackage } from '@/lib/services/packageService';

interface StudentPackagesProps {
  userId: string;
  studentVerificationStatus?: string;
}

export const StudentPackages: React.FC<StudentPackagesProps> = ({ 
  userId, 
  studentVerificationStatus 
}) => {
  const { packages, loading, error } = usePackages('STUDENT');
  const [selectedPackage, setSelectedPackage] = useState<NewPackage | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const handlePurchase = (pkg: NewPackage) => {
    // Check if student verification is required for semester bundle
    if (pkg.packageType === 'SEMESTER_BUNDLE' && studentVerificationStatus !== 'VERIFIED') {
      alert('Student verification required for semester bundle');
      return;
    }
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
        <h1 className="text-4xl font-bold mb-4">Student Packages</h1>
        <p className="text-xl text-muted-foreground mb-4">
          Special packages designed for students
        </p>
        {studentVerificationStatus === 'VERIFIED' && (
          <Badge variant="default" className="mb-4">
            ✅ Student Verified
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <div key={pkg.id}>
            <PackageCard
              package={pkg}
              onPurchase={handlePurchase}
              userRole="STUDENT"
            />
            {pkg.packageType === 'SEMESTER_BUNDLE' && studentVerificationStatus !== 'VERIFIED' && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>
                  <small>Student verification required for semester bundle</small>
                </AlertDescription>
              </Alert>
            )}
          </div>
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

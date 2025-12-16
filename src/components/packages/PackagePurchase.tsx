// src/components/packages/PackagePurchase.tsx
'use client'

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { NewPackage, CustomerInfo } from '@/lib/services/packageService';

interface PackagePurchaseProps {
  show: boolean;
  onHide: () => void;
  package: NewPackage | null;
  userId: string;
  onSuccess: (result: any) => void;
}

export const PackagePurchase: React.FC<PackagePurchaseProps> = ({ 
  show, 
  onHide, 
  package: pkg, 
  userId, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    quantity: 1,
    customerInfo: {
      name: '',
      email: '',
      phone: ''
    } as CustomerInfo
  });
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('customerInfo.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        customerInfo: {
          ...prev.customerInfo,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkg) return;

    setPurchasing(true);
    setError(null);

    try {
      // Validate form data before submission
      if (!formData.customerInfo.name.trim()) {
        setError('Please enter your full name');
        return;
      }
      
      if (!formData.customerInfo.email.trim() || !formData.customerInfo.email.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }
      
      if (!formData.customerInfo.phone.trim()) {
        setError('Please enter your phone number');
        return;
      }

      const purchaseData = {
        userId,
        packageId: pkg.id,
        quantity: parseInt(formData.quantity.toString()),
        customerInfo: formData.customerInfo
      };

      console.log('🛒 Starting package purchase:', purchaseData);

      // Import the service dynamically to avoid circular imports
      const { default: packageService } = await import('@/lib/services/packageService');
      const result = await packageService.purchasePackage(purchaseData);
      
      console.log('✅ Purchase successful:', result);
      setSuccess(true);
      
      // Show success message for 2 seconds before closing
      setTimeout(() => {
        onSuccess(result);
        onHide();
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to purchase package';
      console.error('❌ Purchase failed:', errorMessage);
      setError(errorMessage);
    } finally {
      setPurchasing(false);
    }
  };

  const calculateTotal = () => {
    if (!pkg) return 0;
    const baseAmount = pkg.price * formData.quantity;
    const outletFee = pkg.outletFee * formData.quantity;
    return baseAmount + outletFee;
  };

  if (!pkg) return null;

  return (
    <Dialog open={show} onOpenChange={onHide}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Purchase Package</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handlePurchase} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <AlertDescription>
                ✅ Purchase successful! Redirecting to payment...
              </AlertDescription>
            </Alert>
          )}
          
          {/* Package Summary */}
          <div className="package-summary p-4 bg-muted rounded-lg space-y-2">
            <h5 className="font-semibold">{pkg.name}</h5>
            <p className="text-sm text-muted-foreground">{pkg.description}</p>
            <div className="flex justify-between text-sm">
              <span>Price per package:</span>
              <strong>SGD {pkg.price.toFixed(2)}</strong>
            </div>
        
            <hr />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <strong className="text-primary">SGD {calculateTotal().toFixed(2)}</strong>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="1"
              max="10"
              required
            />
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h6 className="font-medium">Customer Information</h6>
            
            <div className="space-y-2">
              <Label htmlFor="customerInfo.name">Full Name</Label>
              <Input
                id="customerInfo.name"
                type="text"
                name="customerInfo.name"
                value={formData.customerInfo.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerInfo.email">Email</Label>
              <Input
                id="customerInfo.email"
                type="email"
                name="customerInfo.email"
                value={formData.customerInfo.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerInfo.phone">Phone Number</Label>
              <Input
                id="customerInfo.phone"
                type="tel"
                name="customerInfo.phone"
                value={formData.customerInfo.phone}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onHide}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={purchasing}
            >
              {purchasing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Proceed to Payment'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};



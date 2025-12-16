// src/hooks/usePricing.ts
import { useState, useEffect } from 'react';
import pricingService, { PricingConfig } from '@/lib/services/pricingService';

interface UsePricingResult {
  pricing: PricingConfig[];
  loading: boolean;
  error: string | null;
  memberPricing: PricingConfig | null;
  tutorPricing: PricingConfig | null;
  studentPricing: PricingConfig | null;
}

export function usePricing(location: string = 'ALL'): UsePricingResult {
  const [pricing, setPricing] = useState<PricingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await pricingService.getAllPricingConfigurations();

        if (result.success && result.data) {
          let filteredPricing = result.data;

          // Filter by location if not 'ALL'
          if (location !== 'ALL') {
            filteredPricing = result.data.filter(p => p.location === location);
          }

          setPricing(filteredPricing);
        } else {
          setError(result.error || 'Failed to fetch pricing');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPricing();
  }, [location]);

  // Get specific member type pricing
  const memberPricing = pricing.find(p => p.memberType === 'MEMBER') || null;
  const tutorPricing = pricing.find(p => p.memberType === 'TUTOR') || null;
  const studentPricing = pricing.find(p => p.memberType === 'STUDENT') || null;

  return {
    pricing,
    loading,
    error,
    memberPricing,
    tutorPricing,
    studentPricing,
  };
}


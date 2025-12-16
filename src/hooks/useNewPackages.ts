// src/hooks/useNewPackages.ts
// New Package System Hooks

import { useState, useEffect, useCallback } from 'react';
import packageService, { NewPackage, UserPackage, UserPass, PurchaseHistory, PurchaseRequest } from '@/lib/services/packageService';

export const usePackages = (role?: string | null) => {
  const [packages, setPackages] = useState<NewPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchPackages = useCallback(async (isRetry = false) => {
    if (!role) return;
    
    setLoading(true);
    if (!isRetry) {
      setError(null);
    }
    
    try {
      console.log(`🔄 ${isRetry ? 'Retrying' : 'Fetching'} packages for role: ${role}`);
      const response = await packageService.getPackagesByRole(role);
      
      if (response.success && response.packages) {
        setPackages(response.packages);
        setError(null);
        setRetryCount(0);
        console.log(`✅ Successfully loaded ${response.packages.length} packages`);
      } else {
        const errorMsg = response.error || 'Failed to fetch packages';
        setError(errorMsg);
        console.error('❌ Failed to fetch packages:', errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch packages';
      setError(errorMsg);
      console.error('❌ Error fetching packages:', errorMsg);
    } finally {
      setLoading(false);
    }
  }, [role]);

  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    fetchPackages(true);
  }, [fetchPackages]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  return {
    packages,
    loading,
    error,
    retryCount,
    refetch: fetchPackages,
    retry
  };
};

export const usePackagePurchase = () => {
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const purchasePackage = useCallback(async (purchaseData: PurchaseRequest) => {
    setPurchasing(true);
    setPurchaseError(null);
    try {
      const result = await packageService.purchasePackage(purchaseData);
      return result;
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : 'Failed to purchase package');
      throw err;
    } finally {
      setPurchasing(false);
    }
  }, []);

  return {
    purchasing,
    purchaseError,
    purchasePackage
  };
};

export const useUserPackages = (userId: string | undefined) => {
  const [userPackages, setUserPackages] = useState<UserPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Passes pagination state
  const [availablePasses, setAvailablePasses] = useState<UserPass[]>([]);
  const [passesLoading, setPassesLoading] = useState(false);
  const [passesError, setPassesError] = useState<string | null>(null);
  const [passesPagination, setPassesPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
    nextPage: null,
    prevPage: null,
  });
  const [passesInitialized, setPassesInitialized] = useState(false);

  // Fetch user packages
  const fetchUserPackages = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await packageService.getUserPackages(userId);
      if (response.success && response.packages) {
        setUserPackages(response.packages);
      } else {
        setError(response.error || 'Failed to fetch user packages');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user packages');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch user passes with pagination
  const fetchUserPasses = useCallback(async (page: number = 1, limit: number = 10) => {
    if (!userId) return;
    
    try {
      setPassesLoading(true);
      setPassesError(null);
      const response = await packageService.getUserPasses(userId, page, limit);
      
      if (response.success && response.passes) {
        setAvailablePasses(response.passes);
        if (response.pagination) {
          setPassesPagination(response.pagination);
        }
        setPassesInitialized(true);
      } else {
        setPassesError(response.error || 'Failed to fetch user passes');
      }
      
      return response;
    } catch (err) {
      setPassesError(err instanceof Error ? err.message : 'Failed to fetch user passes');
      return null;
    } finally {
      setPassesLoading(false);
    }
  }, [userId]);

  // Initialize passes (called when Passes tab is first clicked)
  const initializePasses = useCallback(async () => {
    if (!passesInitialized && userId) {
      await fetchUserPasses(1, 10);
    }
  }, [passesInitialized, userId, fetchUserPasses]);

  // Change page for passes
  const changePassesPage = useCallback(async (newPage: number) => {
    if (newPage >= 1 && newPage <= passesPagination.totalPages) {
      await fetchUserPasses(newPage, 10); // Default limit of 10
    }
  }, [fetchUserPasses, passesPagination.totalPages]);

  // Fetch purchase history
  const fetchPurchaseHistory = useCallback(async (): Promise<PurchaseHistory[]> => {
    if (!userId) return [];
    
    try {
      setError(null);
      const response = await packageService.getUserPurchaseHistory(userId);
      if (response.success && response.history) {
        return response.history;
      } else {
        setError(response.error || 'Failed to fetch purchase history');
        return [];
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch purchase history');
      return [];
    }
  }, [userId]);

  // Initialize user packages on mount or userId change
  useEffect(() => {
    if (userId) {
      fetchUserPackages();
    }
  }, [userId, fetchUserPackages]);

  return {
    userPackages,
    loading,
    error,
    fetchUserPackages,
    fetchUserPasses,
    changePassesPage,
    initializePasses,
    fetchPurchaseHistory,
    // Passes state
    availablePasses,
    passesLoading,
    passesError,
    passesPagination,
    passesInitialized,
  };
};

export const useAdminPackages = () => {
  const [packages, setPackages] = useState<NewPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllPackages = useCallback(async (filters: Record<string, any> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await packageService.getAllPackages(filters);
      if (response.success && response.packages) {
        setPackages(response.packages);
      } else {
        setError(response.error || 'Failed to fetch packages');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch packages');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPackage = useCallback(async (packageData: Partial<NewPackage>) => {
    try {
      const response = await packageService.createPackage(packageData);
      if (response.success) {
        await fetchAllPackages(); // Refresh the list
        return response;
      } else {
        throw new Error(response.error || 'Failed to create package');
      }
    } catch (err) {
      throw err;
    }
  }, [fetchAllPackages]);

  const updatePackage = useCallback(async (packageId: string, packageData: Partial<NewPackage>) => {
    try {
      const response = await packageService.updatePackage(packageId, packageData);
      if (response.success) {
        await fetchAllPackages(); // Refresh the list
        return response;
      } else {
        throw new Error(response.error || 'Failed to update package');
      }
    } catch (err) {
      throw err;
    }
  }, [fetchAllPackages]);

  const deletePackage = useCallback(async (packageId: string, force: boolean = false) => {
    try {
      const response = await packageService.deletePackage(packageId, force);
      if (response.success) {
        await fetchAllPackages(); // Refresh the list
        return response;
      } else {
        throw new Error(response.error || 'Failed to delete package');
      }
    } catch (err) {
      throw err;
    }
  }, [fetchAllPackages]);

  return {
    packages,
    loading,
    error,
    fetchAllPackages,
    createPackage,
    updatePackage,
    deletePackage,
  };
};

export const usePackagePasses = (userId: string | undefined) => {
  const [passes, setPasses] = useState<UserPass[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
    nextPage: null,
    prevPage: null,
  });

  const fetchPasses = useCallback(async (page: number = 1, limit: number = 10) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await packageService.getUserPasses(userId, page, limit);
      
      if (response.success && response.passes) {
        setPasses(response.passes);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        setError(response.error || 'Failed to fetch passes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch passes');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const usePass = useCallback(async (passId: string, bookingId: string, locationId: string, startTime: string, endTime: string) => {
    if (!userId) return { success: false, error: 'User ID required' };
    
    try {
      const response = await packageService.usePass(userId, passId, bookingId, locationId, startTime, endTime);
      if (response.success) {
        // Refresh passes after using one
        await fetchPasses(pagination.currentPage, pagination.itemsPerPage);
      }
      return response;
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to use pass'
      };
    }
  }, [userId, fetchPasses, pagination.currentPage, pagination.itemsPerPage]);

  return {
    passes,
    loading,
    error,
    pagination,
    fetchPasses,
    usePass,
  };
};

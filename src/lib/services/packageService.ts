// src/lib/services/packageService.ts
// New Package System Service Layer

import { authenticatedFetch } from '@/lib/apiClient'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'https://productive-space-backend.vercel.app';

// Types based on new package system
export interface NewPackage {
  id: string;
  name: string;
  description: string;
  packageType: 'HALF_DAY' | 'FULL_DAY' | 'SEMESTER_BUNDLE';
  targetRole: 'MEMBER' | 'TUTOR' | 'STUDENT';
  price: number;
  originalPrice?: number;
  outletFee: number;
  passCount: number;
  validityDays: number;
  hoursAllowed?: number;
  isActive: boolean;
  discount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  company?: string;
  billingAddress?: string;
  postalCode?: string;
}

export interface PurchaseRequest {
  userId: string;
  packageId: string;
  quantity: number;
  customerInfo: CustomerInfo;
}

export interface PurchaseResponse {
  success: boolean;
  message: string;
  data: {
    orderId: string;
    userPackageId: string;
    packageName: string;
    quantity: number;
    totalAmount: number;
    paymentStatus: string;
  };
}

export interface PackageConfirmationRequest {
  userPackageId: string;
  orderId: string;
  hitpayReference: string;
}

export interface PackageConfirmationResponse {
  success: boolean;
  message: string;
  data: {
    userPackageId: string;
    orderId: string;
    paymentStatus: string;
    hitpayReference: string;
    packageName: string;
    packageType: string;
    targetRole: string;
    totalAmount: number;
    activatedAt: string;
    expiresAt: string;
    userInfo: {
      email: string;
      name: string;
      memberType: string;
    };
    packageContents: {
      totalHours: number;
      halfDayHours: number;
      halfDayPasses: number;
      complimentaryHours: number;
    };
  };
}

export interface UserPackage {
  id: string;
  orderId: string;
  packageId: string;
  packageName: string;
  packageType: string;
  targetRole: string;
  description: string;
  packageContents: {
    passCount: number;
    validityDays: number;
  };
  quantity: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  isExpired: boolean;
  totalPasses: number;
  usedPasses: number;
  remainingPasses: number;
  expiredPasses: number;
  hoursAllowed?: number;
  createdAt: string;
}

export interface UserPass {
  id: string;
  passType: string;
  hours: number;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  packageName: string;
  packageType: string;
  createdAt: string;
  canUse: boolean;
}

export interface PurchaseHistory {
  id: string;
  orderId: string;
  packageName: string;
  packageType: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  hitpayReference?: string;
  customerInfo: CustomerInfo;
  createdAt: string;
}

class PackageService {
  // Get packages by role
  async getPackagesByRole(role: string): Promise<{ success: boolean; packages?: NewPackage[]; error?: string }> {
    try {
      console.log(`🔍 Fetching packages for role: ${role}`);
      const response = await authenticatedFetch(`${API_BASE_URL}/new-packages/role/${role}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        console.error(`❌ API Error (${response.status}):`, errorData);
        
        // Provide more specific error messages based on status codes
        let errorMessage = errorData.message || 'Failed to fetch packages';
        if (response.status === 404) {
          errorMessage = `No packages found for ${role} role`;
        } else if (response.status === 500) {
          errorMessage = 'Server error occurred while fetching packages';
        } else if (response.status === 403) {
          errorMessage = 'Access denied. Please check your permissions';
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log(`✅ Successfully fetched packages for ${role}:`, data);
      
      // Handle the actual API response structure: data.data.packages or data.packages
      const packages = data.data?.packages || data.packages || [];
      console.log(`📦 Found ${packages.length} packages for ${role}`);
      
      return { success: true, packages };
    } catch (error) {
      console.error('Error fetching packages by role:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred while fetching packages'
      };
    }
  }

  // Get specific package by ID
  async getPackageById(packageId: string): Promise<{ success: boolean; package?: NewPackage; error?: string }> {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/new-packages/${packageId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch package');
      }
      const data = await response.json();
      return { success: true, package: data.package };
    } catch (error) {
      console.error('Error fetching package:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch package'
      };
    }
  }

  // Purchase package
  async purchasePackage(purchaseData: PurchaseRequest): Promise<PurchaseResponse> {
    try {
      console.log('🚀 Purchase API Call:', `${API_BASE_URL}/new-packages/purchase`);
      console.log('📦 Purchase Data:', purchaseData);
      
      // Validate purchase data before sending
      if (!purchaseData.userId || !purchaseData.packageId || !purchaseData.quantity) {
        throw new Error('Missing required purchase information');
      }
      
      if (purchaseData.quantity < 1 || purchaseData.quantity > 10) {
        throw new Error('Quantity must be between 1 and 10');
      }
      
      if (!purchaseData.customerInfo.name || !purchaseData.customerInfo.email) {
        throw new Error('Customer information is required');
      }
      
      const response = await authenticatedFetch(`${API_BASE_URL}/new-packages/purchase`, {
        method: 'POST',
        body: JSON.stringify(purchaseData),
      });
      
      console.log('📡 Purchase Response Status:', response.status, response.ok);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        console.error('❌ Purchase API Error:', errorData);
        
        // Provide more specific error messages
        let errorMessage = errorData.message || 'Failed to purchase package';
        if (response.status === 400) {
          errorMessage = 'Invalid purchase data. Please check your information';
        } else if (response.status === 404) {
          errorMessage = 'Package not found or no longer available';
        } else if (response.status === 409) {
          errorMessage = 'Package is out of stock or unavailable';
        } else if (response.status === 500) {
          errorMessage = 'Server error occurred during purchase. Please try again';
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('✅ Purchase API Response:', data);
      
      return data;
    } catch (error) {
      console.error('Error purchasing package:', error);
      throw error;
    }
  }

  // Confirm package purchase after payment
  async confirmPackagePurchase(confirmationData: PackageConfirmationRequest): Promise<PackageConfirmationResponse> {
    try {
      console.log('🔔 Package Confirmation API Call:', `${API_BASE_URL}/packages/confirm`);
      console.log('📦 Confirmation Data:', confirmationData);
      
      const response = await authenticatedFetch(`${API_BASE_URL}/packages/confirm`, {
        method: 'POST',
        body: JSON.stringify(confirmationData),
      });
      
      console.log('📡 Confirmation Response Status:', response.status, response.ok);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        console.error('❌ Confirmation API Error:', errorData);
        
        let errorMessage = errorData.message || 'Failed to confirm package purchase';
        if (response.status === 400) {
          errorMessage = 'Invalid confirmation data. Please check your information';
        } else if (response.status === 404) {
          errorMessage = 'Package purchase not found';
        } else if (response.status === 409) {
          errorMessage = 'Package purchase already confirmed';
        } else if (response.status === 500) {
          errorMessage = 'Server error occurred during confirmation. Please try again';
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('✅ Package Confirmation Response:', data);
      
      return data;
    } catch (error) {
      console.error('Error confirming package purchase:', error);
      throw error;
    }
  }

  // Create payment for package purchase
  async createPackagePayment(paymentData: {
    userPackageId: string;
    orderId: string;
    amount: number;
    paymentMethod: string;
    customerInfo: CustomerInfo;
    redirectUrl: string;
    webhookUrl: string;
  }): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/new-packages/payment`, {
        method: 'POST',
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create payment');
      }
      
      const data = await response.json();
      return { success: true, url: data.url };
    } catch (error) {
      console.error('Error creating package payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment'
      };
    }
  }

  // Complete payment for pending package
  async completePackagePayment(userPackageId: string, orderId: string, customerInfo: CustomerInfo, amount: number, paymentMethod: string = 'paynow_online'): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      console.log('💳 Completing payment for package:', userPackageId);
      
      // Use the same API endpoint as PaymentStep
      const paymentData = {
        userPackageId,
        orderId,
        amount: amount.toFixed(2), // Format as string with 2 decimal places
        paymentMethod, // 'paynow_online' or 'card'
        customerInfo: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone
        },
        redirectUrl: `${window.location.origin}/buy-pass?step=3&orderId=${orderId}&userPackageId=${userPackageId}`,
        webhookUrl: `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/packages/webhook`
      };
      
      console.log('Creating package payment:', paymentData);
      console.log('Full API URL:', `${API_BASE_URL}/packages/payment`);
      
      const response = await authenticatedFetch(`${API_BASE_URL}/packages/payment`, {
        method: 'POST',
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        console.error('❌ Complete Payment API Error:', errorData);
        throw new Error(errorData.message || 'Failed to complete payment');
      }
      
      const data = await response.json();
      console.log('✅ Complete Payment Response:', data);
      
      if (data.url) {
        return { success: true, url: data.url };
      } else {
        throw new Error(data.message || 'No payment URL received');
      }
    } catch (error) {
      console.error('Error completing package payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete payment'
      };
    }
  }

  // Get user's packages
  async getUserPackages(userId: string): Promise<{ success: boolean; packages?: UserPackage[]; error?: string }> {
    try {
      console.log(`🔍 Fetching user packages for userId: ${userId}`);
      const response = await authenticatedFetch(`${API_BASE_URL}/new-packages/user/${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        console.error(`❌ User Packages API Error (${response.status}):`, errorData);
        throw new Error(errorData.message || 'Failed to fetch user packages');
      }
      
      const data = await response.json();
      
      
      // Handle the new API response structure: data.purchases instead of data.packages
      const rawPackages = data.purchases || data.packages || [];
  
      
      // Map the packages to include the required fields
      const packages = rawPackages.map((pkg: any) => ({
        id: pkg.id,
        orderId: pkg.orderId,
        packageId: pkg.packageId,
        packageName: pkg.Package?.name || pkg.packageName,
        packageType: pkg.Package?.packageType || pkg.packageType,
        targetRole: pkg.Package?.targetRole || pkg.targetRole,
        description: pkg.Package?.description || pkg.description,
        passCount: pkg.Package?.passCount || pkg.passCount,
        validityDays: pkg.Package?.validityDays || pkg.validityDays,
        hoursAllowed: pkg.Package?.hoursAllowed || pkg.hoursAllowed || 4, // Default to 4 hours
        quantity: pkg.quantity,
        totalAmount: pkg.totalAmount,
        paymentStatus: pkg.paymentStatus,
        paymentMethod: pkg.paymentMethod,
        activatedAt: pkg.activatedAt,
        expiresAt: pkg.expiresAt,
        isExpired: pkg.isExpired || (pkg.expiresAt ? new Date() > new Date(pkg.expiresAt) : false),
        totalPasses: pkg.totalPasses ?? (pkg.Package?.passCount || 0),
        usedPasses: pkg.usedPasses ?? 0,
        remainingPasses: pkg.remainingPasses ?? (pkg.Package?.passCount || 0),
        expiredPasses: pkg.expiredPasses ?? 0,
        createdAt: pkg.createdAt
      }));
      
    
      return { success: true, packages };
    } catch (error) {
      console.error('Error fetching user packages:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user packages'
      };
    }
  }

  // Admin: Get all packages
  async getAllPackages(filters: Record<string, any> = {}): Promise<{ success: boolean; packages?: NewPackage[]; error?: string }> {
    try {
      console.log('🔍 Fetching all packages for admin...');
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(`${API_BASE_URL}/new-packages/admin/all?${queryParams}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
      
        let errorMessage = errorData.message || 'Failed to fetch all packages';
        if (response.status === 404) {
          errorMessage = 'No packages found';
        } else if (response.status === 500) {
          errorMessage = 'Server error occurred while fetching packages';
        } else if (response.status === 403) {
          errorMessage = 'Access denied. Admin privileges required';
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
    
      // Handle the actual API response structure: data.data.packages
      const packages = data.data?.packages || data.packages || [];
    
      return { success: true, packages };
    } catch (error) {
      console.error('Error fetching all packages:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred while fetching packages'
      };
    }
  }

  // Admin: Create package
  async createPackage(packageData: Partial<NewPackage>): Promise<{ success: boolean; package?: NewPackage; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/new-packages/admin/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(packageData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create package');
      }
      const data = await response.json();
      return { success: true, package: data.package };
    } catch (error) {
      console.error('Error creating package:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create package'
      };
    }
  }

  // Admin: Update package
  async updatePackage(packageId: string, packageData: Partial<NewPackage>): Promise<{ success: boolean; package?: NewPackage; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/new-packages/admin/${packageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(packageData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update package');
      }
      const data = await response.json();
      return { success: true, package: data.package };
    } catch (error) {
      console.error('Error updating package:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update package'
      };
    }
  }

  // Admin: Delete package
  async deletePackage(packageId: string, force: boolean = false): Promise<{ success: boolean; error?: string }> {
    try {
      const url = force 
        ? `${API_BASE_URL}/new-packages/admin/${packageId}?force=true`
        : `${API_BASE_URL}/new-packages/admin/${packageId}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete package');
      }
      return { success: true };
    } catch (error) {
      console.error('Error deleting package:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete package'
      };
    }
  }

  // Admin: Get package purchases
  async getPackagePurchases(filters: Record<string, any> = {}): Promise<{ success: boolean; purchases?: PurchaseHistory[]; error?: string }> {
    try {
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(`${API_BASE_URL}/new-packages/admin/purchases?${queryParams}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch package purchases');
      }
      const data = await response.json();
      return { success: true, purchases: data.purchases || [] };
    } catch (error) {
      console.error('Error fetching package purchases:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch package purchases'
      };
    }
  }

  // Get user's available passes
  async getUserPasses(userId: string, page: number = 1, limit: number = 10): Promise<{
    success: boolean;
    passes?: UserPass[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
      nextPage: number | null;
      prevPage: number | null;
    };
    error?: string;
  }> {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/new-packages/user/${userId}/passes?page=${page}&limit=${limit}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch user passes');
      }
      const data = await response.json();
      return { 
        success: true, 
        passes: data.passes || [],
        pagination: data.pagination
      };
    } catch (error) {
      console.error('Error fetching user passes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user passes'
      };
    }
  }

  // Use a pass for booking
  async usePass(userId: string, passId: string, bookingId: string, locationId: string, startTime: string, endTime: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/new-packages/passes/use`, {
        method: 'POST',
        body: JSON.stringify({
          userId,
          passId,
          bookingId,
          locationId,
          startTime,
          endTime,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Pass usage failed');
      }

      return { success: true };
    } catch (error) {
      console.error('Error using pass:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to use pass'
      };
    }
  }

  // Get user's purchase history
  async getUserPurchaseHistory(userId: string): Promise<{ success: boolean; history?: PurchaseHistory[]; error?: string }> {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/new-packages/user/${userId}/history`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch purchase history');
      }
      const data = await response.json();
      return { success: true, history: data.history || [] };
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch purchase history'
      };
    }
  }
}

export default new PackageService();

// Standalone exports for convenience
export const getUserPackages = async (userId: string): Promise<UserPackage[]> => {
  const service = new PackageService();
  const result = await service.getUserPackages(userId);
  if (result.success && result.packages) {
    return result.packages;
  }
  throw new Error(result.error || 'Failed to fetch user packages');
};

export const completePackagePayment = async (userPackageId: string, orderId: string, customerInfo: CustomerInfo, amount: number, paymentMethod: string = 'paynow_online'): Promise<{ success: boolean; url?: string; error?: string }> => {
  const service = new PackageService();
  return await service.completePackagePayment(userPackageId, orderId, customerInfo, amount, paymentMethod);
};

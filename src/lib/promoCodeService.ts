// Promo Code Service - Based on Backend API Documentation
import { getAuthHeaders, authenticatedFetch } from './apiClient'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8000/api';

// Types based on backend API documentation
export interface PromoCode {
  id: string;
  code: string;
  name: string;
  description?: string;
  promoType: 'GENERAL' | 'GROUP_SPECIFIC' | 'USER_SPECIFIC' | 'WELCOME';
  targetGroup?: 'STUDENT' | 'MEMBER' | 'TUTOR' | null;
  targetUserIds?: string[];
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number;
  minimumAmount?: number;
  minimumHours?: number; // NEW: Minimum booking duration in hours
  maxUsagePerUser?: number;
  globalUsageLimit?: number;
  activeFrom?: string;
  activeTo?: string | null;
  isActive?: boolean;
  category?: string;
  priority?: number;
  currentUsage?: number;
  usageCount?: number;
  isExpired?: boolean;
  isNotYetActive?: boolean;
  timeStatus?: 'active' | 'expired' | 'not_yet_active';
  remainingTime?: string;
  remainingGlobalUses?: number;
  userUsageCount?: number;
  remainingUses?: number;
  createdAt?: string;
  updatedAt?: string;
  eligibility?: {
    isEligible: boolean;
    reason: string;
  };
  
  // Database field names (snake_case)
  discounttype?: 'percentage' | 'fixed';
  discountvalue?: number;
  maxdiscountamount?: number;
  minimumamount?: number;
  minimumhours?: number; // NEW: Database field name
  minimum_hours?: number; // NEW: API field name
  maxusageperuser?: number;
  globalusagelimit?: number;
  activefrom?: string;
  activeto?: string;
  isactive?: boolean;
  currentusage?: number;
  createdat?: string;
  updatedat?: string;
}

export interface PromoCodeUsage {
  id: string;
  promocodeid: string;
  userid: string;
  bookingid: string;
  usedat: string;
  createdat: string;
  discountAmount: number | null;
  originalAmount: number | null;
  finalAmount: number | null;
  PromoCode?: PromoCode;
}

export interface PromoCodeCalculation {
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
}

export interface PromoCodeEligibility {
  isEligible: boolean;
  reason: string;
}

export interface BookingDuration {
  startAt: string;
  endAt: string;
  durationHours: number;
}

export interface ApplyPromoCodeRequest {
  promoCode: string;
  userId: string;
  bookingAmount: number;
  startAt?: string; // NEW: Booking start time
  endAt?: string;   // NEW: Booking end time
}

export interface ApplyPromoCodeResponse {
  message: string;
  promoCode: PromoCode;
  calculation: PromoCodeCalculation;
  eligibility: PromoCodeEligibility;
  error?: string;
}

export interface AvailablePromosResponse {
  availablePromos: PromoCode[];
  totalCount: number;
  userInfo: {
    memberType: string;
    studentVerificationStatus: string;
    firstName: string;
    lastName: string;
  };
}

export interface UsedPromosResponse {
  usedPromos: PromoCodeUsage[];
  totalCount: number;
}

export interface AdminPromoCodesResponse {
  promoCodes: PromoCode[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    status: string;
    promoType: string;
    targetGroup: string;
  };
}

// User/Client API Functions
export const applyPromoCode = async (request: ApplyPromoCodeRequest): Promise<ApplyPromoCodeResponse> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/promocode/apply`, {
      method: 'POST',
      body: JSON.stringify(request),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return {
        message: result.error || 'Failed to apply promo code',
        promoCode: {} as PromoCode,
        calculation: {
          originalAmount: request.bookingAmount,
          discountAmount: 0,
          finalAmount: request.bookingAmount
        },
        eligibility: {
          isEligible: false,
          reason: result.error || 'Failed to apply promo code'
        },
        error: result.error || 'Failed to apply promo code'
      };
    }

    return result;
  } catch (error) {
    console.error('Error applying promo code:', error);
    return {
      message: 'Network error occurred',
      promoCode: {} as PromoCode,
      calculation: {
        originalAmount: request.bookingAmount,
        discountAmount: 0,
        finalAmount: request.bookingAmount
      },
      eligibility: {
        isEligible: false,
        reason: 'Network error occurred'
      },
      error: 'Network error occurred'
    };
  }
};

export const getUserAvailablePromoCodes = async (userId: string): Promise<AvailablePromosResponse> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/promocode/user/${userId}/available`, {
      method: 'GET',
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Failed to fetch available promo codes:', result.error);
      return {
        availablePromos: [],
        totalCount: 0,
        userInfo: {
          memberType: '',
          studentVerificationStatus: '',
          firstName: '',
          lastName: ''
        }
      };
    }

    return result;
  } catch (error) {
    console.error('Error fetching available promo codes:', error);
    return {
      availablePromos: [],
      totalCount: 0,
      userInfo: {
        memberType: '',
        studentVerificationStatus: '',
        firstName: '',
        lastName: ''
      }
    };
  }
};

export const getUserUsedPromoCodes = async (userId: string): Promise<UsedPromosResponse> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/promocode/user/${userId}/used`, {
      method: 'GET',
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Failed to fetch used promo codes:', result.error);
      return {
        usedPromos: [],
        totalCount: 0
      };
    }

    return result;
  } catch (error) {
    console.error('Error fetching used promo codes:', error);
    return {
      usedPromos: [],
      totalCount: 0
    };
  }
};

// Admin API Functions
export const createPromoCode = async (promoData: {
  code: string;
  name: string;
  description?: string;
  discounttype: 'percentage' | 'fixed';
  discountvalue: number;
  maxDiscountAmount?: number;
  minimumamount?: number;
  activefrom?: string;
  activeto?: string;
  promoType: 'GENERAL' | 'GROUP_SPECIFIC' | 'USER_SPECIFIC' | 'WELCOME';
  targetGroup?: 'STUDENT' | 'MEMBER';
  targetUserIds?: string[];
  maxusageperuser?: number;
  globalUsageLimit?: number;
  isactive?: boolean;
  category?: string;
  priority?: number;
}): Promise<{ success: boolean; message: string; promoCode?: PromoCode; error?: string }> => {
  try {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/promocode/admin/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(promoData),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: result.message || result.error || 'Failed to create promo code',
        error: result.error || 'Failed to create promo code',
      };
    }

    return {
      success: true,
      message: result.message || 'Promo code created successfully',
      promoCode: result.promoCode
    };
  } catch (error) {
    console.error('Error creating promo code:', error);
    return {
      success: false,
      message: 'Network error occurred',
      error: 'Network error occurred',
    };
  }
};

export const updatePromoCode = async (id: string, promoData: Partial<{
  code: string;
  name: string;
  description?: string;
  discounttype: 'percentage' | 'fixed';
  discountvalue: number;
  maxDiscountAmount?: number;
  minimumamount?: number;
  activefrom?: string;
  activeto?: string;
  promoType: 'GENERAL' | 'GROUP_SPECIFIC' | 'USER_SPECIFIC' | 'WELCOME';
  targetGroup?: 'STUDENT' | 'MEMBER';
  targetUserIds?: string[];
  maxusageperuser?: number;
  globalUsageLimit?: number;
  isactive?: boolean;
  category?: string;
  priority?: number;
}>): Promise<{ success: boolean; message: string; promoCode?: PromoCode; error?: string }> => {
  try {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/promocode/admin/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(promoData),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: result.message || result.error || 'Failed to update promo code',
        error: result.error || 'Failed to update promo code',
      };
    }

    return {
      success: true,
      message: result.message || 'Promo code updated successfully',
      promoCode: result.promoCode
    };
  } catch (error) {
    console.error('Error updating promo code:', error);
    return {
      success: false,
      error: 'Network error occurred',
      message: 'Network error occurred',
    };
  }
};

export const deletePromoCode = async (id: string): Promise<{ success: boolean; message: string; error?: string }> => {
  try {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/promocode/admin/${id}`, {
      method: 'DELETE',
      headers,
    });

    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: result.message || result.error || 'Failed to delete promo code',
        error: result.error || 'Failed to delete promo code',
      };
    }

    return {
      success: true,
      message: result.message || 'Promo code deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting promo code:', error);
    return {
      success: false,
      error: 'Network error occurred',
      message: 'Network error occurred',
    };
  }
};

export const getAllPromoCodes = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  promoType?: string;
  targetGroup?: string;
}): Promise<AdminPromoCodesResponse> => {
  try {
    // Build query string from parameters
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.promoType) queryParams.append('promoType', params.promoType);
    if (params?.targetGroup) queryParams.append('targetGroup', params.targetGroup);

    const url = `${API_BASE_URL}/promocode/admin/all${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const headers = await getAuthHeaders()
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Failed to fetch all promo codes:', result.error);
      return {
        promoCodes: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        },
        filters: {
          status: 'all',
          promoType: 'all',
          targetGroup: 'all'
        }
      };
    }

    return result;
  } catch (error) {
    console.error('Error fetching all promo codes:', error);
    return {
      promoCodes: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      },
      filters: {
        status: 'all',
        promoType: 'all',
        targetGroup: 'all'
      }
    };
  }
};

export const getPromoCodeDetails = async (id: string): Promise<{ success: boolean; promoCode?: PromoCode; error?: string }> => {
  try {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/promocode/admin/${id}`, {
      method: 'GET',
      headers,
    });

    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to fetch promo code details',
      };
    }

    return {
      success: true,
      promoCode: result.promoCode
    };
  } catch (error) {
    console.error('Error fetching promo code details:', error);
    return {
      success: false,
      error: 'Network error occurred',
    };
  }
};

// Helper function to ensure date string is treated as UTC
const parseUTCDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  // Ensure the date is treated as UTC by appending 'Z' if not present
  let utcString = dateString;
  if (!utcString.endsWith('Z') && !utcString.match(/[+-]\d{2}:\d{2}$/)) {
    utcString = utcString + 'Z';
  }
  
  return new Date(utcString);
};

// Local Utility Functions
export const validatePromoCodeLocally = (promoCode: PromoCode, amount: number): { isValid: boolean; message: string } => {
  // Check if promo code is active
  const isActive = promoCode.isactive !== undefined ? promoCode.isactive : promoCode.isActive;
  if (isActive === false) {
    return { isValid: false, message: 'Promo code is not active' };
  }

  // Check date validity with current timezone
  // Backend sends UTC dates - ensure they're parsed as UTC, then JS converts to local
  const now = new Date();
  
  if (promoCode.activeFrom) {
    const activeFrom = parseUTCDate(promoCode.activeFrom);
    if (activeFrom && activeFrom > now) {
      return { isValid: false, message: 'Promo code is not yet active' };
    }
  }
  
  if (promoCode.activeTo) {
    const activeTo = parseUTCDate(promoCode.activeTo);
    if (activeTo && activeTo < now) {
      return { isValid: false, message: 'Promo code has expired' };
    }
  }

  // Check minimum amount requirement
  const minAmount = promoCode.minimumAmount || 0;
  if (amount < minAmount) {
    return { 
      isValid: false, 
      message: `Minimum booking amount of SGD ${minAmount} required for this promo code` 
    };
  }

  // Check usage limits
  const currentUsage = promoCode.currentUsage || 0;
  const maxUsage = promoCode.maxUsagePerUser || 0;
  if (maxUsage > 0 && currentUsage >= maxUsage) {
    return { isValid: false, message: `You have already used this promo code ${maxUsage} times` };
  }

  const globalLimit = promoCode.globalUsageLimit || 0;
  if (globalLimit > 0 && currentUsage >= globalLimit) {
    return { isValid: false, message: 'Promo code usage limit reached' };
  }

  return { isValid: true, message: 'Promo code is valid' };
};

export const calculateDiscountLocally = (promoCode: PromoCode, amount: number): { discountAmount: number; finalAmount: number } => {
  const isActive = promoCode.isactive !== undefined ? promoCode.isactive : promoCode.isActive;
  if (isActive === false) {
    return { discountAmount: 0, finalAmount: amount };
  }

  const minAmount = promoCode.minimumAmount || 0;
  if (amount < minAmount) {
    return { discountAmount: 0, finalAmount: amount };
  }

  let discountAmount = 0;

  if (promoCode.discountType === 'percentage') {
    discountAmount = (amount * promoCode.discountValue) / 100;
    
    if (promoCode.maxDiscountAmount && discountAmount > promoCode.maxDiscountAmount) {
      discountAmount = promoCode.maxDiscountAmount;
    }
  } else if (promoCode.discountType === 'fixed') {
    discountAmount = promoCode.discountValue;
    
    if (discountAmount > amount) {
      discountAmount = amount;
    }
  }

  const finalAmount = Math.max(0, amount - discountAmount);
  
  return { discountAmount, finalAmount };
};

export const formatDiscountDisplay = (promoCode: PromoCode): string => {
  if (promoCode.discountType === 'percentage') {
    return `${promoCode.discountValue}% off`;
  } else if (promoCode.discountType === 'fixed') {
    return `SGD ${promoCode.discountValue} off`;
  }
  return 'Discount available';
};

export const getPromoCodeTypeLabel = (promoCode: PromoCode): string => {
  switch (promoCode.promoType) {
    case 'GENERAL':
      return 'General Public';
    case 'GROUP_SPECIFIC':
      return `Group: ${promoCode.targetGroup || 'Unknown'}`;
    case 'USER_SPECIFIC':
      return 'Specific Users';
    case 'WELCOME':
      return 'Welcome Code';
    default:
      return 'Unknown';
  }
};

export const getPromoCodeStatusColor = (promoCode: PromoCode): string => {
  const isActive = promoCode.isactive !== undefined ? promoCode.isactive : promoCode.isActive;
  if (isActive === false) return 'text-red-500';
  
  const now = new Date();
  if (promoCode.activeFrom) {
    const activeFrom = new Date(promoCode.activeFrom);
    if (activeFrom > now) return 'text-yellow-500';
  }
  
  if (promoCode.activeTo) {
    const activeTo = new Date(promoCode.activeTo);
    if (activeTo < now) return 'text-red-500';
  }
  
  return 'text-green-500';
};

export const getPromoCodeStatusBadge = (promoCode: PromoCode): { variant: string; className: string; text: string } => {
  // Check both isactive (API response) and isActive (interface) for compatibility
  const isActive = promoCode.isactive !== undefined ? promoCode.isactive : promoCode.isActive;
  if (isActive === false) {
    return { variant: 'secondary', className: 'bg-red-100 text-red-800', text: 'Inactive' };
  }
  
  const now = new Date();
  if (promoCode.activeFrom) {
    const activeFrom = new Date(promoCode.activeFrom);
    if (activeFrom > now) {
      return { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800', text: 'Not Yet Active' };
    }
  }
  
  if (promoCode.activeTo) {
    const activeTo = new Date(promoCode.activeTo);
    if (activeTo < now) {
      return { variant: 'secondary', className: 'bg-red-100 text-red-800', text: 'Expired' };
    }
  }
  
  return { variant: 'default', className: 'bg-green-100 text-green-800', text: 'Active' };
};

// NEW: Utility functions for booking duration and minimum hours validation
export function calculateBookingDuration(startAt: string, endAt: string): number {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const durationMs = end.getTime() - start.getTime();
  return durationMs / (1000 * 60 * 60); // Convert to hours
}

export function validateMinimumHours(promo: PromoCode, bookingDuration: BookingDuration): {
  isValid: boolean;
  message: string;
} {
  if (!promo.minimumHours) {
    return { isValid: true, message: '' };
  }

  const durationHours = bookingDuration.durationHours;
  const minimumHours = promo.minimumHours;

  if (durationHours >= minimumHours) {
    return { 
      isValid: true, 
      message: `✅ Meets minimum ${minimumHours} hours requirement` 
    };
  } else {
    return { 
      isValid: false, 
      message: `❌ Requires minimum ${minimumHours} hours. Your booking is ${durationHours.toFixed(2)} hours.` 
    };
  }
}

export function formatDurationDisplay(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} minutes`;
  } else if (hours === Math.floor(hours)) {
    return `${hours} hours`;
  } else {
    return `${hours.toFixed(2)} hours`;
  }
}
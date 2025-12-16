// Refund Credit System Service
import { authenticatedFetch } from './apiClient'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8000';

export interface UserCredit {
  id: string;
  userid: string;
  amount: number;
  refundedfrombookingid: string;
  refundedat: string;
  expiresat: string;
  status: 'ACTIVE' | 'EXPIRED' | 'USED';
  createdat: string;
  updatedat: string;
  Booking?: {
    bookingRef: string;
    startAt: string;
    endAt: string;
    location: string;
  };
}

export interface CreditsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserCreditsResponse {
  items: UserCredit[];
  pagination: CreditsPagination;
}

export interface RefundTransaction {
  id: string;
  userid: string;
  bookingid: string;
  refundamount: number;
  creditamount: number;
  refundreason: string;
  refundstatus: 'REQUESTED' | 'APPROVED' | 'REJECTED';
  requestedat: string;
  processedat?: string;
  processedby?: string;
  createdat: string;
  updatedat: string;
  Booking?: {
    bookingRef: string;
    startAt: string;
    endAt: string;
    location: string;
    totalAmount: number;
  };
  User?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreditUsage {
  id: string;
  userid: string;
  creditid: string;
  bookingid: string;
  amountused: number;
  usedat: string;
  createdat: string;
  Booking?: {
    bookingRef: string;
    startAt: string;
    endAt: string;
    location: string;
    totalAmount: number;
  };
}

export interface PaymentCalculation {
  bookingAmount: number;
  availableCredit: number;
  paymentRequired: number;
  canUseCredit: boolean;
}

// User Credit Functions
export const getUserCredits = async (userId: string): Promise<{ credits: UserCredit[]; totalCredit: number; count: number }> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/refund/credits?userid=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user credits');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user credits:', error);
    throw error;
  }
};

export const getUserRefundRequests = async (userId: string): Promise<RefundTransaction[]> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/refund/requests?userid=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch refund requests');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching refund requests:', error);
    throw error;
  }
};

export const getUserCreditUsage = async (userId: string): Promise<CreditUsage[]> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/refund/credit-usage?userid=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch credit usage');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching credit usage:', error);
    throw error;
  }
};

export const requestRefund = async (bookingId: string, reason: string, userId: string): Promise<{ message: string; bookingId: string; creditid?: string; creditamount?: number; expiresat?: string }> => {
  try {
    // First, create the refund request
    const response = await authenticatedFetch(`${API_BASE_URL}/refund/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingid: bookingId,
        reason: reason,
        userid: userId
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to request refund');
    }
    
    const refundResult = await response.json();
    
    // Get the refund transaction ID from the response or fetch it
    // We need to get the refund transaction ID to approve it
    const refundRequests = await getUserRefundRequests(userId);
    const latestRefund = refundRequests.find(r => r.bookingid === bookingId && r.refundstatus === 'REQUESTED');
    
    if (latestRefund) {
      // Auto-approve the refund immediately
      try {
        const approveResponse = await authenticatedFetch(`${API_BASE_URL}/admin/refund/refunds/${latestRefund.id}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
        
        if (approveResponse.ok) {
          const approveResult = await approveResponse.json();
          return {
            message: 'Refund approved successfully',
            bookingId: bookingId,
            creditid: approveResult.creditid,
            creditamount: approveResult.creditamount,
            expiresat: approveResult.expiresat
          };
        }
      } catch (approveError) {
        console.error('Error auto-approving refund:', approveError);
        // Return the original result even if approval fails
      }
    }
    
    return refundResult;
  } catch (error) {
    console.error('Error requesting refund:', error);
    throw error;
  }
};

export const calculatePayment = async (bookingAmount: number, userId: string): Promise<PaymentCalculation> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/credit/calculate-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingAmount: bookingAmount,
        userid: userId
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to calculate payment');
    }
    return await response.json();
  } catch (error) {
    console.error('Error calculating payment:', error);
    throw error;
  }
};

// Admin Functions
export const getAllRefundRequests = async (): Promise<RefundTransaction[]> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/refund/refunds`);
    if (!response.ok) {
      throw new Error('Failed to fetch refund requests');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching refund requests:', error);
    throw error;
  }
};

export const getAllUserCredits = async (params?: { page?: number; limit?: number; search?: string }): Promise<UserCreditsResponse> => {
  try {
    const q: string[] = [];
    if (params?.page) q.push(`page=${params.page}`);
    if (params?.limit) q.push(`limit=${params.limit}`);
    if (params?.search && params.search.trim()) q.push(`search=${encodeURIComponent(params.search.trim())}`);
    const qs = q.length ? `?${q.join('&')}` : '';
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/refund/credits${qs}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user credits');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user credits:', error);
    throw error;
  }
};

export const approveRefund = async (refundId: string): Promise<{ message: string; creditid: string; creditamount: number; expiresat: string }> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/refund/refunds/${refundId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    
    if (!response.ok) {
      throw new Error('Failed to approve refund');
    }
    return await response.json();
  } catch (error) {
    console.error('Error approving refund:', error);
    throw error;
  }
};

export const rejectRefund = async (refundId: string): Promise<{ message: string }> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/refund/refunds/${refundId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    
    if (!response.ok) {
      throw new Error('Failed to reject refund');
    }
    return await response.json();
  } catch (error) {
    console.error('Error rejecting refund:', error);
    throw error;
  }
};

export const getRefundStats = async (): Promise<{ totalRefunded: number; totalTransactions: number; averageRefund: number }> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/refund/stats`);
    if (!response.ok) {
      throw new Error('Failed to fetch refund stats');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching refund stats:', error);
    throw error;
  }
};

export const updateUserCredits = async (userId: string, newAmount: number): Promise<{ message: string; oldAmount: number; newAmount: number }> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/refund/credits/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newAmount }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update user credits');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating user credits:', error);
    throw error;
  }
};
// Edit Booking Service - API calls for edit booking functionality
import { authenticatedFetch } from './apiClient'

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8000/api'

export interface EditBookingRequest {
  startAt: string
  endAt: string
  location: string
  students: number
  members: number
  tutors: number
  pax: number
  seatNumbers: string[]
  totalAmount: number
  totalCost: number
  memberType: string
  paymentIntentId?: string
  refundAmount?: number
}

export interface PriceDifferenceRequest {
  startAt: string
  endAt: string
  location: string
  students: number
  members: number
  tutors: number
  pax: number
}

export interface PriceDifferenceResponse {
  success: boolean
  originalCost: number
  newCost: number
  priceDifference: number
  requiresPayment: boolean
  requiresRefund: boolean
  durationInHours: number
  error?: string
}

export interface EditBookingResponse {
  success: boolean
  message?: string
  booking?: any
  error?: string
}

export interface BookingForEditResponse {
  success: boolean
  booking?: any
  error?: string
}

// Get booking details for editing
export const getBookingForEdit = async (bookingId: string): Promise<BookingForEditResponse> => {
  try {
    const response = await authenticatedFetch(`${API_BASE}/edit-booking/booking/${bookingId}`, {
      method: 'GET',
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to fetch booking details'
      }
    }

    return result
  } catch (error) {
    console.error('Get Booking For Edit Error:', error)
    return {
      success: false,
      error: 'Failed to fetch booking details'
    }
  }
}

// Calculate price difference for proposed changes
export const calculatePriceDifference = async (
  bookingId: string,
  changes: PriceDifferenceRequest
): Promise<PriceDifferenceResponse> => {
  try {
    const response = await authenticatedFetch(`${API_BASE}/edit-booking/booking/${bookingId}/calculate-price`, {
      method: 'POST',
      body: JSON.stringify(changes),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        originalCost: 0,
        newCost: 0,
        priceDifference: 0,
        requiresPayment: false,
        requiresRefund: false,
        durationInHours: 0,
        error: result.error || 'Failed to calculate price difference'
      }
    }

    return result
  } catch (error) {
    console.error('Calculate Price Difference Error:', error)
    return {
      success: false,
      originalCost: 0,
      newCost: 0,
      priceDifference: 0,
      requiresPayment: false,
      requiresRefund: false,
      durationInHours: 0,
      error: 'Failed to calculate price difference'
    }
  }
}

// Update booking with new details
export const updateBooking = async (
  bookingId: string,
  editData: EditBookingRequest
): Promise<EditBookingResponse> => {
  try {
    const response = await authenticatedFetch(`${API_BASE}/edit-booking/booking/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify(editData),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to update booking'
      }
    }

    return result
  } catch (error) {
    console.error('Update Booking Error:', error)
    return {
      success: false,
      error: 'Failed to update booking'
    }
  }
}

// Get booking details from reschedule API (for backward compatibility)
export const getBookingFromReschedule = async (bookingId: string): Promise<any> => {
  try {
    const response = await authenticatedFetch(`${API_BASE}/reschedule/booking/${bookingId}`, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch booking')
    }

    return await response.json()
  } catch (error) {
    console.error('Get Booking From Reschedule Error:', error)
    throw error
  }
}


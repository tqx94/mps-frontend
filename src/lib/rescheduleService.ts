// src/lib/rescheduleService.ts - Reschedule booking service
import { authenticatedFetch } from './apiClient'

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8000'

export interface RescheduleRequest {
  startAt: string
  endAt: string
  seatNumbers?: string[]
}

export interface RescheduleResponse {
  success: boolean
  message?: string
  error?: string
  booking?: any
  conflictingSeats?: string[]
  requiresSeatSelection?: boolean
}

export interface AvailableSeatsResponse {
  success: boolean
  availableSeats?: string[]
  occupiedSeats?: string[]
  error?: string
}

// Reschedule booking
export const rescheduleBooking = async (
  bookingId: string, 
  rescheduleData: RescheduleRequest
): Promise<RescheduleResponse> => {
  try {
    const response = await authenticatedFetch(`${API_BASE}/reschedule/booking/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify(rescheduleData),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to reschedule booking'
      }
    }

    return result
  } catch (error) {
    console.error('Reschedule Booking Error:', error)
    return {
      success: false,
      error: 'Failed to reschedule booking'
    }
  }
}

// Get available seats for reschedule
export const getAvailableSeatsForReschedule = async (
  bookingId: string,
  startAt: string,
  endAt: string
): Promise<AvailableSeatsResponse> => {
  try {
    const params = new URLSearchParams({
      startAt,
      endAt
    })

    const response = await authenticatedFetch(`${API_BASE}/reschedule/booking/${bookingId}/available-seats?${params}`)

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to get available seats'
      }
    }

    return result
  } catch (error) {
    console.error('Get Available Seats Error:', error)
    return {
      success: false,
      error: 'Failed to get available seats'
    }
  }
}

// Get booking details for reschedule
export const getBookingForReschedule = async (bookingId: string): Promise<{
  success: boolean
  booking?: any
  error?: string
}> => {
  try {
    const response = await authenticatedFetch(`${API_BASE}/booking/${bookingId}`)
    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to get booking details'
      }
    }

    return result
  } catch (error) {
    console.error('Get Booking Error:', error)
    return {
      success: false,
      error: 'Failed to get booking details'
    }
  }
}

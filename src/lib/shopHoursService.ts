/**
 * Shop Hours Service
 * Handles API calls for operating hours and closure dates
 */
import { authenticatedFetch } from './apiClient'

export interface OperatingHours {
    id: string
    location: string
    dayOfWeek: number // 0=Sunday, 1=Monday, ..., 6=Saturday
    openTime: string // HH:MM:SS
    closeTime: string // HH:MM:SS
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export interface ClosureDate {
    id: string
    location: string
    startDate: string // ISO timestamp
    endDate: string // ISO timestamp
    reason: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL

/**
 * Get operating hours for a location
 */
export async function getOperatingHours(location: string): Promise<OperatingHours[]> {
    try {
        const response = await authenticatedFetch(`${BASE_URL}/shop-hours/operating/${location}`)
        const data = await response.json()

        if (data.success) {
            return data.data
        }
        throw new Error(data.message || 'Failed to fetch operating hours')
    } catch (error) {
        console.error('Error fetching operating hours:', error)
        throw error
    }
}

/**
 * Update operating hours for a specific day
 */
export async function updateOperatingHours(
    id: string,
    openTime: string,
    closeTime: string,
    isActive: boolean = true
): Promise<OperatingHours> {
    try {
        const response = await authenticatedFetch(`${BASE_URL}/shop-hours/operating/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ openTime, closeTime, isActive })
        })

        const data = await response.json()

        if (data.success) {
            return data.data
        }
        throw new Error(data.message || 'Failed to update operating hours')
    } catch (error) {
        console.error('Error updating operating hours:', error)
        throw error
    }
}

/**
 * Get closure dates for a location
 */
export async function getClosureDates(location: string): Promise<ClosureDate[]> {
    try {
        const response = await authenticatedFetch(`${BASE_URL}/shop-hours/closures/${location}`)
        const data = await response.json()

        if (data.success) {
            return data.data
        }
        throw new Error(data.message || 'Failed to fetch closure dates')
    } catch (error) {
        console.error('Error fetching closure dates:', error)
        throw error
    }
}

/**
 * Create a new closure date
 */
export async function createClosureDate(
    location: string,
    startDate: string,
    endDate: string,
    reason: string
): Promise<ClosureDate> {
    try {
        const response = await authenticatedFetch(`${BASE_URL}/shop-hours/closures`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ location, startDate, endDate, reason })
        })

        const data = await response.json()

        if (data.success) {
            return data.data
        }
        throw new Error(data.message || 'Failed to create closure date')
    } catch (error) {
        console.error('Error creating closure date:', error)
        throw error
    }
}

/**
 * Update a closure date
 */
export async function updateClosureDate(
    id: string,
    startDate: string,
    endDate: string,
    reason: string,
    isActive: boolean = true
): Promise<ClosureDate> {
    try {
        const response = await authenticatedFetch(`${BASE_URL}/shop-hours/closures/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ startDate, endDate, reason, isActive })
        })

        const data = await response.json()

        if (data.success) {
            return data.data
        }
        throw new Error(data.message || 'Failed to update closure date')
    } catch (error) {
        console.error('Error updating closure date:', error)
        throw error
    }
}

/**
 * Delete a closure date
 */
export async function deleteClosureDate(id: string): Promise<void> {
    try {
        const response = await authenticatedFetch(`${BASE_URL}/shop-hours/closures/${id}`, {
            method: 'DELETE'
        })

        const data = await response.json()

        if (!data.success) {
            throw new Error(data.message || 'Failed to delete closure date')
        }
    } catch (error) {
        console.error('Error deleting closure date:', error)
        throw error
    }
}

/**
 * Check if a time slot is available
 */
export async function checkAvailability(
    location: string,
    startAt: string,
    endAt: string
): Promise<{ available: boolean; reason?: string }> {
    try {
        const response = await authenticatedFetch(`${BASE_URL}/shop-hours/check-availability`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ location, startAt, endAt })
        })

        const data = await response.json()

        if (data.success) {
            return {
                available: data.available,
                reason: data.reason
            }
        }
        throw new Error(data.message || 'Failed to check availability')
    } catch (error) {
        console.error('Error checking availability:', error)
        throw error
    }
}

/**
 * Helper: Get day name from day number
 */
export function getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[dayOfWeek] || 'Unknown'
}

/**
 * Helper: Format time from HH:MM:SS to HH:MM AM/PM
 */
export function formatTime(time: string): string {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
}

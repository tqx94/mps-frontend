// src/lib/userService.ts - User Management API service
// 
// API Endpoint Structure:
// - GET    /api/booking/admin/users          - Get all users (with filters)
// - GET    /api/booking/admin/users/:id      - Get user by ID
// - PUT    /api/booking/admin/users/:id      - Update user
// - DELETE /api/booking/admin/users/:id      - Delete user
// - POST   /api/booking/admin/users/:id/suspend   - Suspend user
// - POST   /api/booking/admin/users/:id/activate  - Activate user
// - PUT    /api/booking/admin/users/:id/verify    - Update student verification status
// - GET    /api/booking/admin/users/dashboard     - Get user statistics
// - GET    /api/booking/admin/users/analytics    - Get user analytics

// Types
export interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  memberType: string
  contactNumber: string | null
  studentVerificationStatus: 'NA' | 'PENDING' | 'VERIFIED' | 'REJECTED'
  studentVerificationDate: string | null
  createdAt: string
  updatedAt: string
  studentVerificationImageUrl: string | null
  disabled?: boolean
  isDisabled?: boolean
  stats?: {
    totalBookings: number
    confirmedBookings: number
    totalSpent: number
  }
}

export interface UserFilters {
  page?: number
  limit?: number
  search?: string
  memberType?: string
  studentVerificationStatus?: string // Added for admin filtering
  sortBy?: 'createdAt' | 'name' | 'email'
  sortOrder?: 'asc' | 'desc'
  includeStats?: boolean
}

export interface UserResponse {
  success?: boolean
  message?: string
  error?: string
  user?: User
  users?: User[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  summary?: {
    totalUsers: number
    memberTypeBreakdown: {
      MEMBER: number
      STUDENT: number
    }
  }
}

export interface UpdateUserPayload {
  firstName?: string
  lastName?: string
  memberType?: string
  contactNumber?: string
  studentVerificationStatus?: 'NA' | 'PENDING' | 'VERIFIED' | 'REJECTED'
}

import { authenticatedFetch } from './apiClient'

// API Base URL
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'https://productive-space-backend.vercel.app/api'

// Helper function to handle API responses
const handleResponse = async (response: Response): Promise<UserResponse> => {
  try {
    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || `HTTP ${response.status}`,
        message: data.message || data.error || `HTTP ${response.status}`
      }
    }

    return {
      success: true,
      ...data
    }
  } catch (error) {
    console.error('API Response Error:', error)
    return {
      success: false,
      error: 'Failed to parse response',
      message: 'Failed to parse response'
    }
  }
}

// Helper function to build query string
const buildQueryString = (filters: UserFilters): string => {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString())
    }
  })

  return params.toString()
}

// Admin APIs
export const getAllUsers = async (filters: UserFilters = {}): Promise<UserResponse> => {
  try {
    const queryString = buildQueryString(filters)
    const url = `${API_BASE}/booking/admin/users${queryString ? `?${queryString}` : ''}`

    const response = await authenticatedFetch(url)
    return await handleResponse(response)
  } catch (error) {
    console.error('Get All Users Error:', error)
    return {
      success: false,
      error: 'Failed to fetch users',
      message: 'Failed to fetch users'
    }
  }
}

export const getUserById = async (id: string): Promise<UserResponse> => {
  try {
    const response = await authenticatedFetch(`${API_BASE}/booking/admin/users/${id}`)
    return await handleResponse(response)
  } catch (error) {
    console.error('Get User Error:', error)
    return {
      success: false,
      error: 'Failed to fetch user',
      message: 'Failed to fetch user'
    }
  }
}

export const updateUser = async (id: string, updates: Partial<User>): Promise<UserResponse> => {
  try {
    const response = await authenticatedFetch(`${API_BASE}/booking/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    return await handleResponse(response)
  } catch (error) {
    console.error('Update User Error:', error)
    return {
      success: false,
      error: 'Failed to update user',
      message: 'Failed to update user'
    }
  }
}

export const createAdminUser = async (email: string, password: string): Promise<UserResponse> => {
  try {
    const response = await fetch(`${API_BASE}/admin/users/create-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    return await handleResponse(response)
  } catch (error) {
    console.error('Create Admin User Error:', error)
    return {
      success: false,
      error: 'Failed to create admin user',
      message: 'Failed to create admin user'
    }
  }
}

export const suspendUser = async (id: string, reason: string): Promise<UserResponse> => {
  try {
    const response = await authenticatedFetch(`${API_BASE}/booking/admin/users/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })

    return await handleResponse(response)
  } catch (error) {
    console.error('Suspend User Error:', error)
    return {
      success: false,
      error: 'Failed to suspend user',
      message: 'Failed to suspend user'
    }
  }
}

export const activateUser = async (id: string): Promise<UserResponse> => {
  try {
    const response = await authenticatedFetch(`${API_BASE}/booking/admin/users/${id}/activate`, {
      method: 'POST',
    })

    return await handleResponse(response)
  } catch (error) {
    console.error('Activate User Error:', error)
    return {
      success: false,
      error: 'Failed to activate user',
      message: 'Failed to activate user'
    }
  }
}

export const deleteUser = async (id: string): Promise<UserResponse> => {
  try {
    const response = await authenticatedFetch(`${API_BASE}/booking/admin/users/${id}`, {
      method: 'DELETE',
    })

    return await handleResponse(response)
  } catch (error) {
    console.error('Delete User Error:', error)
    return {
      success: false,
      error: 'Failed to delete user',
      message: 'Failed to delete user'
    }
  }
}

export const disableUser = async (id: string): Promise<UserResponse> => {
  try {
    const response = await authenticatedFetch(`${API_BASE}/booking/admin/users/${id}/disable`, {
      method: 'PUT',
    })

    return await handleResponse(response)
  } catch (error) {
    console.error('Disable User Error:', error)
    return {
      success: false,
      error: 'Failed to disable user',
      message: 'Failed to disable user'
    }
  }
}

export const enableUser = async (id: string): Promise<UserResponse> => {
  try {
    const response = await authenticatedFetch(`${API_BASE}/booking/admin/users/${id}/enable`, {
      method: 'PUT',
    })

    return await handleResponse(response)
  } catch (error) {
    console.error('Enable User Error:', error)
    return {
      success: false,
      error: 'Failed to enable user',
      message: 'Failed to enable user'
    }
  }
}

export const getUserStats = async (): Promise<UserResponse> => {
  try {
    const response = await authenticatedFetch(`${API_BASE}/booking/admin/users/dashboard`)
    return await handleResponse(response)
  } catch (error) {
    console.error('Get User Stats Error:', error)
    return {
      success: false,
      error: 'Failed to fetch user stats',
      message: 'Failed to fetch user stats'
    }
  }
}

export const getUserAnalytics = async (period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<UserResponse> => {
  try {
    const response = await authenticatedFetch(`${API_BASE}/booking/admin/users/analytics?period=${period}`)
    return await handleResponse(response)
  } catch (error) {
    console.error('Get User Analytics Error:', error)
    return {
      success: false,
      error: 'Failed to fetch user analytics',
      message: 'Failed to fetch user analytics'
    }
  }
}

export const updateStudentVerification = async (
  id: string,
  status: 'VERIFIED' | 'REJECTED',
  rejectionReason?: string
): Promise<UserResponse> => {
  try {
    const response = await authenticatedFetch(`${API_BASE}/booking/admin/users/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify({
        studentVerificationStatus: status,
        ...(status === 'REJECTED' && rejectionReason ? { rejectionReason } : {})
      }),
    })

    return await handleResponse(response)
  } catch (error) {
    console.error('Update Student Verification Error:', error)
    return {
      success: false,
      error: 'Failed to update student verification',
      message: 'Failed to update student verification'
    }
  }
}

// Utility functions - Client-safe date formatting to avoid hydration errors
export const formatUserDate = (dateString: string): string => {
  if (!dateString) return '-'

  try {
    // Parse the date directly - handles both Z format and timezone offsets
    const date = new Date(dateString)

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString)
      return 'Invalid Date'
    }

    // Convert to GMT+8 (Asia/Singapore) by adding 8 hours to UTC
    const gmt8Date = new Date(date.getTime() + (8 * 60 * 60 * 1000))

    // Format manually to avoid hydration issues
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[gmt8Date.getUTCMonth()]
    const day = gmt8Date.getUTCDate()
    const year = gmt8Date.getUTCFullYear()
    let hours = gmt8Date.getUTCHours()
    const minutes = gmt8Date.getUTCMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12

    return `${month} ${day}, ${year}, ${hours}:${minutes} ${ampm}`
  } catch (error) {
    console.error('Error formatting date:', error, dateString)
    return 'Invalid Date'
  }
}

// Format date specifically for verification date display
export const formatVerificationDate = (dateString: string | null): string => {
  if (!dateString) return '-'

  try {
    // Parse the date directly - it already has timezone info
    const date = new Date(dateString)

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString)
      return '-'
    }

    // Convert to GMT+8 (Asia/Singapore) by adding 8 hours to UTC
    const gmt8Date = new Date(date.getTime() + (8 * 60 * 60 * 1000))

    // Format manually to avoid hydration issues
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[gmt8Date.getUTCMonth()]
    const day = gmt8Date.getUTCDate()
    const year = gmt8Date.getUTCFullYear()
    let hours = gmt8Date.getUTCHours()
    const minutes = gmt8Date.getUTCMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12

    return `${month} ${day}, ${year}, ${hours}:${minutes} ${ampm}`
  } catch (error) {
    console.error('Error formatting verification date:', error, dateString)
    return '-'
  }
}

// Removed unused utility functions

export const getMemberTypeColor = (memberType: string): string => {
  switch (memberType?.toUpperCase()) {
    case 'STUDENT': return 'bg-blue-100 text-blue-800'
    case 'MEMBER': return 'bg-purple-100 text-purple-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export const getVerificationStatusColor = (status: string): string => {
  switch (status) {
    case 'VERIFIED': return 'bg-green-100 text-green-800'
    case 'PENDING': return 'bg-yellow-100 text-yellow-800'
    case 'REJECTED': return 'bg-red-100 text-red-800'
    case 'NA': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export const getVerificationStatusText = (status: string): string => {
  switch (status) {
    case 'VERIFIED': return 'Verified'
    case 'PENDING': return 'Pending'
    case 'REJECTED': return 'Rejected'
    case 'NA': return 'Not Applicable'
    default: return 'Unknown'
  }
}

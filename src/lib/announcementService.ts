// src/lib/announcementService.ts - Announcement API service
import { authenticatedFetch } from './apiClient'

// Types
export interface Announcement {
    id: string
    title: string
    description: string | null
    imageUrl: string | null
    order: number
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export interface AnnouncementFilters {
    includeInactive?: boolean
}

export interface AnnouncementResponse {
    success?: boolean
    message?: string
    error?: string
    data?: Announcement | Announcement[]
    count?: number
}

export interface CreateAnnouncementPayload {
    title: string
    description?: string
    imageUrl?: string
    order?: number
    isActive?: boolean
}

export interface UpdateAnnouncementPayload {
    title?: string
    description?: string
    imageUrl?: string
    order?: number
    isActive?: boolean
}

// API Base URL
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:3001/api'

// Helper function to handle API responses
const handleResponse = async (response: Response): Promise<AnnouncementResponse> => {
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

// Public API - Get all active announcements
export const getAllAnnouncements = async (): Promise<AnnouncementResponse> => {
    try {
        const response = await fetch(`${API_BASE}/announcements`)
        return await handleResponse(response)
    } catch (error) {
        console.error('Get Announcements Error:', error)
        return {
            success: false,
            error: 'Failed to fetch announcements',
            message: 'Failed to fetch announcements'
        }
    }
}

// Admin APIs
export const getAllAnnouncementsAdmin = async (): Promise<AnnouncementResponse> => {
    try {
        const response = await authenticatedFetch(`${API_BASE}/admin/announcements`)
        return await handleResponse(response)
    } catch (error) {
        console.error('Get All Announcements (Admin) Error:', error)
        return {
            success: false,
            error: 'Failed to fetch announcements',
            message: 'Failed to fetch announcements'
        }
    }
}

export const getAnnouncementById = async (id: string): Promise<AnnouncementResponse> => {
    try {
        const response = await authenticatedFetch(`${API_BASE}/admin/announcements/${id}`)
        return await handleResponse(response)
    } catch (error) {
        console.error('Get Announcement Error:', error)
        return {
            success: false,
            error: 'Failed to fetch announcement',
            message: 'Failed to fetch announcement'
        }
    }
}

export const createAnnouncement = async (payload: CreateAnnouncementPayload): Promise<AnnouncementResponse> => {
    try {
        const response = await authenticatedFetch(`${API_BASE}/admin/announcements`, {
            method: 'POST',
            body: JSON.stringify(payload),
        })

        return await handleResponse(response)
    } catch (error) {
        console.error('Create Announcement Error:', error)
        return {
            success: false,
            error: 'Failed to create announcement',
            message: 'Failed to create announcement'
        }
    }
}

export const updateAnnouncement = async (id: string, payload: UpdateAnnouncementPayload): Promise<AnnouncementResponse> => {
    try {
        const response = await authenticatedFetch(`${API_BASE}/admin/announcements/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        })

        return await handleResponse(response)
    } catch (error) {
        console.error('Update Announcement Error:', error)
        return {
            success: false,
            error: 'Failed to update announcement',
            message: 'Failed to update announcement'
        }
    }
}

export const deleteAnnouncement = async (id: string): Promise<AnnouncementResponse> => {
    try {
        const response = await authenticatedFetch(`${API_BASE}/admin/announcements/${id}`, {
            method: 'DELETE',
        })

        return await handleResponse(response)
    } catch (error) {
        console.error('Delete Announcement Error:', error)
        return {
            success: false,
            error: 'Failed to delete announcement',
            message: 'Failed to delete announcement'
        }
    }
}

export const updateAnnouncementOrder = async (id: string, order: number): Promise<AnnouncementResponse> => {
    try {
        const response = await authenticatedFetch(`${API_BASE}/admin/announcements/${id}/order`, {
            method: 'PUT',
            body: JSON.stringify({ order }),
        })

        return await handleResponse(response)
    } catch (error) {
        console.error('Update Announcement Order Error:', error)
        return {
            success: false,
            error: 'Failed to update announcement order',
            message: 'Failed to update announcement order'
        }
    }
}

// Utility functions
export const formatAnnouncementDate = (dateString: string): string => {
    const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z'
    return new Date(utcDateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    })
}

import { supabase } from './supabaseClient'

export const uploadAnnouncementImage = async (file: File): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
        const fileExt = file.name.split('.').pop()
        const fileName = `announcement-${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('announcements')
            .upload(filePath, file)

        if (uploadError) {
            throw uploadError
        }

        const { data } = supabase.storage
            .from('announcements')
            .getPublicUrl(filePath)

        return { success: true, url: data.publicUrl }
    } catch (error: any) {
        console.error('Upload Error:', error)
        return { success: false, error: error.message || 'Failed to upload image' }
    }
}

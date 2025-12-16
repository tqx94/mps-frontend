// Door service for generating door access links
import { getAuthHeaders } from './apiClient'

export interface GenerateOpenLinkResponse {
    success: boolean;
    data?: {
        accessPath: string;
        token: string;
        bookingRef: string;
        createdAt: string;
        used: boolean;
        accessCount: number;
        enableAt: string;
        expiresAt: string;
        maxAccessCount: number | null;
        currentAccessCount: number;
        unlimitedAccess: boolean;
        manualCreated?: boolean;
        manualStartTime?: string;
        manualEndTime?: string;
        seatNumber?: string;
    };
    message?: string;
}

export interface AdminGenerateOpenLinkResponse {
    success: boolean;
    data?: {
        accessPath: string;
        token: string;
        bookingRef: string;
        createdAt: string;
        used: boolean;
        accessCount: number;
        enableAt: string;
        expiresAt: string;
        maxAccessCount: number | null;
        currentAccessCount: number;
        unlimitedAccess: boolean;
        manualCreated: boolean;
        manualStartTime: string;
        manualEndTime: string;
        seatNumber: string;
    };
    message?: string;
}
// API Base URL
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'https://productive-space-backend.vercel.app/api'
/**
 * Generate a secure access link to open the door
 * @param bookingRef - The booking reference
 * @returns Promise with access link data
 */
export async function generateOpenLink(bookingRef: string): Promise<GenerateOpenLinkResponse> {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE}/door/generate-open-link`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ bookingRef }),
        });
        return handleResponse(response);
    } catch (error) {
        // If fetch threw, there is no Response object to pass
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Generate a secure access link for admin with manual seat and time
 * @param seatNumber - The seat number (S1-S15)
 * @param startTime - Start time in ISO 8601 format
 * @param endTime - End time in ISO 8601 format
 * @returns Promise with access link data
 */
export async function adminGenerateOpenLink(
    seatNumber: string, 
    startTime: string, 
    endTime: string
): Promise<AdminGenerateOpenLinkResponse> {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE}/door/admin-generate-open-link`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ seatNumber, startTime, endTime }),
        });
        return handleAdminResponse(response);
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

// Helper function to handle API responses
const handleResponse = async (response: Response): Promise<GenerateOpenLinkResponse> => {
    try {
        const responseData = await response.json();
        if (!response.ok) {
            return {
                success: false,
                message: responseData.message || responseData.error || `HTTP ${response.status}`,
            };
        }
        // Remove /api from base URL for public routes like /open
        const baseUrl = API_BASE.replace(/\/api\/?$/, '');
        return {
            success: true,
            data: {
                ...responseData.data,
                accessPath: `${baseUrl}${responseData.data.accessPath}`,
            },
            message: responseData.message,
        };
    } catch (error) {   
        return {
            success: false,
            message: 'Failed to parse response',
        };
    }
}

// Helper function to handle admin API responses
const handleAdminResponse = async (response: Response): Promise<AdminGenerateOpenLinkResponse> => {
    try {
        const responseData = await response.json();
        if (!response.ok) {
            return {
                success: false,
                message: responseData.message || responseData.error || `HTTP ${response.status}`,
            };
        }
        // Remove /api from base URL for public routes like /open
        const baseUrl = API_BASE.replace(/\/api\/?$/, '');
        return {
            success: true,
            data: {
                ...responseData.data,
                accessPath: `${baseUrl}${responseData.data.accessPath}`,
            },
            message: responseData.message,
        };
    } catch (error) {   
        return {
            success: false,
            message: 'Failed to parse response',
        };
    }
}

export async function sendDoorAccessLink(bookingRef: string): Promise<GenerateOpenLinkResponse> {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE}/door/send-access-link`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ bookingRef }),
        });
        return handleResponse(response);
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Send admin door access link via email
 * @param token - The generated token
 * @param recipientEmail - Email address to send to
 * @param userName - User's name
 * @param seatNumber - Seat number
 * @param startTime - Start time in ISO format
 * @param endTime - End time in ISO format
 * @returns Promise with email sending result
 */
export async function sendAdminDoorAccessLink(
    token: string,
    recipientEmail: string,
    userName: string,
    seatNumber: string,
    startTime: string,
    endTime: string
): Promise<{ success: boolean; message?: string }> {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE}/door/send-admin-access-link`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ token, recipientEmail, userName, seatNumber, startTime, endTime }),
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
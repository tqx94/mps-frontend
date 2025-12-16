// User Management Service
// Handles API calls for user management operations

import { getAuthHeaders } from './apiClient';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:3001';

/**
 * Fetch all users with optional filters
 */
export async function getAllUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    memberType?: string;
    studentVerificationStatus?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeStats?: boolean;
}) {
    const queryParams = new URLSearchParams();

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
            }
        });
    }

    const headers = await getAuthHeaders();

    const response = await fetch(
        `${BASE_URL}/booking/admin/users?${queryParams.toString()}`,
        {
            credentials: 'include',
            headers
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch users');
    }

    return response.json();
}

/**
 * Change a user's role (memberType)
 */
export async function changeUserRole(
    userId: string,
    newRole: 'ADMIN' | 'STUDENT' | 'MEMBER' | 'TUTOR' | null,
    reason?: string
): Promise<{
    success: boolean;
    message: string;
    user: any;
    warnings?: string[];
}> {
    const headers = await getAuthHeaders();

    const response = await fetch(
        `${BASE_URL}/booking/admin/users/${userId}/role`,
        {
            method: 'PUT',
            credentials: 'include',
            headers,
            body: JSON.stringify({ newRole, reason })
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change user role');
    }

    return response.json();
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string, reason?: string) {
    const headers = await getAuthHeaders();

    const response = await fetch(
        `${BASE_URL}/booking/admin/users/${userId}`,
        {
            method: 'DELETE',
            credentials: 'include',
            headers,
            body: JSON.stringify({ reason })
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
    }

    return response.json();
}

/**
 * Verify student account
 */
export async function verifyStudentAccount(
    userId: string,
    studentVerificationStatus: 'VERIFIED' | 'REJECTED',
    rejectionReason?: string
) {
    const headers = await getAuthHeaders();

    const response = await fetch(
        `${BASE_URL}/booking/admin/users/${userId}/verify`,
        {
            method: 'PUT',
            credentials: 'include',
            headers,
            body: JSON.stringify({ studentVerificationStatus, rejectionReason })
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify student account');
    }

    return response.json();
}

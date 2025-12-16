// src/hooks/useLoginStatus.ts - Simple login status hook
import { useAuth } from './useAuth'

export function useLoginStatus() {
  const { isLoggedIn, loading, user, databaseUser } = useAuth()
  
  return {
    isLoggedIn,
    isLoading: loading,
    user,
    databaseUser,
    // Simple boolean checks
    isAuthenticated: !!user,
    hasUserData: !!databaseUser,
    // User info
    userId: databaseUser?.id || user?.id,
    userName: databaseUser?.name || user?.user_metadata?.firstName || 'User',
    userEmail: user?.email || databaseUser?.email
  }
}

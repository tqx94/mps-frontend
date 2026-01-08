// src/hooks/useAuth.ts - Client-side auth hook with local storage
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

interface DatabaseUser {
  id: string
  email: string
  name?: string
  firstName?: string
  lastName?: string
  memberType?: 'STUDENT' | 'MEMBER' | 'TUTOR' | 'ADMIN'
  contactNumber?: string
  studentVerificationStatus?: 'NA' | 'PENDING' | 'VERIFIED'
  studentVerificationImageUrl?: string
  studentVerificationDate?: string
  studentRejectionReason?: string | null
  disabled?: boolean
  isDisabled?: boolean
  createdAt?: string
  updatedAt?: string
}

// Local storage keys
const STORAGE_KEYS = {
  AUTH_USER: 'auth_user',
  DATABASE_USER: 'database_user'
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [databaseUser, setDatabaseUser] = useState<DatabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user data from local storage
  const loadFromStorage = () => {
    try {
      const storedAuthUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER)
      const storedDatabaseUser = localStorage.getItem(STORAGE_KEYS.DATABASE_USER)

      if (storedAuthUser) {
        setUser(JSON.parse(storedAuthUser))
      }

      if (storedDatabaseUser) {
        setDatabaseUser(JSON.parse(storedDatabaseUser))
      }
    } catch (error) {
      console.error('Error loading from local storage:', error)
    }
  }

  // Save user data to local storage
  const saveToStorage = (authUser: User | null, dbUser: DatabaseUser | null) => {
    try {
      if (authUser) {
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(authUser))
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER)
      }

      if (dbUser) {
        localStorage.setItem(STORAGE_KEYS.DATABASE_USER, JSON.stringify(dbUser))
      } else {
        localStorage.removeItem(STORAGE_KEYS.DATABASE_USER)
      }
    } catch (error) {
      console.error('Error saving to local storage:', error)
    }
  }

  // Create mock database user from auth user (for demo purposes)
  const createMockDatabaseUser = (authUser: User): DatabaseUser => {
    const fullName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User'
    const nameParts = fullName.split(' ')

    return {
      id: authUser.id, // Use auth ID as database ID for now
      email: authUser.email || '',
      name: fullName,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      memberType: 'MEMBER', // Default to MEMBER
      contactNumber: authUser.user_metadata?.phone || '',
      studentVerificationStatus: 'NA', // Default to NA
      createdAt: authUser.created_at,
      updatedAt: authUser.updated_at
    }
  }

  // Fetch actual database user
  const fetchDatabaseUser = async (authUser: User): Promise<DatabaseUser> => {
    try {
      console.log('Fetching database user for:', authUser.id)

      // Use Promise.race to implement timeout
      const fetchPromise = supabase
        .from('User')
        .select('*')
        .eq('id', authUser.id)
        .single()

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Database fetch timeout')), 10000)
      )

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise])

      if (error || !data) {
        console.error('Error fetching database user:', error)
        return createMockDatabaseUser(authUser)
      }

      // Check if user is disabled
      if (data.disabled === true || data.isDisabled === true) {
        console.warn('User is disabled, signing out...')
        // Sign out the user immediately
        await supabase.auth.signOut()
        // Clear local storage
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER)
        localStorage.removeItem(STORAGE_KEYS.DATABASE_USER)
        // Return null to indicate user should be logged out
        throw new Error('Account disabled')
      }

      console.log('Database user fetched successfully')
      return {
        id: data.id,
        email: data.email,
        name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        firstName: data.firstName,
        lastName: data.lastName,
        memberType: data.memberType,
        contactNumber: data.contactNumber,
        studentVerificationStatus: data.studentVerificationStatus,
        studentVerificationImageUrl: data.studentVerificationImageUrl,
        studentVerificationDate: data.studentVerificationDate,
        studentRejectionReason: data.studentRejectionReason,
        disabled: data.disabled,
        isDisabled: data.isDisabled,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      }
    } catch (error) {
      console.error('Error fetching database user:', error)
      return createMockDatabaseUser(authUser)
    }
  }

  useEffect(() => {
    let isMounted = true
    let hasCachedData = false // Track if we have cached data from localStorage

    // STEP 1: Load from localStorage FIRST - this is instant, no API call
    const storedAuthUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER)
    const storedDatabaseUser = localStorage.getItem(STORAGE_KEYS.DATABASE_USER)

    if (storedAuthUser && storedDatabaseUser) {
      try {
        const parsedAuthUser = JSON.parse(storedAuthUser)
        const parsedDatabaseUser = JSON.parse(storedDatabaseUser)
        
        setUser(parsedAuthUser)
        setDatabaseUser(parsedDatabaseUser)
        hasCachedData = true
        // Set loading false immediately - user can use cached data
        setLoading(false)
        
        console.log('✅ Loaded user from localStorage - NO API CALL, loading: false')
      } catch (error) {
        console.error('Error loading from local storage:', error)
        hasCachedData = false
      }
    } else {
      // No cached data - need to check session
      hasCachedData = false
    }

    // STEP 2: Only verify session if we DON'T have cached data
    // This prevents unnecessary API calls when we already have data
    const verifySession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.user) {
          // No session - clear everything
          if (isMounted) {
            setUser(null)
            setDatabaseUser(null)
            saveToStorage(null, null)
            setLoading(false)
          }
          return
        }

        // If we have cached data, just verify session matches (no API call)
        if (hasCachedData && isMounted) {
          // Just update auth user if session exists, keep databaseUser from cache
          setUser(session.user)
          // Optionally update auth user in storage
          saveToStorage(session.user, JSON.parse(storedDatabaseUser!))
          setLoading(false) // Ensure loading is false
          console.log('✅ Using cached database user - NO API CALL, loading: false')
          return
        }

        // Only fetch from API if we DON'T have cached data
        if (!hasCachedData && isMounted) {
          console.log('⚠️ No cached data, fetching from API...')
          try {
            const dbUser = await fetchDatabaseUser(session.user)
            if (isMounted) {
              setUser(session.user)
              setDatabaseUser(dbUser)
              saveToStorage(session.user, dbUser)
              hasCachedData = true
              setLoading(false) // Set loading false after fetch
            }
          } catch (error: any) {
            if (error?.message === 'Account disabled') {
              if (isMounted) {
                setUser(null)
                setDatabaseUser(null)
                saveToStorage(null, null)
                setLoading(false) // Set loading false even on error
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('user-disabled'))
                }
              }
            } else {
              console.error('Error fetching database user:', error)
              // Set loading false even on error - use mock user
              if (isMounted) {
                setLoading(false)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error getting session:', error)
        // Set loading false on any error
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    // Only verify session if we don't have cached data
    // If we have cached data, loading is already false, so we're done
    if (!hasCachedData) {
      verifySession()
    } else {
      // We have cached data, loading is already false, but verify session in background (non-blocking)
      // This ensures session is still valid, but doesn't block the UI
      verifySession().catch(() => {
        // Silently handle any errors - we already have cached data
        console.log('Background session verification failed, using cached data')
      })
    }

    // STEP 3: Listen for auth changes - but ONLY fetch on SIGNED_IN
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        console.log('Auth state change:', event)

        if (session?.user) {
          // ONLY fetch from API on SIGNED_IN event (new login)
          // For all other events (TOKEN_REFRESHED, USER_UPDATED, etc.), use cached data
          if (event === 'SIGNED_IN') {
            console.log('🔄 SIGNED_IN event - fetching fresh data from API')
            try {
              const dbUser = await fetchDatabaseUser(session.user)
              if (isMounted) {
                setUser(session.user)
                setDatabaseUser(dbUser)
                saveToStorage(session.user, dbUser)
                hasCachedData = true
                setLoading(false) // Ensure loading is false
              }
            } catch (error: any) {
              console.error('Error in auth state change:', error)
              if (error?.message === 'Account disabled') {
                if (isMounted) {
                  setUser(null)
                  setDatabaseUser(null)
                  saveToStorage(null, null)
                  hasCachedData = false
                  setLoading(false) // Set loading false
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('user-disabled'))
                  }
                }
                return
              }
              // Fallback to mock user if fetch fails
              if (isMounted) {
                setUser(session.user)
                const mockUser = createMockDatabaseUser(session.user)
                setDatabaseUser(mockUser)
                saveToStorage(session.user, mockUser)
                hasCachedData = true
                setLoading(false) // Set loading false
              }
            }
          } else {
            // For TOKEN_REFRESHED, USER_UPDATED, etc. - use cached data, NO API CALL
            if (isMounted) {
              setUser(session.user)
              // Keep existing databaseUser from localStorage - NO API CALL!
              setLoading(false) // Always set loading false for these events
              console.log(`✅ ${event} event - using cached data, NO API CALL, loading: false`)
            }
          }
        } else {
          // SIGNED_OUT event
          console.log('🚪 SIGNED_OUT - clearing user data')
          if (isMounted) {
            setUser(null)
            setDatabaseUser(null)
            saveToStorage(null, null)
            hasCachedData = false
            setLoading(false) // Set loading false on logout
          }
          return
        }

        // Always ensure loading is false after auth state change
        if (isMounted) {
          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Helper function to check if user is logged in
  const isLoggedIn = !!user && !!databaseUser

  // Function to refresh database user data
  const refreshDatabaseUser = async () => {
    if (!user) return

    try {
      const dbUser = await fetchDatabaseUser(user)
      console.log('Refreshing database user with fresh data:', dbUser)
      setDatabaseUser(dbUser)
      saveToStorage(user, dbUser)
    } catch (error) {
      console.error('Error refreshing database user:', error)
    }
  }

  // Function to refresh auth user data
  const refreshAuthUser = async () => {
    try {
      const { data: { user: refreshedUser } } = await supabase.auth.getUser()
      if (refreshedUser) {
        console.log('Refreshing auth user with fresh data:', refreshedUser)
        setUser(refreshedUser)
        // Also refresh database user to keep them in sync
        await refreshDatabaseUser()
      }
    } catch (error) {
      console.error('Error refreshing auth user:', error)
    }
  }

  return {
    user,
    databaseUser,
    loading,
    // Provide both IDs for flexibility
    userId: databaseUser?.id || user?.id, // Prefer database user ID, fallback to auth ID
    authUserId: user?.id, // Always available if authenticated
    // Login status check
    isLoggedIn,
    // Refresh functions
    refreshDatabaseUser,
    refreshAuthUser
  }
}
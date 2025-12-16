
import { supabase } from '@/lib/supabaseClient'

export async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.access_token) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    }
    
   
    return {
      'Content-Type': 'application/json'
    }
  } catch (error) {
    console.error('Error getting auth headers:', error)
    return {
      'Content-Type': 'application/json'
    }
  }
}


export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = await getAuthHeaders()
  
  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers, 
    },
  })
}


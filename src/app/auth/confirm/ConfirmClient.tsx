"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function ConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')

        if (!token_hash || type !== 'email') {
          throw new Error('Invalid confirmation link')
        }

        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'email'
        })

        if (error) throw error

        setConfirmed(true)
        
        setTimeout(() => {
          router.push('/?toastType=emailConfirmed')
        }, 3000)

      } catch (err: any) {
        setError(err.message || 'Failed to confirm email')
      } finally {
        setLoading(false)
      }
    }

    confirmEmail()
  }, [searchParams, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-orange-500" />
            <h2 className="text-xl font-semibold mb-2">Confirming your email...</h2>
            <p className="text-gray-600">Please wait while we verify your account.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-500 mr-2" />
              Confirmation Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={() => router.push('/login')}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-500 mr-2" />
            Email Confirmed!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-4">
            Your email has been successfully verified. You can now access all features.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Redirecting you to the homepage...
          </p>
          <Button 
            onClick={() => router.push('/?toastType=emailConfirmed')}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Continue to Homepage
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
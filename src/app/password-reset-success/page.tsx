// src/app/password-reset-success/page.tsx
"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function PasswordResetSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-xl text-green-600">Password Successfully Reset!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Your password has been successfully reset. 
            Please login with your new password to continue.
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full bg-orange-500 hover:bg-orange-600">
              <Link href="/login">
                Login to Continue
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <p className="text-xs text-gray-500">
              You will be redirected to the login page in a few seconds...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

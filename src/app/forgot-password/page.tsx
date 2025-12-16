"use client"

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import ReCAPTCHA from 'react-google-recaptcha'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/hooks/use-toast'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!captchaToken) {
      toast({
        title: "Error",
        description: "Please complete the captcha verification",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        captchaToken,
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      // Show success message and redirect to success page
      router.push('/password-reset-success')
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
      recaptchaRef.current?.reset()
      setCaptchaToken(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Reset Password</CardTitle>
          <p className="text-center text-sm text-gray-600">
            Enter your email address and we'll send you a reset link
          </p>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* hCaptcha */}
        

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="forgot-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                onChange={setCaptchaToken}
                onExpired={() => setCaptchaToken(null)}
                onError={() => setCaptchaToken(null)}
              />
            </div>
            <br/>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              disabled={loading || !captchaToken}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Send Reset Email'}
            </Button>
            
            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-blue-500 hover:underline"
              >
                Back to Login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
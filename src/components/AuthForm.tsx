// src/components/AuthForm.tsx - Updated for client-side auth
"use client"

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, User, Phone, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { CardContent, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PhoneInput } from 'react-international-phone'
import { PhoneNumberUtil } from 'google-libphonenumber'
import ReCAPTCHA from 'react-google-recaptcha'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/hooks/use-toast'
import { StudentDocumentUpload } from '@/components/StudentDocumentUpload'
import { uploadStudentDocument } from '@/lib/studentDocumentService'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import 'react-international-phone/style.css'

const phoneUtil = PhoneNumberUtil.getInstance()

const isPhoneValid = (phone: string): boolean => {
  try {
    const parsed = phoneUtil.parseAndKeepRawInput(phone, 'SG')
    return phoneUtil.isValidNumber(parsed)
  } catch {
    return false
  }
}

type Props = {
  type: 'login' | 'signUp'
}

export function AuthForm({ type }: Props) {
  const isLoginForm = type === 'login'
  const router = useRouter()
  const { toast } = useToast()
  
  // Form state
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [showOtpPopup, setShowOtpPopup] = useState(false)
  
  // Google reCAPTCHA
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  // Login form data
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })

  // Signup form data
  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    contactNumber: '',
    memberType: 'member' as 'student' | 'member' | 'tutor',
    acceptedTerms: false
  })

  // Student document upload state
  const [studentDocument, setStudentDocument] = useState<{
    url: string
    name: string
    size: number
    mimeType: string
  } | null>(null)

  const resetCaptcha = () => {
    recaptchaRef.current?.reset()
    setCaptchaToken(null)
  }

  const resetSignupForm = () => {
    setSignupData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      contactNumber: '',
      memberType: 'member' as 'student' | 'member' | 'tutor',
      acceptedTerms: false
    })
    setStudentDocument(null)
    resetCaptcha()
  }

  const handleLogin = async (e: React.FormEvent) => {
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
        options: {
          captchaToken
        }
      })

      if (error) throw error

      // Fetch user profile to check memberType and disabled status
      if (data.user) {
        const { data: userProfile, error: profileError } = await supabase
          .from('User')
          .select('memberType, disabled, isDisabled')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          console.error('Error fetching user profile:', profileError)
          // Fallback to dashboard if we can't fetch profile
          resetCaptcha()
          router.push(`/dashboard`)
          return
        }

        // Check if user is disabled
        if (userProfile?.disabled === true || userProfile?.isDisabled === true) {
          // Sign out the user immediately
          await supabase.auth.signOut()
          
          toast({
            title: "Account Disabled",
            description: "Your account has been disabled. Please contact support for assistance.",
            variant: "destructive",
          })
          resetCaptcha()
          return
        }

        // Redirect based on memberType
        resetCaptcha()
        if (userProfile?.memberType === 'ADMIN') {
          router.push('/admin')
        } else {
          router.push('/dashboard#overview')
        }
      } else {
        resetCaptcha()
        router.push(`/dashboard#overview`)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      })
      resetCaptcha()
    } finally {
      setLoading(false)
    }
  }

  // Removed handleBasicSignup - now using single step

  const handleSignup = async (e: React.FormEvent) => {
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

    // Basic validation
    if (!signupData.email || !signupData.password || !signupData.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      setLoading(false)
      return
    }
    
    if (signupData.password !== signupData.confirmPassword) {
      toast({
        title: "Error", 
        description: "Passwords do not match",
        variant: "destructive",
      })
      setLoading(false)
      return
    }
    
    if (signupData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      setLoading(false)
      return
    }
    
    if (!signupData.acceptedTerms) {
      toast({
        title: "Error",
        description: "Please accept the terms and conditions",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    // Detailed validation
    if (!signupData.firstName || !signupData.lastName || !signupData.contactNumber) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    if (!isPhoneValid(signupData.contactNumber)) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    // Validate student document upload
    if (signupData.memberType === 'student' && !studentDocument) {
      toast({
        title: "Error",
        description: "Please upload a student verification document",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      // Test Supabase connection first
      console.log('Testing Supabase connection...')
      const { data: testData, error: testError } = await supabase.from('User').select('count').limit(1)
      if (testError) {
        console.error('Supabase connection test failed:', testError)
        throw new Error(`Database connection failed: ${testError.message}`)
      }
      console.log('Supabase connection successful')
      
      // Check if email already exists before attempting signup
      console.log('Checking if email already exists...')
      const { data: existingUser, error: checkError } = await supabase
        .from('User')
        .select('email')
        .eq('email', signupData.email)
        .single()
      
      if (existingUser && !checkError) {
        throw new Error('An account with this email address already exists. Please use a different email or try logging in.')
      }
      
      console.log('Email is available for registration')
      
      // Step 1: Create user using Supabase Auth (this handles auth.users automatically)
      console.log('Starting signup process...')
      console.log('Email:', signupData.email)
      console.log('Password length:', signupData.password.length)
      console.log('Captcha token exists:', !!captchaToken)
      
      // Test with minimal data first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          captchaToken
        }
      })

      if (authError) {
        console.error('Auth signup error:', authError)
        throw authError
      }

    
      // Step 2: Insert profile data into public.User table
      if (authData.user) {
        try {
          console.log('Attempting to create user profile...')
          
                     const profileData = {
             id: authData.user.id,
             email: signupData.email,
             firstName: signupData.firstName,
             lastName: signupData.lastName,
             memberType: signupData.memberType.toUpperCase() as 'STUDENT' | 'MEMBER' | 'TUTOR',
             contactNumber: signupData.contactNumber,
             studentVerificationStatus: signupData.memberType === 'student' ? 'PENDING' : 'NA',
             // Include student document data if available
             ...(signupData.memberType === 'student' && studentDocument && {
               studentVerificationImageUrl: studentDocument.url
             }),
             createdAt: new Date().toISOString(),
             updatedAt: new Date().toISOString()
           }
          
          console.log('Profile data to insert:', profileData)

          const { error: profileError } = await supabase
            .from('User')
            .insert(profileData)

          if (profileError) {
            console.error('Profile creation failed:', profileError)
            throw new Error(`Profile creation failed: ${profileError.message}`)
          }
          
          console.log('User profile created successfully')

          // If student document was uploaded during signup, upload it now
          if (signupData.memberType === 'student' && studentDocument) {
            try {
              console.log('Uploading student document...')
              
              // Create a File object from the document data
              const response = await fetch(studentDocument.url)
              const blob = await response.blob()
              const file = new File([blob], studentDocument.name, { type: studentDocument.mimeType })
              
              // Upload to Supabase Storage
              const uploadResult = await uploadStudentDocument(file, authData.user.id)
              
              if (uploadResult.success && uploadResult.data) {
                // Update the user record with the actual document URL
                const { error: updateError } = await supabase
                  .from('User')
                  .update({
                    studentVerificationImageUrl: uploadResult.data.url,
                    updatedAt: new Date().toISOString()
                  })
                  .eq('id', authData.user.id)

                if (updateError) {
                  console.error('Failed to update user with document URL:', updateError)
                } else {
                  console.log('Student document uploaded and saved successfully')
                }
              }
            } catch (docError) {
              console.error('Student document upload error:', docError)
              // Don't fail the entire signup if document upload fails
            }
          }
        } catch (profileError: any) {
          console.error('Profile creation error:', profileError)
          throw new Error(`Failed to create user profile: ${profileError.message}`)
        }
      }

      resetCaptcha()
      
      // Show OTP popup instead of navigating
      setShowOtpPopup(true)
      resetSignupForm()
    } catch (error: any) {
      console.error('Signup error:', error)
      
      // Handle specific error cases
      let errorMessage = "An error occurred during signup"
      
      if (error.code === '23505' || error.message?.includes('duplicate key value violates unique constraint')) {
        errorMessage = "An account with this email address already exists. Please use a different email or try logging in."
      } else if (error.message?.includes('User already registered')) {
        errorMessage = "An account with this email address already exists. Please use a different email or try logging in."
      } else if (error.message?.includes('Email already registered')) {
        errorMessage = "An account with this email address already exists. Please use a different email or try logging in."
      } else if (error.message?.includes('duplicate key value')) {
        errorMessage = "An account with this email address already exists. Please use a different email or try logging in."
      } else if (error.message?.includes('already exists')) {
        errorMessage = "An account with this email address already exists. Please use a different email or try logging in."
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive",
      })
      resetCaptcha()
    } finally {
      setLoading(false)
    }
  }

  // Single Step Signup Form - Vertical Layout
  const signupForm = (
    <form onSubmit={handleSignup} className="space-y-2">
        <div className="space-y-2">
          {/* Personal Information */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col space-y-1">
              <Label htmlFor="first-name" className="text-xs font-medium text-gray-700">First Name *</Label>
              <Input
                id="first-name"
                value={signupData.firstName}
                onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                className="h-8 text-xs"
                required
                disabled={loading}
              />
            </div>
            <div className="flex flex-col space-y-1">
              <Label htmlFor="last-name" className="text-xs font-medium text-gray-700">Last Name *</Label>
              <Input
                id="last-name"
                value={signupData.lastName}
                onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
                className="h-8 text-xs"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col space-y-1">
            <Label htmlFor="signup-email" className="text-xs font-medium text-gray-700">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <Input
                id="signup-email"
                type="email"
                placeholder="Enter your email"
                value={signupData.email}
                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                className="pl-7 h-8 text-xs"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Contact Number and Member Type */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col space-y-1">
              <Label htmlFor="contact-number" className="text-xs font-medium text-gray-700">Contact Number *</Label>
              <div className="relative">
                <Phone className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 z-10" />
                <PhoneInput
                  defaultCountry="sg"
                  value={signupData.contactNumber}
                  onChange={(value) => {
                    setSignupData({ ...signupData, contactNumber: value })
                    setPhoneTouched(true)
                  }}
                  onFocus={() => setPhoneTouched(true)}
                  placeholder="Enter phone number"
                  disabled={loading}
                />
              </div>
              {phoneTouched && signupData.contactNumber && !isPhoneValid(signupData.contactNumber) && (
                <p className="text-xs text-red-600">
                  Please enter a valid phone number.
                </p>
              )}
            </div>

            <div className="flex flex-col space-y-1">
              <Label htmlFor="member-type" className="text-xs font-medium text-gray-700">Member Type *</Label>
              <Select
                value={signupData.memberType}
                onValueChange={(value: 'student' | 'member' | 'tutor') =>
                  setSignupData({ ...signupData, memberType: value })
                }
                disabled={loading}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  {/* <SelectItem value="tutor">Tutor</SelectItem> */}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Student Document Upload - Only show when memberType is student */}
          {signupData.memberType === 'student' && (
            <div className="mt-1">
              <StudentDocumentUpload
                onDocumentUploaded={(documentData) => setStudentDocument(documentData)}
                onDocumentRemoved={() => setStudentDocument(null)}
                initialDocument={studentDocument}
                disabled={loading}
              />
            </div>
          )}

          {/* Password Fields */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col space-y-1">
              <Label htmlFor="signup-password" className="text-xs font-medium text-gray-700">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create password"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  className="pl-7 pr-7 h-8 text-xs"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <Label htmlFor="confirm-password" className="text-xs font-medium text-gray-700">Confirm Password *</Label>
              <div className="relative">
                <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm password"
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                  className="pl-7 h-8 text-xs"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="accept-terms"
              checked={signupData.acceptedTerms}
              onCheckedChange={(checked) => setSignupData({ ...signupData, acceptedTerms: !!checked })}
              disabled={loading}
              className="mt-0.5"
            />
            <Label htmlFor="accept-terms" className="text-xs text-gray-600 leading-tight">
              I accept the{' '}
              <Link href="/terms" target="_blank" className="text-orange-600 hover:underline font-medium">
                Terms and Conditions
              </Link>
            </Label>
          </div>
        </div> 
        <div className="space-y-2">
          <div className="flex justify-center">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
              onChange={setCaptchaToken}
              onExpired={() => setCaptchaToken(null)}
              onError={() => setCaptchaToken(null)}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-orange-500 hover:bg-orange-600 h-8 text-xs font-medium"
            disabled={loading || !captchaToken || !isPhoneValid(signupData.contactNumber)}
          >
            {loading ? <Loader2 className="animate-spin w-3 h-3" /> : "Create Account"}
          </Button>
          
          <p className="text-center text-xs text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className={`text-orange-600 hover:underline font-medium ${loading ? "pointer-events-none opacity-50" : ""}`}
            >
              Login
            </Link>
          </p>
        </div>
      </form>
    )



  return (
    <>
      {isLoginForm ? (
        <form onSubmit={handleLogin} className="space-y-2">
          <div className="space-y-2">
            <div className="flex flex-col space-y-1">
              <Label htmlFor="email" className="text-xs font-medium text-gray-700">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                <Input
                  id="email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="h-8 text-xs pl-7"
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <Label htmlFor="password" className="text-xs font-medium text-gray-700">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="h-8 text-xs pl-7 pr-8"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={loginData.rememberMe}
                  onCheckedChange={(checked) => setLoginData({ ...loginData, rememberMe: checked as boolean })}
                  disabled={loading}
                />
                <Label htmlFor="remember" className="text-xs text-gray-600">Remember me</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                onChange={setCaptchaToken}
                onExpired={() => setCaptchaToken(null)}
                onError={() => setCaptchaToken(null)}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-8 text-xs font-medium bg-orange-600 hover:bg-orange-700 text-white"
              disabled={loading || !captchaToken}
            >
            {loading ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
          </div>

          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-xs text-orange-600 hover:underline font-medium"
            >
              Forgot your password?
            </Link>
          </div>

          <p className="text-center text-xs text-gray-600">
            Don't have an account yet?{' '}
            <Link
              href="/sign-up"
              className={`text-orange-600 hover:underline font-medium ${loading ? "pointer-events-none opacity-50" : ""}`}
            >
              Sign Up
            </Link>
          </p>
        </form>
      ) : (
        signupForm
      )}

      {/* OTP Popup Dialog */}
      <Dialog open={showOtpPopup} onOpenChange={setShowOtpPopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold text-gray-900">
              Account Created Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-sm text-gray-600 leading-relaxed">
              We've sent a one-time password to your email address. In case you don't find
              this email in your primary inbox, please check your spam or bulk email
              folders.
            </p>
            <div className="mt-6">
              <Button
                onClick={() => {
                  setShowOtpPopup(false)
                  router.push('/')
                }}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                Got it!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
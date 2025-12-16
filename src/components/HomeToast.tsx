// src/components/HomeToast.tsx - Complete with all notification types (Fixed with Suspense)
"use client"

import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { useEffect, Suspense } from "react"

type ToastVariant = "default" | "destructive" | "success"

type ToastConfig = {
  title: string
  description: string
  variant: ToastVariant
}

const TOAST_CONFIG: Record<string, ToastConfig> = {
  // Authentication success messages
  login: {
    title: "✅ Welcome back to mps!",
    description: "You have been successfully logged in",
    variant: "success",
  },
  signUp: {
    title: "📧 Check your email",
    description: "Account created! Please check your email to confirm your account",
    variant: "success",
  },
  logOut: {
    title: "👋 Goodbye!",
    description: "You have been successfully logged out",
    variant: "success",
  },
  
  // Email confirmation
  emailConfirmed: {
    title: "🎉 Email confirmed!",
    description: "Your email has been verified. You can now access all features",
    variant: "success",
  },
  
  // Password reset flow
  resetEmailSent: {
    title: "📧 Reset email sent",
    description: "Check your email for password reset instructions",
    variant: "success",
  },
  passwordReset: {
    title: "🔐 Password updated",
    description: "Your password has been successfully updated",
    variant: "success",
  },
  
  // Error messages handling
  authError: {
    title: "❌ Authentication failed",
    description: "Please check your credentials and try again",
    variant: "destructive",
  },
  emailNotConfirmed: {
    title: "⚠️ Email not confirmed",
    description: "Please check your email and confirm your account first",
    variant: "destructive",
  },
  sessionExpired: {
    title: "⏰ Session expired",
    description: "Please log in again to continue",
    variant: "destructive",
  },
  
  // General success messages
  profileUpdated: {
    title: "✅ Profile updated",
    description: "Your profile information has been saved",
    variant: "success",
  },
  
  // General error messages
  networkError: {
    title: "🌐 Connection error",
    description: "Please check your internet connection and try again",
    variant: "destructive",
  },
}

type ToastType = keyof typeof TOAST_CONFIG

function isToastType(value: string | null): value is ToastType {
  return value !== null && value in TOAST_CONFIG
}

function HomeToastContent() {
  const toastType = useSearchParams().get("toastType")
  const { toast } = useToast()

  const removeUrlParam = () => {
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.delete("toastType")
    const newUrl = `${window.location.pathname}${searchParams.toString() ? `?${searchParams}` : ""}`
    window.history.replaceState({}, "", newUrl)
  }

  useEffect(() => {
    if (isToastType(toastType)) {
      // Small delay to ensure the page has loaded
      const timeoutId = setTimeout(() => {
        toast({
          ...TOAST_CONFIG[toastType],
        })
        removeUrlParam()
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [toastType, toast])

  return null
}

function HomeToast() {
  return (
    <Suspense fallback={null}>
      <HomeToastContent />
    </Suspense>
  )
}

export default HomeToast
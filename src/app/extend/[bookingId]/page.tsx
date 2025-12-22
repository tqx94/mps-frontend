'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  Clock,
  MapPin,
  Users,
  Calendar,
  AlertTriangle,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  CreditCard,
  Shield,
  ArrowRight
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { SeatPicker, SeatMeta, OverlayMeta, TableMeta, LabelMeta } from '@/components/book-now-sections/SeatPicker'
import PaymentStep from '@/components/book-now/PaymentStep'
import { EntitlementTabs } from '@/components/book-now-sections/EntitlementTabs'
import { useAuth } from '@/hooks/useAuth'
import { getAllPricingForLocation } from '@/lib/pricingService'
import { getClosureDates, getOperatingHours, type ClosureDate, type OperatingHours } from '@/lib/shopHoursService'
import { isSameDay, endOfDay } from 'date-fns'
import {
  toLocalTime,
  toSingaporeTime,
  formatLocalDate,
  formatLocalDateOnly,
  formatLocalTimeOnly
} from '@/lib/timezoneUtils'
import { formatCurrency } from '@/lib/paymentUtils'
import Navbar from '@/components/Navbar'
import { FooterSection } from '@/components/landing-page-sections/FooterSection'
import { authenticatedFetch } from '@/lib/apiClient'

export default function ExtendBookingPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user, databaseUser } = useAuth()

  const bookingId = params.bookingId as string

  // URL parameters state
  const [urlParams, setUrlParams] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search)
    }
    return new URLSearchParams()
  })

  // Update URL params when location changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrlParams(new URLSearchParams(window.location.search))
    }
    loadPaymentFeeSettings() // Load dynamic payment fees
  }, [])

  // Check if this is a payment confirmation
  const isPaymentConfirmation = urlParams.get('step') === '3' && urlParams.get('extension') === 'true'
  const paymentId = urlParams.get('paymentId') || urlParams.get('reference')
  const status = urlParams.get('status')

  // Get extension data from URL parameters
  const urlExtensionHours = urlParams.get('extensionHours')
  const urlExtensionCost = urlParams.get('extensionCost')
  const urlCreditAmount = urlParams.get('creditAmount')
  const urlNewEndAt = urlParams.get('newEndAt')
  const urlSeatNumbers = urlParams.get('seatNumbers')
  const urlOriginalEndAt = urlParams.get('originalEndAt')
  const urlPaymentMethod = urlParams.get('paymentMethod')

  // Debug URL parameters
  console.log('URL params:', { isPaymentConfirmation, paymentId, status })
  console.log('Extension params:', { urlExtensionHours, urlExtensionCost, urlNewEndAt, urlSeatNumbers })
  console.log('All search params:', Object.fromEntries(urlParams.entries()))

  // State
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [availableSeats, setAvailableSeats] = useState<string[]>([])
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([])
  const [checkingSeats, setCheckingSeats] = useState(false)
  const [requiresSeatSelection, setRequiresSeatSelection] = useState(false)

  // Dynamic payment fee settings state
  const [paymentFeeSettings, setPaymentFeeSettings] = useState({
    paynowFee: 0.20,
    creditCardFeePercentage: 5.0
  })

  // Load payment fee settings from database
  const loadPaymentFeeSettings = async () => {
    try {
      const { getPaymentSettings } = await import('@/lib/paymentSettingsService')
      const settings = await getPaymentSettings()
      setPaymentFeeSettings({
        paynowFee: settings.PAYNOW_TRANSACTION_FEE,
        creditCardFeePercentage: settings.CREDIT_CARD_TRANSACTION_FEE_PERCENTAGE
      })
    } catch (error) {
      console.error('Error loading payment fee settings:', error)
    }
  }

  // If returning from payment, start with step 1 and let useEffect handle confirmation
  const [currentStep, setCurrentStep] = useState(1) // 1: Time Selection, 2: Payment, 3: Confirmation

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep])

  const [extensionConfirmed, setExtensionConfirmed] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [confirmingPayment, setConfirmingPayment] = useState(false) // Loading state for payment confirmation
  const [originalBooking, setOriginalBooking] = useState<any>(null)
  const [originalEndTime, setOriginalEndTime] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'payNow' | 'creditCard'>('payNow')
  const [paymentTotal, setPaymentTotal] = useState(0)

  // Form state
  const [originalEndDate, setOriginalEndDate] = useState<Date | null>(null)
  const [newEndDate, setNewEndDate] = useState<Date | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [extendedHours, setExtendedHours] = useState(0)
  const [extensionCost, setExtensionCost] = useState(0)

  // Shop hours state - store raw API responses
  const [closureDates, setClosureDates] = useState<ClosureDate[]>([])
  const [operatingHours, setOperatingHours] = useState<OperatingHours[]>([])
  const [loadingShopHours, setLoadingShopHours] = useState(false)

  // Credit state
  const [creditAmount, setCreditAmount] = useState(0)
  const [finalCost, setFinalCost] = useState(0)
  const [appliedCreditAmount, setAppliedCreditAmount] = useState(0) // Store credit used for extension after payment

  // Calculate final cost after credits
  useEffect(() => {
    const costAfterCredits = Math.max(0, extensionCost - creditAmount)
    setFinalCost(costAfterCredits)
  }, [extensionCost, creditAmount])

  // Pricing state
  const [pricing, setPricing] = useState({
    student: { oneHourRate: 3.00, overOneHourRate: 3.00 },
    member: { oneHourRate: 4.00, overOneHourRate: 4.00 },
    tutor: { oneHourRate: 5.00, overOneHourRate: 5.00 }
  })

  // Seat layout configuration (same as book-now page)
  const DEMO_LAYOUT: SeatMeta[] = [
    { id: 'S1', x: 120, y: 80, shape: 'circle', size: 20 },
    { id: 'S2', x: 120, y: 160, shape: 'circle', size: 20 },
    { id: 'S3', x: 120, y: 260, shape: 'circle', size: 20 },
    { id: 'S4', x: 120, y: 310, shape: 'circle', size: 20 },
    { id: 'S5', x: 120, y: 400, shape: 'circle', size: 20 },
    { id: 'S6', x: 120, y: 450, shape: 'circle', size: 20 },
    { id: 'S7', x: 300, y: 90, shape: 'circle', size: 20 },
    { id: 'S8', x: 300, y: 170, shape: 'circle', size: 20 },
    { id: 'S9', x: 300, y: 220, shape: 'circle', size: 20 },
    { id: 'S12', x: 300, y: 400, shape: 'circle', size: 20 },
    { id: 'S13', x: 300, y: 460, shape: 'circle', size: 20 },
    { id: 'S10', x: 260, y: 280, shape: 'circle', size: 20 },
    { id: 'S11', x: 260, y: 330, shape: 'circle', size: 20 },
    { id: 'S14', x: 260, y: 520, shape: 'circle', size: 20 },
    { id: 'S15', x: 260, y: 570, shape: 'circle', size: 20 },
  ]

  const DEMO_TABLES: TableMeta[] = [
    { id: 'T1', shape: 'rect', x: 80, y: 80, width: 40, height: 80 },
    { id: 'T2', shape: 'rect', x: 80, y: 160, width: 40, height: 80 },
    { id: 'T4', shape: 'rect', x: 80, y: 425, width: 40, height: 100 },
    { id: 'T3', shape: 'circle', x: 60, y: 285, radius: 40 },
    { id: 'T5', shape: 'rect', x: 340, y: 90, width: 40, height: 80 },
    { id: 'T6', shape: 'rect', x: 340, y: 195, width: 40, height: 100 },
    { id: 'T8', shape: 'rect', x: 340, y: 400, width: 40, height: 60 },
    { id: 'T9', shape: 'rect', x: 340, y: 460, width: 40, height: 60 },
    { id: 'T7', shape: 'circle', x: 320, y: 300, radius: 40 },
    { id: 'T10', shape: 'rect', x: 320, y: 520, width: 100, height: 40 },
    { id: 'T10a', shape: 'rect', x: 320, y: 560, width: 100, height: 40 },
  ]

  const DEMO_LABELS: LabelMeta[] = [
    { id: 'lbl-S1', text: 'S1', x: 120, y: 80 },
    { id: 'lbl-S2', text: 'S2', x: 120, y: 160 },
    { id: 'lbl-S3', text: 'S3', x: 120, y: 260 },
    { id: 'lbl-S4', text: 'S4', x: 120, y: 310 },
    { id: 'lbl-S5', text: 'S5', x: 120, y: 400 },
    { id: 'lbl-S6', text: 'S6', x: 120, y: 450 },
    { id: 'lbl-S7', text: 'S7', x: 300, y: 90 },
    { id: 'lbl-S8', text: 'S8', x: 300, y: 170 },
    { id: 'lbl-S9', text: 'S9', x: 300, y: 220 },
    { id: 'lbl-S10', text: 'S10', x: 260, y: 280 },
    { id: 'lbl-S11', text: 'S11', x: 260, y: 330 },
    { id: 'lbl-S12', text: 'S12', x: 300, y: 400 },
    { id: 'lbl-S13', text: 'S13', x: 300, y: 460 },
    { id: 'lbl-S14', text: 'S14', x: 260, y: 520 },
    { id: 'lbl-S15', text: 'S15', x: 260, y: 570 },
    { id: 'lbl-T1', text: 'T1', x: 80, y: 80 },
    { id: 'lbl-T2', text: 'T2', x: 80, y: 160 },
    { id: 'lbl-T3', text: 'T3', x: 60, y: 285 },
    { id: 'lbl-T4', text: 'T4', x: 80, y: 425 },
    { id: 'lbl-T5', text: 'T5', x: 340, y: 90 },
    { id: 'lbl-T6', text: 'T6', x: 340, y: 195 },
    { id: 'lbl-T7', text: 'T7', x: 320, y: 300 },
    { id: 'lbl-T8', text: 'T8', x: 340, y: 400 },
    { id: 'lbl-T9', text: 'T9', x: 340, y: 460 },
    { id: 'lbl-T10', text: 'T10', x: 320, y: 520 },
    { id: 'lbl-T10a', text: 'T10a', x: 320, y: 560 },
  ]

  const OVERLAYS: OverlayMeta[] = [
    { id: 'door', src: '/seat_booking_img/door.png', x: 0, y: 0, width: 60, height: 50 },
    { id: 'legend', src: '/seat_booking_img/legend_img.png', x: 135, y: 0, width: 150, height: 100 },
    { id: 'pantry', src: '/seat_booking_img/pantry.png', x: 0, y: 515, width: 100, height: 80 },
    { id: 'toilet', src: '/seat_booking_img/toilet.png', x: 100, y: 535, width: 80, height: 60 },
    { id: 'monitor_left1', src: '/seat_booking_img/monitor_L.png', x: 20, y: 60, width: 16, height: 24 },
    { id: 'monitor_left2', src: '/seat_booking_img/monitor_L.png', x: 20, y: 140, width: 16, height: 24 },
    { id: 'monitor_left3', src: '/seat_booking_img/monitor_L.png', x: 20, y: 415, width: 16, height: 24 },
    { id: 'monitor_right1', src: '/seat_booking_img/monitor_R.png', x: 365, y: 185, width: 16, height: 24 },
    { id: 'monitor_right2', src: '/seat_booking_img/monitor_R.png', x: 360, y: 285, width: 16, height: 24 },
    { id: 'monitor_right3', src: '/seat_booking_img/monitor_R.png', x: 380, y: 520, width: 16, height: 24 },
  ]

  // Convert closure dates to Date[] for DatePicker excludeDates prop
  const getExcludedDates = (): Date[] => {
    const excluded: Date[] = []

    closureDates.forEach(closure => {
      const start = new Date(closure.startDate)
      const end = new Date(closure.endDate)

      // Add all dates in the closure range
      let current = new Date(start)
      while (current <= end) {
        excluded.push(new Date(current))
        current.setDate(current.getDate() + 1)
      }
    })

    return excluded
  }

  // Helper to generate available times for a given date based on operating hours
  const getAvailableTimes = (date: Date | null): Date[] => {
    if (!date || !originalEndDate) return [];

    const dayOfWeek = date.getDay();

    const dayHours = operatingHours.find(h => h.dayOfWeek === dayOfWeek && h.isActive);

    // If no shop hours found, return empty array
    if (operatingHours.length === 0 || !dayHours) {
      return [];
    }

    const times: Date[] = [];
    const [openHours, openMinutes] = dayHours.openTime.split(':').map(Number);
    const [closeHours, closeMinutes] = dayHours.closeTime.split(':').map(Number);

    // Create start and end times for the selected date
    const openTime = new Date(date);
    openTime.setHours(openHours, openMinutes, 0, 0);
    
    const closeTime = new Date(date);
    closeTime.setHours(closeHours, closeMinutes, 0, 0);

    // Generate 15-minute intervals
    let currentTime = new Date(openTime);
    
    // If same day as original end date, start from original end time
    if (isSameDay(date, originalEndDate)) {
      currentTime = new Date(originalEndDate);
      // Round up to next 15-minute interval
      const minutes = currentTime.getMinutes();
      const remainder = minutes % 15;
      if (remainder !== 0) {
        currentTime.setMinutes(minutes + (15 - remainder));
      }
    }
    
    while (currentTime < closeTime) {
      times.push(new Date(currentTime));
      currentTime.setMinutes(currentTime.getMinutes() + 15);
    }

    return times;
  };

  // Filter function to only allow 15-minute intervals and times after original end time
  const filterTime = (time: Date): boolean => {
    const minutes = time.getMinutes()
    // Only allow :00, :15, :30, :45
    if (minutes % 15 !== 0) return false

    // If original end date exists, only allow times after it
    if (originalEndDate && newEndDate) {
      // Check if the SELECTED date (newEndDate) is the same as original end date
      const selectedDateIsSameDay =
        newEndDate.getFullYear() === originalEndDate.getFullYear() &&
        newEndDate.getMonth() === originalEndDate.getMonth() &&
        newEndDate.getDate() === originalEndDate.getDate()

      if (selectedDateIsSameDay) {
        // Only allow times after the original end time (on same day)
        return time.getTime() > originalEndDate.getTime()
      }

      // If selected date is a different day (future), allow all times
      return true
    }

    return true
  }

  // Load booking details and pricing
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🚀 Extension page loading started')
        setLoading(true)

        // Load booking details
        const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/booking/${bookingId}`)
        if (!response.ok) {
          throw new Error('Failed to load booking')
        }

        const data = await response.json()
        if (data.success && data.booking) {
          const bookingData = data.booking
          setBooking(bookingData)
          setOriginalBooking(bookingData) // Store original booking data

          // Debug booking data
          console.log('Booking loaded:', bookingData)

          // If booking is already confirmed and we're on confirmation step, set extension as confirmed
          if (bookingData.confirmedPayment && currentStep === 3) {
            setExtensionConfirmed(true)
          }

          // Set original end date and pre-fill new end date
          // Convert UTC time from API to local time
          const originalEnd = toLocalTime(bookingData.endAt)
          setOriginalEndDate(originalEnd)
          setNewEndDate(originalEnd)

          // Store the original end time from the booking (before any extension)
          // This will be used to calculate the actual extension hours
          // Only set if booking is not already confirmed (to preserve original end time)
          if (!originalEndTime && !bookingData.confirmedPayment) {
            setOriginalEndTime(bookingData.endAt)
          }
          setSelectedSeats(bookingData.seatNumbers || [])

          // Check if extension is allowed (skip check if this is payment confirmation)
          if (!bookingData.confirmedPayment && !isPaymentConfirmation) {
            toast({
              title: "Cannot Extend",
              description: "Only paid bookings can be extended",
              variant: "destructive"
            })

            return
          }
        } else {
          throw new Error('Booking not found')
        }

        // Load pricing
        console.log('🔍 About to call getAllPricingForLocation for Kovan')
        const allPricing = await getAllPricingForLocation('Kovan')
        console.log('🔍 Loaded pricing from API:', allPricing)
        setPricing(allPricing)

      } catch (error) {
        console.error('Error loading data:', error)
        toast({
          title: "Error",
          description: "Failed to load booking details",
          variant: "destructive"
        })
        // router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    if (bookingId) {
      loadData()
    }
  }, [bookingId, router, toast])

  // Load shop hours (closure dates and operating hours)
  useEffect(() => {
    const loadShopHours = async () => {
      if (!booking?.location) return

      setLoadingShopHours(true)
      try {
        const [dates, hours] = await Promise.all([
          getClosureDates(booking.location),
          getOperatingHours(booking.location)
        ])

        setClosureDates(dates)
        setOperatingHours(hours)
      } catch (error) {
        console.error('Error loading shop hours:', error)
        toast({
          title: "Warning",
          description: "Could not load closure dates. Please verify selected dates manually.",
          variant: "destructive"
        })
      } finally {
        setLoadingShopHours(false)
      }
    }

    loadShopHours()
  }, [booking?.location, toast])

  // Handle payment confirmation
  useEffect(() => {
    const handlePaymentConfirmation = async () => {
      // Handle failed/cancelled payments
      if (isPaymentConfirmation && status && status !== 'completed') {
        console.log('❌ Payment not completed. Status:', status)

        // Set error message based on status
        const errorMessages: Record<string, string> = {
          'canceled': 'Payment was cancelled. Your booking has not been extended.',
          'cancelled': 'Payment was cancelled. Your booking has not been extended.',
          'failed': 'Payment failed. Your booking has not been extended.',
          'pending': 'Payment is still pending. Please wait or contact support.',
        }

        setPaymentError(errorMessages[status] || "Payment was not completed. Your booking has not been extended.")
        setConfirmingPayment(false)
        setCurrentStep(3) // Show step 3 with error
        return
      }

      if (isPaymentConfirmation && status === 'completed') {
        // Set loading state
        setConfirmingPayment(true)

        try {
          console.log('Processing payment confirmation for extension:', { paymentId, status, bookingId })
          console.log('Extension data:', { newEndDate, selectedSeats, extendedHours, extensionCost })

          // Get extension data from URL parameters or state
          const extensionData = {
            newEndAt: urlNewEndAt || newEndDate?.toISOString() || booking.endAt,
            seatNumbers: urlSeatNumbers ? JSON.parse(urlSeatNumbers) : (selectedSeats.length > 0 ? selectedSeats : booking.seatNumbers),
            extensionHours: parseFloat(urlExtensionHours || '0') || extendedHours || 0,
            extensionCost: parseFloat(urlExtensionCost || '0') || extensionCost || 0,
            originalEndAt: urlOriginalEndAt || originalEndTime || booking.endAt,
            creditAmount: parseFloat(urlCreditAmount || '0') || creditAmount || 0, // Use URL credit amount first
            paymentMethod: urlPaymentMethod || 'paynow_online' // Pass the actual payment method from URL
          }

          // Set original end time from URL if available
          if (urlOriginalEndAt && !originalEndTime) {
            setOriginalEndTime(urlOriginalEndAt)
          }

          console.log('Using extension data:', extensionData)

          // Call backend to confirm extension payment
          const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/booking/confirm-extension-payment`, {
            method: 'POST',
            body: JSON.stringify({
              bookingId: bookingId,
              paymentId: paymentId,
              extensionData: extensionData
            })
          })

          if (response.ok) {
            const result = await response.json()
            if (result.success) {
              console.log('Extension confirmed successfully:', result)

              // Handle already confirmed case
              if (result.alreadyConfirmed) {
                toast({
                  title: "Extension Already Confirmed",
                  description: "This booking extension has already been confirmed successfully.",
                })
                // Update booking with confirmed data and set original end time
                setBooking(result.booking)
                if (result.originalEndTime) {
                  setOriginalEndTime(result.originalEndTime)
                }
                setExtensionConfirmed(true)
                setCurrentStep(3)
                return
              }

              // Calculate actual extension hours from booking data (in UTC to avoid timezone issues)
              // Use the stored originalEndTime (before extension) or fall back to current booking endAt
              const originalEndUTC = originalEndTime ? new Date(originalEndTime) : (urlOriginalEndAt ? new Date(urlOriginalEndAt) : new Date(booking.endAt))
              const newEndTimeUTC = new Date(result.booking.endAt)
              const actualExtensionHours = (newEndTimeUTC.getTime() - originalEndUTC.getTime()) / (1000 * 60 * 60)

              console.log('Extension calculation:', {
                originalEndTime: originalEndUTC.toISOString(),
                newEndTime: newEndTimeUTC.toISOString(),
                actualExtensionHours: actualExtensionHours
              })

              // Store original end time for display
              if (result.originalEndTime && !originalEndTime) {
                setOriginalEndTime(result.originalEndTime)
              }

              // Store the credit amount used for this extension
              // Priority: URL params > Calculate from API response > Current state
              let usedCredit = parseFloat(urlCreditAmount || '0') || creditAmount || 0;

              console.log('🔍 Credit calculation debug:', {
                urlCreditAmount,
                creditAmount,
                initialUsedCredit: usedCredit,
                hasExtensionAmounts: !!result.booking?.extensionamounts,
                hasPayment: !!result.payment,
                paymentMethod: result.payment?.paymentMethod
              });

              // If no credit in URL, try to calculate from API response
              if (usedCredit === 0 && result.booking?.extensionamounts && result.payment) {
                const latestExtensionCost = result.booking.extensionamounts[result.booking.extensionamounts.length - 1] || 0;
                const paymentAmount = result.payment.totalAmount || result.payment.cost || 0;

                console.log('🔍 Calculating from API:', {
                  latestExtensionCost,
                  paymentAmount,
                  paymentMethod: result.payment.paymentMethod
                });

                // If payment method is "Credits", the entire amount was covered
                if (result.payment.paymentMethod === 'Credits') {
                  usedCredit = latestExtensionCost;
                  console.log('✅ Calculated credits from API response (fully covered):', usedCredit);
                } else if (latestExtensionCost > paymentAmount) {
                  // Credits = extension cost - payment amount
                  usedCredit = latestExtensionCost - paymentAmount;
                  console.log('✅ Calculated credits from API response (partial):', usedCredit);
                }
              }

              setAppliedCreditAmount(usedCredit)
              console.log('💳 Final credits applied for extension:', usedCredit)

              // Update booking data with COMPLETE data from API response
              setBooking(result.booking)

              // IMPORTANT: Only set these states AFTER booking state is updated
              setExtensionConfirmed(true)
              setConfirmingPayment(false)
              setCurrentStep(3)

              toast({
                title: "Extension Confirmed",
                description: `Your booking has been extended by ${actualExtensionHours.toFixed(2)} hours`,
              })
            } else {
              setConfirmingPayment(false)
              throw new Error(result.message || 'Failed to confirm extension')
            }
          } else {
            setConfirmingPayment(false)
            const errorData = await response.json()
            throw new Error(errorData.message || 'Failed to confirm extension payment')
          }
        } catch (error) {
          console.error('Error confirming extension payment:', error)
          setConfirmingPayment(false)

          // Check if it's already confirmed error
          if (error instanceof Error && (error.message.includes('already confirmed') || error.message.includes('duplicate') || error.message.includes('already exists') || error.message.includes('Extension already confirmed'))) {
            toast({
              title: "Extension Already Confirmed",
              description: "This booking extension has already been confirmed successfully.",
            })
            setExtensionConfirmed(true)
            setCurrentStep(3)
          } else {
            toast({
              title: "Extension Failed",
              description: error instanceof Error ? error.message : "Failed to confirm extension",
              variant: "destructive"
            })
            setCurrentStep(1)
          }
        }
      }
    }

    handlePaymentConfirmation()
  }, [isPaymentConfirmation, paymentId, status])

  // Calculate extension cost when end date changes
  useEffect(() => {
    if (originalEndDate && newEndDate && booking) {
      const hoursDiff = (newEndDate.getTime() - originalEndDate.getTime()) / (1000 * 60 * 60)
      setExtendedHours(Math.max(0, hoursDiff))

      if (hoursDiff > 0) {
        // Use the same formula as booking invoice: (Members × memberRate) + (Tutors × tutorRate) + (Students × studentRate)
        const members = booking.members || 0;
        const tutors = booking.tutors || 0;
        const students = booking.students || 0;

        const memberRate = pricing.member?.oneHourRate || 4.00;
        const tutorRate = pricing.tutor?.oneHourRate || 5.00;
        const studentRate = pricing.student?.oneHourRate || 3.00;

        const hourlyRate = (members * memberRate) + (tutors * tutorRate) + (students * studentRate);

        setExtensionCost(hoursDiff * hourlyRate)
      } else {
        setExtensionCost(0)
      }
    }
  }, [originalEndDate, newEndDate, booking, pricing])

  // Check seat availability when end date changes
  useEffect(() => {
    const checkSeatAvailability = async () => {
      if (!newEndDate || !booking || !originalEndDate) {
        return
      }

      // Only check if extending beyond original end time
      if (newEndDate <= originalEndDate) {
        setRequiresSeatSelection(false)
        setAvailableSeats([])
        setOccupiedSeats([])
        return
      }

      try {
        setCheckingSeats(true)

        const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/booking/getBookedSeats`, {
          method: 'POST',
          body: JSON.stringify({
            location: booking.location,
            startAt: originalEndDate.toISOString().replace('T', ' ').replace('Z', ''),
            endAt: newEndDate.toISOString().replace('T', ' ').replace('Z', '')
          })
        })

        if (response.ok) {
          const data = await response.json()
          setAvailableSeats(data.availableSeats || [])
          setOccupiedSeats(data.bookedSeats || [])

          // Check if original seats are still available
          const originalSeats = booking.seatNumbers || []
          const conflictingSeats = originalSeats.filter((seat: string) =>
            data.bookedSeats?.includes(seat)
          )

          if (conflictingSeats.length > 0) {
            setRequiresSeatSelection(true)
            setSelectedSeats([])
          } else {
            setRequiresSeatSelection(false)
            setSelectedSeats(originalSeats)
          }
        }
      } catch (error) {
        console.error('Error checking seat availability:', error)
      } finally {
        setCheckingSeats(false)
      }
    }

    // Debounce the seat check
    const timeoutId = setTimeout(checkSeatAvailability, 500)
    return () => clearTimeout(timeoutId)
  }, [newEndDate, booking, originalEndDate])

  const handleSubmit = async () => {
    if (!newEndDate || !booking) {
      toast({
        title: "Missing Information",
        description: "Please select new end time",
        variant: "destructive"
      })
      return
    }

    if (newEndDate <= originalEndDate!) {
      toast({
        title: "Invalid Extension",
        description: "New end time must be after current end time",
        variant: "destructive"
      })
      return
    }

    // Check minimum extension of 1 hour
    if (extendedHours < 1) {
      toast({
        title: "Minimum Duration Required",
        description: "Extension requires at least 1 hour.",
        variant: "destructive"
      })
      return
    }

    if (requiresSeatSelection && selectedSeats.length !== booking.pax) {
      toast({
        title: "Seat Selection Required",
        description: `Please select ${booking.pax} seat${booking.pax > 1 ? 's' : ''} for the extended time`,
        variant: "destructive"
      })
      return
    }

    if (extensionCost <= 0) {
      toast({
        title: "Invalid Extension",
        description: "Extension cost must be greater than 0",
        variant: "destructive"
      })
      return
    }

    // Check if fully covered by credits
    if (finalCost === 0 && creditAmount > 0) {
      // Extension is fully covered by credits, skip payment step and directly confirm
      setSubmitting(true)

      try {
        // Generate a proper UUID for payment ID
        const paymentId = crypto.randomUUID()

        const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/booking/confirm-extension-payment`, {
          method: 'POST',
          body: JSON.stringify({
            bookingId,
            paymentId,
            extensionData: {
              newEndAt: newEndDate.toISOString(),
              seatNumbers: requiresSeatSelection ? selectedSeats : booking.seatNumbers,
              extensionHours: extendedHours,
              extensionCost: extensionCost,
              originalEndAt: originalEndTime || booking.endAt,
              creditAmount: creditAmount
            }
          })
        })

        const data = await response.json()

        if (response.ok && data.success) {
          // Calculate actual extension hours for display (in UTC to avoid timezone issues)
          const originalEndUTC = originalEndTime ? new Date(originalEndTime) : (urlOriginalEndAt ? new Date(urlOriginalEndAt) : new Date(booking.endAt))
          const newEndTimeUTC = new Date(data.booking.endAt)
          const actualExtensionHours = (newEndTimeUTC.getTime() - originalEndUTC.getTime()) / (1000 * 60 * 60)

          // Update booking data and set original end time
          setBooking(data.booking)
          if (data.originalEndTime) {
            setOriginalEndTime(data.originalEndTime)
          } else {
            // Fallback to current booking endAt as original
            setOriginalEndTime(booking.endAt)
          }

          // IMPORTANT: Set applied credit amount for display
          setAppliedCreditAmount(creditAmount)
          console.log('💳 Full credits applied - setting appliedCreditAmount:', creditAmount)

          toast({
            title: "Extension Confirmed!",
            description: `Your booking has been extended by ${actualExtensionHours.toFixed(2)} hours`,
          })
          setExtensionConfirmed(true)
          setCurrentStep(3)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
          throw new Error(data.message || 'Failed to confirm extension')
        }
      } catch (error: any) {
        toast({
          title: "Extension Failed",
          description: error.message || "Failed to confirm extension. Please try again.",
          variant: "destructive"
        })
      } finally {
        setSubmitting(false)
      }

      return
    }

    // Move to payment step if not fully covered
    setCurrentStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePaymentMethodChange = (method: 'payNow' | 'creditCard', newTotal: number) => {
    setSelectedPaymentMethod(method)
    setPaymentTotal(newTotal)
  }

  const handlePaymentComplete = async () => {
    // This function is no longer needed as payment confirmation is handled by useEffect
    // when user returns from payment gateway
    console.log('Payment completed, waiting for confirmation...')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-600 mb-4">The booking you're trying to extend doesn't exist.</p>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 sm:pt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Extend Booking</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Extend your booking time. You'll be charged for the additional time.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-6 sm:mb-8">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className={`flex items-center ${currentStep >= 1 ? 'text-orange-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${currentStep >= 1 ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>
                  {currentStep > 1 ? '✓' : <Clock className="w-3 h-3 sm:w-4 sm:h-4" />}
                </div>
                <span className="ml-2 font-medium hidden sm:inline">Time Selection</span>
                <span className="ml-1 font-medium sm:hidden">Time</span>
              </div>
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <div className={`flex items-center ${currentStep >= 2 ? 'text-orange-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${currentStep >= 2 ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>
                  {currentStep > 2 ? '✓' : <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />}
                </div>
                <span className="ml-2 font-medium hidden sm:inline">Payment</span>
                <span className="ml-1 font-medium sm:hidden">Pay</span>
              </div>
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <div className={`flex items-center ${currentStep >= 3 ? 'text-orange-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${currentStep >= 3 ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>
                  {currentStep > 3 ? '✓' : <Shield className="w-3 h-3 sm:w-4 sm:h-4" />}
                </div>
                <span className="ml-2 font-medium hidden sm:inline">Confirmation</span>
                <span className="ml-1 font-medium sm:hidden">Confirm</span>
              </div>
            </div>
          </div>

          {/* Loading State - Payment Confirmation */}
          {confirmingPayment && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
                  <h3 className="text-xl font-semibold text-gray-900">Confirming Your Extension...</h3>
                  <p className="text-gray-600 text-center max-w-md">
                    Please wait while we process your payment and update your booking. This will only take a moment.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Extension Details */}
          {!confirmingPayment && currentStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Extension Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Extend Booking Time</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Time Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>Current End Time (Fixed)</Label>
                        <Input
                          value={originalEndDate ? formatLocalDate(originalEndDate) : ''}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>

                      <div>
                        <Label>New End Time *</Label>
                        <DatePicker
                          selected={newEndDate}
                          onChange={(date) => {
                            if (!date || !originalEndDate) return
                            
                            // Ensure end date is on the same day as original end date
                            if (!isSameDay(date, originalEndDate)) {
                              // If user tries to select a different day, set to end of original end day
                              const endOfOriginalDay = endOfDay(originalEndDate)
                              setNewEndDate(endOfOriginalDay)
                            } else {
                              setNewEndDate(date)
                            }
                          }}
                          showTimeSelect
                          timeIntervals={15}
                          dateFormat="MMM d, h:mm aa"
                          placeholderText="Select new end time"
                          className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
                          wrapperClassName="w-full"
                          minDate={originalEndDate || new Date()}
                          maxDate={originalEndDate ? endOfDay(originalEndDate) : undefined}
                          excludeDates={getExcludedDates()}
                          includeTimes={getAvailableTimes(newEndDate)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          You can only extend on the same day. Select a time after the current end time.
                        </p>
                      </div>
                    </div>

                    {/* Timezone Note */}
                    <div className="flex flex-col gap-1">
                      <p className='text-orange-600 border border-orange-600 rounded-md p-1 px-4 text-xs inline-block'>All times are displayed in Singapore timezone (GMT+8)</p>
                    </div>

                    {/* Minimum Extension Notice */}
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Extension requires at least 1 hour.
                      </AlertDescription>
                    </Alert>
                    {!requiresSeatSelection && !checkingSeats && extendedHours > 0 && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Your original seats are available for the extended time.
                        </AlertDescription>
                      </Alert>
                    )}
                    {/* Extension Summary */}
                    {extendedHours > 0 && extendedHours < 1 && (
                      <Alert className="border-red-500 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          Extension duration ({extendedHours.toFixed(2)} hours) is less than the minimum required 1 hour.
                        </AlertDescription>
                      </Alert>
                    )}

                    {extendedHours >= 1 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-medium text-blue-800 mb-2">Extension Summary</h3>
                        <div className="space-y-1 text-sm text-blue-700">
                          <div>Extended by: {extendedHours.toFixed(2)} hours</div>
                          <div>Cost per hour: ${(() => {
                            // Calculate per hour rate: total extension cost ÷ extension hours
                            const extensionHours = extendedHours || 0;
                            if (extensionHours === 0) return '0.00';

                            const perHourCost = extensionCost / extensionHours;
                            return perHourCost.toFixed(2);
                          })()}</div>
                          <div className="font-medium">Total extension cost: ${extensionCost.toFixed(2)}</div>
                          {creditAmount > 0 && (
                            <>
                              <div className="text-green-700">Credits applied: -${creditAmount.toFixed(2)}</div>
                              <div className="font-bold text-blue-800">Amount to pay: ${finalCost.toFixed(2)}</div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Credit Selection - Only show if extension cost > 0 */}
                    {extendedHours > 0 && extensionCost > 0 && user?.id && (
                      <div className="border-t pt-4">
                        <EntitlementTabs
                          mode="credit"
                          onChange={(data) => {
                            console.log('Credit data changed:', data)
                            if (data && data.type === 'credit' && data.creditAmount !== undefined) {
                              setCreditAmount(data.creditAmount)
                            }
                          }}
                          onModeChange={() => { }} // Not needed for extension
                          userId={user.id}
                          bookingAmount={extensionCost}
                          bookingDuration={extendedHours as any}
                          userRole={booking.memberType || 'MEMBER'}
                          locationPrice={booking.memberType === 'STUDENT' ? 4.00 : booking.memberType === 'TUTOR' ? 6.00 : 5.00}
                          totalPeople={booking.pax || 1}
                          showOnlyCredit={true}
                        />
                      </div>
                    )}

                    {/* Seat Availability Status */}
                    {checkingSeats && (
                      <div className="flex items-center text-sm text-orange-600">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Checking seat availability...
                      </div>
                    )}

                    {requiresSeatSelection && !checkingSeats && extendedHours > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Your original seats are not available for the extended time. Please select different seats.
                        </AlertDescription>
                      </Alert>
                    )}



                    {/* No Seats Available Message */}
                    {!checkingSeats && extendedHours > 0 && (DEMO_LAYOUT.length - occupiedSeats.length) === 0 && (
                      <Alert className="border-red-500 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-700">
                          There is not enough seats for your current timeslot. Please change another timeslot.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Seat Selection */}
                    {requiresSeatSelection && !checkingSeats && extendedHours > 0 && (DEMO_LAYOUT.length - occupiedSeats.length) > 0 && (
                      <div>
                        <Label>Select Seats for Extended Time</Label>
                        <p className="text-sm text-gray-600 mb-3">
                          Choose {booking.pax} seat{booking.pax > 1 ? 's' : ''} for the extended time.
                          <span className="ml-2 text-blue-600">
                            ({DEMO_LAYOUT.length - occupiedSeats.length} seats available)
                          </span>
                        </p>

                        <SeatPicker
                          layout={DEMO_LAYOUT}
                          tables={DEMO_TABLES}
                          labels={DEMO_LABELS}
                          bookedSeats={occupiedSeats}
                          overlays={OVERLAYS}
                          maxSeats={booking.pax}
                          onSelectionChange={setSelectedSeats}
                        />

                        <div className="flex justify-between items-center mt-2">
                          <p className="text-sm text-gray-600">
                            Selected: {selectedSeats.join(', ') || 'none'}
                          </p>
                          {selectedSeats.length !== booking.pax && (
                            <p className="text-sm text-orange-600">
                              {selectedSeats.length < booking.pax
                                ? `Please select ${booking.pax - selectedSeats.length} more seat${booking.pax - selectedSeats.length !== 1 ? 's' : ''}`
                                : `Please deselect ${selectedSeats.length - booking.pax} seat${selectedSeats.length - booking.pax !== 1 ? 's' : ''}`
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4">
                      <Button
                        variant="outline"
                        onClick={() => router.push('/dashboard')}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>

                      <Button
                        onClick={handleSubmit}
                        disabled={
                          submitting ||
                          checkingSeats ||
                          extendedHours < 1 ||
                          (requiresSeatSelection && selectedSeats.length !== booking.pax)
                        }
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        {submitting ? 'Processing...' :
                          finalCost === 0 && creditAmount > 0 ? 'Confirm Extension (Fully Covered)' :
                            'Continue to Payment'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* Current Booking Info */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                      Current Booking
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="font-medium">Reference:</span>
                      <span className="ml-2 font-mono">{booking.bookingRef}</span>
                    </div>

                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{booking.location}</span>
                    </div>

                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <div>
                        <div>{formatLocalDate(toLocalTime(booking.startAt))}</div>
                        <div className="text-gray-500">to {formatLocalDate(toLocalTime(booking.endAt))}</div>
                      </div>
                    </div>

                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-2 text-gray-500" />
                      <span>
                        {[
                          booking.students > 0 && `${booking.students} Student${booking.students > 1 ? 's' : ''}`,
                          booking.members > 0 && `${booking.members} Member${booking.members > 1 ? 's' : ''}`,
                          booking.tutors > 0 && `${booking.tutors} Tutor${booking.tutors > 1 ? 's' : ''}`
                        ].filter(Boolean).join(', ') || `${booking.pax} people`}
                      </span>
                    </div>

                    {booking.seatNumbers && booking.seatNumbers.length > 0 && (
                      <div className="text-sm">
                        <div className="flex items-center mb-2">
                          <span className="font-medium">Current Seats:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {booking.seatNumbers.map((seat: string, index: number) => (
                            <Badge key={index} variant="outline">
                              {seat}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

            </div>
          )}

          {/* Payment Step */}
          {!confirmingPayment && currentStep === 2 && booking && (
            <div className="mt-4 sm:mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Payment Form - Left Side */}
                <div className="lg:col-span-2">
                  <PaymentStep
                    subtotal={extensionCost}
                    total={finalCost}
                    discountAmount={creditAmount}
                    appliedVoucher={undefined}
                    selectedPackage={undefined}
                    customer={{
                      name: (databaseUser?.firstName && databaseUser?.lastName)
                        ? `${databaseUser.firstName} ${databaseUser.lastName}`
                        : user?.email?.split('@')[0] || 'User',
                      email: user?.email || 'user@example.com',
                      phone: databaseUser?.contactNumber || '+65 1234 5678'
                    }}
                    bookingId={bookingId}
                    onBack={() => setCurrentStep(1)}
                    onComplete={handlePaymentComplete}
                    onPaymentMethodChange={handlePaymentMethodChange}
                    onCreateBooking={async () => {
                      // For extension, we don't need to create a new booking
                      // Just return the existing booking ID
                      return bookingId
                    }}
                    onBookingCreated={(bookingId) => {
                      console.log('Extension booking ID:', bookingId)
                    }}
                    isExtension={true}
                    extensionData={{
                      newEndAt: newEndDate?.toISOString() || '',
                      seatNumbers: selectedSeats,
                      extensionHours: extendedHours,
                      extensionCost: extensionCost,
                      originalEndAt: originalEndTime || booking?.endAt || '',
                      creditAmount: creditAmount
                    }}
                  />
                </div>

                {/* Summary Grid - Right Side */}
                <div className="lg:col-span-1">
                  <Card className="sticky top-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Extension Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Booking Details */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{booking.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span>{booking.pax || 1} {(booking.pax || 1) === 1 ? 'Person' : 'People'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>{formatLocalDateOnly(new Date(booking.startAt))}</span>
                        </div>
                      </div>

                      <div className="border-t pt-3">
                        <h4 className="font-medium text-sm mb-2">Time Extension</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Original End:</span>
                            <span className="font-medium">{formatLocalTimeOnly(new Date(booking.endAt))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">New End:</span>
                            <span className="font-medium text-blue-600">{newEndDate ? formatLocalTimeOnly(newEndDate) : '-'}</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t">
                            <span className="text-gray-600">Extended by:</span>
                            <span className="font-medium">{extendedHours.toFixed(2)} hours</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-3">
                        <h4 className="font-medium text-sm mb-2">Cost Breakdown</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Extension Cost:</span>
                            <span className="font-medium">${extensionCost.toFixed(2)}</span>
                          </div>
                          {creditAmount > 0 && (
                            <div className="flex justify-between text-green-700">
                              <span>Credits Applied:</span>
                              <span>-${creditAmount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-1 border-t">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium">${finalCost.toFixed(2)}</span>
                          </div>
                          {(() => {
                            const paymentFee = selectedPaymentMethod === 'creditCard'
                              ? Math.round(finalCost * (paymentFeeSettings.creditCardFeePercentage / 100) * 100) / 100
                              : (finalCost < 10 ? paymentFeeSettings.paynowFee : 0)  // PayNow fee only for < $10
                            const finalTotal = Math.round((finalCost + paymentFee) * 100) / 100

                            return (
                              <>
                                {selectedPaymentMethod === 'creditCard' ? (
                                  <div className="flex justify-between text-gray-600">
                                    <span>Credit Card Fee ({paymentFeeSettings.creditCardFeePercentage}%):</span>
                                    <span>+${paymentFee.toFixed(2)}</span>
                                  </div>
                                ) : finalCost < 10 ? (
                                  <div className="flex justify-between text-gray-600">
                                    <span>Transaction Fee:</span>
                                    <span>+${paymentFee.toFixed(2)}</span>
                                  </div>
                                ) : (
                                  <div className="flex justify-between text-green-700 text-xs">
                                    <span>✓ No transaction fee</span>
                                    <span>$0.00</span>
                                  </div>
                                )}
                                <div className="flex justify-between pt-2 border-t font-bold text-base">
                                  <span>Total to Pay:</span>
                                  <span className="text-orange-600">${finalTotal.toFixed(2)}</span>
                                </div>
                              </>
                            )
                          })()}
                        </div>
                      </div>

                      {selectedSeats.length > 0 && (
                        <div className="border-t pt-3">
                          <h4 className="font-medium text-sm mb-2">Selected Seats</h4>
                          <div className="flex flex-wrap gap-1">
                            {selectedSeats.map(seat => (
                              <Badge key={seat} variant="secondary" className="text-xs">
                                {seat}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Step */}
          {!confirmingPayment && currentStep === 3 && booking && (
            <div className="mt-6">
              {paymentError ? (
                // Payment failed/cancelled - show error
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <XCircle className="h-5 w-5 mr-2 text-red-600" />
                      Extension Failed
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-medium text-red-800 mb-2">Payment Not Completed</h3>
                      <p className="text-sm text-red-700">{paymentError}</p>

                      <div className="mt-4 pt-4 border-t border-red-200">
                        <h4 className="font-medium text-red-800 mb-2">Booking Details (Not Changed)</h4>
                        <div className="space-y-1 text-sm text-red-700">
                          <div>Reference: {booking?.bookingRef}</div>
                          <div>Location: {booking?.location}</div>
                          <div>Current End Time: {booking?.endAt ? formatLocalDate(booking.endAt) : ''}</div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center space-y-3">
                      <p className="text-gray-600">
                        Your original booking remains unchanged. You can try extending again.
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={() => {
                            setPaymentError(null)
                            setCurrentStep(1)
                          }}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          Try Again
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => router.push('/dashboard')}
                        >
                          Back to Dashboard
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // Payment successful - show success
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                      Extension Confirmed
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-medium text-green-800 mb-2">Booking Extended Successfully</h3>
                      <div className="space-y-1 text-sm text-green-700">
                        <div>Your booking has been extended by {(() => {
                          // Calculate extension hours from original and new end times
                          if (originalEndTime && booking?.endAt) {
                            const hours = (new Date(booking.endAt).getTime() - new Date(originalEndTime).getTime()) / (1000 * 60 * 60)
                            return hours.toFixed(2)
                          }
                          return urlExtensionHours || extendedHours.toFixed(2)
                        })()} hours</div>
                        <div>New end time: {booking?.endAt ? formatLocalDate(booking.endAt) : (newEndDate ? formatLocalDate(newEndDate) : '')}</div>
                        <div className="border-t border-green-300 pt-2 mt-2">
                          <div className="font-medium mb-1">Payment Breakdown:</div>
                          <div>Booking Extension cost: ${(() => {
                            // Use the latest extension amount from extensionamounts array
                            if (booking?.extensionamounts && booking.extensionamounts.length > 0) {
                              return booking.extensionamounts[booking.extensionamounts.length - 1].toFixed(2)
                            }
                            const costValue = urlExtensionCost ? parseFloat(urlExtensionCost) : extensionCost
                            return costValue.toFixed(2)
                          })()}</div>
                          {appliedCreditAmount > 0 && (
                            <div className="text-blue-700">Credits applied: -${appliedCreditAmount.toFixed(2)}</div>
                          )}
                          {(() => {
                            // Calculate subtotal, fee, and total paid
                            const baseAmount = booking?.extensionamounts?.[booking.extensionamounts.length - 1] || parseFloat(urlExtensionCost || '0') || extensionCost;
                            const credits = appliedCreditAmount || 0;
                            const subtotal = Math.max(0, baseAmount - credits);

                            // Determine payment method based on subtotal and credits
                            let paymentMethod = 'paynow_online';

                            if (subtotal === 0 && credits > 0) {
                              // Fully covered by credits
                              paymentMethod = 'Credits';
                            } else if (urlPaymentMethod) {
                              // Use URL payment method
                              paymentMethod = urlPaymentMethod;
                            }

                            // Calculate fee - NO FEE if method is "Credits" (fully covered)
                            const isCreditsOnly = paymentMethod === 'Credits';
                            const isCard = !isCreditsOnly && paymentMethod.toLowerCase().includes('card');
                            const fee = isCreditsOnly ? 0 : (isCard ? subtotal * (paymentFeeSettings.creditCardFeePercentage / 100) : (subtotal < 10 ? paymentFeeSettings.paynowFee : 0));
                            const totalPaid = subtotal + fee;

                            return (
                              <>
                                <div className="border-t border-green-200 mt-1 pt-1">
                                  {subtotal === 0 ? (
                                    <div className="font-semibold text-green-700 bg-green-100 p-2 rounded">
                                      ✓ Fully Covered by Credits - No Payment Required
                                    </div>
                                  ) : (
                                    <>
                                      <div className="text-green-600">Subtotal: ${subtotal.toFixed(2)}</div>
                                      {fee > 0 && (
                                        <div className="text-green-600">
                                          {isCard ? `Card Fee (${paymentFeeSettings.creditCardFeePercentage}%)` : 'Transaction Fee'}: +${fee.toFixed(2)}
                                        </div>
                                      )}
                                      <div className="font-semibold text-green-800 mt-1">Amount Paid: ${totalPaid.toFixed(2)}</div>
                                    </>
                                  )}
                                </div>
                                {/* <div className="border-t border-green-300 mt-2 pt-2">
                                <div className="font-medium text-green-800">
                                  Total Booking Cost: ${(() => {
                                    if (booking?.totalactualcost !== undefined && booking?.totalactualcost !== null) {
                                      return booking.totalactualcost.toFixed(2)
                                    }
                                    const originalCost = booking?.totalAmount || 0;
                                    const extensionTotal = booking?.extensionamounts?.reduce((sum: number, amount: number) => sum + amount, 0) || 0;
                                    return (originalCost + extensionTotal).toFixed(2);
                                  })()}
                                </div>
                                <div className="text-xs text-green-600">(Cumulative cost including all extensions)</div>
                              </div> */}
                              </>
                            );
                          })()}
                        </div>
                        {/* {paymentId && (
                        <div className="mt-2 pt-2 border-t border-green-300">Payment ID: {paymentId}</div>
                      )} */}
                      </div>
                    </div>

                    <div className="text-center">
                      <Button
                        onClick={() => router.push('/dashboard')}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Back to Dashboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
      <FooterSection />
    </>
  )
}

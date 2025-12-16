'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
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
  AlertCircle,
  AlertTriangle,
  Loader2,
  CheckCircle,
  XCircle,
  CreditCard,
  DollarSign,
  ArrowRight
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import {
  getBookingForReschedule
} from '@/lib/rescheduleService'
import { getAllPricingForLocation } from '@/lib/pricingService'
import { SeatPicker, SeatMeta, OverlayMeta, TableMeta, LabelMeta } from '@/components/book-now-sections/SeatPicker'
import PaymentStep from '@/components/book-now/PaymentStep'
import { EntitlementTabs } from '@/components/book-now-sections/EntitlementTabs'
import {
  toSingaporeTime,
  formatSingaporeDate,
  formatSingaporeDateOnly,
  formatSingaporeTimeOnly,
  fromDatePickerToUTC,
  toLocalTime
} from '@/lib/timezoneUtils'
import { supabase } from '@/lib/supabaseClient'
import { formatCurrency } from '@/lib/paymentUtils'
import Navbar from '@/components/Navbar'
import { FooterSection } from '@/components/landing-page-sections/FooterSection'
import { authenticatedFetch } from '@/lib/apiClient'
import { getOperatingHours, getClosureDates, OperatingHours, ClosureDate } from '@/lib/shopHoursService'
import { isSameDay, addMonths, endOfDay } from 'date-fns'


// Layout and seat configuration (same as extend page)
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

export default function ReschedulePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user } = useAuth()

  const bookingId = params.bookingId as string

  // URL Parameters (for payment confirmation flow)
  const isRescheduleReturn = searchParams.get('reschedule') === 'true'
  const paymentReference = searchParams.get('reference')
  const status = searchParams.get('status')
  const urlNewStartAt = searchParams.get('newStartAt')
  const urlNewEndAt = searchParams.get('newEndAt')
  const urlSeatNumbers = searchParams.get('seatNumbers')
  const urlAdditionalCost = searchParams.get('additionalCost')
  const urlOriginalStartAt = searchParams.get('originalStartAt')
  const urlOriginalEndAt = searchParams.get('originalEndAt')
  // Note: creditAmount is NOT in URL - it will be fetched from Payment record or passed from rescheduleData state

  // State
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [apiLoading, setApiLoading] = useState(false)
  const [rescheduleConfirmed, setRescheduleConfirmed] = useState(false)
  const [currentStep, setCurrentStep] = useState(() => {
    // If returning from payment gateway, always go to step 3 to show result (success or error)
    const step = searchParams.get('step')
    const isRescheduleReturn = searchParams.get('reschedule') === 'true'
    const status = searchParams.get('status')
    const paymentReference = searchParams.get('reference')
    
    // If returning from payment (has reference and reschedule=true), show step 3 regardless of status
    if (isRescheduleReturn && paymentReference) {
      return 3 // Show confirmation page (will display error or success based on status)
    }
    
    return step ? parseInt(step) : 1
  })
  const [submitting, setSubmitting] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const processedPaymentRef = useRef<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  // Store API response data for confirmation display
  const [confirmationData, setConfirmationData] = useState<{
    booking: any
    originalTimes: { startAt: string; endAt: string }
  } | null>(null)

  // User info state
  const [userInfo, setUserInfo] = useState<{
    name: string
    email: string
    phone: string
  }>({
    name: '',
    email: '',
    phone: ''
  })

  // Step 1: Time Selection
  const [newStartDate, setNewStartDate] = useState<Date | null>(null)
  const [newEndDate, setNewEndDate] = useState<Date | null>(null)
  const [originalStartDate, setOriginalStartDate] = useState<Date | null>(null)
  const [originalEndDate, setOriginalEndDate] = useState<Date | null>(null)
  const [originalDuration, setOriginalDuration] = useState<number>(0)

  // Dynamic payment fee settings state
  const [feeSettings, setFeeSettings] = useState({
    paynowFee: 0.20,
    creditCardFeePercentage: 5.0
  })

  // Load payment fee settings from database
  const loadPaymentFeeSettings = async () => {
    try {
      const { getPaymentSettings } = await import('@/lib/paymentSettingsService')
      const settings = await getPaymentSettings()
      setFeeSettings({
        paynowFee: settings.PAYNOW_TRANSACTION_FEE,
        creditCardFeePercentage: settings.CREDIT_CARD_TRANSACTION_FEE_PERCENTAGE
      })
    } catch (error) {
      console.error('Error loading payment fee settings:', error)
    }
  }

  // Step 1: Seat Selection
  const [availableSeats, setAvailableSeats] = useState<string[]>([])
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([])
  const [otherBookedSeats, setOtherBookedSeats] = useState<string[]>([])
  const [conflictingCurrentSeats, setConflictingCurrentSeats] = useState<string[]>([])
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [requiresSeatSelection, setRequiresSeatSelection] = useState(false)
  const [checkingSeats, setCheckingSeats] = useState(false)

  // Step 2: Payment
  const [rescheduleData, setRescheduleData] = useState<any>(null)
  const [costDifference, setCostDifference] = useState(0)
  const [needsPayment, setNeedsPayment] = useState(false)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  const [paymentTotal, setPaymentTotal] = useState(0)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'payNow' | 'creditCard'>('payNow')
  
  // Credits state
  const [creditAmount, setCreditAmount] = useState(() => {
    // Check if we're in the browser (not SSR)
    if (typeof window === 'undefined') return 0
    
    // Only restore from localStorage if coming from payment return
    if (isRescheduleReturn && status === 'completed' && paymentReference) {
      const saved = localStorage.getItem(`reschedule_credit_${bookingId}`)
      return saved ? parseFloat(saved) : 0
    }
    // Otherwise start fresh (and clear any old data)
    localStorage.removeItem(`reschedule_credit_${bookingId}`)
    return 0
  })
  const [finalCost, setFinalCost] = useState(0)

  // Pricing state (dynamic - fetched from backend)
  const [pricing, setPricing] = useState({
    student: { oneHourRate: 3.00, overOneHourRate: 3.00 },
    member: { oneHourRate: 4.00, overOneHourRate: 4.00 },
    tutor: { oneHourRate: 5.00, overOneHourRate: 5.00 }
  })

  // Shop hours state
  const [operatingHours, setOperatingHours] = useState<OperatingHours[]>([])
  const [closureDates, setClosureDates] = useState<ClosureDate[]>([])
  const [isLoadingShopHours, setIsLoadingShopHours] = useState(false)

  // Load shop hours on mount
  useEffect(() => {
    const loadShopHours = async () => {
      setIsLoadingShopHours(true)
      try {
        // Hardcoded to Kovan as per UI
        const [hours, closures] = await Promise.all([
          getOperatingHours('Kovan'),
          getClosureDates('Kovan')
        ])
        setOperatingHours(hours)
        setClosureDates(closures)
        console.log('✅ Shop hours loaded for reschedule:', hours)
      } catch (error) {
        console.error('Error loading shop hours:', error)
      } finally {
        setIsLoadingShopHours(false)
      }
    }

    loadShopHours()
  }, [])

  // Calculate max date (2 months from today)
  const maxBookingDate = addMonths(new Date(), 2)

  // Helper function to get dates that should be excluded (closure dates)
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
    if (!date) return [];

    const dayOfWeek = date.getDay();
    const now = new Date();
    const isToday = isSameDay(date, now);

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
    while (currentTime < closeTime) {
      // For today, only include future times
      if (isToday && currentTime <= now) {
        currentTime.setMinutes(currentTime.getMinutes() + 15);
        continue;
      }
      
      times.push(new Date(currentTime));
      currentTime.setMinutes(currentTime.getMinutes() + 15);
    }

    return times;
  };

  // Helper function to get available end times based on start date
  const getAvailableEndTimes = (startDate: Date | null): Date[] => {
    if (!startDate) return [];
    
    const times = getAvailableTimes(startDate);
    if (!times.length) return times;

    // Filter based on start time (must be >= start time + 1 hour)
    const minEndTime = new Date(startDate.getTime() + 60 * 60 * 1000);
    return times.filter(time => time.getTime() >= minEndTime.getTime());
  };

  // Helper function to round UP to next 15-minute interval
  const roundUpToNext15Minutes = (date: Date): Date => {
    const rounded = new Date(date);
    const minutes = rounded.getMinutes();
    const remainder = minutes % 15;

    if (remainder !== 0) {
      const validMinutes = minutes + (15 - remainder);
      rounded.setMinutes(validMinutes);
      rounded.setSeconds(0);
      rounded.setMilliseconds(0);
    } else {
      rounded.setSeconds(0);
      rounded.setMilliseconds(0);
    }

    return rounded;
  };

  // Helper function to get optimal start time based on shop hours
  const getOptimalStartTime = (selectedDate: Date): Date => {
    const now = new Date()
    const isToday = isSameDay(selectedDate, now)
    const dayOfWeek = selectedDate.getDay()
    
    // Get shop hours for the selected day
    const dayHours = operatingHours.find(h => h.dayOfWeek === dayOfWeek && h.isActive)
    
    // If no shop hours found
    if (!dayHours || operatingHours.length === 0) {
      if (isToday) {
        return roundUpToNext15Minutes(now)
      }
      const defaultTime = new Date(selectedDate)
      defaultTime.setHours(9, 0, 0, 0)
      return defaultTime
    }
    
    // Parse shop open time
    const [openHours, openMinutes] = dayHours.openTime.split(':').map(Number)
    const openTime = new Date(selectedDate)
    openTime.setHours(openHours, openMinutes, 0, 0)
    
    if (isToday) {
      const currentRounded = roundUpToNext15Minutes(now)
      if (currentRounded < openTime) {
        return openTime
      }
      return currentRounded
    } else {
      return openTime
    }
  }

  // Handler for when user clicks on calendar date
  const handleDateSelect = (date: Date | null) => {
    if (!date) return
    
    const optimalTime = getOptimalStartTime(date)
    setNewStartDate(optimalTime)
    
    // Auto-set end date based on original duration
    if (originalDuration > 0) {
      const calculatedEndDate = new Date(optimalTime.getTime() + (originalDuration * 60 * 60 * 1000))
      // Ensure end date is on the same day as start date
      if (!isSameDay(calculatedEndDate, optimalTime)) {
        // If calculated end date is on a different day, set it to end of start day
        const endOfStartDay = endOfDay(optimalTime)
        setNewEndDate(endOfStartDay)
      } else {
        setNewEndDate(calculatedEndDate)
      }
    }
  }

  // Filter function to only allow 15-minute intervals and disable past hours
  const filterTime = (time: Date): boolean => {
    const minutes = time.getMinutes()
    // Only allow :00, :15, :30, :45
    if (minutes % 15 !== 0) return false
    
    // Get current time
    const now = new Date()
    
    // If the selected date is today, only allow times after current time
    if (newStartDate) {
      const selectedDateIsToday = 
        newStartDate.getFullYear() === now.getFullYear() &&
        newStartDate.getMonth() === now.getMonth() &&
        newStartDate.getDate() === now.getDate()
      
      if (selectedDateIsToday) {
        // Only allow times after current time (on same day)
        return time.getTime() > now.getTime()
      }
    }
    
    // If selected date is a different day (future), allow all times
    return true
  }

  // Helper function to update URL with current step
  const updateStepInURL = (step: number) => {
    const url = new URL(window.location.href)
    url.searchParams.set('step', step.toString())
    router.replace(url.pathname + url.search, { scroll: false })
  }

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep])

  // Fetch current user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          setUserInfo({
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            phone: user.user_metadata?.phone || user.phone || ''
          })
        }
      } catch (error) {
        console.error('Error fetching user info:', error)
      }
    }

    fetchUserInfo()
    loadPaymentFeeSettings()
  }, [])

  // Load booking data
  useEffect(() => {
    const loadBooking = async () => {
      try {
        setLoading(true)
        const response = await getBookingForReschedule(bookingId)

        if (response.success && response.booking) {
          const bookingData = response.booking
          setBooking(bookingData)

          // Set original dates from the booking's current times
          const startDate = toLocalTime(bookingData.startAt)
          const endDate = toLocalTime(bookingData.endAt)

          setOriginalStartDate(startDate)
          setOriginalEndDate(endDate)

          // Calculate original duration in hours
          const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
          setOriginalDuration(duration)

          // Set initial new dates to original dates
          setNewStartDate(startDate)
          setNewEndDate(endDate)

          // Set initial selected seats
          setSelectedSeats(bookingData.seatNumbers || [])

          // Load pricing dynamically from backend
          console.log('🔍 About to call getAllPricingForLocation for Kovan')
          const allPricing = await getAllPricingForLocation('Kovan')
          console.log('🔍 Loaded pricing from API:', allPricing)
          setPricing(allPricing)

        } else {
          toast({
            title: "Booking Not Found",
            description: response.error || "Could not load booking details",
            variant: "destructive"
          })
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Error loading booking:', error)
        toast({
          title: "Error",
          description: "Failed to load booking details",
          variant: "destructive"
        })
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    if (bookingId) {
      loadBooking()
    }
  }, [bookingId, router, toast])

  // Handle payment confirmation (same pattern as extend booking)
  useEffect(() => {
    const handlePaymentConfirmation = async () => {
      // Handle failed/cancelled payments
      if (isRescheduleReturn && status && status !== 'completed') {
        console.log('❌ Payment not completed. Status:', status)
        
        // Clean up any saved credit data
        localStorage.removeItem(`reschedule_credit_${bookingId}`)
        
        // Set error message based on status
        const errorMessages: Record<string, string> = {
          'canceled': 'Payment was cancelled. Your booking has not been rescheduled.',
          'cancelled': 'Payment was cancelled. Your booking has not been rescheduled.',
          'failed': 'Payment failed. Your booking has not been rescheduled.',
          'pending': 'Payment is still pending. Please wait or contact support.',
        }
        
        setPaymentError(errorMessages[status] || "Payment was not completed. Your booking has not been rescheduled.")
        setCurrentStep(3) // Show step 3 with error
        setApiLoading(false)
        return
      }
      
      if (isRescheduleReturn && status === 'completed' && paymentReference) {
        // Check if already processed (prevent double API calls)
        const processedKey = `reschedule_processed_${bookingId}_${paymentReference}`
        if (localStorage.getItem(processedKey)) {
          console.log('✅ Payment already processed, skipping duplicate call')
          setRescheduleConfirmed(true)
          setPaymentConfirmed(true)
          setCurrentStep(3)
          return
        }
        
        try {
          setApiLoading(true) // Show loading during confirmation
          console.log('🔄 Processing payment confirmation for reschedule:', { paymentReference, status, bookingId })
          
          // Get creditAmount from localStorage (saved before payment)
          const savedCreditAmount = parseFloat(localStorage.getItem(`reschedule_credit_${bookingId}`) || '0')
          console.log('💳 Retrieved credit amount from localStorage:', savedCreditAmount)
          
          // Get reschedule data from URL parameters + creditAmount from localStorage
          const rescheduleDataFromUrl = {
            newStartAt: urlNewStartAt!,
            newEndAt: urlNewEndAt!,
            seatNumbers: urlSeatNumbers ? JSON.parse(urlSeatNumbers) : [],
            additionalCost: parseFloat(urlAdditionalCost || '0'),
            originalStartAt: urlOriginalStartAt!,
            originalEndAt: urlOriginalEndAt!,
            creditAmount: savedCreditAmount // Use creditAmount from localStorage!
          }
          
          console.log('💳 Sending reschedule data with credits:', rescheduleDataFromUrl)
          
          // Call backend to confirm reschedule payment
          // Use bookingId to lookup payment by bookingRef (same as extend)
          const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/reschedule/confirm-payment`, {
            method: 'POST',
            body: JSON.stringify({
              bookingId: bookingId,
              paymentId: bookingId, // Use bookingId to lookup payment by bookingRef
              rescheduleData: rescheduleDataFromUrl
            })
          })

          if (response.ok) {
            const result = await response.json()
            if (result.success) {
              console.log('✅ Reschedule confirmed successfully:', result)
              
              // Mark as processed (prevent duplicate calls)
              localStorage.setItem(processedKey, 'true')
              // Clean up credit amount from localStorage
              localStorage.removeItem(`reschedule_credit_${bookingId}`)
              
              setRescheduleConfirmed(true)
              setPaymentConfirmed(true)
              setCurrentStep(3)
              
              // Update booking with confirmed data
              if (result.booking) {
                setBooking(result.booking)
                setConfirmationData({
                  booking: result.booking,
                  originalTimes: result.originalTimes || {
                    startAt: urlOriginalStartAt!,
                    endAt: urlOriginalEndAt!
                  }
                })
              }
              
              toast({
                title: "Reschedule Confirmed",
                description: "Your booking has been rescheduled successfully",
              })
            } else {
              throw new Error(result.message || 'Failed to confirm reschedule')
            }
          } else {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Failed to confirm reschedule payment')
          }
        } catch (error) {
          console.error('❌ Error confirming reschedule payment:', error)
          toast({
            title: "Confirmation Error",
            description: error instanceof Error ? error.message : "Failed to confirm your reschedule",
            variant: "destructive"
          })
          // Reset to step 2 to allow retry
          setCurrentStep(2)
          updateStepInURL(2)
        } finally {
          setApiLoading(false) // Hide loading
        }
      }
    }

    // Only run if booking is loaded
    if (booking && !loading) {
      handlePaymentConfirmation()
    }
  }, [isRescheduleReturn, status, paymentReference, urlNewStartAt, urlNewEndAt, urlSeatNumbers, urlAdditionalCost, urlOriginalStartAt, urlOriginalEndAt, booking, loading, bookingId, toast])
  // Note: creditAmount NOT in dependency array - we get it from localStorage instead

  // Calculate new end date when start date changes
  useEffect(() => {
    if (newStartDate && originalDuration > 0) {
      const calculatedEndDate = new Date(newStartDate.getTime() + (originalDuration * 60 * 60 * 1000))
      // Ensure end date is on the same day as start date
      if (!isSameDay(calculatedEndDate, newStartDate)) {
        // If calculated end date is on a different day, set it to end of start day
        const endOfStartDay = endOfDay(newStartDate)
        setNewEndDate(endOfStartDay)
      } else {
        setNewEndDate(calculatedEndDate)
      }
    }
  }, [newStartDate, originalDuration])

  // Calculate cost difference when dates change
  useEffect(() => {
    if (newStartDate && newEndDate && booking && originalStartDate && originalEndDate) {
      const newDuration = (newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60)
      const originalDuration = (originalEndDate.getTime() - originalStartDate.getTime()) / (1000 * 60 * 60)



      // Calculate cost difference
      const memberType = booking.memberType?.toLowerCase() || 'member'
      const rate = newDuration === 1 ?
        pricing[memberType as keyof typeof pricing]?.oneHourRate || 5.00 :
        pricing[memberType as keyof typeof pricing]?.overOneHourRate || 5.00

      const originalCost = originalDuration * rate * booking.pax
      const newCost = newDuration * rate * booking.pax
      const difference = newCost - originalCost

      setCostDifference(difference)
      setNeedsPayment(difference > 0)
      setPaymentTotal(difference) // Initialize payment total with cost difference
    }
  }, [newStartDate, newEndDate, booking, originalStartDate, originalEndDate, pricing, booking?.pax, booking?.memberType, toast])

  // Debug payment total changes
  useEffect(() => {
    console.log('Payment total changed:', paymentTotal, 'Cost difference:', costDifference)
  }, [paymentTotal, costDifference])

  // Debug reschedule data
  useEffect(() => {
    console.log('Reschedule data changed:', rescheduleData)
  }, [rescheduleData])

  // Initialize payment total when cost difference changes
  useEffect(() => {
    if (costDifference > 0 && paymentTotal === 0) {
      // Initialize with credit card calculation (default selected method)
      // For PayNow, fee only applies if < $10
      const feeAmount = costDifference * (feeSettings.creditCardFeePercentage / 100)
      const totalWithFee = costDifference + feeAmount
      console.log('Initial calculation - Credit card total:', costDifference, '+', feeAmount, '=', totalWithFee)
      setPaymentTotal(totalWithFee)
    }
  }, [costDifference, paymentTotal])

  // Calculate final cost after credits
  useEffect(() => {
    const finalAmount = Math.max(0, costDifference - creditAmount)
    setFinalCost(finalAmount)
  }, [costDifference, creditAmount])

  // Check seat availability when dates change
  useEffect(() => {
    const checkSeatAvailability = async () => {
      if (!newStartDate || !newEndDate || !booking) {
        return
      }

      try {
        setCheckingSeats(true)

        const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/booking/getBookedSeats`, {
          method: 'POST',
          body: JSON.stringify({
            location: booking.location,
            startAt: newStartDate.toISOString(),
            endAt: newEndDate.toISOString(),
            excludeBookingId: bookingId // Exclude current booking
          })
        })

        if (response.ok) {
          const data = await response.json()
          console.log('🔍 Seat availability response:', data)
          setAvailableSeats(data.availableSeats || [])
          
          // Filter out current booking's seats from occupied seats
          // Backend should exclude them, but double-check here
          const otherBookedSeats = (data.bookedSeats || []).filter(
            (seat: string) => !(booking.seatNumbers || []).includes(seat)
          )
          setOccupiedSeats(data.bookedSeats || [])
          setOtherBookedSeats(otherBookedSeats)
          setConflictingCurrentSeats(data.conflictingCurrentSeats || [])

          console.log('🔍 Debug seat availability:', {
            originalSeats: booking.seatNumbers || [],
            allBookedSeats: data.bookedSeats || [],
            otherBookedSeats,
            availableSeats: data.availableSeats || [],
            currentBookingSeats: data.currentBookingSeats || [],
            conflictingCurrentSeats: data.conflictingCurrentSeats || []
          })

          // Check if original seats conflict with OTHER bookings (not current booking)
          const originalSeats = booking.seatNumbers || []
          const conflictingSeats = originalSeats.filter((seat: string) =>
            otherBookedSeats.includes(seat)
          )

          // Also check if any of the original seats are in the booked seats list
          // (this handles the case where current booking is not properly excluded)
          const additionalConflicts = originalSeats.filter((seat: string) =>
            (data.bookedSeats || []).includes(seat) && !(data.currentBookingSeats || []).includes(seat)
          )

          // Check if user is trying to select seats that are already booked
          // This is the main issue - we need to check if any seats the user might want are unavailable
          const unavailableSeats = (data.bookedSeats || []).filter((seat: string) =>
            !(data.currentBookingSeats || []).includes(seat)
          )

          // Check if current booking seats conflict with other bookings
          const conflictingCurrentSeats = data.conflictingCurrentSeats || []
          
          const allConflictingSeats = [...new Set([...conflictingSeats, ...additionalConflicts, ...conflictingCurrentSeats])]

          console.log('🔍 Conflicting seats:', conflictingSeats)
          console.log('🔍 Additional conflicts:', additionalConflicts)
          console.log('🔍 Conflicting current seats:', conflictingCurrentSeats)
          console.log('🔍 All conflicting seats:', allConflictingSeats)

          if (allConflictingSeats.length > 0) {
            console.log('🔍 Setting requiresSeatSelection to true')
            setRequiresSeatSelection(true)
            setSelectedSeats([])
          } else {
            console.log('🔍 Setting requiresSeatSelection to false')
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
  }, [newStartDate, newEndDate, booking, bookingId])

  const handleStep1Submit = () => {
    if (!newStartDate || !newEndDate) {
      toast({
        title: "Missing Information",
        description: "Please select new start and end times",
        variant: "destructive"
      })
      return
    }

    // Check duration constraints
    const newDuration = (newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60)
    const durationIncrease = newDuration - originalDuration
    
    // Check if duration decreased
    if (newDuration < originalDuration) {
      toast({
        title: "Cannot Decrease Time",
        description: "You cannot reschedule to a shorter duration. Please select a longer or equal duration.",
        variant: "destructive"
      })
      return
    }

    // If duration increased, it must be at least 1 hour increase
    // If duration is same (0 change), that's allowed (just date/time change)
    if (durationIncrease > 0 && durationIncrease < 1) {
      toast({
        title: "Minimum Duration Increase",
        description: "If increasing duration, minimum increase is 1 hour. You can keep the same duration and just change date/time.",
        variant: "destructive"
      })
      return
    }

    if (requiresSeatSelection && selectedSeats.length !== booking.pax) {
      toast({
        title: "Seat Selection Required",
        description: `Please select ${booking.pax} seat${booking.pax > 1 ? 's' : ''} for the new time`,
        variant: "destructive"
      })
      return
    }

    setRescheduleData({
      newStartAt: newStartDate.toISOString(),
      newEndAt: newEndDate.toISOString(),
      seatNumbers: selectedSeats,
      originalStartAt: originalStartDate!.toISOString(),
      originalEndAt: originalEndDate!.toISOString(),
      originalDuration,
      newDuration,
      costDifference,
      needsPayment,
      creditAmount: creditAmount
    })

    // Check if payment is needed (after credits)
    const paymentRequired = finalCost > 0
    console.log('💰 Payment check:', { costDifference, creditAmount, finalCost, paymentRequired })

    if (paymentRequired) {
      // Payment needed - go to payment step
      setCurrentStep(2)
      updateStepInURL(2)
    } else {
      // No payment needed (credits cover full cost) - update booking directly and go to confirmation
      console.log('✅ Credits cover full cost, no payment needed. Confirming reschedule directly...')
      handlePaymentSuccess(undefined, {
        newStartAt: newStartDate!.toISOString(),
        newEndAt: newEndDate!.toISOString(),
        seatNumbers: selectedSeats,
        originalStartAt: originalStartDate!.toISOString(),
        originalEndAt: originalEndDate!.toISOString(),
        additionalCost: costDifference,
        additionalHours: newDuration - originalDuration,
        newDuration,
        originalDuration,
        costDifference,
        needsPayment: false, // Force false since credits cover it
        creditAmount: creditAmount
      })
    }
  }

  const handlePaymentComplete = async () => {
    // This function is no longer needed as payment confirmation is handled by useEffect
    // when user returns from payment gateway
    console.log('Payment completed, waiting for confirmation...')
  }

  const handlePaymentSuccess = async (paymentId?: string, customRescheduleData?: any) => {
    // Payment completed - now update booking with new schedule
    const dataToUse = customRescheduleData || rescheduleData
    setApiLoading(true)
    
    try {
      if (paymentId && dataToUse) {
        console.log('🔍 Payment completed, updating booking with new schedule...')

        // Update booking with new dates/times/seats AFTER payment confirmation
        const rescheduleDataWithCredits = {
          ...dataToUse,
          creditAmount: creditAmount // Make sure creditAmount is included
        };
        
        console.log('💳 Sending reschedule data with credits:', rescheduleDataWithCredits);
        
        const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/reschedule/confirm-payment`, {
          method: 'POST',
          body: JSON.stringify({
            bookingId,
            paymentId,
            rescheduleData: rescheduleDataWithCredits
          })
        })

        const result = await response.json()

        if (response.ok && result.success) {
          console.log('✅ Payment confirmed and booking updated with new schedule')
          setPaymentConfirmed(true)
          setCurrentStep(3)
          updateStepInURL(3)

          // Update local booking state with confirmed changes
          if (result.booking) {
            setBooking(result.booking)
            
            // Set confirmation data for display
            setConfirmationData({
              booking: result.booking,
              originalTimes: {
                startAt: result.originalTimes?.startAt || originalStartDate!.toISOString(),
                endAt: result.originalTimes?.endAt || originalEndDate!.toISOString()
              }
            })
          }

          toast({
            title: "Reschedule Completed!",
            description: "Your booking has been rescheduled and payment confirmed.",
          })
        } else {
          throw new Error(result.error || 'Failed to confirm reschedule')
        }
      } else {
        // No payment needed case - update booking directly (credits may cover full cost)
        console.log('✅ No payment needed, updating booking...')
        console.log('📤 Sending reschedule data:', {
          startAt: dataToUse?.newStartAt,
          endAt: dataToUse?.newEndAt,
          seatNumbers: dataToUse?.seatNumbers,
          rescheduleCost: dataToUse?.additionalCost || dataToUse?.costDifference || 0,
          creditAmount: dataToUse?.creditAmount || 0
        })
        
        const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/reschedule/booking/${bookingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            startAt: dataToUse?.newStartAt,
            endAt: dataToUse?.newEndAt,
            seatNumbers: dataToUse?.seatNumbers,
            rescheduleCost: dataToUse?.additionalCost || dataToUse?.costDifference || 0,  // Send actual cost!
            creditAmount: dataToUse?.creditAmount || 0  // Include credits!
          })
        })

        const result = await response.json()
        console.log('📥 Backend response:', result)
        console.log('📊 Response status:', response.status, response.ok)

        if (response.ok && result.success) {
          console.log('✅ Booking updated successfully:', result.booking)
          setPaymentConfirmed(true)
          setCurrentStep(3)
          updateStepInURL(3)

          if (result.booking) {
            setBooking(result.booking)
            console.log('📅 Updated booking times:', {
              startAt: result.booking.startAt,
              endAt: result.booking.endAt
            })
            
            // Set confirmation data for display
            setConfirmationData({
              booking: result.booking,
              originalTimes: {
                startAt: originalStartDate!.toISOString(),
                endAt: originalEndDate!.toISOString()
              }
            })
          }

          toast({
            title: "Reschedule Completed!",
            description: "Your booking has been rescheduled successfully.",
          })
        } else {
          throw new Error(result.error || 'Failed to reschedule booking')
        }
      }
    } catch (error: any) {
      console.error('❌ Error in handlePaymentSuccess:', error)
      toast({
        title: "Reschedule Failed",
        description: error.message || "Failed to reschedule booking.",
        variant: "destructive"
      })
    } finally {
      setApiLoading(false)
    }
  }

  const handlePaymentMethodChange = (method: 'payNow' | 'creditCard', newTotal: number) => {
    console.log('PaymentStep callback triggered:', method, 'newTotal:', newTotal, 'costDifference:', costDifference)
    setSelectedPaymentMethod(method)
    setPaymentTotal(newTotal)
  }

  const handleSeatSelectionChange = useCallback((selectedSeats: string[]) => {
    console.log('Seat selection changed:', selectedSeats)
    setSelectedSeats(selectedSeats)
  }, [])

  const handleRescheduleConfirm = async () => {
    if (!rescheduleData) return

    console.log('🔄 Starting reschedule process for booking:', bookingId)
    console.log('Reschedule data:', rescheduleData)
    console.log('Cost difference:', costDifference)
    console.log('Payment confirmed:', paymentConfirmed)

    setSubmitting(true)

    try {
      // If payment was already confirmed, just show success
      if (paymentConfirmed) {
        setRescheduleConfirmed(true)
        toast({
          title: "Booking Rescheduled Successfully!",
          description: `Your booking has been rescheduled from ${formatSingaporeDate(originalStartDate!)} to ${formatSingaporeDate(newStartDate!)}`,
        })

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
        return
      }

      // If no payment needed, reschedule directly
      console.log('💰 No payment needed, proceeding with direct reschedule')
      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/reschedule/booking/${bookingId}`, {
        method: 'PUT',
        body: JSON.stringify({
            startAt: rescheduleData.newStartAt,
            endAt: rescheduleData.newEndAt,
            seatNumbers: rescheduleData.seatNumbers,
          rescheduleCost: costDifference
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setRescheduleConfirmed(true)

        // Update booking data with new reschedule details
        if (result.booking) {
          setBooking(result.booking)
        }

        toast({
          title: "Booking Rescheduled Successfully!",
          description: `Your booking has been rescheduled from ${formatSingaporeDate(originalStartDate!)} to ${formatSingaporeDate(newStartDate!)}`,
        })

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      } else {
        throw new Error(result.error || 'Failed to reschedule booking')
      }
    } catch (error: any) {
      console.error('Error rescheduling booking:', error)
      toast({
        title: "Reschedule Failed",
        description: error.message || "Failed to reschedule booking",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Booking not found</p>
        </div>
      </div>
    )
  }

  return (
    <>
    <Navbar/>
      <div className="min-h-screen bg-gray-50 pt-24 sm:pt-24">

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reschedule Booking</h1>
            <p className="text-sm sm:text-base text-gray-600">Reference: {booking.bookingRef}</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${currentStep >= 1 ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Select Time</span>
              <span className="ml-1 font-medium sm:hidden">Time</span>
            </div>
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
            <div className={`flex items-center ${currentStep >= 2 ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${currentStep >= 2 ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Payment</span>
              <span className="ml-1 font-medium sm:hidden">Pay</span>
            </div>
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
            <div className={`flex items-center ${currentStep >= 3 ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${currentStep >= 3 ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Confirmation</span>
              <span className="ml-1 font-medium sm:hidden">Confirm</span>
            </div>
          </div>
        </div>

        {/* Step 1: Time Selection */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Current Booking Info */}


            {/* New Time Selection */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Select New Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <Label htmlFor="newStartDate" className="flex items-center gap-2">
                        New Start Time
                        {isLoadingShopHours && <Loader2 className="h-3 w-3 animate-spin text-orange-500" />}
                      </Label>
                      <DatePicker
                        id="newStartDate"
                        selected={newStartDate}
                        onChange={(date) => {
                          setNewStartDate(date)
                          // Auto-update end date if original duration exists
                          if (date && originalDuration > 0) {
                            const calculatedEndDate = new Date(date.getTime() + (originalDuration * 60 * 60 * 1000))
                            // Ensure end date is on the same day as start date
                            const startDay = new Date(date)
                            startDay.setHours(0, 0, 0, 0)
                            const endDay = new Date(calculatedEndDate)
                            endDay.setHours(0, 0, 0, 0)
                            
                            // If calculated end date is on a different day, set it to end of start day
                            if (!isSameDay(calculatedEndDate, date)) {
                              const endOfStartDay = endOfDay(date)
                              setNewEndDate(endOfStartDay)
                            } else {
                              setNewEndDate(calculatedEndDate)
                            }
                          }
                        }}
                        onSelect={handleDateSelect}
                        showTimeSelect
                        timeFormat="h:mm aa"
                        timeIntervals={15}
                        dateFormat="dd MMM yyyy, h:mm aa"
                        minDate={new Date()}
                        maxDate={maxBookingDate}
                        excludeDates={getExcludedDates()}
                        includeTimes={getAvailableTimes(newStartDate)}
                        className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
                        wrapperClassName="w-full"
                        placeholderText="Select new start time"
                      />
                    </div>

                    <div>
                      <Label htmlFor="newEndDate">New End Time</Label>
                      <DatePicker
                        id="newEndDate"
                        selected={newEndDate}
                        onChange={(date) => {
                          if (!date || !newStartDate) return
                          
                          // Ensure end date is on the same day as start date
                          if (!isSameDay(date, newStartDate)) {
                            // If user tries to select a different day, set to end of start day
                            const endOfStartDay = endOfDay(newStartDate)
                            setNewEndDate(endOfStartDay)
                          } else {
                            setNewEndDate(date)
                          }
                        }}
                        showTimeSelect
                        timeFormat="h:mm aa"
                        timeIntervals={15}
                        dateFormat="dd MMM yyyy, h:mm aa"
                        minDate={newStartDate || undefined}
                        maxDate={newStartDate ? endOfDay(newStartDate) : undefined}
                        excludeDates={getExcludedDates()}
                        includeTimes={getAvailableEndTimes(newStartDate)}
                        className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
                        wrapperClassName="w-full"
                        placeholderText="Select new end time"
                        disabled={!newStartDate}
                      />
                    </div>
                  </div>

                

                  {/* Duration Info usama*/}
                  {newStartDate && newEndDate && (
                    <Alert className={
                      (() => {
                        const durationIncrease = ((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60)) - originalDuration;
                        // Red if duration decreased OR if increased but less than 1 hour (partial increase)
                        if (durationIncrease < 0 || (durationIncrease > 0 && durationIncrease < 1)) {
                          return "border-red-500 bg-red-50";
                        }
                        // Green if duration is exactly same (just date/time change)
                        if (durationIncrease === 0) {
                          return "border-green-500 bg-green-50";
                        }
                        // Normal if duration increased by 1 hour or more
                        return "";
                      })()
                    }>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        New Duration: {((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60)).toFixed(2)} hours
                        <span className="block mt-1 text-gray-600 text-sm">
                          Original: {originalDuration.toFixed(2)} hours | Change: {(((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60)) - originalDuration).toFixed(2)} hours
                        </span>
                        {(() => {
                          const durationIncrease = ((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60)) - originalDuration;
                          if (durationIncrease === 0) {
                            return (
                              <span className="block mt-1 text-green-600">
                                ✓ Same duration - No additional cost
                              </span>
                            );
                          }
                          if (durationIncrease > 0 && durationIncrease < 1) {
                            return (
                              <span className="block mt-1 text-red-600">
                                ⚠ Minimum increase is 1 hour. Keep same duration or increase by at least 1 hour.
                              </span>
                            );
                          }
                          if (costDifference > 0) {
                            return (
                              <span className="block mt-1 text-orange-600">
                                Additional cost: SGD ${costDifference.toFixed(2)}
                              </span>
                            );
                          }
                          if (costDifference < 0) {
                            return (
                              <span className="block mt-1 text-red-600">
                                New duration cannot be lesser than original duration. Please cancel and rebook
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </AlertDescription>
                    </Alert>
                  )}
  {/* Minimum Duration Increase Notice */}
  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                    Rescheduling requires at least 1 hour.
                      </AlertDescription>
                  </Alert>
                  {/* Seat Availability Status */}
                  {checkingSeats && (
                    <div className="flex items-center text-sm text-orange-600">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Checking seat availability...
                    </div>
                  )}
   <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                      Reschedule can only be done once.
                      </AlertDescription>
                    </Alert>
                  {requiresSeatSelection && !checkingSeats && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Your original seats are not available for the new time. Please select different seats.
                      </AlertDescription>
                    </Alert>
                  )}

                  {!requiresSeatSelection && !checkingSeats && newStartDate && newEndDate && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Your original seats are available for the new time.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* No Seats Available Message */}
                  {!checkingSeats && newStartDate && newEndDate && availableSeats.length === 0 && (
                    <Alert className="border-red-500 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">
                        There is not enough seats for your current timeslot. Please change another timeslot.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Seat Selection */}
                  {!checkingSeats && newStartDate && newEndDate && availableSeats.length > 0 && (
                    <div>
                      <Label>Select Seats for New Time</Label>
                      <p className="text-sm text-gray-600 mb-3">
                        Choose {booking.pax} seat{booking.pax > 1 ? 's' : ''} for the new time.
                        <span className="ml-2 text-blue-600">
                          ({availableSeats.length} seats available)
                        </span>
                      </p>

                      {/* SeatPicker Container with proper constraints */}
                      <div className="w-full max-w-full overflow-hidden">
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <SeatPicker
                            layout={DEMO_LAYOUT}
                            tables={DEMO_TABLES}
                            labels={DEMO_LABELS}
                            bookedSeats={[...otherBookedSeats, ...conflictingCurrentSeats]}
                            overlays={OVERLAYS}
                            maxSeats={booking.pax}
                            onSelectionChange={handleSeatSelectionChange}
                            initialSelectedSeats={selectedSeats}
                          />
                        </div>
                      </div>

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

                  {/* Credit Selection - Show in Step 1 if there's additional cost */}
                  {costDifference > 0 && user?.id && (
                    <div className="border-t pt-4 mt-6">
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                        <div className="space-y-1 text-sm text-orange-700">
                          <div className="flex justify-between">
                            <span>Additional cost:</span>
                            <span className="font-medium">${costDifference.toFixed(2)}</span>
                          </div>
                          {creditAmount > 0 && (
                            <>
                              <div className="flex justify-between text-green-700">
                                <span>Credits applied:</span>
                                <span className="font-medium">-${creditAmount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between font-bold text-orange-800 pt-2 border-t border-orange-300">
                                <span>Amount to pay:</span>
                                <span>${finalCost.toFixed(2)}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <EntitlementTabs
                        mode="credit"
                        onChange={(data) => {
                          console.log('Credit data changed:', data)
                          if (data && data.type === 'credit' && data.creditAmount !== undefined) {
                            setCreditAmount(data.creditAmount)
                            // Save to localStorage for payment return
                            localStorage.setItem(`reschedule_credit_${bookingId}`, data.creditAmount.toString())
                            console.log('💾 Saved credit amount to localStorage:', data.creditAmount)
                          }
                        }}
                        onModeChange={() => {}} // Not needed for reschedule
                        userId={user.id}
                        bookingAmount={costDifference}
                        bookingDuration={newStartDate && newEndDate ? {
                          startAt: newStartDate.toISOString(),
                          endAt: newEndDate.toISOString(),
                          durationHours: (newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60)
                        } : undefined}
                        userRole={booking?.memberType || 'MEMBER'}
                        locationPrice={booking?.memberType === 'STUDENT' ? 4.00 : booking?.memberType === 'TUTOR' ? 6.00 : 5.00}
                        totalPeople={booking?.pax || 1}
                        showOnlyCredit={true}
                      />
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
                      onClick={handleStep1Submit}
                      disabled={
                        submitting ||
                        apiLoading ||
                        checkingSeats ||
                        !newStartDate ||
                        !newEndDate ||
                        (requiresSeatSelection && selectedSeats.length !== booking.pax) ||
                        costDifference < 0 ||
                        // Disable if times haven't changed from original
                        (newStartDate?.getTime() === originalStartDate?.getTime() && 
                         newEndDate?.getTime() === originalEndDate?.getTime()) ||
                        // Disable if duration decreased
                        (newStartDate && newEndDate && 
                         ((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60)) < originalDuration) ||
                        // Disable if increased but less than 1 hour (partial increase not allowed)
                        // Allow if duration is same (0 increase) - just date/time change
                        (newStartDate && newEndDate && 
                         (() => {
                           const durationIncrease = ((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60)) - originalDuration;
                           return durationIncrease > 0 && durationIncrease < 1;
                         })())
                      }
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {submitting || apiLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {finalCost > 0 ? 'Processing...' : 'Confirming Reschedule...'}
                        </>
                      ) : (
                        finalCost > 0 ? 'Continue to Payment' : 'Confirm Reschedule'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Current Booking
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{booking.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{formatSingaporeDate(originalStartDate!)} - {formatSingaporeDate(originalEndDate!)}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-500" />
                    <span>
                      {[
                        booking.students > 0 && `${booking.students} Student${booking.students > 1 ? 's' : ''}`,
                        booking.members > 0 && `${booking.members} Member${booking.members > 1 ? 's' : ''}`,
                        booking.tutors > 0 && `${booking.tutors} Tutor${booking.tutors > 1 ? 's' : ''}`
                      ].filter(Boolean).join(', ') || `${booking.pax} people`}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500">Seats: {booking.seatNumbers?.join(', ') || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500">Duration: {originalDuration.toFixed(1)} hours</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {currentStep === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Payment Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Payment Required
                  </CardTitle>
                </CardHeader>
                <CardContent>

                  <PaymentStep
                    subtotal={costDifference}
                    total={finalCost}
                    discountAmount={creditAmount}
                    appliedVoucher={null}
                    selectedPackage={undefined}
                    customer={{
                      name: userInfo.name || booking?.bookedForEmails?.[0]?.split('@')[0] || 'User',
                      email: userInfo.email || booking?.bookedForEmails?.[0] || 'user@example.com',
                      phone: userInfo.phone || booking?.phone || ''
                    }}
                    bookingId={bookingId}
                    onBack={() => {
                      setCurrentStep(1)
                      updateStepInURL(1)
                    }}
                    onComplete={handlePaymentComplete}
                    onPaymentMethodChange={handlePaymentMethodChange}
                    onCreateBooking={async () => {
                      // For reschedule, don't update booking before payment
                      // Just return bookingId so payment can be created
                      // Booking will be updated AFTER payment is confirmed
                      console.log('💳 Creating payment for reschedule, booking will update after payment confirmation')
                      return bookingId
                    }}
                    onBookingCreated={(bookingId) => {
                      console.log('Reschedule payment initiated for booking:', bookingId)
                    }}
                    isReschedule={true}
                    rescheduleData={rescheduleData ? {
                      originalStartAt: originalStartDate!.toISOString(),
                      originalEndAt: originalEndDate!.toISOString(),
                      newStartAt: rescheduleData.newStartAt,
                      newEndAt: rescheduleData.newEndAt,
                      seatNumbers: rescheduleData.seatNumbers,
                      additionalHours: (rescheduleData.newDuration - rescheduleData.originalDuration),
                      additionalCost: costDifference,
                      creditAmount: creditAmount
                    } : undefined}
                    isLoading={apiLoading}
                  />
                </CardContent>
              </Card>
            </div>
            {/* Reschedule Summary */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Reschedule Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-800">Booking Reference:</span>
                    <span className="ml-2 text-sm text-gray-600">{booking.bookingRef}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">{booking.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">
                      {[
                        booking.students > 0 && `${booking.students} Student${booking.students > 1 ? 's' : ''}`,
                        booking.members > 0 && `${booking.members} Member${booking.members > 1 ? 's' : ''}`,
                        booking.tutors > 0 && `${booking.tutors} Tutor${booking.tutors > 1 ? 's' : ''}`
                      ].filter(Boolean).join(', ') || `${booking.pax} people`}
                    </span>
                  </div>

                  <div className="border-t pt-4">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium text-gray-800">Original Duration:</span>
                        <span className="ml-2 text-gray-600">{originalDuration.toFixed(1)} hours</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-800">New Duration:</span>
                        <span className="ml-2 text-gray-600">{((newEndDate!.getTime() - newStartDate!.getTime()) / (1000 * 60 * 60)).toFixed(1)} hours</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-800">Time Change:</span>
                        <span className="ml-2 text-orange-600 font-medium">+{((newEndDate!.getTime() - newStartDate!.getTime()) / (1000 * 60 * 60) - originalDuration).toFixed(1)} hours</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium text-gray-800">Original Time:</span>
                        <div className="text-xs text-gray-600 mt-1">{formatSingaporeDate(originalStartDate!)} - {formatSingaporeDate(originalEndDate!)}</div>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-800">New Time:</span>
                        <div className="text-xs text-gray-600 mt-1">{formatSingaporeDate(newStartDate!)} - {formatSingaporeDate(newEndDate!)}</div>
                      </div>
                      {requiresSeatSelection ? (
                        <>
                          <div className="text-sm">
                            <span className="font-medium text-gray-800">Original Seats:</span>
                            <div className="text-xs text-gray-600 mt-1">{booking.seatNumbers?.join(', ') || 'N/A'}</div>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-800">New Seats:</span>
                            <div className="text-xs text-gray-600 mt-1">
                              {rescheduleData.seatNumbers?.join(', ') || 'Not selected'}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm">
                          <span className="font-medium text-gray-800">Seats:</span>
                          <div className="text-xs text-gray-600 mt-1">{booking.seatNumbers?.join(', ') || 'N/A'}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-4 bg-orange-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-orange-800 mb-2">Payment Breakdown</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-orange-700 text-sm font-medium">Subtotal:</span>
                        <span className="text-orange-700 text-sm font-medium">SGD ${costDifference.toFixed(2)}</span>
                      </div>
                      {creditAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-green-700 text-sm font-medium">Credits Applied:</span>
                          <span className="text-green-700 text-sm font-medium">- SGD ${creditAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {(() => {
                        const transactionFee = selectedPaymentMethod === 'creditCard'
                          ? finalCost * (feeSettings.creditCardFeePercentage / 100)
                          : finalCost > 0 && finalCost < 10
                            ? feeSettings.paynowFee
                            : 0

                        if (transactionFee > 0) {
                          return (
                            <div className="flex justify-between">
                              <span className="text-orange-700 text-sm font-medium">
                                {selectedPaymentMethod === 'creditCard' ? `Credit Card Fee (${feeSettings.creditCardFeePercentage}%)` : 'PayNow Transaction Fee'}
                              </span>
                              <span className="text-orange-700 text-sm font-medium">SGD ${formatCurrency(transactionFee)}</span>
                            </div>
                          )
                        }
                        return null
                      })()}
                      <div className="flex justify-between font-medium border-t border-orange-200 pt-1 mt-2">
                        <span className="text-orange-800 text-sm font-medium">Total payable:</span>
                        <span className="text-orange-900 text-sm font-medium">
                          SGD ${(() => {
                            const transactionFee = selectedPaymentMethod === 'creditCard'
                              ? finalCost * (feeSettings.creditCardFeePercentage / 100)
                              : finalCost > 0 && finalCost < 10
                                ? feeSettings.paynowFee
                                : 0
                            return formatCurrency(finalCost + transactionFee)
                          })()}
                        </span>
                      </div>

                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>


          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && (
          <div className="max-w-2xl mx-auto px-4 sm:px-0">
            {apiLoading ? (
              <Card>
                <CardContent className="space-y-6 py-8">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-orange-600" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Updating Booking...</h3>
                    <p className="text-gray-600">Please wait while we update your booking details.</p>
                  </div>
                </CardContent>
              </Card>
            ) : paymentError ? (
              // Payment failed/cancelled - show error
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <XCircle className="h-5 w-5 mr-2 text-red-600" />
                    Reschedule Failed
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
                        <div>Current Time: {formatSingaporeDate(
                          originalStartDate?.toISOString() || booking?.startAt || ''
                        )} - {formatSingaporeDate(
                          originalEndDate?.toISOString() || booking?.endAt || ''
                        )}</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center space-y-3">
                    <p className="text-gray-600">
                      Your original booking remains unchanged. You can try rescheduling again.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={() => {
                          setPaymentError(null)
                          setCurrentStep(1)
                          updateStepInURL(1)
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
            ) : (confirmationData || booking) ? (
              // Payment successful - show success
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    Reschedule Confirmed
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800 mb-2">Booking Rescheduled Successfully</h3>
                  <div className="space-y-1 text-sm text-green-700">
                    <div>Reference: {(confirmationData?.booking || booking)?.bookingRef}</div>
                    <div>Location: {(confirmationData?.booking || booking)?.location}</div>
                    <div>Original: {formatSingaporeDate(
                      confirmationData?.originalTimes?.startAt || originalStartDate?.toISOString() || ''
                    )} - {formatSingaporeDate(
                      confirmationData?.originalTimes?.endAt || originalEndDate?.toISOString() || ''
                    )}</div>
                    <div>New: {formatSingaporeDate(
                      confirmationData?.booking?.startAt || booking?.startAt || newStartDate?.toISOString() || ''
                    )} - {formatSingaporeDate(
                      confirmationData?.booking?.endAt || booking?.endAt || newEndDate?.toISOString() || ''
                    )}</div>
                  </div>
                </div>

                <div className="text-center">
                  {/* <p className="text-gray-600 mb-4">
                    Your booking has been successfully rescheduled. You will receive a confirmation email shortly.
                  </p> */}
                  <Button
                    onClick={() => router.push('/dashboard')}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
            ) : null}
          </div>
        )}
      </div>
    </div>
    <FooterSection/>
    </>
  )
}
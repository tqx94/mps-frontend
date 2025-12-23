'use client'

import { SeatPicker, SeatMeta, OverlayMeta, TableMeta, LabelMeta } from '@/components/book-now-sections/SeatPicker'
import { EntitlementTabs } from '@/components/book-now-sections/EntitlementTabs'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { isSameDay, endOfDay, parseISO, addMonths, addDays, setHours, setMinutes } from 'date-fns'
import { MapPin, Clock, Users, Calendar, CreditCard, Shield, AlertCircle, AlertTriangle, Ticket, Package, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

import { PeopleSelector } from '@/components/PeopleSelector'
import Navbar from '@/components/Navbar'
import { FooterSection } from '@/components/landing-page-sections/FooterSection'

import { StudentValidation } from '@/components/book-now-sections/StudentValidation'
import type { StudentValidationStatus } from '@/components/book-now-sections/StudentValidation'

import PaymentStep from '@/components/book-now/PaymentStep'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useAuth } from '@/hooks/useAuth'
import { PromoCode } from '@/lib/promoCodeService'
import { getUserPackages, UserPackage } from '@/lib/services/packageService'
import { getAllPricingForLocation } from '@/lib/pricingService'
import { getUserProfile, UserProfile } from '@/lib/userProfileService'
import {
  getCurrentSingaporeTime,
  getSingaporeTimeConstraints,
  toDatePickerDate,
  fromDatePickerToUTC,
  formatSingaporeDate,
  formatSingaporeDateOnly,
  formatSingaporeTimeOnly,
  formatBookingDateRange,
  toSingaporeTime
} from '@/lib/timezoneUtils'
import { formatCurrency } from '@/lib/paymentUtils'
import { getOperatingHours, getClosureDates, type OperatingHours, type ClosureDate } from '@/lib/shopHoursService'
import { authenticatedFetch } from '@/lib/apiClient'


const locations = [
  { id: 'kovan', name: 'Kovan', address: 'Blk 208 Hougang St 21 #01-201 S 530208' }
]

// Dynamic pricing will be loaded from database

export default function BookingClient() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, userId, isLoggedIn, loading: isLoadingAuth, databaseUser } = useAuth()
  const [location, setLocation] = useState<string>('kovan')
  const [entitlementMode, setEntitlementMode] = useState<'package' | 'promo' | 'credit'>('package')
  const [selectedPackage, setSelectedPackage] = useState<string>('')
  const [promoCode, setPromoCode] = useState<string>('')
  const [promoValid, setPromoValid] = useState<boolean>(false)

  const [promoCodeInfo, setPromoCodeInfo] = useState<{
    type: string
    id: string
    discountAmount: number
    finalAmount: number
    promoCode?: PromoCode
  } | null>(null)
  const [creditInfo, setCreditInfo] = useState<{
    type: string
    id: string
    discountAmount: number
    finalAmount: number
    creditAmount: number
  } | null>(null)

  // Dynamic pricing state
  const [pricing, setPricing] = useState({
    student: { oneHourRate: 4.00, overOneHourRate: 3.00 },
    member: { oneHourRate: 5.00, overOneHourRate: 4.00 },
    tutor: { oneHourRate: 6.00, overOneHourRate: 5.00 }
  })

  // Dynamic payment fee settings state
  const [paymentFeeSettings, setPaymentFeeSettings] = useState({
    paynowFee: 0.20,
    creditCardFeePercentage: 5.0
  })

  // Load pricing from database (single API call)
  const loadPricing = async () => {
    try {
      const allPricing = await getAllPricingForLocation('Kovan')
      setPricing(allPricing)
    } catch (error) {
      console.error('Error loading pricing:', error)
      // Keep fallback pricing if database fetch fails
    }
  }

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
      // Keep fallback values if database fetch fails
    }
  }

  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [bookedSeats, setBookedSeats] = useState<string[]>([])
  const [isLoadingSeats, setIsLoadingSeats] = useState(false)

  // Shop hours state
  const [operatingHours, setOperatingHours] = useState<OperatingHours[]>([])
  const [closureDates, setClosureDates] = useState<ClosureDate[]>([])
  const [isLoadingShopHours, setIsLoadingShopHours] = useState(false)


  const [studentsValidated, setStudentsValidated] = useState(false)
  const [validatedStudents, setValidatedStudents] = useState<StudentValidationStatus[]>([])
  const [freshUserProfile, setFreshUserProfile] = useState<UserProfile | null>(null)
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(false)

  // Fetch fresh user profile data
  const loadFreshUserProfile = async () => {
    if (!userId) return

    setIsLoadingUserProfile(true)
    try {

      const profile = await getUserProfile(userId)
      if (profile) {

        setFreshUserProfile(profile)
      } else {
        console.log('❌ Failed to load fresh user profile')
      }
    } catch (error) {
      console.error('❌ Error loading fresh user profile:', error)
    } finally {
      setIsLoadingUserProfile(false)
    }
  }

  useEffect(() => {
    if (searchParams.get('step') === '3') {
      setBookingStep(3)
      // Scroll to top when moving to confirmation step from URL
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    loadPricing() // Load dynamic pricing on component mount
    loadPaymentFeeSettings() // Load dynamic payment fees on component mount
    loadFreshUserProfile() // Load fresh user profile
  }, [searchParams, userId])

  // Load shop hours when location changes
  useEffect(() => {
    if (location && locations.length > 0) {
      loadShopHours()
    }
  }, [location, locations])

  // Load shop hours and closure dates
  const loadShopHours = async () => {
    if (!location) return

    setIsLoadingShopHours(true)
    try {
      const locationData = locations.find(loc => loc.id === location)
      const locationName = locationData?.name || 'Kovan'

      console.log(`Fetching shop hours for: ${locationName}`)

      const [hours, closures] = await Promise.all([
        getOperatingHours(locationName),
        getClosureDates(locationName)
      ])
      setOperatingHours(hours)
      setClosureDates(closures)
    } catch (error) {
      console.error('Error loading shop hours:', error)
    } finally {
      setIsLoadingShopHours(false)
    }
  }



  const DEMO_LAYOUT: SeatMeta[] = [
    { id: 'S1', x: 120, y: 80, shape: 'circle', size: 20 },
    { id: 'S2', x: 120, y: 160, shape: 'circle', size: 20 },
    { id: 'S3', x: 120, y: 260, shape: 'circle', size: 20 },
    { id: 'S4', x: 120, y: 310, shape: 'circle', size: 20 },
    { id: 'S5', x: 120, y: 400, shape: 'circle', size: 20 },
    { id: 'S6', x: 120, y: 450, shape: 'circle', size: 20 },

    // ← Right column (near T5–T9)
    { id: 'S7', x: 300, y: 90, shape: 'circle', size: 20 },
    { id: 'S8', x: 300, y: 170, shape: 'circle', size: 20 },
    { id: 'S9', x: 300, y: 220, shape: 'circle', size: 20 },
    { id: 'S12', x: 300, y: 400, shape: 'circle', size: 20 },
    { id: 'S13', x: 300, y: 460, shape: 'circle', size: 20 },

    // ← Center column (near T7 & bottom T10/T10a)
    { id: 'S10', x: 260, y: 280, shape: 'circle', size: 20 },
    { id: 'S11', x: 260, y: 330, shape: 'circle', size: 20 },
    { id: 'S14', x: 260, y: 520, shape: 'circle', size: 20 },
    { id: 'S15', x: 260, y: 570, shape: 'circle', size: 20 },
  ]
  const DEMO_TABLES: TableMeta[] = [
    // Left‐column rectangles (T1, T2, T4)
    { id: 'T1', shape: 'rect', x: 80, y: 80, width: 40, height: 80 },
    { id: 'T2', shape: 'rect', x: 80, y: 160, width: 40, height: 80 },
    { id: 'T4', shape: 'rect', x: 80, y: 425, width: 40, height: 100 },

    // Left‐column circle (T3)
    { id: 'T3', shape: 'circle', x: 60, y: 285, radius: 40 },

    // Right‐column rectangles (T5, T6, T8, T9)
    { id: 'T5', shape: 'rect', x: 340, y: 90, width: 40, height: 80 },
    { id: 'T6', shape: 'rect', x: 340, y: 195, width: 40, height: 100 },
    { id: 'T8', shape: 'rect', x: 340, y: 400, width: 40, height: 60 },
    { id: 'T9', shape: 'rect', x: 340, y: 460, width: 40, height: 60 },

    // Right‐column circle (T7)
    { id: 'T7', shape: 'circle', x: 320, y: 300, radius: 40 },

    // Bottom‐center rectangle (T10 & T10a)
    { id: 'T10', shape: 'rect', x: 320, y: 520, width: 100, height: 40 },
    { id: 'T10a', shape: 'rect', x: 320, y: 560, width: 100, height: 40 },
  ]

  const DEMO_LABELS: LabelMeta[] = [
    // seats number tag
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

    // …and so on S4–S15…

    // tables
    { id: 'lbl-T1', text: '', x: 80, y: 80 },
    { id: 'lbl-T2', text: '', x: 80, y: 160 },
    { id: 'lbl-T3', text: '', x: 60, y: 285 },
    { id: 'lbl-T4', text: '', x: 80, y: 425 },
    { id: 'lbl-T5', text: '', x: 340, y: 90 },
    { id: 'lbl-T6', text: '', x: 340, y: 195 },
    { id: 'lbl-T7', text: '', x: 320, y: 300 },
    { id: 'lbl-T8', text: '', x: 340, y: 400 },
    { id: 'lbl-T9', text: '', x: 340, y: 460 },
    { id: 'lbl-T10', text: '', x: 320, y: 520 },
    { id: 'lbl-T10a', text: '', x: 320, y: 560 },
    // …etc for T4–T10a…
  ]

  const OVERLAYS: OverlayMeta[] = [
    { id: 'door', src: '/seat_booking_img/door.png', x: 0, y: 0, width: 60, height: 50 },
    { id: 'legend', src: '/seat_booking_img/legend_img.png', x: 135, y: 0, width: 150, height: 100 },
    { id: 'pantry', src: '/seat_booking_img/pantry.png', x: 0, y: 515, width: 100, height: 80 },
    { id: 'toilet', src: '/seat_booking_img/toilet.png', x: 100, y: 535, width: 80, height: 60 },
    // left-wall monitors
    { id: 'monitor_left1', src: '/seat_booking_img/monitor_L.png', x: 20, y: 60, width: 16, height: 24 },
    { id: 'monitor_left2', src: '/seat_booking_img/monitor_L.png', x: 20, y: 140, width: 16, height: 24 },
    { id: 'monitor_left3', src: '/seat_booking_img/monitor_L.png', x: 20, y: 415, width: 16, height: 24 },

    // right-wall monitors
    { id: 'monitor_right1', src: '/seat_booking_img/monitor_R.png', x: 365, y: 185, width: 16, height: 24 },
    { id: 'monitor_right2', src: '/seat_booking_img/monitor_R.png', x: 360, y: 390, width: 16, height: 24 },
    { id: 'monitor_right3', src: '/seat_booking_img/monitor_R.png', x: 380, y: 520, width: 16, height: 24 },
    // and so on for each monitor, smiley‐face PNG, etc.
  ]
  // Add state for breakdown
  const [peopleBreakdown, setPeopleBreakdown] = useState<{
    coWorkers: number
    coTutors: number
    coStudents: number
    total: number
  }>({
    coWorkers: 1,
    coTutors: 0,
    coStudents: 0,
    total: 1
  })

  // Determine if student verification is needed using fresh API data
  const isStudentAccount = freshUserProfile?.memberType === 'STUDENT'
  const isAdminAccount = freshUserProfile?.memberType === 'ADMIN'
  const isBookingForSingleStudent = peopleBreakdown.coStudents === 1
  const isVerifiedStudent = freshUserProfile?.studentVerificationStatus === 'VERIFIED'

  // Calculate how many students need verification
  // If current user is ADMIN, no verification is needed
  // If current user is a verified student, they don't need verification
  // So we only need to verify the additional students
  const studentsNeedingVerification = isAdminAccount
    ? 0  // Admin accounts don't need student verification
    : isVerifiedStudent
      ? Math.max(0, peopleBreakdown.coStudents - 1)  // Current user is verified, so verify others
      : peopleBreakdown.coStudents  // Current user is not verified, so verify all

  const needsStudentVerification = studentsNeedingVerification > 0

  // Check if tutor has more than 4 students or more than 4 workers (not allowed)
  const hasTutorWithTooManyPeople = peopleBreakdown.coTutors === 1 && (peopleBreakdown.coStudents > 4 || peopleBreakdown.coWorkers > 4)

  // Debug console logs


  // Auto-validate if student account is booking for only themselves or if user is admin
  useEffect(() => {


    if (isAdminAccount) {

      setStudentsValidated(true)
    } else if (isVerifiedStudent && peopleBreakdown.coStudents === 1) {

      setStudentsValidated(true)
    } else if (peopleBreakdown.coStudents === 0) {

      setStudentsValidated(false)
    } else if (studentsNeedingVerification === 0) {

      setStudentsValidated(true)
    } else {

      setStudentsValidated(false)
    }
  }, [isAdminAccount, isStudentAccount, isVerifiedStudent, peopleBreakdown.coStudents, studentsNeedingVerification])

  // Auto-fill customer information when fresh user profile is loaded
  useEffect(() => {
    if (freshUserProfile && !isLoadingUserProfile) {
      console.log('🔄 Auto-filling customer information with fresh user profile:', freshUserProfile)

      // Auto-fill customer name
      if (freshUserProfile.firstName && freshUserProfile.lastName) {
        const fullName = `${freshUserProfile.firstName} ${freshUserProfile.lastName}`
        setCustomerName(fullName)

      }

      // Auto-fill customer email
      if (freshUserProfile.email) {
        setCustomerEmail(freshUserProfile.email)

      }

      // Auto-fill customer phone
      if (freshUserProfile.contactNumber) {
        setCustomerPhone(freshUserProfile.contactNumber)

      }
    }
  }, [freshUserProfile, isLoadingUserProfile])




  const [people, setPeople] = useState<number>(1)

  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  const [bookingDuration, setBookingDuration] = useState<{
    startAt: string;
    endAt: string;
    durationHours: number;
  } | undefined>(undefined)

  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [bookingStep, setBookingStep] = useState(1)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [confirmationStatus, setConfirmationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [confirmationError, setConfirmationError] = useState<string | null>(null)
  const [isOver24Hours, setIsOver24Hours] = useState(false)

  const [confirmationHeadingError, setConfirmationHeadingError] = useState<string | null>(null)
  const [confirmedBookingData, setConfirmedBookingData] = useState<any>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'payNow' | 'creditCard'>('payNow')
  const [finalTotal, setFinalTotal] = useState(0)

  const [userPackages, setUserPackages] = useState<UserPackage[]>([])
  const [isLoadingPackages, setIsLoadingPackages] = useState(false)

  useEffect(() => {
    try {
      const userString = localStorage.getItem("database_user");
      if (userString) {
        const userData = JSON.parse(userString);
        const fullName = `${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`.trim();
        setCustomerName(fullName || "");
        setCustomerEmail(userData.email || "");
        setCustomerPhone(userData.phone || "");
      }
    } catch (error) {
      console.error("Error parsing database_user:", error);
    }
  }, []);


  const loadUserPackages = useCallback(async () => {
    if (!userId) return

    setIsLoadingPackages(true)
    try {
      const packages = await getUserPackages(userId)
      const completedPackages = packages.filter((pkg: UserPackage) => pkg.paymentStatus === 'COMPLETED')
      setUserPackages(completedPackages)
    } catch (error) {
      console.error('Error loading user packages:', error)
    } finally {
      setIsLoadingPackages(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      loadUserPackages()
    }
  }, [userId, loadUserPackages])

  // Auto-select package from URL parameter when packages are loaded
  useEffect(() => {
    const packageParam = searchParams.get('package')
    if (packageParam && userPackages.length > 0 && !selectedPackage) {
      const decodedPackageName = decodeURIComponent(packageParam)

      // Try exact match first
      let foundPackage = userPackages.find(pkg => pkg.packageName === decodedPackageName)

      // If no exact match, try case-insensitive match
      if (!foundPackage) {
        foundPackage = userPackages.find(pkg =>
          pkg.packageName.toLowerCase() === decodedPackageName.toLowerCase()
        )
      }

      // If still no match, try partial match
      if (!foundPackage) {
        foundPackage = userPackages.find(pkg =>
          pkg.packageName.toLowerCase().includes(decodedPackageName.toLowerCase()) ||
          decodedPackageName.toLowerCase().includes(pkg.packageName.toLowerCase())
        )
      }

      if (foundPackage) {
        console.log('✅ Auto-selecting package from URL:', foundPackage.packageName)
        setSelectedPackage(foundPackage.id)
        setEntitlementMode('package')

        toast({
          title: "Package Selected",
          description: `${foundPackage.packageName} has been automatically selected for your booking.`,
        })
      } else {

        toast({
          title: "Package Not Found",
          description: `You don't have the "${decodedPackageName}" package. Please purchase it first or select a different package.`,
          variant: "destructive"
        })
      }
    }
  }, [searchParams, userPackages, selectedPackage, toast])

  useEffect(() => {
    if (startDate && endDate) {
      // Convert local time to UTC for database storage
      const startAt = fromDatePickerToUTC(startDate);
      const endAt = fromDatePickerToUTC(endDate);
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);

      setBookingDuration({
        startAt,
        endAt,
        durationHours
      });
    } else {
      setBookingDuration(undefined);
    }
  }, [startDate, endDate])

  const { minTime, maxTime } = getSingaporeTimeConstraints()
  // minDate should be TODAY (not 30 minutes from now) to allow same-day booking
  // The 30-minute buffer is enforced by getStartTimeConstraints() for time selection
  const minDate = new Date() // Allow selecting today's date
  minDate.setHours(0, 0, 0, 0) // Set to start of day
  const maxBookingDate = maxTime

  const isPaymentFailed = useCallback((status: string | null) => {
    return status === 'canceled' || status === 'cancelled' || status === 'failed' ||
      status === 'declined' || status === 'rejected' || status === 'expired'
  }, [])

  const confirmBooking = useCallback(async () => {
    try {
      setConfirmationStatus('loading')
      setConfirmationError(null)
      setConfirmationHeadingError(null)

      const currentBooking = JSON.parse(localStorage.getItem('currentBooking') || '{}')
      if (currentBooking.confirmedPayment && currentBooking.status === 'confirmed') {
        setConfirmedBookingData(currentBooking)
        setConfirmationStatus('success')
        return
      }

      const paymentStatus = searchParams.get('status')
      if (isPaymentFailed(paymentStatus)) {
        setConfirmationStatus('error')
        setConfirmationError('Payment was not completed. Your booking has not been confirmed.')
        return
      }

      const urlBookingId = searchParams.get('bookingId')
      const currentBookingId = urlBookingId || bookingId

      if (!currentBookingId) {
        throw new Error('No booking ID found for confirmation')
      }

      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/booking/confirmBooking`, {
        method: 'POST',
        body: JSON.stringify({
          bookingId: currentBookingId
        })
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw {
          heading: errorData.error || "Booking Error",
          message: errorData.message || "Failed to confirm booking"
        };
      }


      const result = await response.json()

      // Store the confirmed booking data
      setConfirmedBookingData(result.booking)

      // Update local storage with confirmed booking
      const updatedBooking = { ...currentBooking, confirmedPayment: true, status: 'confirmed' }
      localStorage.setItem('currentBooking', JSON.stringify(updatedBooking))

      setConfirmationStatus('success')

    } catch (error: any) {
      console.error(
        "Error confirming booking:",
        error?.message || error
      );

      setConfirmationStatus("error");
      setConfirmationError(error?.message || "Failed to confirm booking");
      setConfirmationHeadingError(error?.heading || "Failed to confirm booking");
    }

  }, [searchParams, bookingId])

  // Handle booking confirmation when step 3 loads
  useEffect(() => {
    if (bookingStep === 3) {
      // Check if payment was canceled or failed before attempting confirmation
      const paymentStatus = searchParams.get('status')
      if (isPaymentFailed(paymentStatus)) {
        setConfirmationStatus('error')
        setConfirmationError('Payment was not completed. Your booking has not been confirmed.')
        return
      }
      confirmBooking()
    }
  }, [bookingStep, searchParams, bookingId])



  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoadingAuth && !user) {
      router.push('/login')
    }
  }, [user, isLoadingAuth, router])

  // useEffect(() => {
  //   if (user) {
  //     const metadata = user.user_metadata as any
  //     if (metadata) {
  //       if (!customerName) {
  //         setCustomerName(`${user.firstName || ''} ${user.lastName || ''}`.trim())
  //       }
  //       if (!customerEmail) {
  //         setCustomerEmail(user.email || '')
  //       }
  //       if (!customerPhone) {
  //         setCustomerPhone(user.contactNumber || '')
  //       }
  //     }
  //   }
  // }, [user, customerName, customerEmail, customerPhone])

  useEffect(() => {
    const locStr = searchParams.get('location')
    const peopleParam = searchParams.get('people')
    const startStr = searchParams.get('start')
    const endStr = searchParams.get('end')
    const cW = parseInt(searchParams.get('coWorkers') ?? '1', 10)
    const cT = parseInt(searchParams.get('coTutors') ?? '0', 10)
    const cS = parseInt(searchParams.get('coStudents') ?? '0', 10)
    const total = cW + cT + cS
    const packageParam = searchParams.get('package')

    // Set location with a small delay to ensure Select component is ready
    if (locStr) {
      setLocation(locStr)
      // Force a re-render if needed
      setTimeout(() => {
        setLocation(locStr)
      }, 100)
    }

    // set booking fields
    if (peopleParam) setPeople(parseInt(peopleParam))
    if (locStr) setLocation(locStr)
    if (startStr) setStartDate(parseISO(startStr))
    if (endStr) setEndDate(parseISO(endStr))

    setPeopleBreakdown({ coWorkers: cW, coTutors: cT, coStudents: cS, total })
    setPeople(total)

    // Auto-select package if package parameter is in URL
    if (packageParam) {

      setEntitlementMode('package')
    }
  }, [searchParams])


  const handlePeopleChange = (newPeople: number) => {
    setPeople(newPeople)
    if (peopleBreakdown.total !== newPeople) {
      setPeopleBreakdown(prev => ({
        ...prev,
        total: newPeople,
        coWorkers: Math.max(1, newPeople - prev.coTutors - prev.coStudents)
      }))
    }
  }

  const handleBreakdownChange = (newBreakdown: typeof peopleBreakdown) => {
    setPeopleBreakdown(newBreakdown)
    if (people !== newBreakdown.total) {
      setPeople(newBreakdown.total)
    }
  }

  // Helper function to STRICTLY enforce 15-minute intervals
  const enforceStrict15Minutes = (date: Date | null): Date | null => {
    if (!date) return null;

    const strictDate = new Date(date);
    const minutes = strictDate.getMinutes();
    const remainder = minutes % 15;

    // Reject any time that's not on a 15-minute boundary
    if (remainder !== 0) {
      // Always round DOWN to the previous 15-minute mark for strict enforcement
      const validMinutes = minutes - remainder;
      strictDate.setMinutes(validMinutes);
      strictDate.setSeconds(0);
      strictDate.setMilliseconds(0);

      toast({
        title: "Invalid Time",
        description: `Only 15-minute intervals allowed. Changed to ${strictDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        variant: "destructive"
      });
    } else {
      // Time is already on 15-minute boundary, just clear seconds/milliseconds
      strictDate.setSeconds(0);
      strictDate.setMilliseconds(0);
    }

    return strictDate;
  };

  // Helper function to get optimal start time based on shop hours
  const getOptimalStartTime = (selectedDate: Date): Date => {
    const dayOfWeek = selectedDate.getDay()
    
    // Get shop hours for the selected day
    const dayHours = operatingHours.find(h => h.dayOfWeek === dayOfWeek && h.isActive)
    
    // If shop hours found, use open time
    if (dayHours && operatingHours.length > 0) {
      const [openHours, openMinutes] = dayHours.openTime.split(':').map(Number)
      const openTime = new Date(selectedDate)
      openTime.setHours(openHours, openMinutes, 0, 0)
      openTime.setSeconds(0)
      openTime.setMilliseconds(0)
      return openTime
    }
    
    // If no shop hours found, use 9 AM as default
    const defaultTime = new Date(selectedDate)
    defaultTime.setHours(9, 0, 0, 0)
    defaultTime.setSeconds(0)
    defaultTime.setMilliseconds(0)
    return defaultTime
  }

  // Handler for when user clicks on calendar date (onSelect event)
  const handleDateSelect = (date: Date | null) => {
    if (!date) return
    
    // When user clicks on calendar date, set shop open time
    const optimalTime = getOptimalStartTime(date)
    setStartDate(optimalTime)
    setEndDate(null) // Clear end date to force user to select
  }

  const handleStartChange = (date: Date | null) => {
    if (!date) {
      setStartDate(null)
      setEndDate(null)
      return
    }

    // Check if this is a date-only selection (time is 00:00:00)
    const isDateOnlySelection = date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0
    
    let finalDate: Date
    
    if (isDateOnlySelection) {
      // Date-only selection - set shop open time
      finalDate = getOptimalStartTime(date)
    } else {
      // User manually selected time - use the selected date/time as is
      finalDate = date
    }
    
    const validDate = enforceStrict15Minutes(finalDate)
    setStartDate(validDate)
    // Clear end date when start date changes to force reselection
    setEndDate(null)
  }

  const handleEndChange = (date: Date | null) => {
    const validDate = enforceStrict15Minutes(date);

    // Prevent selecting past end times
    if (validDate && startDate) {
      const now = new Date();
      const minEndTime = new Date(startDate.getTime() + 60 * 60 * 1000); // Start + 1 hour

      // If selecting today and end time is before current time + 1 hour from start
      if (isSameDay(validDate, now) && validDate < minEndTime && minEndTime > now) {
        // Don't allow past times
        toast({
          title: "Invalid End Time",
          description: "End time cannot be in the past. Please select a future time.",
          variant: "destructive"
        });
        return;
      }

      // Ensure end time is at least 1 hour after start time
      if (validDate <= startDate) {
        toast({
          title: "Invalid End Time",
          description: "End time must be after start time",
          variant: "destructive"
        });
        return;
      }

      if (validDate < minEndTime) {
        toast({
          title: "Invalid End Time",
          description: "End time must be at least 1 hour after start time",
          variant: "destructive"
        });
        return;
      }

      // Check if end date is same day as start date
      if (!isSameDay(validDate, startDate)) {
        toast({
          title: "Invalid End Date",
          description: "End date must be on the same day as start date. Next day bookings are not allowed.",
          variant: "destructive"
        });
        return;
      }
    }

    setEndDate(validDate)
  }

  // Helper to generate available times for a given date based on operating hours
  const getAvailableTimes = (date: Date | null): Date[] => {
    if (!date) return [];

    const dayOfWeek = date.getDay();
    const dayHours = operatingHours.find(h => h.dayOfWeek === dayOfWeek && h.isActive);

    // If no operating hours loaded OR day is closed, return all 15-min intervals (fallback)
    // This ensures the time picker is always visible
    if (operatingHours.length === 0 || !dayHours) {
      const times: Date[] = [];
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      for (let i = 0; i < 24 * 4; i++) {
        times.push(new Date(start.getTime() + i * 15 * 60 * 1000));
      }
      return times;
    }

    const times: Date[] = [];
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    // Generate 15-min intervals
    for (let i = 0; i < 24 * 4; i++) {
      const time = new Date(start.getTime() + i * 15 * 60 * 1000);
      const timeString = time.toTimeString().split(' ')[0].substring(0, 5);

      const openTime = dayHours.openTime.substring(0, 5);
      const closeTime = dayHours.closeTime.substring(0, 5);

      if (timeString >= openTime && timeString <= closeTime) {
        times.push(time);
      }
    }
    return times;
  };

  const getAvailableEndTimes = (date: Date | null): Date[] => {
    // If no start date, return empty array
    if (!startDate) return [];

    // End date must be same day as start date, so always use startDate's date
    const targetDate = startDate;
    const times = getAvailableTimes(targetDate);
    if (!times.length) return times;

    // Filter based on start time (must be >= start time + 1 hour)
    const minEndTime = new Date(startDate.getTime() + 60 * 60 * 1000);

    // Since end date is always same day, filter times to be >= start + 1 hour
    return times.filter(time => {
      // Compare the time portion - time should be >= minEndTime
      return time.getTime() >= minEndTime.getTime();
    });
  };



  // Get constraints for end date selection
  const getEndDateConstraints = () => {
    if (!startDate) return { minDate: new Date(), maxDate: maxBookingDate }

    // End date must be same day as start date (no next day allowed)
    const minEndDate = startDate
    const maxEndDate = endOfDay(startDate) // Same day only, until end of day

    return {
      minDate: minEndDate,
      maxDate: maxEndDate > maxBookingDate ? maxBookingDate : maxEndDate
    }
  }

  // Get time constraints for end time selection
  const getEndTimeConstraints = () => {
    if (!startDate || !endDate) {
      return {
        minTime: setHours(setMinutes(new Date(), 0), 0),
        maxTime: setHours(setMinutes(new Date(), 59), 23)
      }
    }

    // Minimum end time is start time + 1 hour (60 minutes)
    const minEndTime = new Date(startDate.getTime() + 60 * 60 * 1000)

    // End date must be same day as start date (no next day allowed)
    // Since end date is always same day, we only need same day logic
    return {
      minTime: minEndTime, // Must be at least 1 hour after start time
      maxTime: setHours(setMinutes(endDate, 59), 23) // Until 11:59 PM same day
    }
  }

  // Get constraints when no end date is selected yet (for initial filtering)
  const getInitialEndTimeConstraints = () => {
    if (!startDate) return {
      minTime: setHours(setMinutes(new Date(), 0), 0),
      maxTime: setHours(setMinutes(new Date(), 59), 23)
    }

    // Minimum end time is start time + 1 hour (60 minutes)
    const minEndTime = new Date(startDate.getTime() + 60 * 60 * 1000) // Add 1 hour

    // For today's date, start from the start time + 1 hour
    const today = new Date()
    if (isSameDay(startDate, today)) {
      return {
        minTime: minEndTime,
        maxTime: setHours(setMinutes(today, 59), 23)
      }
    }

    // For future dates, still need 1 hour minimum
    return {
      minTime: minEndTime,
      maxTime: setHours(setMinutes(new Date(), 59), 23)
    }
  }



  // Get minimum start time
  const getStartTimeConstraints = () => {
    const selectedDate = startDate || new Date()
    const today = new Date()

    // If booking for today, minimum time is current time
    if (isSameDay(selectedDate, today)) {
      return {
        minTime: new Date(),
        maxTime: setHours(setMinutes(new Date(), 59), 23) // Until 11:59 PM
      }
    }

    // For future dates, allow full day
    return {
      minTime: setHours(setMinutes(new Date(), 0), 0), // From 12:00 AM
      maxTime: setHours(setMinutes(new Date(), 59), 23) // Until 11:59 PM
    }
  }




  // Validate booking constraints
  const validateBookingConstraints = () => {
    if (!startDate || !endDate) return { isValid: false, message: 'Please select both start and end times' }

    // Validate booking time constraints
    if (endDate <= startDate) {
      return { isValid: false, message: 'End time must be after start time' }
    }

    // Validate minimum booking duration of 1 hour
    const timeDifferenceMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60)
    if (timeDifferenceMinutes < 60) {
      return { isValid: false, message: 'Minimum booking duration is 1 hour' }
    }

    // Check if booking is over 24 hours
    const timeDifferenceHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
    if (timeDifferenceHours > 24) {
      return {
        isValid: false,
        message: 'Booking of more than 24 hours should not be allowed. If required, please contact admin via whatsapp.'
      }
    }

    // Check if end date is same day as start date (no next day bookings allowed)
    if (!isSameDay(startDate, endDate)) {
      return {
        isValid: false,
        message: 'End date must be on the same day as start date. Next day bookings are not allowed.'
      }
    }

    return { isValid: true, message: '' }
  }


  //

  // Function to fetch booked seats
  const fetchBookedSeats = useCallback(async () => {
    if (!location || !startDate || !endDate) {
      setBookedSeats([])
      return
    }

    setIsLoadingSeats(true)
    try {
      const locationData = locations.find(loc => loc.id === location)
      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/booking/getBookedSeats`, {
        method: 'POST',
        body: JSON.stringify({
          location: locationData?.name || location,
          startAt: startDate.toISOString().replace('T', ' ').replace('Z', ''),
          endAt: endDate.toISOString().replace('T', ' ').replace('Z', '')
        })
      })

      if (response.ok) {
        const data = await response.json()
        setBookedSeats(data.bookedSeats || [])

        if (data.summary?.pending > 0) {
          console.log('⏳ Pending payment bookings detected - seats temporarily blocked')
        }

        // Check if all seats are booked
        const availableSeats = DEMO_LAYOUT.length - (data.bookedSeats || []).length
        console.log('availableSeats', availableSeats)
        if (availableSeats === 0) {
          toast({
            title: "No seats available",
            description: "Please choose another time.",
            variant: "destructive",
          })
        }
      } else {
        console.error('Failed to fetch booked seats')
        setBookedSeats([])
      }
    } catch (error) {
      console.error('Error fetching booked seats:', error)
      setBookedSeats([])
    } finally {
      setIsLoadingSeats(false)
    }
  }, [location, startDate, endDate])

  // Fetch booked seats when location, start date, or end date changes
  useEffect(() => {
    fetchBookedSeats()
    // Clear selected seats when booking details change
    setSelectedSeats([])
  }, [fetchBookedSeats])

  // memoize to keep identity stable
  const handleStudentValidationChange = useCallback((allValid: boolean, students: any[]) => {
    setStudentsValidated(allValid)
    setValidatedStudents(students)
  }, [])


  const selectedLocation = locations.find(loc => loc.id === location)
  const totalHours = startDate && endDate ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))) : 0

  // Calculate base subtotal using people-based pricing
  const baseSubtotal = (() => {
    if (!selectedLocation || !bookingDuration) return 0

    // Use actual duration hours for pricing calculation
    const actualHours = bookingDuration.durationHours

    // Determine pricing tier based on actual duration
    const pricingTier = actualHours <= 1 ? '1hour' : 'over1hour'

    // Calculate cost based on people breakdown
    let totalCost = 0

    // Students (coStudents)
    const studentRate = actualHours <= 1 ? pricing.student.oneHourRate : pricing.student.overOneHourRate
    const studentCost = studentRate * actualHours * peopleBreakdown.coStudents
    totalCost += studentCost

    // Members (coWorkers) 
    const memberRate = actualHours <= 1 ? pricing.member.oneHourRate : pricing.member.overOneHourRate
    const memberCost = memberRate * actualHours * peopleBreakdown.coWorkers
    totalCost += memberCost

    // Tutors (coTutors)
    const tutorRate = actualHours <= 1 ? pricing.tutor.oneHourRate : pricing.tutor.overOneHourRate
    const tutorCost = tutorRate * actualHours * peopleBreakdown.coTutors
    totalCost += tutorCost

    return totalCost
  })()

  // Calculate discount if voucher is applied
  const discountInfo = null // Removed test voucher calculation
  const promoDiscountInfo = promoCodeInfo

  // Calculate package discount if package is selected
  const packageDiscountInfo = selectedPackage ? (() => {
    const pkg = userPackages?.find(p => p.id === selectedPackage)
    if (!pkg || !bookingDuration) return null

    // Package applies to individual person hours, not total booking hours
    const discountHours = pkg.hoursAllowed || 4; // Default to 4 hours if not set
    const individualPersonHours = bookingDuration.durationHours; // Hours per person

    // Package can only cover hours for ONE person, not all people
    const appliedHours = Math.min(individualPersonHours, discountHours);
    const remainingHours = Math.max(0, individualPersonHours - appliedHours);

    // Calculate discount based on the user role (since package applies to the person who owns it)
    // We need to determine which person the package applies to - for simplicity, assume it's the first person
    const memberType = peopleBreakdown.coStudents > 0 ? 'STUDENT' :
      peopleBreakdown.coTutors > 0 ? 'TUTOR' : 'MEMBER'

    // Get the hourly rate for the person with the package (use actual duration for pricing)
    const pricePerHour = memberType === 'STUDENT' ?
      (individualPersonHours <= 1 ? pricing.student.oneHourRate : pricing.student.overOneHourRate) :
      memberType === 'TUTOR' ?
        (individualPersonHours <= 1 ? pricing.tutor.oneHourRate : pricing.tutor.overOneHourRate) :
        (individualPersonHours <= 1 ? pricing.member.oneHourRate : pricing.member.overOneHourRate)

    const discountAmount = appliedHours * pricePerHour; // Discount for 1 person

    // Calculate final amount after package discount (matching backend logic)
    let finalAmount = 0;

    // If package covers all hours (full day), user pays zero
    if (appliedHours >= individualPersonHours && individualPersonHours > 0) {
      // Full package coverage - user pays nothing for the person with package
      // But other people still pay full price
      const packagePersonCost = individualPersonHours * pricePerHour;
      const otherPeopleCost = baseSubtotal - packagePersonCost;
      finalAmount = Math.max(0, otherPeopleCost);
    } else {
      // Partial package coverage - user pays for remaining hours for the person with package
      // Plus full cost for other people
      const remainingCostForPackagePerson = remainingHours * pricePerHour;
      const packagePersonCost = individualPersonHours * pricePerHour;
      const otherPeopleCost = baseSubtotal - packagePersonCost;
      finalAmount = Math.max(0, remainingCostForPackagePerson + otherPeopleCost);
    }

    // Debug logging


    return {
      discountAmount: discountAmount,
      finalAmount: finalAmount,
      appliedHours: appliedHours,
      remainingHours: remainingHours,
      packageAppliedToPerson: 1 // Package applies to 1 person only
    }
  })() : null

  // Calculate final amounts - packages take precedence over promo codes, then credits
  let subtotal = baseSubtotal
  let discountAmount = 0

  if (packageDiscountInfo) {
    subtotal = packageDiscountInfo.finalAmount
    discountAmount = packageDiscountInfo.discountAmount
  } else if (promoDiscountInfo) {
    subtotal = promoDiscountInfo.finalAmount
    discountAmount = promoDiscountInfo.discountAmount
  } else if (creditInfo) {
    subtotal = creditInfo.finalAmount
    discountAmount = creditInfo.discountAmount
  }

  const total = subtotal



  // Update finalTotal when total changes (only for step 1, step 2+ uses payment method calculation)
  useEffect(() => {
    if (bookingStep === 1) {
      setFinalTotal(total)
    }
  }, [total, bookingStep])

  // Check for 24-hour booking validation
  useEffect(() => {
    if (startDate && endDate) {
      const timeDifferenceHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
      const isOver24 = timeDifferenceHours > 24

      if (isOver24 && !isOver24Hours) {
        // Show toast when user selects over 24 hours
        toast({
          title: "Booking Duration Exceeded",
          description: "Booking of more than 24 hours should not be allowed. If required, please contact admin via whatsapp.",
          variant: "destructive",
        })
      }

      setIsOver24Hours(isOver24)
    } else {
      setIsOver24Hours(false)
    }
  }, [startDate, endDate, isOver24Hours, toast])

  // Handle payment method change
  const handlePaymentMethodChange = (method: 'payNow' | 'creditCard', newTotal: number) => {
    setSelectedPaymentMethod(method)
    setFinalTotal(newTotal)
  }



  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Double-check user is logged in
    if (!user) {
      router.push('/login')
      return
    }

    // Validate seat selection
    if (selectedSeats.length !== people) {
      toast({
        title: "Seat selection required",
        description: `Please select exactly ${people} seat${people !== 1 ? 's' : ''} for your booking.`,
        variant: "destructive",
      })
      return
    }

    // Check if there are enough available seats
    const availableSeats = DEMO_LAYOUT.length - bookedSeats.length
    console.log('availableSeats', availableSeats)
    if (availableSeats === 0) {
      toast({
        title: "No seats available",
        description: "Please choose another time.",
        variant: "destructive",
      })
      return
    }
    if (availableSeats < people) {
      toast({
        title: "Not enough seats available",
        description: `Sorry, only ${availableSeats} seat${availableSeats !== 1 ? 's are' : ' is'} available for this time slot. Please select a different time or reduce the number of people.`,
        variant: "destructive",
      })
      return
    }

    // Validate booking constraints
    const validation = validateBookingConstraints()
    if (!validation.isValid) {
      toast({
        title: "Booking validation failed",
        description: validation.message,
        variant: "destructive",
      })
      return
    }


    // Check if it's a zero amount booking - handle immediately
    if (total <= 0) {
      await handleZeroAmountBooking()
      return
    }

    // For non-zero amounts, just move to payment step
    // Booking will be created when user clicks "Pay"
    setBookingStep(2)

    // Scroll to top when moving to payment step
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle zero amount bookings (free bookings)
  const handleZeroAmountBooking = async () => {
    setIsLoading(true)

    try {
      // Prepare booking payload
      const locationData = locations.find(loc => loc.id === location)
      const memberType = peopleBreakdown.coStudents > 0 ? 'STUDENT' :
        peopleBreakdown.coTutors > 0 ? 'TUTOR' : 'MEMBER'

      const bookingPayload = {
        userId: user!.id,
        location: locationData?.name || location,
        startAt: startDate?.toISOString(),
        endAt: endDate?.toISOString(),
        specialRequests: specialRequests || null,
        seatNumbers: selectedSeats,
        pax: people,
        students: peopleBreakdown.coStudents,
        members: peopleBreakdown.coWorkers,
        tutors: peopleBreakdown.coTutors,
        totalCost: baseSubtotal,
        promoCodeId: promoCodeInfo?.promoCode?.id || null,
        discountAmount: (promoCodeInfo?.discountAmount || 0) + (creditInfo?.discountAmount || 0),
        totalAmount: total,
        memberType: memberType,
        bookedForEmails: [customerEmail],
        confirmedPayment: false,
        bookingRef: `BOOK${Date.now().toString().slice(-6)}`,
        paymentId: null,
        bookedAt: new Date().toISOString(),
        packageId: selectedPackage || null,
        packageUsed: !!selectedPackage,
        packageDiscountAmount: packageDiscountInfo?.discountAmount || 0,
        packageDiscountId: selectedPackage || null,
        packageName: packageDiscountInfo ? userPackages?.find(p => p.id === selectedPackage)?.packageName || 'Package' : null,
        creditAmount: creditInfo?.creditAmount || 0
      }

      // Create booking
      const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/booking/create`;
      const response = await authenticatedFetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify(bookingPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const result = await response.json();
      const createdBookingId = result.booking?.id || result.id;
      setBookingId(createdBookingId);

      // Store booking data for confirmation step
      localStorage.setItem('currentBooking', JSON.stringify(result.booking || result))

      // Go to confirmation step (booking will be confirmed there)
      setBookingStep(3)

      // Scroll to top when moving to confirmation step
      window.scrollTo({ top: 0, behavior: 'smooth' })

    } catch (error) {
      toast({
        title: "Booking failed",
        description: error instanceof Error ? error.message : "An error occurred while creating your booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Create booking for payment (called from PaymentStep)
  const createBookingForPayment = async (): Promise<string | null> => {
    if (!user) {
      throw new Error('User not authenticated')
    }


    try {
      // Prepare booking payload
      const locationData = locations.find(loc => loc.id === location)
      const memberType = peopleBreakdown.coStudents > 0 ? 'STUDENT' :
        peopleBreakdown.coTutors > 0 ? 'TUTOR' : 'MEMBER'

      const bookingPayload = {
        userId: user.id,
        location: locationData?.name || location,
        startAt: startDate?.toISOString(),
        endAt: endDate?.toISOString(),
        specialRequests: specialRequests || null,
        seatNumbers: selectedSeats,
        pax: people,
        students: peopleBreakdown.coStudents,
        members: peopleBreakdown.coWorkers,
        tutors: peopleBreakdown.coTutors,
        totalCost: baseSubtotal,
        promoCodeId: promoCodeInfo?.promoCode?.id || null,
        discountAmount: (promoCodeInfo?.discountAmount || 0) + (creditInfo?.discountAmount || 0),
        totalAmount: total,
        memberType: memberType,
        bookedForEmails: [customerEmail],
        confirmedPayment: false,
        bookingRef: `BOOK${Date.now().toString().slice(-6)}`,
        paymentId: null,
        bookedAt: new Date().toISOString(),
        packageId: selectedPackage || null,
        packageUsed: !!selectedPackage,
        packageDiscountAmount: packageDiscountInfo?.discountAmount || 0,
        packageDiscountId: selectedPackage || null,
        packageName: packageDiscountInfo ? userPackages?.find(p => p.id === selectedPackage)?.packageName || 'Package' : null,
        creditAmount: creditInfo?.creditAmount || 0
      }

      // Create booking
      const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/booking/create`;
      const response = await authenticatedFetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify(bookingPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const result = await response.json();
      const createdBookingId = result.booking?.id || result.id;

      // Store booking data for payment step
      localStorage.setItem('currentBooking', JSON.stringify(result.booking || result))

      return createdBookingId;

    } catch (error) {
      console.error('Error creating booking for payment:', error)
      throw error
    }

  };



  // Use the new function for End Times as well (previously it relied on getAvailableTimes which was missing/implied?)
  // Wait, getAvailableEndTimes in BookingForm used getAvailableTimes.
  // In BookingClient, getAvailableEndTimes (line 1450 in view?) likely has its own logic or calls getAvailableTimes?
  // I need to check getAvailableEndTimes definition to see if it calls getAvailableStartTimes or duplicates logic.
  // But for now, adding getAvailableStartTimes is safe.

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

  // Get constraints for the DatePicker components
  const { minDate: endMinDate, maxDate: endMaxDate } = getEndDateConstraints()
  const endTimeConstraints = endDate ? getEndTimeConstraints() : getInitialEndTimeConstraints()
  
  // Memoize available end times to avoid recalculation on every render
  const availableEndTimes = useMemo(() => {
    return getAvailableEndTimes(endDate)
  }, [endDate, startDate, operatingHours])

  const isFormValid =
    location &&
    people &&
    startDate &&
    endDate &&
    customerName &&
    customerEmail &&
    customerPhone &&
    (!needsStudentVerification || studentsValidated) && // Only require validation if verification is needed
    selectedSeats.length === people &&
    user;

  // Debug form validation


  // Show loading state while checking auth
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-32 text-center">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="pt-32 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!user && (
            <Alert className="mb-6 border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800">Sign In Required</AlertTitle>
              <AlertDescription className="text-orange-700">
                You must be signed in as a member to make bookings.
                <Button
                  variant="link"
                  className="px-2 text-orange-600 hover:text-orange-800"
                  onClick={() => router.push('/login')}
                >
                  Sign in now
                </Button>
                to continue with your booking.
              </AlertDescription>
            </Alert>
          )}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-serif text-gray-900 mb-4">Complete Your Booking</h1>
            <p className="text-lg text-gray-600">Secure your co-working space in just a few steps</p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-8">
              {[
                { step: 1, title: 'Details', icon: Calendar },
                { step: 2, title: 'Payment', icon: CreditCard },
                { step: 3, title: 'Confirmation', icon: Shield }
              ].map(({ step, title, icon: Icon }) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bookingStep >= step ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                    {bookingStep > step ? '✓' : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${bookingStep >= step ? 'text-orange-500' : 'text-gray-500'
                    }`}>
                    {title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Booking Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bookingStep === 1 && (
                    <form onSubmit={handleBookingSubmit} className="space-y-4 sm:space-y-6">
                      {/* Workspace Selection */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Select value={location} onValueChange={setLocation} disabled={!user}>
                            <SelectTrigger className={`w-full ${!user ? "bg-gray-50" : ""}`}>
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                              {locations.map(loc => (
                                <SelectItem key={loc.id} value={loc.id}>
                                  {loc.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>


                        <div>
                          <Label>Number of People</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={`w-full justify-start ${!user ? "bg-gray-50" : ""}`} disabled={!user}>
                                {people} {people === 1 ? 'Person' : 'People'}
                                {peopleBreakdown.coTutors > 0 || peopleBreakdown.coStudents > 0 ? (
                                  <span className="ml-2 text-xs text-gray-500">
                                    ({peopleBreakdown.coWorkers}💼 {peopleBreakdown.coTutors}👩‍🏫 {peopleBreakdown.coStudents}🎓)
                                  </span>
                                ) : null}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="w-auto">
                              <PeopleSelector
                                value={people}
                                min={1}
                                max={15}
                                onChange={handlePeopleChange}
                                showBreakdown={true}
                                onBreakdownChange={handleBreakdownChange}
                                storageKey="book-now-people-selector"
                                enablePersistence={true}
                                initialBreakdown={peopleBreakdown}
                                isInitialLoad={true}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      {/* Date & Time Selection */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <Label className="flex items-center gap-2">
                            Start Date & Time
                            {(isLoadingShopHours || isLoadingSeats) && (
                              <Loader2 className="h-3 w-3 animate-spin text-orange-500" />
                            )}
                          </Label>
                          {/* Get minimum start time constraints */}
                          <DatePicker
                            selected={startDate}
                            onChange={handleStartChange}
                            onSelect={handleDateSelect}
                            onChangeRaw={(e) => e?.preventDefault()}
                            selectsStart
                            startDate={startDate}
                            endDate={endDate}
                            showTimeSelect
                            timeIntervals={15}
                            dateFormat="MMM d, h:mm aa"
                            placeholderText="Select start time"
                            className={`w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors ${!user ? "bg-gray-50" : ""}`}
                            wrapperClassName="w-full"
                            minDate={minDate}
                            maxDate={maxBookingDate}
                            excludeDates={getExcludedDates()}
                            includeTimes={getAvailableTimes(startDate)}
                            {...getStartTimeConstraints()}
                            disabled={!user}
                          />
                        </div>

                        <div>
                          <Label>End Date & Time</Label>
                          {/* Get end time constraints */}
                          <DatePicker
                            selected={endDate}
                            onChange={handleEndChange}
                            onChangeRaw={(e) => e?.preventDefault()}
                            selectsEnd
                            startDate={startDate}
                            endDate={endDate}
                            minDate={endMinDate}
                            maxDate={endMaxDate}
                            showTimeSelect
                            timeIntervals={15}
                            includeTimes={availableEndTimes}
                            excludeDates={getExcludedDates()}
                            dateFormat="MMM d, h:mm aa"
                            placeholderText="Select end time"
                            className={`w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors ${!user ? "bg-gray-50" : ""}`}
                            wrapperClassName="w-full"
                            {...getEndTimeConstraints()}
                            disabled={!user || !startDate}
                          />
                          {/* {startDate && (
                            <p className="text-xs text-gray-500 mt-1">
                              💡 End time must be on the same day as start time
                          )} */}
                        </div>
                      </div>


                      <div className="flex flex-col mt-2">
                        <p className='text-orange-600 border border-orange-600 rounded-md p-1 px-4 text-xs inline-block'>All timezones are based on GMT+8</p>
                      </div>
                      <div className="flex flex-col">
                        <p className='text-gray-600 border border-gray-600 rounded-md p-1 px-4 text-xs inline-block'>Booking has to be made for at least an hour</p>
                      </div>

                      {/* Booking Duration Display */}
                      {bookingDuration && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                              Booking Duration: {bookingDuration.durationHours.toFixed(2)} hours
                            </span>
                          </div>
                          <p className="text-xs text-blue-600 mt-1">
                            {bookingDuration.startAt && bookingDuration.endAt && (
                              <>
                                From {formatSingaporeDate(bookingDuration.startAt)} to {formatSingaporeDate(bookingDuration.endAt)}
                              </>
                            )}
                          </p>
                        </div>
                      )}
                      {hasTutorWithTooManyPeople && (
                        <Alert variant="destructive" className="mb-4">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Booking Not Allowed</AlertTitle>
                          <AlertDescription>

                            A maximum of 4 students or 4 co-workers in a booking is allowed. Anything more than this, please contact us via whatsapp to make special arrangements
                          </AlertDescription>
                        </Alert>
                      )}

                      {(() => {
                        console.log('🎨 Rendering student verification UI:', {
                          needsStudentVerification,
                          isStudentAccount,
                          isBookingForSingleStudent,
                          coStudents: peopleBreakdown.coStudents,
                          user: !!user
                        })
                        return null
                      })()}

                      {/* Show loading state while fetching user profile */}
                      {isLoadingUserProfile && peopleBreakdown.coStudents > 0 && (
                        <div className="mt-2 p-3 rounded-md bg-gray-50 border border-gray-200">
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                            <p className="text-sm text-gray-600">Loading user profile...</p>
                          </div>
                        </div>
                      )}

                      {needsStudentVerification && user && !isLoadingUserProfile && (
                        <div>

                          <StudentValidation
                            numberOfStudents={studentsNeedingVerification}
                            onValidationChange={handleStudentValidationChange}
                            currentUserEmail={freshUserProfile?.email}
                          />
                          <div className={`mt-2 p-2 rounded-md text-sm ${studentsValidated
                            ? 'bg-green-50 border border-green-200 text-green-800'
                            : 'bg-orange-50 border border-orange-200 text-orange-800'
                            }`}>
                            {studentsValidated
                              ? `✅ All ${studentsNeedingVerification} student${studentsNeedingVerification > 1 ? 's' : ''} validated successfully!`
                              : `⚠️ Please validate ${studentsNeedingVerification} student${studentsNeedingVerification > 1 ? 's' : ''} to continue`
                            }
                          </div>
                        </div>
                      )}



                      {/* Customer Information */}
                      <div className="border-t pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium">Contact Information</h3>
                          {isLoadingUserProfile ? (
                            <div className="flex items-center text-sm text-gray-500">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                              <span>Loading profile...</span>
                            </div>
                          ) : null}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                          <div>
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                              id="name"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              placeholder="Enter your full name"
                              required
                              disabled={!user}
                              className={!user ? "bg-gray-50" : ""}
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email Address *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={customerEmail}
                              onChange={(e) => setCustomerEmail(e.target.value)}
                              placeholder="Enter your email"
                              required
                              disabled={!user}
                              className={!user ? "bg-gray-50" : ""}
                            />
                          </div>
                          <div>
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              placeholder="Enter your phone number"
                              required
                              disabled={!user}
                              className={!user ? "bg-gray-50" : ""}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Special Requests */}
                      <div>
                        <Label htmlFor="requests">Special Requests (Optional)</Label>
                        <Textarea
                          id="requests"
                          value={specialRequests}
                          onChange={(e) => setSpecialRequests(e.target.value)}
                          placeholder="Any special requirements or requests?"
                          rows={3}
                          disabled={!user}
                          className={!user ? "bg-gray-50" : ""}
                        />
                      </div>
                      {/* seat selection */}
                      {user && (
                        <div>
                          <Label>Select Your Seat(s)</Label>
                          <p className="text-sm text-gray-600 mb-2">
                            Please select exactly {people} seat{people !== 1 ? 's' : ''} for your booking.
                            {!isLoadingSeats && (
                              <span className="ml-2 text-blue-600">
                                ({DEMO_LAYOUT.length - bookedSeats.length} seats available)
                              </span>
                            )}
                          </p>

                          {isLoadingSeats ? (
                            <div className="flex items-center justify-center p-8 border rounded-lg">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                              <span className="ml-3 text-gray-600">Loading available seats...</span>
                            </div>
                          ) : (
                            <>
                              {/* Show message if no seats available */}
                              {DEMO_LAYOUT.length - bookedSeats.length === 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                  <div className="flex items-center">
                                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                                    <div>
                                      <h3 className="text-sm font-medium text-red-800">No seats available</h3>
                                      <p className="text-sm text-red-700">Please choose another time.</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Show message if not enough seats for requested people */}
                              {DEMO_LAYOUT.length - bookedSeats.length > 0 && people > (DEMO_LAYOUT.length - bookedSeats.length) && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                  <div className="flex items-center">
                                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                                    <div>
                                      <h3 className="text-sm font-medium text-red-800">Not enough seats available</h3>
                                      <p className="text-sm text-red-700">
                                        There are only {DEMO_LAYOUT.length - bookedSeats.length} seats available. Please select another timeslot.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <SeatPicker
                                layout={DEMO_LAYOUT}
                                tables={DEMO_TABLES}
                                labels={DEMO_LABELS}
                                bookedSeats={bookedSeats}
                                overlays={OVERLAYS}
                                maxSeats={people}
                                onSelectionChange={setSelectedSeats}
                              />
                              <div className="flex justify-between items-center mt-2">
                                <p className="text-sm text-gray-600">
                                  Selected: {selectedSeats.join(', ') || 'none'}
                                </p>
                                {selectedSeats.length !== people && (
                                  <p className="text-sm text-orange-600">
                                    {selectedSeats.length < people
                                      ? `Please select ${people - selectedSeats.length} more seat${people - selectedSeats.length !== 1 ? 's' : ''}`
                                      : `Please deselect ${selectedSeats.length - people} seat${selectedSeats.length - people !== 1 ? 's' : ''}`
                                    }
                                  </p>
                                )}
                              </div>
                              {bookedSeats.length > 0 && (
                                <p className="text-sm text-red-600 mt-2">
                                  ⚠️ {bookedSeats.length} seat{bookedSeats.length !== 1 ? 's are' : ' is'} already booked for this time slot
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      )}



                      {/* ── ENTITLEMENT TABS ───────────────────────────── */}
                      {user && (
                        <EntitlementTabs
                          mode={entitlementMode}
                          onModeChange={(newMode) => {
                            setEntitlementMode(newMode);
                            setSelectedPackage('');
                            setPromoCode('');
                            setPromoValid(false);
                            setPromoCodeInfo(null);
                            setCreditInfo(null);
                          }}
                          onChange={(discountInfo) => {
                            if (discountInfo && discountInfo.type === 'package') {
                              setEntitlementMode('package')
                              setSelectedPackage(discountInfo.id)
                              setPromoCode('')
                              setPromoValid(false)
                              setPromoCodeInfo(null)
                              setCreditInfo(null)
                            } else if (discountInfo && discountInfo.type === 'promo') {


                              setEntitlementMode('promo')
                              setPromoCode(discountInfo.promoCode?.code || '')
                              setPromoValid(true)
                              setSelectedPackage('')
                              setPromoCodeInfo(discountInfo)
                              setCreditInfo(null)
                            } else if (discountInfo && discountInfo.type === 'credit') {

                              setEntitlementMode('credit')
                              setCreditInfo(discountInfo)
                              setSelectedPackage('')
                              setPromoCode('')
                              setPromoValid(false)
                              setPromoCodeInfo(null)
                            } else {
                              // Clear all discounts
                              setEntitlementMode('package')
                              setSelectedPackage('')
                              setPromoCode('')
                              setPromoValid(false)
                              setPromoCodeInfo(null)
                              setCreditInfo(null)
                            }
                          }}
                          selectedPackage={selectedPackage}
                          promoCode={promoCode}
                          promoValid={promoValid}

                          userId={userId}
                          bookingAmount={baseSubtotal}
                          bookingDuration={bookingDuration}
                          userRole={peopleBreakdown.coStudents > 0 ? 'STUDENT' : peopleBreakdown.coTutors > 0 ? 'TUTOR' : 'MEMBER'}
                          locationPrice={(() => {
                            // Get the appropriate hourly rate based on user role and booking duration
                            const memberType = peopleBreakdown.coStudents > 0 ? 'STUDENT' : peopleBreakdown.coTutors > 0 ? 'TUTOR' : 'MEMBER'
                            const individualPersonHours = bookingDuration?.durationHours || 0
                            return memberType === 'STUDENT' ?
                              (individualPersonHours === 1 ? pricing.student.oneHourRate : pricing.student.overOneHourRate) :
                              memberType === 'TUTOR' ?
                                (individualPersonHours === 1 ? pricing.tutor.oneHourRate : pricing.tutor.overOneHourRate) :
                                (individualPersonHours === 1 ? pricing.member.oneHourRate : pricing.member.overOneHourRate)
                          })()}
                          totalPeople={people}
                        />
                      )}
                      {/* ──────────────────────────────────────────────── */}

                      {/* Tutor with too many students error */}


                      <Button
                        type="submit"
                        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={
                          !user ||
                          selectedSeats.length !== people ||
                          (needsStudentVerification && !studentsValidated) ||
                          isLoading ||
                          isOver24Hours ||
                          hasTutorWithTooManyPeople
                        }
                      >
                        {!user
                          ? 'Sign In Required'
                          : hasTutorWithTooManyPeople
                            ? 'Tutors with more than 4 Students/Workers Not Allowed - Contact Admin'
                            : isOver24Hours
                              ? 'Booking Over 24 Hours Not Allowed'
                              : selectedSeats.length !== people
                                ? `Select ${people} Seat${people !== 1 ? 's' : ''} to Continue`
                                : needsStudentVerification && !studentsValidated
                                  ? `Validate ${studentsNeedingVerification} Student${studentsNeedingVerification > 1 ? 's' : ''} to Continue`
                                  : total <= 0
                                    ? (isLoading ? 'Confirming Free Booking...' : 'Confirm Free Booking')
                                    : (isLoading ? 'Processing...' : 'Continue to Payment')
                        }
                      </Button>

                      {!user && (
                        <p className="text-center text-sm text-gray-600 mt-2">
                          <Button
                            type="button"
                            variant="link"
                            className="text-orange-600 hover:text-orange-800 p-0"
                            onClick={() => router.push('/login')}
                          >
                            Sign in
                          </Button>
                          {' '}to make your booking
                        </p>
                      )}

                      {needsStudentVerification && !studentsValidated && user && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-amber-800">Student Verification Required</p>
                              <p className="text-xs text-amber-700 mt-1">
                                Please complete student verification for all {studentsNeedingVerification} student{studentsNeedingVerification > 1 ? 's' : ''} before proceeding to payment.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </form>
                  )}

                  {bookingStep === 2 && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium">Payment Information</h3>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-4">

                          <ErrorBoundary componentName="PaymentStep">
                            <PaymentStep
                              subtotal={baseSubtotal}
                              total={total}
                              discountAmount={discountAmount}
                              selectedPackage={selectedPackage}
                              customer={{ name: customerName, email: customerEmail, phone: customerPhone }}
                              bookingId={bookingId || undefined}
                              onBack={() => {
                                setBookingStep(1)
                                setSelectedPaymentMethod('payNow') // Reset to default payment method
                              }}
                              onComplete={() => setBookingStep(3)}
                              onPaymentMethodChange={handlePaymentMethodChange}
                              onCreateBooking={createBookingForPayment}
                              onBookingCreated={(bookingId) => setBookingId(bookingId)}
                            />
                          </ErrorBoundary>
                        </p>

                      </div>
                    </div>

                  )}

                  {bookingStep === 3 && (
                    <div className="text-center py-8">
                      {confirmationStatus === 'loading' && (
                        <>
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirming Your Booking...</h3>
                          <p className="text-gray-600 mb-6">
                            Please wait while we confirm your booking.
                          </p>
                        </>
                      )}

                      {confirmationStatus === 'error' && (
                        <>
                          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {confirmationHeadingError || ' Booking Failed '}
                          </h3>
                          <p className="text-red-600 mb-4">
                            {confirmationError || 'An error occurred while confirming your booking.'}
                          </p>
                          {isPaymentFailed(searchParams.get('status')) && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                              <div className="flex items-start space-x-2">
                                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-amber-800">
                                  <p className="font-medium">What happened?</p>
                                  <p>Your payment was not completed successfully.</p>

                                  <p className="mt-2">Your booking has not been confirmed and no charges were made to your account.</p>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="space-y-3">
                            {isPaymentFailed(searchParams.get('status')) ? (
                              <>
                                <Button
                                  onClick={() => router.push('/')}
                                  className="bg-orange-500 hover:bg-orange-600"
                                >
                                  Try Booking Again
                                </Button>
                                <Button
                                  onClick={() => router.push('/dashboard#overview')}
                                  variant="outline"
                                  className="ml-3"
                                >
                                  Go to Dashboard
                                </Button>
                              </>
                            ) : (
                              <>


                              </>
                            )}
                          </div>
                        </>
                      )}

                      {confirmationStatus === 'success' && (
                        <>
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
                          {(() => {
                            const currentBooking = JSON.parse(localStorage.getItem('currentBooking') || '{}')
                            const isZeroAmount = currentBooking.totalAmount <= 0

                            return (
                              <>
                                <p className="text-gray-600 mb-6">
                                  {isZeroAmount
                                    ? "Your booking has been automatically confirmed as the total amount was $0.00. No payment was required."
                                    : "Your booking has been confirmed. You will receive a confirmation email shortly."
                                  }
                                </p>
                                {isZeroAmount && (
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-green-600 text-sm">💰</span>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-green-800">Zero Amount Booking</p>
                                        <p className="text-xs text-green-600">Fully covered by package discount</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </>
                            )
                          })()}
                          <div className="bg-gray-50 p-4 rounded-lg text-left">
                            <p className="text-sm text-gray-600">
                              Booking Reference: {(() => {
                                try {
                                  const currentBooking = JSON.parse(localStorage.getItem('currentBooking') || '{}')
                                  return currentBooking.bookingRef || `#BK${Date.now().toString().slice(-6)}`
                                } catch {
                                  return `#BK${Date.now().toString().slice(-6)}`
                                }
                              })()}
                            </p>
                            {bookingId && (
                              <p className="text-sm text-gray-600 mt-1">Booking ID: {bookingId}</p>
                            )}
                          </div>
                          <Button
                            onClick={() => router.push('/dashboard#overview')}
                            className="mt-6 bg-orange-500 hover:bg-orange-600"
                          >
                            View My Bookings
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Booking Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Booking Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!user && (
                    <div className="bg-orange-50 border border-orange-200 rounded-md p-4 text-center">
                      <p className="text-sm text-orange-800 font-medium">Member Booking</p>
                      <p className="text-xs text-orange-700 mt-1">Sign in to view pricing</p>
                    </div>
                  )}
                  {confirmedBookingData ? (
                    // Show confirmed booking data
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium">{confirmedBookingData.location}</p>
                          <p className="text-sm text-gray-600">Confirmed Booking</p>
                        </div>
                      </div>


                      {confirmedBookingData.seatNumbers && confirmedBookingData.seatNumbers.length > 0 && (
                        <div className="flex items-center space-x-3">
                          <Users className="w-5 h-5 text-gray-400" />
                          <span>{confirmedBookingData.pax} {confirmedBookingData.pax === 1 ? 'Person' : 'People'}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm">
                            {formatBookingDateRange(confirmedBookingData.startAt, confirmedBookingData.endAt)}
                          </p>
                        </div>
                      </div>

                      {confirmedBookingData.seatNumbers && confirmedBookingData.seatNumbers.length > 0 && (
                        <div className="flex items-center space-x-3">
                          <div className="w-5 h-5 text-gray-400">🪑</div>
                          <span className="text-sm">Seats: {confirmedBookingData.seatNumbers.join(', ')}</span>
                        </div>
                      )}

                      {confirmedBookingData.specialRequests && (
                        <div className="flex items-start space-x-3">
                          <div className="w-5 h-5 text-gray-400">📝</div>
                          <div>
                            <p className="text-sm font-medium">Special Requests</p>
                            <p className="text-sm text-gray-600">{confirmedBookingData.specialRequests}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : selectedLocation && user && bookingStep !== 3 ? (
                    // Show form data when not yet confirmed (hide during step 3 loading)
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium">{selectedLocation.name}</p>
                          <p className="text-sm text-gray-600">{selectedLocation.address}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-gray-400" />
                        <span>{people} {people === 1 ? 'Person' : 'People'}</span>
                      </div>

                      {bookingStep >= 2 && (
                        <div className="flex items-center space-x-3">
                          <CreditCard className="w-5 h-5 text-gray-400" />
                          <div>
                            <span className="text-sm font-medium">
                              {selectedPaymentMethod === 'payNow' ? 'Pay Now (Scan & Pay)' : 'Credit Card Payment'}
                            </span>
                            {selectedPaymentMethod === 'creditCard' && (
                              <p className="text-xs text-amber-600">+{paymentFeeSettings.creditCardFeePercentage}% processing fee</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Promo Code Summary */}
                      {promoCodeInfo && (
                        <div className="flex items-center space-x-3">
                          <Ticket className="w-5 h-5 text-blue-600" />
                          <div>
                            <span className="text-sm font-medium text-blue-800">
                              Promo Code Applied
                            </span>
                            <p className="text-xs text-blue-600">
                              Discount: ${promoCodeInfo.discountAmount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      )}

                      {startDate && endDate && (
                        <div className="flex items-center space-x-3">
                          <Clock className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm">
                              {startDate.toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                              {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : bookingStep === 3 && confirmationStatus === 'loading' ? (
                    // Show loading state during confirmation
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-orange-500" />
                      <p className="text-sm text-gray-600">Confirming your booking...</p>
                      <p className="text-xs text-gray-500 mt-1">Please wait</p>
                    </div>
                  ) : null}

                  {confirmedBookingData ? (
                    // Show confirmed booking pricing
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between">
                        <span>Booking Reference</span>
                        <span className="font-mono text-sm">{confirmedBookingData.bookingRef}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Member Type</span>
                        <span className="capitalize">{confirmedBookingData.memberType.toLowerCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Amount</span>
                        <span className="font-bold">${confirmedBookingData.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Status</span>
                        <span className="text-green-600 font-medium">✓ Confirmed</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Confirmed At</span>
                        <span>
                          {new Date(
                            new Date(confirmedBookingData.updatedAt).getTime() + 8 * 60 * 60 * 1000
                          ).toLocaleString("en-SG", {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </div>

                    </div>
                  ) : totalHours > 0 && user && bookingStep !== 3 ? (
                    <div className="border-t pt-4 space-y-2">
                      {/* Role-based rates */}
                      {peopleBreakdown.coStudents > 0 && (
                        <div className="flex justify-between">
                          <span>Students ({peopleBreakdown.coStudents}):</span>
                          <span>${bookingDuration && bookingDuration.durationHours <= 1 ? pricing.student.oneHourRate : pricing.student.overOneHourRate}/hr</span>
                        </div>
                      )}
                      {peopleBreakdown.coWorkers > 0 && (
                        <div className="flex justify-between">
                          <span>Members ({peopleBreakdown.coWorkers}):</span>
                          <span>${bookingDuration && bookingDuration.durationHours <= 1 ? pricing.member.oneHourRate : pricing.member.overOneHourRate}/hr</span>
                        </div>
                      )}
                      {peopleBreakdown.coTutors > 0 && (
                        <div className="flex justify-between">
                          <span>Tutors ({peopleBreakdown.coTutors}):</span>
                          <span>${bookingDuration && bookingDuration.durationHours <= 1 ? pricing.tutor.oneHourRate : pricing.tutor.overOneHourRate}/hr</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Duration</span>
                        <span>{bookingDuration ? bookingDuration.durationHours.toFixed(2) : totalHours} hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span>People</span>
                        <span>{people}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Base Subtotal</span>
                        <span>${baseSubtotal.toFixed(2)}</span>
                      </div>

                      {/* Show discount if applied */}
                      {promoCodeInfo && promoCodeInfo.discountAmount > 0 && (
                        <div className="flex justify-between text-blue-600">
                          <span>Promo Code Applied</span>
                          <span>-${promoCodeInfo.discountAmount.toFixed(2)}</span>
                        </div>
                      )}

                      {/* Show credit discount if applied */}
                      {creditInfo && creditInfo.discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Store Credit Applied</span>
                          <span>-${creditInfo.discountAmount.toFixed(2)}</span>
                        </div>
                      )}

                      {/* Package Discount Information */}
                      {selectedPackage && (() => {
                        // Find the selected package details
                        const pkg = userPackages?.find(p => p.id === selectedPackage)
                        if (!pkg || !bookingDuration) return null

                        // Use dynamic hoursAllowed from package configuration instead of hardcoded values
                        const discountHours = pkg.hoursAllowed || 4; // Default to 4 hours if not set

                        const appliedHours = Math.min(bookingDuration.durationHours, discountHours || 4);
                        const remainingHours = Math.max(0, bookingDuration.durationHours - appliedHours);


                        // Get the appropriate hourly rate based on user role and booking duration
                        const memberType = peopleBreakdown.coStudents > 0 ? 'STUDENT' : peopleBreakdown.coTutors > 0 ? 'TUTOR' : 'MEMBER'
                        const individualPersonHours = bookingDuration.durationHours
                        const pricePerHour = memberType === 'STUDENT' ?
                          (individualPersonHours <= 1 ? pricing.student.oneHourRate : pricing.student.overOneHourRate) :
                          memberType === 'TUTOR' ?
                            (individualPersonHours <= 1 ? pricing.tutor.oneHourRate : pricing.tutor.overOneHourRate) :
                            (individualPersonHours <= 1 ? pricing.member.oneHourRate : pricing.member.overOneHourRate)
                        const packageDiscount = appliedHours * pricePerHour;
                        const remainingAmount = remainingHours * pricePerHour;

                        return (
                          <>

                            <div className="flex justify-between text-green-600">
                              <span className='text-sm'>Package Applied</span>
                              <span className='text-sm'>{appliedHours?.toFixed(2)}h free</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                              <span className='text-sm'>Package Discount</span>
                              <span className='text-sm'>-${packageDiscount.toFixed(2)}</span>
                            </div>

                            {remainingAmount === 0 && people === 1 && (
                              <div className="flex justify-between text-green-600 font-medium">
                                <span className='text-sm'>Fully Covered!</span>
                                <span>🎉</span>
                              </div>
                            )}
                          </>
                        )
                      })()}

                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>

                      {selectedPaymentMethod === 'creditCard' && (() => {
                        const fee = subtotal * (paymentFeeSettings.creditCardFeePercentage / 100)
                        return (
                          <div className="flex justify-between text-amber-600">
                            <span>Credit Card Fee ({paymentFeeSettings.creditCardFeePercentage}%)</span>
                            <span>${formatCurrency(fee)}</span>
                          </div>
                        )
                      })()}

                      {bookingStep >= 2 && selectedPaymentMethod === 'payNow' && subtotal < 10 && (() => {
                        const fee = paymentFeeSettings.paynowFee
                        if (fee > 0) {
                          return (
                            <div className="flex justify-between text-orange-600">
                              <span>PayNow Transaction Fee</span>
                              <span>${formatCurrency(fee)}</span>
                            </div>
                          )
                        }
                        return null
                      })()}
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total</span>
                        <span className={total <= 0 ? "text-green-600" : ""}>
                          {total <= 0 ? (
                            <>
                              <span className="line-through text-gray-400">${(() => {
                                if (bookingStep >= 2) {
                                  if (selectedPaymentMethod === 'creditCard') {
                                    const multiplier = 1 + (paymentFeeSettings.creditCardFeePercentage / 100);
                                    return (subtotal * multiplier).toFixed(2);
                                  } else if (selectedPaymentMethod === 'payNow') {
                                    const fee = subtotal < 10 ? paymentFeeSettings.paynowFee : 0;
                                    return (subtotal + fee).toFixed(2);
                                  }
                                }
                                return subtotal.toFixed(2);
                              })()}</span>
                              <span className="ml-2">$0.00</span>
                              <span className="ml-1 text-sm">🎉</span>
                            </>
                          ) : (
                            `$${(() => {
                              if (bookingStep >= 2) {
                                if (selectedPaymentMethod === 'creditCard') {
                                  const multiplier = 1 + (paymentFeeSettings.creditCardFeePercentage / 100);
                                  return (subtotal * multiplier).toFixed(2);
                                } else if (selectedPaymentMethod === 'payNow') {
                                  const fee = subtotal < 10 ? paymentFeeSettings.paynowFee : 0;
                                  return (subtotal + fee).toFixed(2);
                                }
                              }
                              return subtotal.toFixed(2);
                            })()}`
                          )}
                        </span>
                      </div>

                      {total <= 0 && (
                        <div className="mt-3 p-3 rounded-md bg-green-50 border border-green-200">
                          <div className="text-center">
                            <p className="text-sm font-medium text-green-800">
                              🎉 Free Booking!
                            </p>
                            <p className="text-xs mt-1 text-green-600">
                              {selectedPackage ? 'Fully covered by package discount' :
                                creditInfo ? 'Fully covered by store credit' :
                                  promoCodeInfo ? 'Fully covered by promo code' :
                                    'Fully covered by discount'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Show total savings if promo code applied */}
                      {promoCodeInfo && promoCodeInfo.discountAmount > 0 && (
                        <div className="mt-3 p-3 rounded-md bg-green-50 border border-green-200">
                          <div className="text-center">
                            <p className="text-sm font-medium text-green-800">
                              🎉 You're saving ${promoCodeInfo.discountAmount.toFixed(2)}!
                            </p>
                            <p className="text-xs mt-1 text-green-600">
                              Original: ${baseSubtotal.toFixed(2)} |
                              Final: ${promoCodeInfo.finalAmount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Show total savings if credit applied */}
                      {/* {creditInfo && creditInfo.discountAmount > 0 && (
                        <div className="mt-3 p-3 rounded-md bg-blue-50 border border-blue-200">
                          <div className="text-center">
                            <p className="text-sm font-medium text-blue-800">
                              💳 Using ${creditInfo.creditAmount.toFixed(2)} store credit!
                            </p>
                            <p className="text-xs mt-1 text-blue-600">
                              Original: ${baseSubtotal.toFixed(2)} |
                              Final: ${creditInfo.finalAmount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      )} */}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <FooterSection />
    </div>
  )
}
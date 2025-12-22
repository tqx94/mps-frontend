// src/components/dashboard/UserBookings.tsx - User booking dashboard
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Clock, MapPin, Users, DollarSign, CheckCircle, XCircle, Edit, AlertTriangle, X, Loader2, Timer, Key, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import {
  Booking,
  getUserBookings,
  getUserStats,
  formatBookingDate,
  getBookingStatus,
  getStatusColor,
  calculateDuration
} from '@/lib/bookingService'
import { requestRefund } from '@/lib/refundService'
import { sendDoorAccessLink } from '@/lib/doorService'
import { authenticatedFetch } from '@/lib/apiClient'
import {
  formatSingaporeDate,
  formatSingaporeDateOnly,
  formatSingaporeTimeOnly,
  formatBookingDateRange,
  toSingaporeTime,
  isPastInSingapore,
  isFutureInSingapore,
  calculateDurationSingapore
} from '@/lib/timezoneUtils'

export function UserBookings() {
  const { toast } = useToast()
  const { user: authUser } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [userStats, setUserStats] = useState({ upcomingBookings: 0, ongoingBookings: 0, pastBookings: 0 })
  const [activeTab, setActiveTab] = useState<'upcoming' | 'ongoing' | 'past' | 'cancelled'>('upcoming')

  // Refund dialog state
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [refundReason, setRefundReason] = useState('')
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false)

  // Dynamic payment fee settings state
  const [feeSettings, setFeeSettings] = useState({
    paynowFee: 0.20,
    creditCardFeePercentage: 5.0,
    adminRefundFee: 2.00
  })
  const [actualRefundAmount, setActualRefundAmount] = useState<number | null>(null)
  const [sendingTuyaLink, setSendingTuyaLink] = useState<string | null>(null)
  const [isCardPayment, setIsCardPayment] = useState(false)
  const [promoDiscountAmount, setPromoDiscountAmount] = useState<number>(0)
  const [packageDiscountAmount, setPackageDiscountAmount] = useState<number>(0)
  const [creditAmount, setCreditAmount] = useState<number>(0)
  const [totalDiscountAmount, setTotalDiscountAmount] = useState<number>(0)
  const [cardFee, setCardFee] = useState<number>(0)
  const [payNowFee, setPayNowFee] = useState<number>(0)
  const [totalCost, setTotalCost] = useState<number>(0)





  // Load user bookings
  const loadBookings = async () => {
    try {
      setLoading(true)
      const response = await getUserBookings()
      if (response.success && response.bookings) {
        setBookings(response.bookings)
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load bookings",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Load Bookings Error:', error)
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load user statistics
  const loadUserStats = async () => {
    try {
      // For demo purposes, using a mock userId - in real app, get from auth context
      const mockUserId = '123e4567-e89b-12d3-a456-426614174000'
      const stats = await getUserStats(mockUserId)
      setUserStats({
        upcomingBookings: stats.upcomingBookings || 0,
        ongoingBookings: stats.ongoingBookings || 0,
        pastBookings: stats.pastBookings || 0
      })
    } catch (error) {
      console.error('Load User Stats Error:', error)
    }
  }

  // Handle cancel booking (refund request)
  const handleSendTuyaLink = async (booking: Booking) => {
    setSendingTuyaLink(booking.bookingRef)

    try {
      const result = await sendDoorAccessLink(booking.bookingRef)

      if (result.success) {
        toast({
          title: "Door Access Link Sent!",
          description: `Access link has been sent to your email for booking ${booking.bookingRef}`,
        })
      } else {
        toast({
          title: "Failed to Send Access Link",
          description: result.message || "Please try again later",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error sending Tuya link:', error)
      toast({
        title: "Error",
        description: "Failed to send door access link. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSendingTuyaLink(null)
    }
  }

  const handleCancelBooking = async (booking: Booking) => {
    setSelectedBooking(booking)
    setRefundReason('')
    setIsRefundDialogOpen(true)

    // Calculate actual refund amount
    try {
      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/booking/getBookingPaymentDetails`, {
        method: 'POST',
        body: JSON.stringify({
          bookingId: booking.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        const paidAmount = parseFloat(data.paymentAmount || booking.totalAmount)
        const promoDiscount = parseFloat(data.promoDiscountAmount || 0)
        const packageDiscount = parseFloat(data.packageDiscountAmount || 0)
        const credit = parseFloat(data.creditAmount || 0)
        const totalDiscount = parseFloat(data.totalDiscountAmount || 0)
        const cardFee = parseFloat(data.cardFee || 0)
        const payNowFee = parseFloat(data.payNowFee || 0)
        const originalCost = parseFloat(data.totalCost || booking.totalAmount)
        const isCard = data.paymentMethod &&
          (data.paymentMethod.toLowerCase().includes('card') ||
            data.paymentMethod.toLowerCase().includes('credit'))

        setIsCardPayment(isCard)
        setPromoDiscountAmount(promoDiscount)
        setPackageDiscountAmount(packageDiscount)
        setCreditAmount(credit)
        setTotalDiscountAmount(totalDiscount)
        setCardFee(cardFee)
        setPayNowFee(payNowFee)
        setTotalCost(originalCost)

        if (isCard) {
          // Deduct dynamic % card fee AND admin refund fee
          const multiplier = 1 + (feeSettings.creditCardFeePercentage / 100)
          const amountAfterCardFee = paidAmount / multiplier
          const finalRefund = amountAfterCardFee - feeSettings.adminRefundFee
          setActualRefundAmount(Math.max(0, finalRefund))
        } else if (payNowFee > 0) {
          // Deduct dynamic PayNow transaction fee AND admin refund fee
          const amountAfterPayNowFee = paidAmount - feeSettings.paynowFee
          const finalRefund = amountAfterPayNowFee - feeSettings.adminRefundFee
          setActualRefundAmount(Math.max(0, finalRefund))
        } else {
          // Only deduct admin refund fee
          const finalRefund = paidAmount - feeSettings.adminRefundFee
          setActualRefundAmount(Math.max(0, finalRefund))
        }
      } else {
        // Fallback to booking amount
        setActualRefundAmount(Number(booking.totalAmount))
        setIsCardPayment(false)
        setPromoDiscountAmount(0)
        setPackageDiscountAmount(0)
        setCreditAmount(0)
        setTotalDiscountAmount(0)
        setCardFee(0)
        setPayNowFee(0)
        setTotalCost(Number(booking.totalAmount))
      }
    } catch (error) {
      console.error('Error fetching payment details:', error)
      // Fallback to booking amount
      setActualRefundAmount(Number(booking.totalAmount))
      setIsCardPayment(false)
      setPromoDiscountAmount(0)
      setPackageDiscountAmount(0)
      setCreditAmount(0)
      setTotalDiscountAmount(0)
      setCardFee(0)
      setPayNowFee(0)
      setTotalCost(Number(booking.totalAmount))
    }
  }

  // Submit refund request
  const handleSubmitRefund = async () => {
    if (!selectedBooking || !refundReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the refund request.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmittingRefund(true)

      // Get user ID from auth context
      const userId = authUser?.id

      if (!userId) {
        toast({
          title: "Error",
          description: "User ID not available. Please log in.",
          variant: "destructive"
        })
        return
      }

      await requestRefund(selectedBooking.id, refundReason, userId)

      toast({
        title: "Refund Approved",
        description: "Your refund has been approved and added to your store credits.",
      })

      setIsRefundDialogOpen(false)
      setSelectedBooking(null)
      setRefundReason('')

      // Reload bookings to reflect any status changes
      loadBookings()

    } catch (error) {
      console.error('Refund Request Error:', error)
      toast({
        title: "Error",
        description: "Failed to submit refund request. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmittingRefund(false)
    }
  }

  useEffect(() => {
    loadBookings()
    loadUserStats()
    loadPaymentFeeSettings()
  }, [])

  // Load payment fee settings from database
  const loadPaymentFeeSettings = async () => {
    try {
      const { getPaymentSettings } = await import('@/lib/paymentSettingsService')
      const settings = await getPaymentSettings()
      setFeeSettings({
        paynowFee: settings.PAYNOW_TRANSACTION_FEE,
        creditCardFeePercentage: settings.CREDIT_CARD_TRANSACTION_FEE_PERCENTAGE,
        adminRefundFee: settings.ADMIN_REFUND_FEE
      })
    } catch (error) {
      console.error('Error loading payment fee settings:', error)
    }
  }

  // Filter bookings by status (using frontend local timezone)
  const now = new Date()

  // Helper: Check if booking is cancelled by admin or refunded
  const isCancelledOrRefunded = (booking: Booking): boolean => {
    return booking.cancelledBy === 'admin' || booking.refundstatus === 'APPROVED'
  }

  const upcomingBookings = bookings
    .filter(booking => {
      // Only include paid bookings
      if (!booking.confirmedPayment) return false
      // Exclude cancelled by admin or refunded bookings
      if (isCancelledOrRefunded(booking)) return false
      if (booking.status === 'refunded' || booking.refundstatus === 'APPROVED') return false
      const startAt = new Date(booking.startAt)

      // Upcoming: bookings that haven't started yet
      return startAt > now
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()) // Earliest first

  const ongoingBookings = bookings
    .filter(booking => {
      // Only include paid bookings
      if (!booking.confirmedPayment) return false
      // Exclude cancelled by admin or refunded bookings
      if (isCancelledOrRefunded(booking)) return false
      if (booking.status === 'refunded' || booking.refundstatus === 'APPROVED') return false
      const startAt = new Date(booking.startAt)
      const endAt = new Date(booking.endAt)

      // Ongoing: bookings that are currently in progress (started and not ended)
      return startAt <= now && endAt > now
    })
    .sort((a, b) => {
      // Sort by earliest start time first (most recent ongoing booking)
      return new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    })

  const pastBookings = bookings
    .filter(booking => {
      // Only include paid bookings
      if (!booking.confirmedPayment) return false
      // Exclude cancelled by admin or refunded bookings
      if (isCancelledOrRefunded(booking)) return false
      if (booking.status === 'refunded' || booking.refundstatus === 'APPROVED') return false
      const endAt = new Date(booking.endAt)
      // Past: end time passed
      return endAt < now
    })
    .sort((a, b) => new Date(b.endAt).getTime() - new Date(a.endAt).getTime()) // Most recent first

  // Cancelled tab: Only show bookings cancelled by admin or refunded
  const cancelledBookings = bookings
    .filter(booking => booking.cancelledBy === 'admin' || booking.refundstatus === 'APPROVED')
    .sort((a, b) => {
      const aDate = new Date(a.updatedAt || a.createdAt || a.startAt).getTime()
      const bDate = new Date(b.updatedAt || b.createdAt || b.startAt).getTime()
      return bDate - aDate // Most recent first
    })

  // Update stats when bookings change
  useEffect(() => {
    setUserStats({
      upcomingBookings: upcomingBookings.length,
      ongoingBookings: ongoingBookings.length,
      pastBookings: pastBookings.length
    })
  }, [upcomingBookings.length, ongoingBookings.length, pastBookings.length])

  const currentBookings = ongoingBookings

  // Check if booking can be edited/rescheduled (≥5 hours in advance)
  const canEditBooking = (booking: Booking): boolean => {
    const now = new Date()
    // Handle both ISO string formats (with and without timezone)
    const bookingStart = new Date(booking.startAt.includes('Z') ? booking.startAt : booking.startAt + 'Z')
    const hoursDifference = (bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60)
    return hoursDifference >= 5
  }

  // Check if booking can be cancelled/refunded (≥5 hours in advance)
  const canCancelBooking = (booking: Booking): boolean => {
    const now = new Date()
    // Handle both ISO string formats (with and without timezone)
    const bookingStart = new Date(booking.startAt.includes('Z') ? booking.startAt : booking.startAt + 'Z')
    const hoursDifference = (bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60)
    return hoursDifference >= 5 && booking.confirmedPayment && booking.refundstatus === 'NONE'
  }

  // Check if booking can be extended (<5 hours before start OR ongoing, but NOT past)
  const canExtendBooking = (booking: Booking): boolean => {
    const now = new Date()
    // Handle both ISO string formats (with and without timezone)
    const bookingStart = new Date(booking.startAt.includes('Z') ? booking.startAt : booking.startAt + 'Z')
    const bookingEnd = new Date(booking.endAt.includes('Z') ? booking.endAt : booking.endAt + 'Z')
    const hoursDifference = (bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60)

    // Check if booking is past (ended)
    const isPast = now.getTime() > bookingEnd.getTime()
    if (isPast) {
      return false
    }

    // Check if booking is ongoing
    const isOngoing = now.getTime() >= bookingStart.getTime() && now.getTime() <= bookingEnd.getTime()

    // Can extend if:
    // 1. Less than 5 hours before start (hoursDifference < 5 and positive)
    // 2. Currently ongoing
    const canExtend = (hoursDifference < 5 && hoursDifference >= 0) || isOngoing

    return canExtend && booking.confirmedPayment && booking.refundstatus === 'NONE'
  }

  // Handle edit booking - navigate to book-now page
  const handleEdit = (booking: Booking) => {
    if (!canEditBooking(booking)) {
      toast({
        title: "Cannot Edit",
        description: "Bookings can only be edited 5 hours or more in advance",
        variant: "destructive",
      })
      return
    }

    // Navigate to book-now page with existing booking data
    // This will allow users to modify timing, dates, and seats
    // but not change member type
    const bookingData = encodeURIComponent(JSON.stringify({
      id: booking.id,
      startAt: booking.startAt,
      endAt: booking.endAt,
      location: booking.location,
      specialRequests: booking.specialRequests || '',
      totalAmount: booking.totalAmount,
      memberType: booking.User?.memberType || 'working_adult',
      isEditing: true
    }))

    window.location.href = `/book-now?edit=${bookingData}`
  }

  // Handle reschedule booking
  const handleReschedule = (booking: Booking) => {
    window.location.href = `/reschedule/${booking.id}`
  }

  // Handle extend booking
  const handleExtend = (booking: Booking) => {
    window.location.href = `/extend/${booking.id}`
  }





  // Get current tab bookings with sorting by most recent date/time first
  const getCurrentTabBookings = () => {
    let tabBookings: Booking[] = []

    switch (activeTab) {
      case 'upcoming':
        tabBookings = upcomingBookings
        break
      case 'ongoing':
        tabBookings = ongoingBookings
        break
      case 'past':
        tabBookings = pastBookings
        break
      case 'cancelled':
        tabBookings = cancelledBookings
        break
      default:
        return []
    }

    // Sort bookings by most recent date/time first
    return tabBookings.sort((a, b) => {
      // For upcoming bookings, sort by startAt (earliest first)
      if (activeTab === 'upcoming') {
        return new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      }
      // For ongoing bookings, sort by startAt (earliest first - most recent ongoing)
      if (activeTab === 'ongoing') {
        return new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      }
      // For past bookings, sort by endAt (most recent first)
      if (activeTab === 'past') {
        return new Date(b.endAt).getTime() - new Date(a.endAt).getTime()
      }
      // For cancelled bookings, sort by updatedAt or createdAt (most recent first)
      if (activeTab === 'cancelled') {
        const aDate = new Date(a.updatedAt || a.createdAt || a.startAt).getTime()
        const bDate = new Date(b.updatedAt || b.createdAt || b.startAt).getTime()
        return bDate - aDate
      }

      // Default sorting by startAt (most recent first)
      return new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
    })
  }

  const currentTabBookings = getCurrentTabBookings()


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">My Bookings</h2>
        <p className='text-orange-600 border border-orange-600 rounded-md p-1 px-4 text-xs inline mt-2'>All timezones are based on GMT+8</p>
      </div>



      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.upcomingBookings}</div>
            <p className="text-xs text-muted-foreground">
              Future bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ongoing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ongoingBookings.length}</div>
            <p className="text-xs text-muted-foreground">
              Active now
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Past</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.pastBookings}</div>
            <p className="text-xs text-muted-foreground">
              Completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cancelledBookings.length}</div>
            <p className="text-xs text-muted-foreground">
              Cancelled
            </p>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${bookings
                .filter(booking => booking.confirmedPayment) // Only include confirmed payments
                .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)
                .toFixed(2)}
            </div>
          
          </CardContent>
        </Card> */}



      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'upcoming'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Upcoming ({upcomingBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('ongoing')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'ongoing'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Ongoing ({ongoingBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'past'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Past ({pastBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'cancelled'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Cancelled ({cancelledBookings.length})
        </button>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'upcoming' ? 'Upcoming Bookings' :
              activeTab === 'ongoing' ? 'Ongoing Bookings' :
                activeTab === 'cancelled' ? 'Cancelled Bookings' : 'Past Bookings'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading bookings...</p>
            </div>
          ) : currentTabBookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <Calendar className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-gray-500 text-lg">
                {activeTab === 'upcoming' ? 'No upcoming bookings' :
                  activeTab === 'ongoing' ? 'No ongoing bookings' :
                    activeTab === 'cancelled' ? 'No cancelled bookings' : 'No past bookings'}
              </p>
              <p className="text-gray-400 text-sm">
                {activeTab === 'upcoming'
                  ? 'Book a study space to get started'
                  : activeTab === 'ongoing'
                    ? 'Your active bookings will appear here'
                    : activeTab === 'cancelled'
                      ? 'Your refunded bookings will appear here'
                      : 'Your completed bookings will appear here'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead>Booked For</TableHead>
                  <TableHead>Discount Type</TableHead>
                  <TableHead>Discount Amount</TableHead>
                  <TableHead>Amount</TableHead>
                  {/* <TableHead>Payment Method</TableHead> */}
                  {/* <TableHead>Status</TableHead> */}
                  <TableHead>Payment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTabBookings.filter(booking => booking.confirmedPayment).map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="font-mono font-bold">{booking.bookingRef}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{booking.location}</span>
                      </div>
                    </TableCell>
                    <TableCell className="w-32">
                      <div className="text-sm">
                        <div className="font-medium leading-tight">
                          {(() => {
                            const startDate = formatSingaporeDateOnly(booking.startAt);
                            const endDate = formatSingaporeDateOnly(booking.endAt);

                            // If same date, show date once
                            if (startDate === endDate) {
                              return (
                                <>
                                  <div>{startDate}</div>
                                  <div className="text-xs text-gray-500">Start: {formatSingaporeTimeOnly(booking.startAt)}</div>
                                  <div className="text-xs text-gray-500">End: {formatSingaporeTimeOnly(booking.endAt)}</div>
                                </>
                              );
                            }

                            // If different dates, show both dates
                            return (
                              <>
                                <div>{startDate}</div>
                                <div className="text-xs text-gray-500">Start: {formatSingaporeTimeOnly(booking.startAt)}</div>
                                <div>{endDate}</div>
                                <div className="text-xs text-gray-500">End: {formatSingaporeTimeOnly(booking.endAt)}</div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {calculateDurationSingapore(booking.startAt, booking.endAt).toFixed(2)} hrs
                      </div>
                    </TableCell>
                    <TableCell>
                      {booking.seatNumbers && booking.seatNumbers.length > 0 ? (
                        <div className="flex flex-row flex-wrap gap-1 items-center w-[80px]">
                          {booking.seatNumbers.map((seat, index) => (
                            <Badge key={index} variant="outline" className="text-xs whitespace-nowrap">
                              {seat}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">---</span>
                      )}
                    </TableCell>
                    <TableCell className="w-24">
                      <div className="text-sm">
                        {(() => {
                          const bookedFor = [];

                          if (booking.students > 0) bookedFor.push(`Students: ${booking.students}`);
                          if (booking.members > 0) bookedFor.push(`Members: ${booking.members}`);
                          if (booking.tutors > 0) bookedFor.push(`Tutors: ${booking.tutors}`);

                          if (bookedFor.length === 0) {
                            return <div className="text-gray-500">---</div>;
                          }

                          return (
                            <div className="leading-tight">
                              {bookedFor.map((item, index) => (
                                <div key={index} className="text-xs">
                                  {item}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {(() => {
                          // Check if discountHistory exists and has items
                          if (booking.discountHistory && booking.discountHistory.length > 0) {
                            // Get unique discount types from history
                            const discountTypes = new Set(
                              booking.discountHistory.map((d: any) => d.discountType)
                            );

                            // Convert to readable names
                            const typeNames: string[] = [];
                            if (discountTypes.has('CREDIT')) typeNames.push('Credit');
                            if (discountTypes.has('PASS')) typeNames.push('Package Applied');
                            if (discountTypes.has('PROMO_CODE')) typeNames.push('Promo Code');

                            if (typeNames.length > 0) {
                              return (
                                <div className="flex flex-wrap gap-1">
                                  {typeNames.map((name, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className={
                                        name === 'Credit' ? 'bg-green-50 text-green-700 border-green-200' :
                                          name === 'Package Applied' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                            'bg-blue-50 text-blue-700 border-blue-200'
                                      }
                                    >
                                      {name}
                                    </Badge>
                                  ))}
                                </div>
                              );
                            }
                          }

                          // Fallback to old logic if no discountHistory
                          if (booking.packageUsed && booking.packageId) {
                            return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Package</Badge>;
                          }
                          if (booking.promoCodeId || booking.PromoCode) {
                            return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Promo Code</Badge>;
                          }
                          if ((booking.discountamount || booking.discountAmount || 0) > 0) {
                            return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Credits</Badge>;
                          }
                          return <span className="text-gray-400 text-xs">---</span>;
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {(() => {
                          // Use discountSummary if available (new tracking system)
                          if (booking.discountSummary && booking.discountSummary.totalDiscount > 0) {
                            return `$${booking.discountSummary.totalDiscount.toFixed(2)}`;
                          }
                          // Fallback to old field
                          if ((booking.discountamount || booking.discountAmount || 0) > 0) {
                            return `$${(booking.discountamount || booking.discountAmount || 0).toFixed(2)}`;
                          }
                          return <span className="text-gray-400 text-xs">$0.00</span>;
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">${(booking.extensionamounts && booking.extensionamounts.length > 0 ? Number(booking.totalactualcost) : Number(booking.totalAmount)).toFixed(2)}</div>
                        {/* {booking.extensionamounts && booking.extensionamounts.length > 0 && (
                          <div className="text-xs text-blue-600">
                            Total: ${(() => {
                              const originalCost = booking.totalCost || 0
                              const extensionTotal = booking.extensionamounts.reduce((sum: number, amount: number) => sum + amount, 0)
                              return (originalCost + extensionTotal).toFixed(2)
                            })()}
                          </div>
                        )} */}
                      </div>

                      {/* <div className="text-sm">
                        <div className="font-medium">${booking.totalAmount}</div>
                        {booking.discountAmount && booking.discountAmount > 0 && (
                          <div className="text-xs text-green-600">
                            -${booking.discountAmount} off
                          </div>
                        )}
                        {booking.PromoCode && (
                          <div className="text-xs text-blue-600">
                            {booking.PromoCode.code} applied
                          </div>
                        )}
                      </div> */}
                    </TableCell>
                    {/* <TableCell>
                      <div className="text-sm">
                        {(() => {
                          // If payment method exists from backend, only show Card or PayNow
                          if (booking.paymentMethod) {
                            const method = booking.paymentMethod.toLowerCase();
                            if (method.includes('card') || method.includes('credit')) {
                              return <span className="font-medium">Card</span>;
                            } else if (method.includes('paynow') || method.includes('pay_now')) {
                              return <span className="font-medium">PayNow</span>;
                            }
                          }
                          // Default for all other cases
                          return <span className="text-gray-400 text-xs">---</span>;
                        })()}
                      </div>
                    </TableCell> */}
                    {/* <TableCell>
                      <Badge className={getStatusColor(getBookingStatus(booking))}>
                        {getBookingStatus(booking)}
                      </Badge>
                    </TableCell> */}
                    <TableCell>
                      {booking.confirmedPayment ? (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">
                            {booking.extensionamounts && booking.extensionamounts.length > 0 ? 'Paid' : 'Paid'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-red-600">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm">Unpaid</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        {/* {activeTab === 'upcoming' && canEditBooking(booking) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(booking)}
                            className="hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        )} */}

                        {activeTab === 'upcoming' && booking.confirmedPayment && booking.refundstatus === 'NONE' && (booking.rescheduleCount || 0) < 1 && canEditBooking(booking) && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReschedule(booking)}
                              className="hover:bg-orange-50 border-orange-200 text-orange-700"
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Reschedule
                            </Button>
                          </>
                        )}

                        {/* Tuya button shows in upcoming tab when reschedule is NOT available (less than 5 hours before) */}
                        {activeTab === 'upcoming' && booking.confirmedPayment && booking.refundstatus === 'NONE' &&
                          (!canEditBooking(booking)) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendTuyaLink(booking)}
                              disabled={sendingTuyaLink === booking.bookingRef}
                              className="hover:bg-green-50 border-green-200 text-green-700"
                            >
                              {sendingTuyaLink === booking.bookingRef ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Key className="h-4 w-4 mr-1" />
                              )}
                              {sendingTuyaLink === booking.bookingRef ? 'Sending...' : 'Door Access Link'}
                            </Button>
                          )}

                        {activeTab === 'upcoming' && canExtendBooking(booking) && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExtend(booking)}
                              className="hover:bg-blue-50 border-blue-200 text-blue-700"
                            >
                              <Timer className="h-4 w-4 mr-1" />
                              Extend
                            </Button>
                          </>
                        )}

                        {activeTab === 'upcoming' && canCancelBooking(booking) && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelBooking(booking)}
                            className="bg-red-500 hover:bg-red-500/90 text-white border-red-500 hover:border-red-500"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel & Refund
                          </Button>
                        )}





                        {activeTab === 'upcoming' && booking.confirmedPayment && booking.refundstatus !== 'NONE' && (
                          <div className="flex items-center gap-2">
                            <Badge
                              className={`text-xs ${booking.refundstatus === 'APPROVED'
                                ? 'bg-orange-100 text-orange-800 border-orange-200'
                                : booking.refundstatus === 'REJECTED'
                                  ? 'bg-red-100 text-red-800 border-red-200'
                                  : 'bg-orange-50 text-orange-700 border-orange-200'
                                }`}
                            >
                              {booking.refundstatus === 'REQUESTED' && 'Refund Requested'}
                              {booking.refundstatus === 'APPROVED' && 'Refund Approved'}
                              {booking.refundstatus === 'REJECTED' && 'Refund Rejected'}
                            </Badge>
                          </div>
                        )}

                        {activeTab === 'cancelled' && (
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(getBookingStatus(booking))}>
                              {getBookingStatus(booking)}
                            </Badge>
                          </div>
                        )}

                        {activeTab === 'upcoming' && !canEditBooking(booking) && !booking.confirmedPayment && (
                          <div className="text-sm text-gray-500">
                            <AlertTriangle className="h-4 w-4 inline mr-1" />
                            Cannot edit
                          </div>
                        )}

                        {activeTab === 'ongoing' && (
                          <>
                            {/* Tuya Door Access Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendTuyaLink(booking)}
                              disabled={sendingTuyaLink === booking.bookingRef}
                              className="hover:bg-green-50 border-green-200 text-green-700"
                            >
                              {sendingTuyaLink === booking.bookingRef ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Key className="h-4 w-4 mr-1" />
                              )}
                              {sendingTuyaLink === booking.bookingRef ? 'Sending...' : 'Door Access Link'}
                            </Button>


                            {booking.confirmedPayment && booking.refundstatus === 'NONE' && (booking.rescheduleCount || 0) < 1 && canEditBooking(booking) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReschedule(booking)}
                                className="hover:bg-orange-50 border-orange-200 text-orange-700"
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                Reschedule
                              </Button>
                            )}

                            {canExtendBooking(booking) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExtend(booking)}
                                className="hover:bg-blue-50 border-blue-200 text-blue-700"
                              >
                                <Timer className="h-4 w-4 mr-1" />
                                Extend Now
                              </Button>
                            )}

                            {canCancelBooking(booking) && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCancelBooking(booking)}
                                className="bg-red-500 hover:bg-red-500/90 text-white border-red-500 hover:border-red-500"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel & Refund
                              </Button>
                            )}
                          </>
                        )}

                        {activeTab === 'past' && (
                          <div className="text-sm text-gray-500">
                            Completed
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Special Requests Display */}
      {currentTabBookings.some(booking => booking.specialRequests) && (
        <Card>
          <CardHeader>
            <CardTitle>Special Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentTabBookings
                .filter(booking => booking.specialRequests)
                .map(booking => (
                  <div key={booking.id} className="border-l-4 border-orange-500 pl-4 py-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{booking.bookingRef}</div>
                        <div className="text-sm text-gray-600">{booking.specialRequests}</div>
                      </div>
                      <Badge variant="outline">{booking.location}</Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}








      {/* Refund Request Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Refund</DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4">


              <div className="space-y-2">

                <div className="p-3 bg-gray-50 rounded-md text-sm space-y-2">
                  <div><strong>Reference:</strong> {selectedBooking.bookingRef}</div>
                  <div><strong>Location:</strong> {selectedBooking.location}</div>
                  <div><strong>Date:</strong> {formatSingaporeDateOnly(selectedBooking.startAt)}</div>
                  <div><strong>Time:</strong> {formatSingaporeTimeOnly(selectedBooking.startAt)} - {formatSingaporeTimeOnly(selectedBooking.endAt)}</div>

                  <div className="border-t pt-2 mt-2 space-y-1">
                    {/* <div className="flex justify-between items-center">
                      <span>Booking Cost:</span>
                      <span>${totalCost.toFixed(2)}</span>
                    </div> */}
                    {/* {promoDiscountAmount > 0 && (
                      <div className="flex justify-between items-center text-green-600">
                        <span>Promo Code Discount:</span>
                        <span>-${promoDiscountAmount.toFixed(2)}</span>
                      </div>
                    )} */}
                    {/* {packageDiscountAmount > 0 && (
                      <div className="flex justify-between items-center text-green-600">
                        <span>Package Discount:</span>
                        <span>-${packageDiscountAmount.toFixed(2)}</span>
                      </div>
                    )} */}
                    {/* {creditAmount > 0 && (
                      <div className="flex justify-between items-center text-green-600">
                        <span>Store Credit Applied:</span>
                        <span>-${creditAmount.toFixed(2)}</span>
                      </div>
                    )} */}
                    {/* {cardFee > 0 && (
                      <div className="flex justify-between items-center text-blue-600">
                        <span>Credit Card Fee (5%):</span>
                        <span>+${cardFee.toFixed(2)}</span>
                      </div>
                    )}
                    {payNowFee > 0 && (
                      <div className="flex justify-between items-center text-blue-600">
                        <span>PayNow Transaction Fee:</span>
                        <span>+${payNowFee.toFixed(2)}</span>
                      </div>
                    )} */}
                    <div className="flex justify-between items-center font-medium pt-1">
                      <span>Amount Paid:</span>
                      <span>${Number(selectedBooking.totalAmount).toFixed(2)}</span>
                    </div>
                  </div>

                  {actualRefundAmount !== null && (
                    <div className="border-t pt-2 mt-2 bg-green-50 p-2 rounded">
                      <div className="flex justify-between items-center">
                        <span><strong>Refund Amount:</strong></span>
                        <span className="text-green-600 font-semibold text-lg">${actualRefundAmount.toFixed(2)}</span>
                      </div>
                      {isCardPayment && (
                        <div className="text-xs text-gray-600 mt-1">
                          * Credit card fee (${cardFee.toFixed(2)}) is non-refundable
                        </div>
                      )}
                      {payNowFee > 0 && (
                        <div className="text-xs text-gray-600 mt-1">
                          * PayNow transaction fee (${payNowFee.toFixed(2)}) is non-refundable
                        </div>
                      )}
                      {totalDiscountAmount > 0 && (
                        <div className="text-xs text-gray-600 mt-1">
                          * Discount, promo code if any, will not be refundable.
                        </div>
                      )}
                      <div className="text-xs text-gray-600 mt-1">
                        * Refund Policy: Refund is subjected to a non-refundable <strong>${feeSettings.adminRefundFee.toFixed(2)}</strong> admin fee.
                      </div>
                    </div>
                  )}



                  {/* Admin Refund Fee Disclaimer */}
                  {/* <div className="border-t pt-2 mt-2 bg-gray-100 p-3 rounded">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-gray-700">
                        <strong>Refund Policy:</strong> Refund is subjected to a non-refundable <strong>${feeSettings.adminRefundFee.toFixed(2)}</strong> admin fee.
                      </div>
                    </div>
                  </div> */}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refundReason">Reason for Refund *</Label>
                <Textarea
                  id="refundReason"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Please explain why you need a refund..."
                  className="w-full"
                  rows={4}
                />
              </div>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Approved refunds will be added to your store credits, which expire in 30 days. Store credits used cannot be refunded for any cancellation.
                  <br />
                  Any discounts, promo codes, packages, credit card fees, or PayNow transaction fees cannot be refunded.
                  <br />
                  Refund is subjected to a non-refundable ${feeSettings.adminRefundFee.toFixed(2)} admin fee.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsRefundDialogOpen(false)}
                  disabled={isSubmittingRefund}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitRefund}
                  disabled={isSubmittingRefund || !refundReason.trim()}
                  variant="destructive"
                >
                  {isSubmittingRefund ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Confirm Refund'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

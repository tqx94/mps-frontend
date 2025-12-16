// src/components/admin/BookingManagement.tsx - Admin booking management
'use client'

import { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Calendar, Users, DollarSign, Clock, MapPin, Eye, Edit, Trash2, Filter, BarChart3, FileText, Download, Loader2, AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { BookingDetailsModal } from './BookingDetailsModal'
import {
  Booking,
  BookingFilters,
  getAdminBookings,
  getDashboardSummary,
  getBookingAnalytics,
  updateAdminBooking,
  cancelAdminBooking,
  formatBookingDate,
  getBookingStatus,
  getStatusColor,
  calculateDuration,
  getAdminBookingDetails
} from '@/lib/bookingService'
import {
  formatSingaporeDate,
  formatSingaporeDateOnly,
  formatSingaporeTimeOnly,
  formatBookingDateRange,
  formatLocalDate
} from '@/lib/timezoneUtils'
import { authenticatedFetch } from '@/lib/apiClient'
import { getOperatingHours, getClosureDates, OperatingHours, ClosureDate } from '@/lib/shopHoursService'
import { isSameDay, addDays, setHours, setMinutes } from 'date-fns'

export function BookingManagement() {
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [filters, setFilters] = useState<BookingFilters>({
    page: 1,
    limit: 20,
    sortBy: 'startAt',
    sortOrder: 'desc'
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editFormData, setEditFormData] = useState({
    startAt: '',
    endAt: '',
    location: '',
    specialRequests: '',
    totalAmount: 0
  })

  // Shop hours state
  const [operatingHours, setOperatingHours] = useState<OperatingHours[]>([])
  const [closureDates, setClosureDates] = useState<ClosureDate[]>([])
  const [isLoadingShopHours, setIsLoadingShopHours] = useState(false)

  // Cancel Booking State
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [refundAmount, setRefundAmount] = useState<number>(0)
  const [locations, setLocations] = useState<string[]>([])
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailData, setDetailData] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)

  // Booking Timeline Modal state
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false)
  const [selectedBookingRef, setSelectedBookingRef] = useState('')

  // Debounced search state
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Date picker states
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  // Seat filter state
  const [selectedSeat, setSelectedSeat] = useState<string>('')
  const hasDateRange = !!startDate && !!endDate

  // Helper function to format date to YYYY-MM-DD in local timezone
  const formatDateToLocal = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Helper to format exact datetime as ISO
  const formatExact = (date: Date): string => {
    return date.toISOString()
  }

  // Load shop hours
  const loadShopHours = async (location: string) => {
    if (!location) return
    setIsLoadingShopHours(true)
    try {
      const [hours, closures] = await Promise.all([
        getOperatingHours(location),
        getClosureDates(location)
      ])
      setOperatingHours(hours)
      setClosureDates(closures)
    } catch (error) {
      console.error('Error loading shop hours:', error)
    } finally {
      setIsLoadingShopHours(false)
    }
  }

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
    const dayHours = operatingHours.find(h => h.dayOfWeek === dayOfWeek && h.isActive);

    // CRITICAL: Always show times even if hours aren't loaded yet (fallback)
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

    // Generate 15-min intervals within shop hours
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


  // Load dashboard data
  const loadDashboard = async () => {
    try {
      const response = await getDashboardSummary()
      if (response.success && response.dashboard) {
        setDashboardData(response.dashboard)
      }
    } catch (error) {
      console.error('Dashboard Error:', error)
    }
  }

  // Load analytics data
  const loadAnalytics = async () => {
    try {
      const response = await getBookingAnalytics('month')
      if (response.success && response.analytics) {
        setAnalyticsData(response.analytics)
      }
    } catch (error) {
      console.error('Analytics Error:', error)
    }
  }

  // Load bookings
  // Fetch locations from pricing configuration
  const fetchLocations = async () => {
    try {
      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/pricing`)
      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        // Extract unique locations
        const uniqueLocations = Array.from(new Set(data.data.map((item: any) => item.location))) as string[]
        setLocations(uniqueLocations.sort())
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
      // Fallback to default locations if fetch fails
      setLocations(['Kovan', 'Beauty World', 'Potong Pasir'])
    }
  }

  useEffect(() => {
    fetchLocations()
  }, [])

  const loadBookings = async () => {
    try {
      setLoading(true)
      const response = await getAdminBookings(filters)
      if (response.success) {
        setBookings(response.bookings || [])
        if (response.pagination) {
          setPagination(response.pagination)
        }
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

  useEffect(() => {
    loadDashboard()
    loadAnalytics()
  }, [])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchInput])

  // Update filters when debounced search changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearch, page: 1 }))
  }, [debouncedSearch])

  // Update filters when date/time picker values change
  // Only apply filter when end date is selected (or both are selected)
  useEffect(() => {
    if (endDate) {
      setFilters(prev => ({
        ...prev,
        dateFrom: startDate ? formatExact(startDate) : undefined,
        dateTo: formatExact(endDate),
        page: 1
      }))
    } else if (!startDate && !endDate) {
      // Clear filters when both dates are cleared
      setFilters(prev => ({
        ...prev,
        dateFrom: undefined,
        dateTo: undefined,
        page: 1
      }))
    }
  }, [startDate, endDate])

  // Update filters when seat selection or dates change
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      seatNumbers: selectedSeat || undefined,
      page: 1
    }))
  }, [selectedSeat])

  useEffect(() => {
    loadBookings()
  }, [filters])

  // Handle filter changes
  const handleFilterChange = (key: keyof BookingFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
      page: 1 // Reset to first page when filters change
    }))
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleLimitChange = (newLimit: number) => {
    setFilters(prev => ({
      ...prev,
      limit: newLimit,
      page: 1 // Reset to first page when limit changes
    }))
  }

  // Handle edit booking
  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking)
    setEditFormData({
      startAt: booking.startAt.slice(0, 16), // Format for datetime-local input
      endAt: booking.endAt.slice(0, 16),
      location: booking.location,
      specialRequests: booking.specialRequests || '',
      totalAmount: booking.totalAmount
    })
    setIsEditDialogOpen(true)
    // Load shop hours for the booking's location
    loadShopHours(booking.location)
  }

  // Reload shop hours when location changes in edit form
  useEffect(() => {
    if (isEditDialogOpen && editFormData.location) {
      loadShopHours(editFormData.location)
    }
  }, [editFormData.location, isEditDialogOpen])

  // Handle cancel booking click
  const handleCancelClick = (booking: Booking) => {
    setCancellingBooking(booking)
    setCancelReason('')
    setRefundAmount(booking.totalAmount) // Default to full refund
    setIsCancelDialogOpen(true)
  }

  // Confirm cancel booking
  const confirmCancel = async () => {
    if (!cancellingBooking) return

    setIsSubmitting(true)
    try {
      const response = await cancelAdminBooking(cancellingBooking.id, {
        reason: cancelReason,
        refundAmount: refundAmount
      })

      if (response.success) {
        toast({
          title: "Success",
          description: "Booking cancelled successfully",
        })
        setIsCancelDialogOpen(false)
        setCancellingBooking(null)
        loadBookings()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to cancel booking",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Cancel Error:', error)
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle update booking
  const handleUpdate = async () => {
    if (!editingBooking) return

    setIsSubmitting(true)
    try {
      const payload = {
        startAt: new Date(editFormData.startAt).toISOString(),
        endAt: new Date(editFormData.endAt).toISOString(),
        location: editFormData.location,
        specialRequests: editFormData.specialRequests,
        totalAmount: editFormData.totalAmount
      }

      const response = await updateAdminBooking(editingBooking.id, payload)
      if (response.success) {
        toast({
          title: "Success",
          description: "Booking updated successfully",
        })
        setIsEditDialogOpen(false)
        setEditingBooking(null)
        loadBookings()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update booking",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Update Error:', error)
      toast({
        title: "Error",
        description: "Failed to update booking",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Export to Excel
  const exportToExcel = async () => {
    try {
      // Call the same API but with limit 1000 to get all records
      const exportFilters = { ...filters, limit: 1000, page: 1 }
      const response = await getAdminBookings(exportFilters)

      if (response.success && response.bookings) {
        // Convert bookings data to CSV format
        const csvData = convertBookingsToCSV(response.bookings)
        downloadCSV(csvData, 'bookings-export.csv')

        toast({
          title: "Success",
          description: `Exported ${response.bookings.length} bookings to Excel`,
        })
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to export bookings",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error exporting bookings:', error)
      toast({
        title: "Error",
        description: "Failed to export bookings",
        variant: "destructive",
      })
    }
  }

  const convertBookingsToCSV = (bookings: Booking[]): string => {
    const headers = [
      'ID',
      'Booking Ref',
      'User Email',
      'Start Time',
      'End Time',
      'Duration (hours)',
      'Location',
      'Member Type',
      'Special Requests',
      'Total Amount',
      'Extension Amounts',
      'Total Actual Cost',
      'Status',
      'Payment Status',
      'Pax',
      'Students',
      'Members',
      'Tutors'
    ]

    const rows = bookings.map(booking => {
      const extensionAmounts = booking.extensionamounts && booking.extensionamounts.length > 0
        ? booking.extensionamounts.join('; ')
        : 'None'
      const totalActualCost = booking.extensionamounts && booking.extensionamounts.length > 0
        ? ((booking.totalCost || 0) + booking.extensionamounts.reduce((sum: number, amount: number) => sum + amount, 0)).toFixed(2)
        : booking.totalAmount

      return [
        booking.id,
        booking.bookingRef,
        booking.bookedForEmails?.[0] || 'N/A',
        formatBookingDate(booking.startAt),
        formatBookingDate(booking.endAt),
        calculateDuration(booking.startAt, booking.endAt),
        booking.location,
        booking.memberType,
        booking.specialRequests || '',
        booking.totalAmount,
        extensionAmounts,
        totalActualCost,
        getBookingStatus(booking),
        booking.confirmedPayment ? 'PAID' : 'UNPAID',
        booking.pax,
        booking.students,
        booking.members,
        booking.tutors
      ]
    })

    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
  }

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }



  // Format date for datetime-local input
  const formatDateForInput = (dateString: string): string => {
    return dateString.slice(0, 16)
  }



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Booking Management</h2>
          <p className="text-gray-600">Manage all bookings and view analytics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={loadAnalytics}
            className="flex items-center space-x-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Refresh Analytics</span>
          </Button>

          <Button
            variant="outline"
            onClick={exportToExcel}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export to Excel</span>
          </Button>
        </div>
      </div>



      {/* Search and Date Filters */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="search">Search Bookings</Label>
              <div className="relative">
                {loading && searchInput ? (
                  <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                )}
                <Input
                  id="search"
                  placeholder="Search by booking ref or email"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Start Time Filter */}
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Start Time</Label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                showTimeSelect
                timeIntervals={15}
                dateFormat="MMM d, yyyy h:mm aa"
                placeholderText="Select start time"
                className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
                wrapperClassName="w-full"
              />
            </div>

            {/* End Time Filter */}
            <div className="space-y-2">
              <Label htmlFor="dateTo">End Time</Label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                showTimeSelect
                timeIntervals={15}
                dateFormat="MMM d, yyyy h:mm aa"
                placeholderText="Select end time"
                className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
                wrapperClassName="w-full"
              />
            </div>

            {/* Seat Filter */}
            <div className="space-y-2">
              <Label htmlFor="seatFilter">Seat Filter</Label>
              <Select value={selectedSeat} onValueChange={(val) => setSelectedSeat(val === 'ALL' ? '' : val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select seat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Seats</SelectItem>
                  {Array.from({ length: 15 }, (_, i) => (
                    <SelectItem key={`S${i + 1}`} value={`S${i + 1}`}>
                      S{i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* If needed, admin can also narrow by date using the date filters above */}
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setSearchInput('')
                setDebouncedSearch('')
                setStartDate(null)
                setEndDate(null)
                setSelectedSeat('')
                setFilters({
                  page: 1,
                  limit: 20,
                  sortBy: 'startAt',
                  sortOrder: 'desc'
                })
              }}
              className="flex items-center space-x-2"
            >
              <AlertCircle className="h-4 w-4" />
              <span>Clear Filters</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-gray-500 text-lg">No bookings found</p>
              <p className="text-gray-400 text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Pax</TableHead>
                      <TableHead>Seats</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Amount Paid</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Refund Status</TableHead>
                      <TableHead>Reschedule</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="font-mono font-bold">{booking.bookingRef}</div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {booking.bookedForEmails?.[0]?.split('@')[0] || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.bookedForEmails?.[0] || 'N/A'}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {booking.memberType || 'N/A'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{booking.location}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{booking.pax || 0}</div>
                            <div className="text-xs text-gray-500">
                              S:{booking.students || 0} M:{booking.members || 0} T:{booking.tutors || 0}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {booking.seatNumbers && booking.seatNumbers.length > 0 ? booking.seatNumbers.join(', ') : 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{formatBookingDateRange(booking.startAt, booking.endAt)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {booking.durationHours ? `${booking.durationHours}h` : `${calculateDuration(booking.startAt, booking.endAt)}h`}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">${booking.totalCost || 0}</div>
                            {(booking.discountAmount && booking.discountAmount > 0) ? (
                              <div className="text-xs text-green-600">
                                -${booking.discountAmount} off
                              </div>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">${booking.totalAmount || 0}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {booking.packageUsed ? (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                Used
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {booking.refundstatus && booking.refundstatus !== 'NONE' ? (
                              <Badge
                                variant="outline"
                                className={booking.refundstatus === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                              >
                                {booking.refundstatus}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {(booking.rescheduleCount || 0) > 0 ? (
                              <Badge variant="outline" className="bg-orange-100 text-orange-800">
                                {booking.rescheduleCount}x
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(getBookingStatus(booking))}>
                            {getBookingStatus(booking)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={booking.confirmedPayment ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          >
                            {booking.confirmedPayment ? 'Paid' : 'Unpaid'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(booking)}
                              title="Modify Booking"
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelClick(booking)}
                              title="Cancel Booking"
                              disabled={
                                booking.status === 'cancelled' || 
                                booking.status === 'completed' ||
                                booking.status === 'Cancelled by Admin' ||
                                booking.cancelledBy === 'admin' ||
                                (booking.refundstatus && booking.refundstatus !== 'NONE')
                              }
                            >
                              <Trash2 className={`h-4 w-4 ${
                                booking.status === 'cancelled' || 
                                booking.status === 'completed' ||
                                booking.status === 'Cancelled by Admin' ||
                                booking.cancelledBy === 'admin' ||
                                (booking.refundstatus && booking.refundstatus !== 'NONE')
                                  ? 'text-gray-300' 
                                  : 'text-red-600'
                              }`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                setIsDetailDialogOpen(true)
                                setDetailLoading(true)
                                setDetailData(null)
                                try {
                                  const resp = await getAdminBookingDetails(booking.id || booking.bookingRef)
                                  if (resp && resp.success) {
                                    setDetailData(resp.data)
                                  }
                                  // Fetch activities separately
                                  setLoadingActivities(true)
                                  try {
                                    const activityResp = await authenticatedFetch(
                                      `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/booking-activity/comprehensive/${booking.bookingRef}`
                                    )
                                    const activityData = await activityResp.json()
                                    if (activityData.success && activityData.data?.activities) {
                                      setActivities(activityData.data.activities)
                                    }
                                  } catch (activityError) {
                                    console.error('Error fetching activities:', activityError)
                                    setActivities([])
                                  } finally {
                                    setLoadingActivities(false)
                                  }
                                } catch (e) {
                                  // no-op
                                } finally {
                                  setDetailLoading(false)
                                }
                              }}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {/* <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBookingRef(booking.bookingRef)
                                setIsTimelineModalOpen(true)
                              }}
                              title="View Timeline & History"
                            >
                              <Info className="h-4 w-4" />
                            </Button> */}
                          </div>
                        </TableCell>

                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>
                          Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                          {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                          {pagination.total} bookings
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">Rows per page:</span>
                          <Select value={pagination.limit.toString()} onValueChange={(value) => handleLimitChange(parseInt(value))}>
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(1)}
                            disabled={pagination.page === 1}
                          >
                            <ChevronsLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>

                          <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                              let pageNum: number
                              if (pagination.totalPages <= 5) {
                                pageNum = i + 1
                              } else if (pagination.page <= 3) {
                                pageNum = i + 1
                              } else if (pagination.page >= pagination.totalPages - 2) {
                                pageNum = pagination.totalPages - 4 + i
                              } else {
                                pageNum = pagination.page - 2 + i
                              }

                              return (
                                <Button
                                  key={pageNum}
                                  variant={pagination.page === pageNum ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handlePageChange(pageNum)}
                                  className="w-8 h-8 p-0"
                                >
                                  {pageNum}
                                </Button>
                              )
                            })}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.totalPages)}
                            disabled={pagination.page === pagination.totalPages}
                          >
                            <ChevronsRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Booking Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modify Booking</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="startAt">Start Time</Label>
              <div className="relative">
                <DatePicker
                  selected={editFormData.startAt ? new Date(editFormData.startAt) : null}
                  onChange={(date) => setEditFormData({ ...editFormData, startAt: date ? date.toISOString() : '' })}
                  showTimeSelect
                  timeIntervals={15}
                  dateFormat="MMM d, yyyy h:mm aa"
                  placeholderText="Select start time"
                  className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
                  wrapperClassName="w-full"
                  excludeDates={getExcludedDates()}
                  includeTimes={getAvailableTimes(editFormData.startAt ? new Date(editFormData.startAt) : null)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endAt">End Time</Label>
              <div className="relative">
                <DatePicker
                  selected={editFormData.endAt ? new Date(editFormData.endAt) : null}
                  onChange={(date) => setEditFormData({ ...editFormData, endAt: date ? date.toISOString() : '' })}
                  showTimeSelect
                  timeIntervals={15}
                  dateFormat="MMM d, yyyy h:mm aa"
                  placeholderText="Select end time"
                  className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
                  wrapperClassName="w-full"
                  excludeDates={getExcludedDates()}
                  includeTimes={getAvailableTimes(editFormData.endAt ? new Date(editFormData.endAt) : null)}
                  minDate={editFormData.startAt ? new Date(editFormData.startAt) : undefined}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={editFormData.location}
                onValueChange={(val) => setEditFormData({ ...editFormData, location: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.length > 0 ? (
                    locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="Kovan">Kovan</SelectItem>
                      <SelectItem value="Beauty World">Beauty World</SelectItem>
                      <SelectItem value="Potong Pasir">Potong Pasir</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="totalAmount">Total Amount ($)</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                value={editFormData.totalAmount}
                onChange={(e) => setEditFormData({ ...editFormData, totalAmount: parseFloat(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="specialRequests">Special Requests</Label>
              <Textarea
                id="specialRequests"
                value={editFormData.specialRequests}
                onChange={(e) => setEditFormData({ ...editFormData, specialRequests: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Booking Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">Cancellation Reason</Label>
              <Textarea
                id="reason"
                placeholder="e.g. User requested, Emergency maintenance"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="refundAmount">Refund Amount ($)</Label>
              <Input
                id="refundAmount"
                type="number"
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(parseFloat(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Original Total: ${cancellingBooking?.totalAmount || 0}
              </p>
            </div>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This action will cancel the booking. Please process any refunds manually if required.
              </AlertDescription>
            </Alert>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              Keep Booking
            </Button>
            <Button variant="destructive" onClick={confirmCancel} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Confirm Cancellation'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Booking Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => {
        setIsDetailDialogOpen(open)
        if (!open) {
          setDetailData(null)
          setActivities([])
        }
      }}>
        <DialogContent className="min-w-3xl max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="py-6 text-center text-gray-500">
              <Loader2 className="h-5 w-5 inline animate-spin mr-2" /> Loading details...
            </div>
          ) : detailData ? (
            <div className="space-y-6">
              {/* Header summary */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="font-mono text-lg font-semibold">{detailData.booking.bookingRef}</div>
                {/* <div className="flex items-center gap-2">
              <Badge variant="outline" className={detailData.booking.confirmedPayment ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {detailData.booking.confirmedPayment ? 'Paid' : 'Unpaid'}
              </Badge>
              <Badge variant="outline">{detailData.booking.memberType || 'N/A'}</Badge>
            </div> */}
              </div>

              {/* Booking + User */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Booking</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Basic Booking Info */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-sm">
                      <div className="text-gray-500">Location</div><div>{detailData.booking.location}</div>
                      <div className="text-gray-500">Dates</div><div>{formatBookingDateRange(detailData.booking.startAt, detailData.booking.endAt)}</div>
                      <div className="text-gray-500">Seats</div><div className="break-words">{detailData.booking.seatNumbers?.length ? detailData.booking.seatNumbers.join(', ') : '-'}</div>
                      <div className="text-gray-500">Pax</div><div>{detailData.booking.pax} (S:{detailData.booking.students} M:{detailData.booking.members} T:{detailData.booking.tutors})</div>
                      <div className="text-gray-500">Refund Status</div><div>{detailData.booking.refundstatus || 'NONE'}</div>
                      {detailData.booking.refundreason ? (<><div className="text-gray-500">Refund Reason</div><div>{detailData.booking.refundreason}</div></>) : null}
                    </div>

                    {/* Payment Breakdown */}
                    <div className="border-t pt-4 space-y-4">
                      <h4 className="font-semibold text-sm">Payment Breakdown</h4>
                      
                      {/* Original Booking Payment */}
                      <div className="border-b pb-3">
                        <h5 className="font-medium text-xs mb-2 text-gray-700">Original Booking</h5>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          <div className="text-gray-500">Base Cost</div>
                          <div className="font-medium">${(detailData.booking.totalCost || 0).toFixed(2)}</div>
                          
                          {/* Discounts Breakdown */}
                          {detailData.discountHistory && detailData.discountHistory.length > 0 ? (
                            <>
                              {detailData.discountHistory
                                .filter((d: any) => d.actionType === 'ORIGINAL_BOOKING')
                                .map((discount: any, idx: number) => (
                                  <div key={idx} className="col-span-2 grid grid-cols-2 gap-x-4">
                                    <div className="text-gray-500 pl-4">
                                      - {discount.discountType === 'PROMO_CODE' ? 'Promo Code' : discount.discountType === 'CREDIT' ? 'Credits' : discount.discountType === 'PASS' ? 'Package/Pass' : 'Discount'}
                                    </div>
                                    <div className="text-green-600">-${(parseFloat(discount.discountAmount) || 0).toFixed(2)}</div>
                                  </div>
                                ))}
                            </>
                          ) : null}
                          
                          {detailData.booking.discountAmount && detailData.booking.discountAmount > 0 && (!detailData.discountHistory || detailData.discountHistory.length === 0) ? (
                            <>
                              <div className="text-gray-500">Total Discount</div>
                              <div className="text-green-600">-${(detailData.booking.discountAmount || 0).toFixed(2)}</div>
                            </>
                          ) : null}
                          
                          {detailData.paymentFee && detailData.paymentFee > 0 ? (
                            <>
                              <div className="text-gray-500">Payment Fee</div>
                              <div className="text-orange-600">+${(detailData.paymentFee || 0).toFixed(2)}</div>
                            </>
                          ) : null}
                          
                          <div className="text-gray-700 font-semibold pt-1 border-t">Amount Paid</div>
                          <div className="text-gray-700 font-semibold pt-1 border-t">
                            ${(() => {
                              // Calculate actual amount paid: Base Cost - Discounts + Fees
                              const baseCost = parseFloat(detailData.booking.totalCost || 0);
                              const totalDiscounts = detailData.discountHistory && detailData.discountHistory.length > 0
                                ? detailData.discountHistory
                                    .filter((d: any) => d.actionType === 'ORIGINAL_BOOKING')
                                    .reduce((sum: number, d: any) => sum + (parseFloat(d.discountAmount) || 0), 0)
                                : (parseFloat(detailData.booking.discountAmount) || 0);
                              const paymentFee = parseFloat(detailData.paymentFee || 0);
                              
                              // If credits/discounts fully cover the cost, amount paid should be 0
                              // Formula: Base Cost - Total Discounts + Payment Fees
                              const amountPaid = Math.max(0, baseCost - totalDiscounts + paymentFee);
                              
                              return amountPaid.toFixed(2);
                            })()}
                          </div>
                        </div>
                        
                        {(() => {
                          // Calculate if credits fully covered the booking
                          const baseCost = parseFloat(detailData.booking.totalCost || 0);
                          const totalDiscounts = detailData.discountHistory && detailData.discountHistory.length > 0
                            ? detailData.discountHistory
                                .filter((d: any) => d.actionType === 'ORIGINAL_BOOKING')
                                .reduce((sum: number, d: any) => sum + (parseFloat(d.discountAmount) || 0), 0)
                            : (parseFloat(detailData.booking.discountAmount) || 0);
                          const paymentFee = parseFloat(detailData.paymentFee || 0);
                          const amountPaid = Math.max(0, baseCost - totalDiscounts + paymentFee);
                          
                          if (amountPaid === 0 && totalDiscounts > 0) {
                            // Credits fully covered the booking
                            return (
                              <div className="mt-2 text-xs text-green-600 font-medium">
                                Fully paid via Credits/Discounts - No payment required
                              </div>
                            );
                          } else if (detailData.allPayments && detailData.allPayments.length > 0 && detailData.allPayments[0]) {
                            // Show payment method and date
                            return (
                              <div className="mt-2 text-xs text-gray-500">
                                Paid via {detailData.allPayments[0].paymentMethod?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'N/A'} on{' '}
                                {formatLocalDate(detailData.allPayments[0].paidAt || detailData.allPayments[0].createdAt, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* Reschedule Payments */}
                      {detailData.allPayments && detailData.allPayments.length > 1 ? (
                        <div className="space-y-3">
                          <h5 className="font-medium text-xs text-gray-700">Reschedule Payments</h5>
                          {(detailData.allPayments || []).slice(1).map((payment: any, idx: number) => {
                            // Find corresponding activity for this payment
                            const rescheduleActivity = activities.find((a: any) => 
                              a.activityType === 'RESCHEDULE_APPROVED' && 
                              a.createdAt && 
                              Math.abs(new Date(a.createdAt).getTime() - new Date(payment.createdAt).getTime()) < 60000
                            );
                            
                            return (
                              <div key={payment.id || idx} className="border rounded p-3 bg-gray-50">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium text-gray-700">Reschedule #{idx + 1}</span>
                                  <span className="text-xs text-gray-500">
                                    {formatLocalDate(payment.paidAt || payment.createdAt, {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true
                                    })}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                  <div className="text-gray-500">Additional Amount</div>
                                  <div className="font-medium text-blue-600">+${(parseFloat(payment.amount) || 0).toFixed(2)}</div>
                                  
                                  {/* Reschedule-specific discounts */}
                                  {detailData.discountHistory && detailData.discountHistory.length > 0 ? (
                                    <>
                                      {detailData.discountHistory
                                        .filter((d: any) => d.actionType === 'RESCHEDULE' && 
                                          new Date(d.appliedAt).getTime() >= new Date(payment.createdAt).getTime() - 60000 &&
                                          new Date(d.appliedAt).getTime() <= new Date(payment.createdAt).getTime() + 60000)
                                        .map((discount: any, discountIdx: number) => (
                                          <div key={discountIdx} className="col-span-2 grid grid-cols-2 gap-x-4">
                                            <div className="text-gray-500 pl-4">
                                              - {discount.discountType === 'CREDIT' ? 'Credits' : discount.discountType === 'PROMO_CODE' ? 'Promo Code' : 'Discount'}
                                            </div>
                                            <div className="text-green-600">-${(parseFloat(discount.discountAmount) || 0).toFixed(2)}</div>
                                          </div>
                                        ))}
                                    </>
                                  ) : null}
                                  
                                  <div className="text-gray-700 font-semibold pt-1 border-t">Amount Paid</div>
                                  <div className="text-gray-700 font-semibold pt-1 border-t">
                                    ${(parseFloat(payment.amount) || 0).toFixed(2)}
                                  </div>
                                </div>
                                <div className="mt-2 text-xs text-gray-500">
                                  Via {payment.paymentMethod?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'N/A'}
                                </div>
                                {rescheduleActivity && rescheduleActivity.metadata ? (
                                  <div className="mt-2 text-xs text-gray-600">
                                    <div>Old: {rescheduleActivity.metadata.originalStartAt ? formatSingaporeDate(rescheduleActivity.metadata.originalStartAt) : 'N/A'}</div>
                                    <div>New: {rescheduleActivity.metadata.newStartAt ? formatSingaporeDate(rescheduleActivity.metadata.newStartAt) : 'N/A'}</div>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}

                      {/* Total Summary */}
                      <div className="border-t pt-3">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-semibold">
                          <div className="text-gray-700">Total Base Cost</div>
                          <div className="text-gray-700">${(detailData.booking.totalCost || 0).toFixed(2)}</div>
                          
                          <div className="text-gray-700">Total Discounts</div>
                          <div className="text-green-600">
                            -${(detailData.discountHistory && detailData.discountHistory.length > 0
                              ? detailData.discountHistory.reduce((sum: number, d: any) => sum + (parseFloat(d.discountAmount) || 0), 0)
                              : detailData.booking.discountAmount || 0).toFixed(2)}
                          </div>
                          
                          <div className="text-gray-700">Total Payment Fees</div>
                          <div className="text-orange-600">+${(detailData.paymentFee || 0).toFixed(2)}</div>
                          
                          <div className="text-base text-gray-900 pt-2 border-t">Total Amount Paid</div>
                          <div className="text-base text-gray-900 pt-2 border-t">
                            ${(() => {
                              // Calculate total amount paid: Base Cost - All Discounts + Fees
                              // If credits fully covered, this should be 0
                              const totalBaseCost = parseFloat(detailData.booking.totalCost || 0);
                              const totalDiscounts = detailData.discountHistory && detailData.discountHistory.length > 0
                                ? detailData.discountHistory.reduce((sum: number, d: any) => sum + (parseFloat(d.discountAmount) || 0), 0)
                                : (parseFloat(detailData.booking.discountAmount) || 0);
                              const totalPaymentFees = parseFloat(detailData.paymentFee || 0);
                              
                              // Formula: Base Cost - Total Discounts + Payment Fees
                              // If discounts fully cover, result will be 0 or less, so show 0
                              const totalAmountPaid = Math.max(0, totalBaseCost - totalDiscounts + totalPaymentFees);
                              
                              return totalAmountPaid.toFixed(2);
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>


                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">User</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="text-gray-500">Email</div><div className="break-all">{detailData.user?.email || '-'}</div>
                    <div className="text-gray-500">Name</div><div>{detailData.user?.firstName && detailData.user?.lastName ? `${detailData.user.firstName} ${detailData.user.lastName}` : (detailData.user?.firstName || detailData.user?.lastName || '-')}</div>
                    <div className="text-gray-500">Phone</div><div>{detailData.user?.contactNumber || '-'}</div>
                    <div className="text-gray-500">Role</div><div>{detailData.user?.memberType || '-'}</div>
                    <div className="text-gray-500">Booked For</div><div className="break-all">{detailData.booking.bookedForEmails?.join(', ') || '-'}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment + Promo/Package */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Promo / Package</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="text-gray-500">Promo Code</div><div>{detailData.promoCode?.code || '-'}</div>
                    <div className="text-gray-500">Package Used</div><div>{detailData.booking.packageUsed ? 'Yes' : 'No'}</div>
                    {detailData.package ? (
                      <>
                        <div className="text-gray-500">Plan</div><div>{detailData.package.packageName || (detailData.package.packageId ? 'Count-based Pass' : '-')}</div>
                        <div className="text-gray-500">Quantity</div><div>{detailData.package.quantity ?? '-'}</div>
                        <div className="text-gray-500">Active</div><div>{detailData.package.isActive ? 'Yes' : 'No'}</div>
                      </>
                    ) : (
                      <>
                        <div className="text-gray-500">Plan</div><div>-</div>
                        <div className="text-gray-500">Quantity</div><div>-</div>
                        <div className="text-gray-500">Active</div><div>-</div>

                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* User Activity + Audit */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                {/* <Card>
              <CardHeader>
                <CardTitle className="text-sm">User Activity</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-gray-500">Total Bookings</div><div>{detailData.userStats?.totalBookings ?? '-'}</div>
                <div className="text-gray-500">Total Spent</div><div>{detailData.userStats ? `$${detailData.userStats.totalSpent.toFixed(2)}` : '-'}</div>
                <div className="text-gray-500">Last Booking</div><div>{detailData.userStats?.lastBookingAt ? formatBookingDate(detailData.userStats.lastBookingAt) : '-'}</div>
                <div className="text-gray-500">Recent Bookings</div>
                <div className="space-y-1">
                  {Array.isArray(detailData.recentBookings) && detailData.recentBookings.length > 0 ? (
                    detailData.recentBookings.map((b: any) => (
                      <div key={b.id} className="text-xs flex items-center justify-between gap-2">
                        <span className="font-mono">{b.bookingRef}</span>
                        </div>
                    ))
                  ) : (
                    <span className="text-gray-400">No recent bookings</span>
                  )}
                </div>
              </CardContent>
            </Card> */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Audit</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="text-gray-500">Booked At</div><div>{formatLocalDate(detailData.booking.bookedAt || detailData.booking.createdAt, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}</div>
                  <div className="text-gray-500">Reschedules</div><div>{detailData.booking.rescheduleCount || 0}</div>
                </div> */}

                    {/* Activity Timeline */}
                    <div className="">
                      {/* <div className="text-sm font-medium mb-3">Activity Timeline</div> */}
                      {loadingActivities ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                        </div>
                      ) : activities && activities.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {activities.map((activity: any, index: number) => {
                            // Helper function to calculate transaction fee based on payment method and amount
                            const calculateTransactionFee = (amount: number, paymentMethod?: string): number => {
                              if (!amount || amount <= 0) return 0;
                              
                              if (!paymentMethod) return 0;
                              
                              const method = paymentMethod.toLowerCase();
                              
                              // PayNow: $0.20 for amounts < $10, $0 for >= $10
                              if (method.includes('paynow') || method.includes('pay_now')) {
                                return amount < 10 ? 0.20 : 0;
                              }
                              
                              // Credit Card: Typically 5% (or configured percentage)
                              if (method.includes('card') || method.includes('credit')) {
                                // Default 5%, but could be from settings
                                const cardFeePercentage = 5.0;
                                return (amount * cardFeePercentage) / 100;
                              }
                              
                              return 0;
                            };

                            // Match activity with payment based on timestamp
                            const findMatchingPayment = (): any => {
                              if (!detailData?.allPayments || !activity.createdAt) return null;
                              
                              return detailData.allPayments.find((payment: any) => {
                                if (!payment.createdAt && !payment.paidAt) return false;
                                
                                const activityTime = new Date(activity.createdAt).getTime();
                                const paymentTime = new Date(payment.paidAt || payment.createdAt).getTime();
                                
                                // Match if within 2 minutes (120000ms)
                                return Math.abs(activityTime - paymentTime) < 120000;
                              });
                            };

                            // For BOOKING_CREATED, use first payment (original booking payment)
                            let matchedPayment: any = null;
                            if (activity.activityType === 'BOOKING_CREATED' || activity.activityType === 'PACKAGE_USED' || activity.activityType === 'CREDIT_USED') {
                              matchedPayment = detailData?.allPayments?.[0] || null;
                            } else {
                              matchedPayment = findMatchingPayment();
                            }

                            // Get payment details - check multiple possible field names
                            const paymentAmount = matchedPayment?.amount ? parseFloat(matchedPayment.amount) : 
                                                  matchedPayment?.totalAmount ? parseFloat(matchedPayment.totalAmount) :
                                                  (activity.amount || null);
                            const paymentMethod = matchedPayment?.paymentMethod || matchedPayment?.paymentmethod || null;
                            const transactionFee = paymentAmount && paymentMethod ? calculateTransactionFee(paymentAmount, paymentMethod) : null;

                            return (
                              <div key={activity.id || index} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100">
                                    {activity.activityType === 'BOOKING_CREATED' && <Calendar className="w-3 h-3 text-blue-500" />}
                                    {activity.activityType === 'PAYMENT_CONFIRMED' && <DollarSign className="w-3 h-3 text-green-500" />}
                                    {activity.activityType === 'RESCHEDULE_APPROVED' && <Clock className="w-3 h-3 text-blue-500" />}
                                    {activity.activityType === 'EXTEND_APPROVED' && <Clock className="w-3 h-3 text-teal-500" />}
                                    {activity.activityType === 'CREDIT_USED' && <DollarSign className="w-3 h-3 text-orange-500" />}
                                    {activity.activityType === 'PACKAGE_USED' && <DollarSign className="w-3 h-3 text-purple-500" />}
                                    {activity.activityType === 'REFUND_APPROVED' && <DollarSign className="w-3 h-3 text-yellow-500" />}
                                    {!['BOOKING_CREATED', 'PAYMENT_CONFIRMED', 'RESCHEDULE_APPROVED', 'EXTEND_APPROVED', 'CREDIT_USED', 'PACKAGE_USED', 'REFUND_APPROVED'].includes(activity.activityType) && <FileText className="w-3 h-3 text-gray-500" />}
                                  </div>
                                  {index < activities.length - 1 && (
                                    <div className="w-0.5 h-full bg-gray-200 mt-1 min-h-[40px]"></div>
                                  )}
                                </div>
                                <div className="flex-1 pb-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <p className="font-medium text-xs">{activity.activityTitle}</p>
                                      {activity.activityDescription && (
                                        <div className="text-xs text-gray-600 mt-0.5 space-y-1">
                                          {activity.activityType === 'RESCHEDULE_APPROVED' || activity.activityType === 'EXTEND_APPROVED' ? (
                                            <div className="space-y-1">
                                              {/* Use metadata first if available (most reliable) */}
                                              {activity.metadata && (activity.metadata.originalStartAt || activity.metadata.originalEndAt || activity.metadata.newStartAt || activity.metadata.newEndAt) ? (
                                                <div className="flex flex-col gap-1">
                                                  {/* Old Time */}
                                                  {(activity.metadata.originalStartAt || activity.metadata.originalEndAt) && (
                                                    <div className="flex items-center gap-1">
                                                      <span className="text-gray-500">Old:</span>
                                                      <span className="font-mono text-xs">
                                                        {activity.metadata.originalStartAt && activity.metadata.originalEndAt
                                                          ? `${formatSingaporeDate(activity.metadata.originalStartAt)} - ${formatSingaporeDate(activity.metadata.originalEndAt)}`
                                                          : activity.metadata.originalEndAt
                                                            ? `End: ${formatSingaporeDate(activity.metadata.originalEndAt)}`
                                                            : formatSingaporeDate(activity.metadata.originalStartAt)}
                                                      </span>
                                                    </div>
                                                  )}
                                                  {/* New Time */}
                                                  {(activity.metadata.newStartAt || activity.metadata.newEndAt) && (
                                                    <div className="flex items-center gap-1">
                                                      <span className="text-blue-600 font-medium">New:</span>
                                                      <span className="font-mono text-xs">
                                                        {activity.metadata.newStartAt && activity.metadata.newEndAt
                                                          ? `${formatSingaporeDate(activity.metadata.newStartAt)} - ${formatSingaporeDate(activity.metadata.newEndAt)}`
                                                          : activity.metadata.newEndAt
                                                            ? `End: ${formatSingaporeDate(activity.metadata.newEndAt)}`
                                                            : formatSingaporeDate(activity.metadata.newStartAt)}
                                                      </span>
                                                    </div>
                                                  )}
                                                </div>
                                              ) : activity.oldValue && activity.newValue ? (
                                                // Fallback to oldValue/newValue if metadata not available
                                                <div className="flex flex-col gap-1">
                                                  <div className="flex items-center gap-1">
                                                    <span className="text-gray-500">Old:</span>
                                                    <span className="font-mono text-xs">
                                                      {activity.oldValue.includes(' - ')
                                                        ? activity.oldValue.split(' - ').map((time: string) => formatSingaporeDate(time.trim())).join(' - ')
                                                        : formatSingaporeDate(activity.oldValue)}
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                    <span className="text-blue-600 font-medium">New:</span>
                                                    <span className="font-mono text-xs">
                                                      {activity.newValue.includes(' - ')
                                                        ? activity.newValue.split(' - ').map((time: string) => formatSingaporeDate(time.trim())).join(' - ')
                                                        : formatSingaporeDate(activity.newValue)}
                                                    </span>
                                                  </div>
                                                </div>
                                              ) : activity.activityDescription.includes('→') ? (
                                                // Parse description with arrow format
                                                <div className="flex flex-col gap-1">
                                                  {activity.activityDescription.split('→').map((part: string, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-1">
                                                      <span className={idx === 0 ? 'text-gray-500' : 'text-blue-600 font-medium'}>
                                                        {idx === 0 ? 'Old:' : 'New:'}
                                                      </span>
                                                      <span className="font-mono text-xs">{part.trim()}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : activity.activityDescription.includes('Old:') && activity.activityDescription.includes('New:') ? (
                                                // Handle format: "Old: ... New: ..."
                                                <div className="flex flex-col gap-1">
                                                  {activity.activityDescription.split(/(?=New:)/).map((part: string, idx: number) => {
                                                    const isOld = part.includes('Old:')
                                                    const isNew = part.includes('New:')
                                                    const label = isOld ? 'Old:' : isNew ? 'New:' : ''
                                                    const content = part.replace(/^(Old:|New:)\s*/, '').trim()
                                                    return (
                                                      <div key={idx} className="flex items-center gap-1">
                                                        <span className={isOld ? 'text-gray-500' : 'text-blue-600 font-medium'}>
                                                          {label}
                                                        </span>
                                                        <span className="font-mono text-xs">{content}</span>
                                                      </div>
                                                    )
                                                  })}
                                                </div>
                                              ) : activity.activityDescription.includes('from') && activity.activityDescription.includes('to') ? (
                                                // Handle old format: "Booking rescheduled from X to Y"
                                                <div className="flex flex-col gap-1">
                                                  {(() => {
                                                    const fromMatch = activity.activityDescription.match(/from\s+(.+?)\s+to\s+(.+?)$/i)
                                                    if (fromMatch) {
                                                      return (
                                                        <>
                                                          <div className="flex items-center gap-1">
                                                            <span className="text-gray-500">Old:</span>
                                                            <span className="font-mono text-xs">{fromMatch[1].trim()}</span>
                                                          </div>
                                                          <div className="flex items-center gap-1">
                                                            <span className="text-blue-600 font-medium">New:</span>
                                                            <span className="font-mono text-xs">{fromMatch[2].trim()}</span>
                                                          </div>
                                                        </>
                                                      )
                                                    }
                                                    return <p className="text-gray-600">{activity.activityDescription}</p>
                                                  })()}
                                                </div>
                                              ) : (
                                                // Fallback for any other format
                                                <p className="text-gray-600">{activity.activityDescription}</p>
                                              )}

                                              {/* Payment Information for Reschedule/Extend */}
                                              {(paymentAmount || paymentMethod) && (
                                                <div className="flex flex-col gap-1 mt-1 pt-1 border-t border-gray-200">
                                                  {paymentMethod && (
                                                    <div className="flex items-center gap-1">
                                                      <span className="text-gray-500">Payment mode:</span>
                                                      <span className="text-xs font-medium">{paymentMethod.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                                                    </div>
                                                  )}
                                                  {paymentAmount && paymentAmount > 0 && (
                                                    <div className="flex items-center gap-1">
                                                      <span className="text-gray-500">Payment amount:</span>
                                                      <span className="text-xs text-green-600 font-medium">${paymentAmount.toFixed(2)}</span>
                                                    </div>
                                                  )}
                                                  {transactionFee !== null && transactionFee > 0 && (
                                                    <div className="flex items-center gap-1">
                                                      <span className="text-gray-500">Transaction fee incurred:</span>
                                                      <span className="text-xs text-orange-600">${transactionFee.toFixed(2)}</span>
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          ) : activity.activityType === 'PACKAGE_USED' || activity.activityType === 'CREDIT_USED' ? (
                                            <div className="space-y-1">
                                              <p className="text-gray-600">{activity.activityDescription}</p>
                                              
                                              {/* Payment Information for Package/Credit Usage */}
                                              {(paymentAmount || paymentMethod) && (
                                                <div className="flex flex-col gap-1 mt-1 pt-1 border-t border-gray-200">
                                                  {paymentMethod && (
                                                    <div className="flex items-center gap-1">
                                                      <span className="text-gray-500">Payment mode:</span>
                                                      <span className="text-xs font-medium">{paymentMethod.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                                                    </div>
                                                  )}
                                                  {paymentAmount && paymentAmount > 0 && (
                                                    <div className="flex items-center gap-1">
                                                      <span className="text-gray-500">Payment amount:</span>
                                                      <span className="text-xs text-green-600 font-medium">${paymentAmount.toFixed(2)}</span>
                                                    </div>
                                                  )}
                                                  {transactionFee !== null && transactionFee > 0 && (
                                                    <div className="flex items-center gap-1">
                                                      <span className="text-gray-500">Transaction fee incurred:</span>
                                                      <span className="text-xs text-orange-600">${transactionFee.toFixed(2)}</span>
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          ) : activity.activityType === 'BOOKING_CREATED' ? (
                                            <div className="space-y-1">
                                              <p>{activity.activityDescription}</p>
                                              
                                              {/* Payment Information for Booking Creation */}
                                              {(paymentAmount || paymentMethod) && (
                                                <div className="flex flex-col gap-1 mt-1 pt-1 border-t border-gray-200">
                                                  {paymentMethod && (
                                                    <div className="flex items-center gap-1">
                                                      <span className="text-gray-500">Payment mode:</span>
                                                      <span className="text-xs font-medium">{paymentMethod.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                                                    </div>
                                                  )}
                                                  {paymentAmount && paymentAmount > 0 && (
                                                    <div className="flex items-center gap-1">
                                                      <span className="text-gray-500">Payment amount:</span>
                                                      <span className="text-xs text-green-600 font-medium">${paymentAmount.toFixed(2)}</span>
                                                    </div>
                                                  )}
                                                  {transactionFee !== null && transactionFee > 0 && (
                                                    <div className="flex items-center gap-1">
                                                      <span className="text-gray-500">Transaction fee incurred:</span>
                                                      <span className="text-xs text-orange-600">${transactionFee.toFixed(2)}</span>
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            <p>{activity.activityDescription}</p>
                                          )}
                                        </div>
                                      )}
                                      {/* Show amount if no payment details found */}
                                      {activity.amount && activity.amount > 0 && !paymentAmount && (
                                        <p className="text-xs text-green-600 font-medium mt-0.5">
                                          ${activity.amount.toFixed(2)}
                                        </p>
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                      {formatLocalDate(activity.createdAt, {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 text-center py-2">No activities recorded yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-gray-500">No details found</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Booking Timeline Modal */}
      <BookingDetailsModal
        isOpen={isTimelineModalOpen}
        onClose={() => setIsTimelineModalOpen(false)}
        bookingRef={selectedBookingRef}
      />
    </div>
  )
}

// src/app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import {
  User,
  Calendar,
  CreditCard,
  Settings,
  History,
  Edit,
  Trash2,
  MapPin,
  Clock,
  Users,
  AlertTriangle,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Gift,
  Package,
  Loader2,
  AlertCircle,
  BarChart3,
  Star,
  FileText,
  Eye,
  Bell
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import Navbar from '@/components/Navbar'
import { FooterSection } from '@/components/landing-page-sections/FooterSection'
import { EntitlementHistory } from '@/components/dashboard/EntitlementHistory'
import { PromoCodeHistory } from '@/components/dashboard/PromoCodeHistory'
import { UserBookings } from '@/components/dashboard/UserBookings'
import { UserPromoCodes } from '@/components/dashboard/UserPromoCodes'
import { UserPackages } from '@/components/dashboard/UserPackages'
import { UserCredits } from '@/components/dashboard/UserCredits'
import { RefundRequests } from '@/components/dashboard/RefundRequests'
import { RefundSystemTest } from '@/components/RefundSystemTest'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { getUserProfile, updateUserProfile, UserProfile, formatUserName, getMemberTypeDisplayName, getVerificationStatusDisplayName, getVerificationStatusColor, getEffectiveMemberType, getDaysUntilVerificationExpiry, isVerificationExpired, isVerificationExpiringSoon, getVerificationExpiryMessage } from '@/lib/userProfileService'
import { StudentDocumentUpload } from '@/components/StudentDocumentUpload'
import { StudentDocumentData } from '@/lib/studentDocumentService'
import { getUserBookings, Booking as ApiBooking, formatBookingDate, getBookingStatus, getStatusColor, calculateDuration } from '@/lib/bookingService'

// Mock data types
interface Booking {
  id: string
  locationName: string
  locationAddress: string
  date: string
  startTime: string
  endTime: string
  numberOfPeople: number
  selectedSeats: string[]
  totalAmount: number
  status: 'confirmed' | 'cancelled' | 'completed' | 'pending'
  bookingReference: string
  canEdit: boolean
  canCancel: boolean
}

export default function Dashboard() {
  const { toast } = useToast()
  const { user: authUser, databaseUser, refreshDatabaseUser, refreshAuthUser } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(() => {
    // Initialize from URL hash if available
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '')
      return hash || 'overview'
    }
    return 'overview'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [verificationHistory, setVerificationHistory] = useState<any[]>([])
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    contactNumber: '',
    memberType: 'MEMBER' as 'STUDENT' | 'MEMBER' | 'TUTOR' | 'ADMIN'
  })
  const [studentDocument, setStudentDocument] = useState<StudentDocumentData | null>(null)
  const [originalMemberType, setOriginalMemberType] = useState<'STUDENT' | 'MEMBER' | 'TUTOR' | 'ADMIN'>('MEMBER')
  const [upcomingBookings, setUpcomingBookings] = useState<ApiBooking[]>([])
  const [isLoadingBookings, setIsLoadingBookings] = useState(false)
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false)

  // Sample data for testing (fallback)
  const sampleUserData = {
    name: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    contactNumber: '+1 (555) 123-4567',
    memberType: 'MEMBER' as const,
    studentVerificationStatus: 'NA' as 'NA' | 'PENDING' | 'VERIFIED' | 'REJECTED',
    studentRejectionReason: null
  }


  // Load user profile data
  const loadUserProfile = async () => {
    if (!authUser?.id) return
    console.log('authUser', authUser)
    setIsLoadingProfile(true)
    try {
      const profile = await getUserProfile(authUser.id)
      console.log('profile', profile)
      if (profile) {
        setUserProfile(profile)
        setEditFormData({
          firstName: profile.firstName,
          lastName: profile.lastName,
          contactNumber: profile.contactNumber,
          memberType: profile.memberType
        })
        setOriginalMemberType(profile.memberType)

        // Load existing student document if user is a student
        if (profile.memberType === 'STUDENT' && profile.studentVerificationImageUrl) {
          setStudentDocument({
            url: profile.studentVerificationImageUrl,
            name: 'Student Document',
            size: 0, // We don't have this info from DB
            mimeType: 'image/jpeg' // Default assumption
          })
        }

        // Load verification history if user is a student
        if (profile.memberType === 'STUDENT') {
          await loadVerificationHistory(authUser.id)
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // Load verification history
  const loadVerificationHistory = async (userId: string) => {
    try {
      const response = await fetch(`https://productive-space-backend.vercel.app/api/verification-history/${userId}`)
      const data = await response.json()

      if (data.success) {
        setVerificationHistory(data.history || [])
        console.log('📋 Verification history loaded:', data.history)

        // Check if there are any unread notifications
        // Show orange dot if there are status changes (VERIFIED or REJECTED)
        const hasStatusChanges = (data.history || []).some((h: any) => h.newStatus === 'REJECTED' || h.newStatus === 'VERIFIED')

        // Check localStorage to see if user has viewed notifications
        const lastViewedTimestamp = localStorage.getItem('notificationLastViewed')
        if (!lastViewedTimestamp && hasStatusChanges) {
          setHasUnreadNotifications(true)
        } else if (lastViewedTimestamp && hasStatusChanges) {
          // Check if there are new notifications after last viewed time
          const hasNewNotifications = (data.history || []).some((h: any) =>
            new Date(h.changedAt).getTime() > parseInt(lastViewedTimestamp)
          )
          setHasUnreadNotifications(hasNewNotifications)
        }
      }
    } catch (error) {
      console.error('Error loading verification history:', error)
    }
  }

  // Handle edit profile
  const handleEditProfile = () => {
    setIsEditingProfile(true)
    setOriginalMemberType(editFormData.memberType)
  }

  // Handle save profile changes
  const handleSaveProfile = async () => {
    if (!authUser?.id || !userProfile) return

    // Check if user is changing to student but hasn't uploaded a document
    if (editFormData.memberType === 'STUDENT' && originalMemberType !== 'STUDENT' && !studentDocument) {
      toast({
        title: "Document required",
        description: "Please upload a student verification document before changing to student status.",
        variant: "destructive",
      })
      return
    }

    setIsLoadingProfile(true)
    try {
      // Prepare profile data with student document info
      const profileUpdateData: Partial<UserProfile> = {
        ...editFormData,
        ...(editFormData.memberType === 'STUDENT' && studentDocument && {
          studentVerificationImageUrl: studentDocument.url,
          studentVerificationStatus: 'PENDING' as const
        }),
        ...(editFormData.memberType !== 'STUDENT' && originalMemberType === 'STUDENT' && {
          studentVerificationImageUrl: undefined,
          studentVerificationStatus: 'NA' as const
        })
      }

      const updatedProfile = await updateUserProfile(authUser.id, profileUpdateData, refreshAuthUser)
      if (updatedProfile) {
        setUserProfile(updatedProfile)
        setIsEditingProfile(false)
        setOriginalMemberType(editFormData.memberType)
        toast({
          title: "Profile updated successfully!",
          description: "Your profile information has been updated.",
        })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Profile update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    if (userProfile) {
      setEditFormData({
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        contactNumber: userProfile.contactNumber,
        memberType: userProfile.memberType
      })
      setOriginalMemberType(userProfile.memberType)
    }
    setIsEditingProfile(false)
  }

  // Handle member type change
  const handleMemberTypeChange = (newMemberType: 'STUDENT' | 'MEMBER' | 'TUTOR' | 'ADMIN') => {
    setEditFormData(prev => ({ ...prev, memberType: newMemberType }))

    // If changing from student to another type, clear the document
    if (originalMemberType === 'STUDENT' && newMemberType !== 'STUDENT') {
      setStudentDocument(null)
    }
  }

  // Handle document upload
  const handleDocumentUploaded = (documentData: StudentDocumentData) => {
    setStudentDocument(documentData)
  }

  // Handle document removal
  const handleDocumentRemoved = () => {
    setStudentDocument(null)
  }

  // Load most recent booking (upcoming or ongoing)
  const loadUpcomingBookings = async () => {
    try {
      setIsLoadingBookings(true)
      const response = await getUserBookings()
      if (response.success && response.bookings) {
        // Filter for upcoming and ongoing bookings
        const upcomingAndOngoing = response.bookings.filter(booking =>
          (booking.isUpcoming && booking.status === 'upcoming') ||
          (booking.isOngoing && booking.status === 'ongoing')
        )
        // Sort by startAt date (most recent first) and get the most recent 2 bookings
        const sortedBookings = upcomingAndOngoing.sort((a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
        )
        setUpcomingBookings(sortedBookings.slice(0, 2))
      }
    } catch (error) {
      console.error('Error loading upcoming bookings:', error)
    } finally {
      setIsLoadingBookings(false)
    }
  }

  // Load user profile when component mounts or authUser changes
  useEffect(() => {
    loadUserProfile()
    loadUpcomingBookings()
  }, [authUser?.id])

  // Set initial hash if not present and handle hash changes
  useEffect(() => {
    // Set hash to overview if no hash is present
    if (typeof window !== 'undefined' && !window.location.hash) {
      window.location.hash = 'overview'
      setActiveTab('overview')
    } else {
      // Read hash from URL on mount
      const hash = window.location.hash.replace('#', '')
      if (hash) {
        setActiveTab(hash)
      }
    }

    // Listen for hash changes (browser back/forward navigation)
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash) {
        setActiveTab(hash)
      } else {
        // If hash is removed, default to overview
        setActiveTab('overview')
        window.location.hash = 'overview'
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Update URL hash to persist tab selection
    if (typeof window !== 'undefined') {
      window.location.hash = value
    }
  }

  // Handle booking cancellation
  const handleCancelBooking = async (booking: Booking) => {
    setIsLoading(true)

    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    console.log('Booking cancellation request:', booking)
    toast({
      title: "Booking cancelled successfully!",
      description: "Your booking has been cancelled and you will receive a refund.",
    })
    setCancellingBooking(null)
    setIsLoading(false)
  }

  // Handle booking edit
  const handleEditBooking = async (booking: Booking) => {
    setIsLoading(true)

    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    console.log('Booking edit request:', booking)
    toast({
      title: "Booking edit request submitted!",
      description: "You will be redirected to the booking page.",
    })
    setEditingBooking(null)
    setIsLoading(false)
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const variants = {
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800'
    }

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const BookingCard = ({ booking, showActions = true }: { booking: Booking, showActions?: boolean }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-semibold text-lg">{booking.locationName}</h4>
            <p className="text-sm text-gray-600 mb-2">{booking.locationAddress}</p>
            <p className="text-sm text-gray-500">Ref: {booking.bookingReference}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span>{new Date(booking.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-gray-400" />
            <span>{booking.startTime} - {booking.endTime}</span>
          </div>
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-2 text-gray-400" />
            <span>{booking.numberOfPeople} people</span>
          </div>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
            <span>Seats: {booking.selectedSeats.join(', ')}</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t flex justify-between items-center">
          <span className="font-semibold text-lg">${booking.totalAmount}</span>

          {showActions && booking.status === 'confirmed' && (
            <div className="space-x-2">
              {booking.canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingBooking(booking)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
              {booking.canCancel && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setCancellingBooking(booking)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="pt-32 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-2 lg:px-2">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  Welcome back, {databaseUser?.name || 'User'}!
                </p>
              </div>

            </div>
          </div>


          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div className="w-full overflow-x-auto scrollbar-hide -mx-4 px-4 md:overflow-x-visible md:mx-0 md:px-0">
              <TabsList className="grid w-full grid-cols-6 min-w-[600px] md:min-w-0">
                <TabsTrigger value="overview" className="text-xs sm:text-sm md:text-base whitespace-nowrap">Overview</TabsTrigger>
                <TabsTrigger value="mybookings" className="text-xs sm:text-sm md:text-base whitespace-nowrap">My Bookings</TabsTrigger>
                <TabsTrigger value="profile" className="text-xs sm:text-sm md:text-base whitespace-nowrap">Profile</TabsTrigger>
                <TabsTrigger value="passes" className="text-xs sm:text-sm md:text-base whitespace-nowrap">Packages</TabsTrigger>
                <TabsTrigger value="promocodes" className="text-xs sm:text-sm md:text-base whitespace-nowrap">Promo Codes</TabsTrigger>
                <TabsTrigger value="credits" className="text-xs sm:text-sm md:text-base whitespace-nowrap">Credits</TabsTrigger>
                {/* <TabsTrigger value="refunds">Refund Requests</TabsTrigger> */}
              </TabsList>
            </div>


            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Stats Card - Now on LEFT */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Quick Guide
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3 text-sm">
                      <li className="flex gap-2">
                        <span className="text-primary font-bold">•</span>
                        <div>
                          <strong>Upcoming Bookings:</strong> View your latest bookings under Upcoming Bookings.
                        </div>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary font-bold">•</span>
                        <div>
                          <strong>My Bookings:</strong> Check, reschedule, or cancel your upcoming bookings here.
                          <span className="text-muted-foreground italic"> (Rescheduling and cancellations must be made at least 5 hours in advance.)</span>
                        </div>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary font-bold">•</span>
                        <div>
                          <strong>Ongoing Bookings:</strong> Need more time? Click <strong>Extend</strong> on your active booking under My Bookings.
                        </div>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary font-bold">•</span>
                        <div>
                          <strong>Profile:</strong> Update your member type or personal details in the Profile tab.
                        </div>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary font-bold">•</span>
                        <div>
                          <strong>Packages:</strong> View your current packages and remaining sessions in the Packages tab.
                        </div>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary font-bold">•</span>
                        <div>
                          <strong>Promo Codes:</strong> Check available promo codes in the Promo Code tab.
                        </div>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary font-bold">•</span>
                        <div>
                          <strong>Credits:</strong> View your remaining credits anytime in your credits tab.
                        </div>
                      </li>
                      {/* <li className="flex gap-2">
                        <span className="text-primary font-bold">•</span>
                        <div>
                          <strong>Refund Requests:</strong> Track the status of your refund requests in the Refund tab.
                        </div>
                      </li> */}
                      <li className="flex gap-2">
                        <span className="text-primary font-bold">•</span>
                        <div>
                          <strong>Need Help?</strong> Click the WhatsApp button at the bottom right corner — we'll assist you as soon as possible!
                        </div>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Upcoming Bookings Card - Now on RIGHT with Bell Icon */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        Upcoming/Ongoing bookings
                      </CardTitle>
                      {(userProfile?.memberType || databaseUser?.memberType) === 'STUDENT' && (() => {
                        // ONLY show notification if there's verification history
                        if (verificationHistory.length === 0) return null;



                        const formatDate = (dateString: string) => {
                          const date = new Date(dateString);
                          return `${date.getMonth() + 1}/${date.getDate()}`;
                        };

                        const getStatusIcon = (status: string) => {
                          switch (status) {
                            case 'REJECTED':
                              return <AlertCircle className="h-4 w-4 text-red-600" />;
                            case 'VERIFIED':
                              return <CheckCircle className="h-4 w-4 text-green-600" />;
                            case 'PENDING':
                              return <Clock className="h-4 w-4 text-orange-600" />;
                            default:
                              return <AlertCircle className="h-4 w-4 text-gray-600" />;
                          }
                        };

                        const getStatusColor = (status: string) => {
                          switch (status) {
                            case 'REJECTED':
                              return 'text-red-800';
                            case 'VERIFIED':
                              return 'text-green-800';
                            case 'PENDING':
                              return 'text-orange-800';
                            default:
                              return 'text-gray-800';
                          }
                        };

                        const getStatusText = (status: string) => {
                          switch (status) {
                            case 'REJECTED':
                              return 'rejected';
                            case 'VERIFIED':
                              return 'approved';
                            case 'PENDING':
                              return 'pending';
                            default:
                              return 'changed';
                          }
                        };

                        // Check for verification expiry
                        const verifiedAt = userProfile?.studentVerifiedAt || userProfile?.studentVerificationDate
                        const daysRemaining = getDaysUntilVerificationExpiry(verifiedAt)
                        const expired = isVerificationExpired(verifiedAt)
                        const expiringSoon = isVerificationExpiringSoon(verifiedAt)

                        // Show notification if there are any status changes in history OR verification is expiring/expired
                        const hasStatusChanges = verificationHistory.some(h => h.newStatus === 'REJECTED' || h.newStatus === 'VERIFIED');
                        const hasExpiryWarning = expired || expiringSoon;

                        if (!hasStatusChanges && !hasExpiryWarning) return null;

                        return (
                          <Popover onOpenChange={(open) => {
                            if (open) {
                              // Mark notifications as read when popover opens
                              localStorage.setItem('notificationLastViewed', Date.now().toString())
                              setHasUnreadNotifications(false)
                            }
                          }}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="relative">
                                <Bell className="h-4 w-4" />
                                {(hasUnreadNotifications || hasExpiryWarning) && (
                                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 rounded-full"></span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="end">
                              <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  <Bell className="h-4 w-4 text-orange-600" />
                                  <h4 className="font-semibold text-orange-600">Notifications</h4>
                                </div>

                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                  {/* Verification Expiry Warning */}
                                  {hasExpiryWarning && (
                                    <div className={`${expired ? 'border-l-2 border-red-500 bg-red-50' : 'border-l-2 border-orange-500 bg-orange-50'} pl-3 py-2 rounded`}>
                                      <div className="flex items-center space-x-2">
                                        {expired ? (
                                          <AlertCircle className="h-4 w-4 text-red-600" />
                                        ) : (
                                          <Clock className="h-4 w-4 text-orange-600" />
                                        )}
                                        <span className={`text-sm font-medium ${expired ? 'text-red-800' : 'text-orange-800'}`}>
                                          {expired ? 'Student Verification Expired' : 'Verification Expiring Soon'}
                                        </span>
                                      </div>
                                      <div className={`text-xs ${expired ? 'text-red-600' : 'text-orange-600'} mt-1`}>
                                        {expired
                                          ? 'Your student verification has expired. Please verify again to maintain student status.'
                                          : `Your verification will expire in ${daysRemaining} days.`
                                        }
                                      </div>
                                    </div>
                                  )}

                                  {/* Verification History */}
                                  {verificationHistory.map((history, index) => (
                                    <div key={history.id} className="border-l-2 border-gray-200 pl-3 py-2">
                                      <div className="flex items-center space-x-2">
                                        {getStatusIcon(history.newStatus)}
                                        <span className={`text-sm font-medium ${getStatusColor(history.newStatus)}`}>
                                          Student status {getStatusText(history.newStatus)}
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {formatDate(history.changedAt)} - {history.reason}
                                      </div>
                                    </div>
                                  ))}
                                </div>


                              </div>
                            </PopoverContent>
                          </Popover>
                        );
                      })()}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingBookings ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-gray-400" />
                        <p className="text-gray-600">Loading bookings...</p>
                      </div>
                    ) : upcomingBookings.length > 0 ? (
                      <div className="space-y-4">
                        {/* Show most recent 2 bookings */}
                        {upcomingBookings.filter(booking => booking.cancelledBy !== "admin",).map((booking, index) => (
                          <div key={booking.id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold text-sm">{booking.location}</h4>
                                <p className="text-xs text-gray-600">Ref: {booking.bookingRef}</p>
                              </div>
                              <Badge className={getStatusColor(getBookingStatus(booking))}>
                                {getBookingStatus(booking)}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                                <span>{formatBookingDate(booking.startAt)}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1 text-gray-400" />
                                <span>{calculateDuration(booking.startAt, booking.endAt)}h</span>
                              </div>
                              <div className="flex items-center">
                                <Users className="w-3 h-3 mr-1 text-gray-400" />
                                <span>{booking.pax} people</span>
                              </div>
                              <div className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                                <span className="text-xs">
                                  {booking.seatNumbers && booking.seatNumbers.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {booking.seatNumbers.map((seat, seatIndex) => (
                                        <Badge key={seatIndex} variant="outline" className="text-xs px-1 py-0">
                                          {seat}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    'No seats'
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="mt-2 pt-2 border-t flex justify-between items-center">
                              <span className="font-semibold text-sm">${booking.totalAmount}</span>
                              {index === upcomingBookings.length - 1 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setActiveTab('mybookings')}
                                  className="text-xs"
                                >
                                  View All Bookings
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming or ongoing bookings</h3>
                        <p className="text-gray-600 mb-4">You don't have any upcoming or ongoing bookings at the moment.</p>
                        <Button onClick={() => router.push('/book-now')}>
                          Book Now
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="space-y-6">
                {/* Profile Header */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Profile Information
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Manage your account information and preferences
                    </p>
                    {isLoadingProfile && (
                      <Alert className="mt-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <AlertDescription>
                          Loading profile data...
                        </AlertDescription>
                      </Alert>
                    )}
                    {!userProfile && !isLoadingProfile && (
                      <Alert className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Showing sample data. Real user data will be displayed when available.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* User Avatar and Basic Info */}
                    <div className="flex items-center space-x-6 flex-col md:flex-row">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="w-10 h-10 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {userProfile ? formatUserName(userProfile) : (databaseUser?.name || authUser?.user_metadata?.full_name || sampleUserData.name)}
                        </h3>
                        <p className="text-gray-600">{userProfile?.email || authUser?.email || sampleUserData.email}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            {userProfile
                              ? getMemberTypeDisplayName(userProfile.memberType, userProfile.studentVerificationStatus)
                              : getMemberTypeDisplayName(
                                databaseUser?.memberType || sampleUserData.memberType,
                                databaseUser?.studentVerificationStatus || sampleUserData.studentVerificationStatus
                              )
                            }
                          </Badge>
                          {(userProfile?.memberType || databaseUser?.memberType || sampleUserData.memberType) === 'STUDENT' && (() => {
                            const status =
                              userProfile?.studentVerificationStatus ||
                              databaseUser?.studentVerificationStatus ||
                              sampleUserData.studentVerificationStatus;

                            if (status === 'REJECTED') {
                              return null;
                            }

                            const statusText =
                              status === 'VERIFIED'
                                ? 'Verified'
                                : status === 'PENDING'
                                  ? 'Pending'
                                  : 'Not Verified';

                            // Check expiry status for verified students
                            const verifiedAt = userProfile?.studentVerifiedAt || userProfile?.studentVerificationDate;
                            const expired = status === 'VERIFIED' ? isVerificationExpired(verifiedAt) : false;
                            const expiringSoon = status === 'VERIFIED' ? isVerificationExpiringSoon(verifiedAt) : false;
                            const daysRemaining = status === 'VERIFIED' ? getDaysUntilVerificationExpiry(verifiedAt) : 0;

                            // Determine badge color based on expiry status
                            const badgeClass =
                              status === 'VERIFIED'
                                ? expired
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : expiringSoon
                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                    : 'bg-green-50 text-green-700 border-green-200'
                                : status === 'PENDING'
                                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                                  : 'bg-gray-50 text-gray-700 border-gray-200';

                            return (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={badgeClass}>
                                  {status === 'PENDING'
                                    ? 'Student status verification Pending - Please check back in a few days.'
                                    : status === 'VERIFIED'
                                      ? expired
                                        ? 'Student Verification - Expired'
                                        : expiringSoon
                                          ? `Expires in ${daysRemaining} days`
                                          : 'Student Verification - Verified'
                                      : `Student Verification Status - ${statusText}`
                                  }
                                </Badge>
                                {status === 'VERIFIED' && expiringSoon && (
                                  <div className="relative">
                                    <Bell className="w-4 h-4 text-orange-600 animate-pulse" />
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-600 rounded-full"></span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}


                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditProfile}
                        disabled={isLoadingProfile}
                        className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:text-orange-800 w-full md:w-auto mt-4 md:mt-0"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={isEditingProfile ? editFormData.firstName : (userProfile?.firstName || databaseUser?.firstName || authUser?.user_metadata?.full_name?.split(' ')[0] || sampleUserData.firstName)}
                          disabled={!isEditingProfile}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={isEditingProfile ? editFormData.lastName : (userProfile?.lastName || databaseUser?.lastName || authUser?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || sampleUserData.lastName)}
                          disabled={!isEditingProfile}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          value={authUser?.email || ''}
                          disabled
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Contact Number</Label>
                        <Input
                          id="phone"
                          value={isEditingProfile ? editFormData.contactNumber : (userProfile?.contactNumber || databaseUser?.contactNumber || authUser?.user_metadata?.phone || sampleUserData.contactNumber)}
                          disabled={!isEditingProfile}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      {/* Hide Member Type field for admin users */}
                      {(databaseUser?.memberType !== 'ADMIN' && userProfile?.memberType !== 'ADMIN') && (
                        <div>
                          <Label htmlFor="memberType">Member Type</Label>
                          <Select
                            disabled={!isEditingProfile}
                            value={isEditingProfile ? editFormData.memberType : getEffectiveMemberType(
                              userProfile?.memberType || databaseUser?.memberType || sampleUserData.memberType,
                              userProfile?.studentVerificationStatus || databaseUser?.studentVerificationStatus || sampleUserData.studentVerificationStatus
                            )}
                            onValueChange={handleMemberTypeChange}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="STUDENT">Student</SelectItem>
                              <SelectItem value="MEMBER">Member</SelectItem>
                              {/* <SelectItem value="TUTOR">Tutor</SelectItem> */}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {(userProfile?.memberType || databaseUser?.memberType || sampleUserData.memberType) === 'STUDENT' && (
                        <div>
                          <Label htmlFor="verificationStatus">Student Verification</Label>
                          <Select disabled value={userProfile?.studentVerificationStatus || databaseUser?.studentVerificationStatus || sampleUserData.studentVerificationStatus}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NA">Not Applicable</SelectItem>
                              <SelectItem value="PENDING">Pending</SelectItem>
                              <SelectItem value="VERIFIED">Verified</SelectItem>
                              <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Student Verification Expiry Warning - Show for verified students */}
                    {(userProfile?.memberType || databaseUser?.memberType || sampleUserData.memberType) === 'STUDENT' &&
                      (userProfile?.studentVerificationStatus || databaseUser?.studentVerificationStatus) === 'VERIFIED' && (
                        <div className="pt-6 border-t">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 mb-2">Student Verification Status</h4>
                            </div>

                            {(() => {
                              const verifiedAt = userProfile?.studentVerifiedAt || userProfile?.studentVerificationDate
                              const daysRemaining = getDaysUntilVerificationExpiry(verifiedAt)
                              const expired = isVerificationExpired(verifiedAt)
                              const expiringSoon = isVerificationExpiringSoon(verifiedAt)
                              const expiryMessage = getVerificationExpiryMessage(verifiedAt)

                              // Determine colors based on status
                              const bgColor = expired ? 'bg-red-100' : expiringSoon ? 'bg-orange-100' : 'bg-green-100'
                              const textColor = expired ? 'text-red-800' : expiringSoon ? 'text-orange-800' : 'text-green-800'
                              const borderColor = expired ? 'border-red-200' : expiringSoon ? 'border-orange-200' : 'border-green-200'
                              const iconBg = expired ? 'bg-red-100' : expiringSoon ? 'bg-orange-100' : 'bg-green-100'
                              const iconColor = expired ? 'text-red-600' : expiringSoon ? 'text-orange-600' : 'text-green-600'

                              return (
                                <div className={`${bgColor} ${textColor} ${borderColor} border rounded-lg p-4`}>
                                  <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                      {expired ? (
                                        <AlertCircle className={`w-5 h-5 ${iconColor}`} />
                                      ) : expiringSoon ? (
                                        <Clock className={`w-5 h-5 ${iconColor}`} />
                                      ) : (
                                        <CheckCircle className={`w-5 h-5 ${iconColor}`} />
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <p className={`font-medium ${textColor} mb-2`}>
                                        {expired ? 'Verification Expired' : expiringSoon ? 'Verification Expiring Soon' : 'Verification Active'}
                                      </p>
                                      <p className={`text-sm ${expired ? 'text-red-600' : expiringSoon ? 'text-orange-600' : 'text-green-600'}`}>
                                        {expiryMessage}
                                      </p>
                                      {(expired || expiringSoon) && (
                                        <p className="text-sm mt-2 font-medium">
                                          Please click 'Edit profile' and upload a new verification document to maintain your student status.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })()}
                          </div>
                        </div>
                      )}

                    {/* Student Document Upload - Only show when editing and member type is student */}
                    {isEditingProfile && editFormData.memberType === 'STUDENT' && (
                      <div className="pt-6 border-t">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Student Verification Document</h4>
                            <p className="text-sm text-gray-600 mb-4">
                              Upload a valid student document to verify your student status. This is required when changing to student membership.
                            </p>
                          </div>
                          <StudentDocumentUpload
                            onDocumentUploaded={handleDocumentUploaded}
                            onDocumentRemoved={handleDocumentRemoved}
                            initialDocument={studentDocument}
                            disabled={isLoadingProfile}
                            userId={authUser?.id}
                          />
                        </div>
                      </div>
                    )}

                    {/* Edit Profile Actions */}
                    {isEditingProfile && (
                      <div className="pt-6 border-t">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={isLoadingProfile}
                            className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveProfile}
                            disabled={isLoadingProfile}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                          >
                            {isLoadingProfile ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Saving...
                              </>
                            ) : (
                              'Save Changes'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}


                  </CardContent>
                </Card>


              </div>
            </TabsContent>

            {/* Passes Tab - User Packages */}
            <TabsContent value="passes" className="space-y-6">
              <UserPackages userId={authUser?.id || ''} />
            </TabsContent>


            {/* Promo Codes Tab */}
            <TabsContent value="promocodes" className="space-y-6">
              <UserPromoCodes userId={authUser?.id || ''} />
            </TabsContent>

            {/* Store Credits Tab */}
            <TabsContent value="credits" className="space-y-6">
              <UserCredits userId={authUser?.id || ''} />
            </TabsContent>

            {/* Refund Requests Tab */}
            {/* <TabsContent value="refunds" className="space-y-6">
              <RefundRequests userId={authUser?.id || ''} />
              
            </TabsContent> */}

            {/* My Bookings Tab */}
            <TabsContent value="mybookings" className="space-y-6">
              <UserBookings />
            </TabsContent>

          </Tabs>
        </div>
      </div>

      {/* Cancellation Dialog */}
      <Dialog open={!!cancellingBooking} onOpenChange={() => setCancellingBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
          </DialogHeader>
          {cancellingBooking && (
            <div className="space-y-4">
              <p>Are you sure you want to cancel this booking?</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold">{cancellingBooking.locationName}</h4>
                <p className="text-sm text-gray-600">{cancellingBooking.locationAddress}</p>
                <p className="text-sm text-gray-500">
                  {new Date(cancellingBooking.date).toLocaleDateString()} at {cancellingBooking.startTime} - {cancellingBooking.endTime}
                </p>
                <p className="text-sm text-gray-500">Ref: {cancellingBooking.bookingReference}</p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setCancellingBooking(null)}>
                  Keep Booking
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleCancelBooking(cancellingBooking)}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel Booking'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Booking Dialog */}
      <Dialog open={!!editingBooking} onOpenChange={() => setEditingBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
          </DialogHeader>
          {editingBooking && (
            <div className="space-y-4">
              <p>You will be redirected to the booking page to make changes.</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold">{editingBooking.locationName}</h4>
                <p className="text-sm text-gray-600">{editingBooking.locationAddress}</p>
                <p className="text-sm text-gray-500">
                  {new Date(editingBooking.date).toLocaleDateString()} at {editingBooking.startTime} - {editingBooking.endTime}
                </p>
                <p className="text-sm text-gray-500">Ref: {editingBooking.bookingReference}</p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingBooking(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleEditBooking(editingBooking)}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Edit Booking'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <FooterSection />
    </div>
  )
}
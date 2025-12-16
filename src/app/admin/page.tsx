'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { getAllUsers, updateStudentVerification } from '@/lib/userService'
import { getAllRefundRequests, RefundTransaction } from '@/lib/refundService'
import Navbar from '@/components/Navbar'
import { FooterSection } from '@/components/landing-page-sections/FooterSection'
import AdminHeader from '@/components/admin/AdminHeader'
import AdminTabs from '@/components/admin/AdminTabs'
import CancellationReviewModal from '@/components/admin/CancellationReviewModal'
import UserVerificationModal from '@/components/admin/UserVerificationModal'


interface CancellationRequest {
  id: string
  bookingReference: string
  userEmail: string
  userName: string
  locationName: string
  bookingDate: string
  bookingTime: string
  totalAmount: number
  reason: string
  requestDate: string
  refundAmount: number
  status: 'pending' | 'processed' | 'rejected'
}

interface UserAccount {
  id: string
  email: string
  name: string
  memberType: 'student' | 'professional' | 'freelancer'
  verificationStatus: 'pending' | 'verified' | 'rejected'
  joinDate: string
  totalBookings: number
  totalSpent: number
}

const mockCancellations: CancellationRequest[] = [
  {
    id: '1',
    bookingReference: 'BK001236',
    userEmail: 'john.doe@example.com',
    userName: 'John Doe',
    locationName: 'Kovan',
    bookingDate: '2024-11-20',
    bookingTime: '14:00 - 18:00',
    totalAmount: 7.50,
    reason: 'Emergency meeting',
    requestDate: '2024-11-19',
    refundAmount: 7.50,
    status: 'pending'
  },
  {
    id: '2',
    bookingReference: 'BK001237',
    userEmail: 'jane.smith@example.com',
    userName: 'Jane Smith',
    locationName: 'Kovan',
    bookingDate: '2024-12-15',
    bookingTime: '09:00 - 17:00',
    totalAmount: 10.50,
    reason: 'Sick leave',
    requestDate: '2024-12-14',
    refundAmount: 10,
    status: 'pending'
  }
]

const mockUsers: UserAccount[] = [
  {
    id: '1',
    email: 'john.doe@example.com',
    name: 'John Doe',
    memberType: 'professional',
    verificationStatus: 'verified',
    joinDate: '2024-01-15',
    totalBookings: 5,
    totalSpent: 1200
  },
  {
    id: '2',
    email: 'jane.student@university.edu',
    name: 'Jane Student',
    memberType: 'student',
    verificationStatus: 'pending',
    joinDate: '2024-02-20',
    totalBookings: 2,
    totalSpent: 150
  },
  {
    id: '3',
    email: 'mike.student@nus.edu.sg',
    name: 'Mike Chen',
    memberType: 'student',
    verificationStatus: 'pending',
    joinDate: '2024-03-10',
    totalBookings: 1,
    totalSpent: 75
  },
  {
    id: '4',
    email: 'sarah.student@ntu.edu.sg',
    name: 'Sarah Lee',
    memberType: 'student',
    verificationStatus: 'pending',
    joinDate: '2024-03-15',
    totalBookings: 0,
    totalSpent: 0
  },
  {
    id: '5',
    email: 'alex.professional@company.com',
    name: 'Alex Johnson',
    memberType: 'professional',
    verificationStatus: 'verified',
    joinDate: '2024-01-20',
    totalBookings: 8,
    totalSpent: 2000
  }
]

export default function AdminDashboard() {
  const { toast } = useToast()
  // Always start with 'overview' on both server and client to avoid hydration mismatch
  const [activeTab, setActiveTab] = useState('overview')
  const [refundRequests, setRefundRequests] = useState<RefundTransaction[]>([])
  const [users, setUsers] = useState<UserAccount[]>(mockUsers)
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingStudents, setPendingStudents] = useState<any[]>([])
  const [isLoadingPendingStudents, setIsLoadingPendingStudents] = useState(false)
  const [isLoadingRefunds, setIsLoadingRefunds] = useState(false)

  // Initialize from URL hash after component mounts (client-side only)
  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash) {
      setActiveTab(hash)
    }
  }, [])

  const fetchPendingStudents = async () => {
    setIsLoadingPendingStudents(true)
    try {
      const response = await getAllUsers({
        memberType: 'STUDENT',
        limit: 10,
        includeStats: true
      })

      if (response.success && response.users) {
        const pending = response.users.filter(user =>
          user.studentVerificationStatus === 'PENDING' &&
          user.studentVerificationImageUrl
        )
        setPendingStudents(pending)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch pending students",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch pending students",
        variant: "destructive",
      })
    } finally {
      setIsLoadingPendingStudents(false)
    }
  }

  const fetchRecentRefundRequests = async () => {
    setIsLoadingRefunds(true)
    try {
      const response = await getAllRefundRequests()
      if (response && Array.isArray(response)) {
        // Get only recent refund requests (last 3)
        const recentRefunds = response
          .sort((a, b) => new Date(b.requestedat).getTime() - new Date(a.requestedat).getTime())
          .slice(0, 3)
        setRefundRequests(recentRefunds)
      }
    } catch (error) {
      console.error('Error fetching refund requests:', error)
      // Keep empty array if fetch fails
    } finally {
      setIsLoadingRefunds(false)
    }
  }

  useEffect(() => {
    fetchPendingStudents()
    fetchRecentRefundRequests()
  }, [])

  // Listen for hash changes (browser back/forward navigation)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash) {
        setActiveTab(hash)
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleUserVerification = async (user: UserAccount, action: 'verify' | 'reject', rejectionReason?: string) => {
    setIsLoading(true)

    try {
      if (action === 'reject' && !rejectionReason) {
        toast({
          title: "Rejection reason required",
          description: "Please provide a reason for rejection.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const result = await updateStudentVerification(
        user.id,
        action === 'verify' ? 'VERIFIED' : 'REJECTED',
        rejectionReason
      )

      if (!result.success) {
        throw new Error(result.error || 'API call failed')
      }

      setUsers(prev => prev.map(u =>
        u.id === user.id
          ? {
            ...u,
            verificationStatus: action === 'verify' ? 'verified' : 'rejected',
            ...(action === 'reject' && rejectionReason && { rejectionReason })
          }
          : u
      ))

      fetchPendingStudents()

      toast({
        title: "User verification updated",
        description: `User ${user.name} has been ${action}ed. Email notification sent.`,
      })

    } catch (error) {
      toast({
        title: "Verification failed",
        description: `Failed to ${action} user. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setSelectedUser(null)
      setIsLoading(false)
    }
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      processed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      verified: 'bg-green-100 text-green-800'
    }

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredRefundRequests = refundRequests.filter(refund => {
    const matchesSearch = refund.User?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.Booking?.bookingRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.refundreason?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || refund.refundstatus?.toLowerCase() === filterStatus.toLowerCase()
    return matchesSearch && matchesFilter
  })

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || u.verificationStatus === filterStatus
    return matchesSearch && matchesFilter
  })

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Update URL hash to persist tab selection
    if (typeof window !== 'undefined') {
      window.location.hash = value
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="pt-32 pb-12 max-w-7xl mx-auto px-4 sm:px-2 lg:px-2">
        <AdminHeader />

        <AdminTabs
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          refundRequests={refundRequests}
          users={users}
          pendingStudents={pendingStudents}
          isLoadingPendingStudents={isLoadingPendingStudents}
          isLoadingRefunds={isLoadingRefunds}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          setSelectedUser={setSelectedUser}
          StatusBadge={StatusBadge}
          filteredRefundRequests={filteredRefundRequests}
          filteredUsers={filteredUsers}
        />
      </div>


      <UserVerificationModal
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        handleUserVerification={handleUserVerification}
        isLoading={isLoading}
        onRefresh={fetchPendingStudents}
      />

      <FooterSection />
    </div>
  )
}
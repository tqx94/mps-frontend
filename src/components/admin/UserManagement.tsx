'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// Removed unused Textarea import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import {
  Users,
  Search,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  ShieldCheck,
  Phone,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  AlertCircle,
  Loader2,
  UserPlus,
  UserCog
} from 'lucide-react'
import {
  User,
  UserFilters,
  getAllUsers,
  updateUser,
  deleteUser,
  disableUser,
  enableUser,
  getUserStats,
  getUserAnalytics,
  updateStudentVerification,
  createAdminUser,
  formatUserDate,
  formatVerificationDate,
  getMemberTypeColor,
  getVerificationStatusColor,
  getVerificationStatusText
} from '@/lib/userService'
import { getEffectiveMemberType, getMemberTypeDisplayName } from '@/lib/userProfileService'
import { changeUserRole } from '@/lib/userManagementService'
import UserVerificationModal from './UserVerificationModal'

export function UserManagement() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  // Filter states
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    includeStats: true,
    page: 1,
    limit: 20
  })

  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [isCreateAdminDialogOpen, setIsCreateAdminDialogOpen] = useState(false)
  const [isRoleChangeDialogOpen, setIsRoleChangeDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedUserForReview, setSelectedUserForReview] = useState<User | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [roleChangeData, setRoleChangeData] = useState({
    newRole: '' as 'ADMIN' | 'STUDENT' | 'MEMBER' | 'TUTOR' | 'null' | '',
    reason: ''
  })
  const [roleChangeWarnings, setRoleChangeWarnings] = useState<string[]>([])
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    memberType: '',
    contactNumber: '',
    studentVerificationStatus: 'NA' as 'NA' | 'PENDING' | 'VERIFIED' | 'REJECTED'
  })
  const [adminFormData, setAdminFormData] = useState({
    email: '',
    password: ''
  })

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Debounced search state
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

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

  useEffect(() => {
    loadUsers()
    loadStats()
  }, [filters])

  // Reset pagination when search changes
  useEffect(() => {
    if (filters.search) {
      setFilters(prev => ({ ...prev, page: 1 }))
    }
  }, [filters.search])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await getAllUsers(filters)

      if (response.success && response.users) {
        setUsers(response.users)
        if (response.pagination) {
          setPagination(response.pagination)
        }
      } else {
        console.error('Failed to load users:', response.error)
        toast({
          title: "Error",
          description: response.error || "Failed to load users",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading users:', error)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await getUserStats()
      if (response.success && response.summary) {
        setStats(response.summary)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleFilterChange = (key: keyof UserFilters, value: string | boolean | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
      page: 1 // Reset to first page when filters change
    }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }))
  }

  const handleLimitChange = (newLimit: number) => {
    setFilters(prev => ({
      ...prev,
      limit: newLimit,
      page: 1 // Reset to first page when limit changes
    }))
  }

  const exportToExcel = async () => {
    try {
      // Call the same API but with limit 1000 to get all records
      const exportFilters = { ...filters, limit: 1000, page: 1 }
      const response = await getAllUsers(exportFilters)

      if (response.success && response.users) {
        // Convert users data to CSV format
        const csvData = convertUsersToCSV(response.users)
        downloadCSV(csvData, 'users-export.csv')

        toast({
          title: "Success",
          description: `Exported ${response.users.length} users to Excel`,
        })
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to export users",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error exporting users:', error)
      toast({
        title: "Error",
        description: "Failed to export users",
        variant: "destructive",
      })
    }
  }

  const convertUsersToCSV = (users: User[]): string => {
    const headers = [
      'ID',
      'First Name',
      'Last Name',
      'Email',
      'Member Type',
      'Contact Number',
      'Verification Status',
      'Total Bookings',
      'Total Spent',
      'Created At'
    ]

    const rows = users.map(user => [
      user.id,
      user.firstName || '',
      user.lastName || '',
      user.email,
      user.memberType,
      user.contactNumber || '',
      user.studentVerificationStatus,
      user.stats?.totalBookings || 0,
      user.stats?.totalSpent || 0,
      formatUserDate(user.createdAt)
    ])

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

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setEditFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      memberType: user.memberType,
      contactNumber: user.contactNumber || '',
      studentVerificationStatus: user.studentVerificationStatus
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!selectedUser) return

    try {
      setIsSubmitting(true)
      const response = await updateUser(selectedUser.id, editFormData)

      if (response.success) {
        toast({
          title: "Success",
          description: "User updated successfully",
        })
        setIsEditDialogOpen(false)
        loadUsers()
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update user",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Removed suspend and activate functions as they're not part of the new API

  const handleRejectClick = (user: User) => {
    setSelectedUser(user)
    setRejectionReason('')
    setIsRejectDialogOpen(true)
  }

  const handleConfirmRejection = async () => {
    if (!selectedUser || !rejectionReason.trim()) {
      toast({
        title: "Rejection reason required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      })
      return
    }

    await handleVerifyStudent(selectedUser.id, 'REJECTED', rejectionReason.trim())
    setIsRejectDialogOpen(false)
    setRejectionReason('')
  }

  const handleVerifyStudent = async (userId: string, status: 'VERIFIED' | 'REJECTED', rejectionReason?: string) => {
    try {
      setIsSubmitting(true)

      const result = await updateStudentVerification(userId, status, rejectionReason)

      if (!result.success) {
        throw new Error(result.error || 'API call failed')
      }

      toast({
        title: "Success",
        description: `Student ${status === 'VERIFIED' ? 'approved' : 'rejected'} successfully`,
      })
      loadUsers()

    } catch (error) {
      console.error('Error updating student verification:', error)
      toast({
        title: "Error",
        description: `Failed to ${status === 'VERIFIED' ? 'approve' : 'reject'} student`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle user verification from modal (for Review button)
  const handleUserVerification = async (user: User, action: 'verify' | 'reject', rejectionReason?: string) => {
    const status = action === 'verify' ? 'VERIFIED' : 'REJECTED'
    await handleVerifyStudent(user.id, status, rejectionReason)
    setSelectedUserForReview(null)
  }

  const handleDelete = async () => {
    if (!selectedUser) return

    try {
      setIsSubmitting(true)
      const response = await deleteUser(selectedUser.id)

      if (response.success) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        })
        setIsDeleteDialogOpen(false)
        loadUsers()
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete user",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDisable = async () => {
    if (!selectedUser) return

    try {
      setIsSubmitting(true)
      const response = await disableUser(selectedUser.id)

      if (response.success) {
        toast({
          title: "Success",
          description: "User disabled successfully. User will not be able to login or perform any activities.",
        })
        setIsDisableDialogOpen(false)
        loadUsers()
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to disable user",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error disabling user:', error)
      toast({
        title: "Error",
        description: "Failed to disable user",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEnable = async (user: User) => {
    try {
      setIsSubmitting(true)
      const response = await enableUser(user.id)

      if (response.success) {
        toast({
          title: "Success",
          description: "User enabled successfully. User can now login and perform activities.",
        })
        loadUsers()
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to enable user",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error enabling user:', error)
      toast({
        title: "Error",
        description: "Failed to enable user",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateAdmin = async () => {
    // Validation
    if (!adminFormData.email || !adminFormData.password) {
      toast({
        title: "Validation Error",
        description: "Email and password are required",
        variant: "destructive",
      })
      return
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(adminFormData.email)) {
      toast({
        title: "Validation Error",
        description: "Invalid email format",
        variant: "destructive",
      })
      return
    }

    // Password strength validation
    if (adminFormData.password.length < 8) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await createAdminUser(adminFormData.email, adminFormData.password)

      if (response.success) {
        toast({
          title: "Success",
          description: "Admin user created successfully",
        })
        setIsCreateAdminDialogOpen(false)
        setAdminFormData({ email: '', password: '' })
        loadUsers()
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to create admin user",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating admin:', error)
      toast({
        title: "Error",
        description: "Failed to create admin user",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRoleChangeClick = (user: User) => {
    setSelectedUser(user)
    setRoleChangeData({
      newRole: (user.memberType || 'null') as 'ADMIN' | 'STUDENT' | 'MEMBER' | 'TUTOR' | 'null' | '',
      reason: ''
    })
    setRoleChangeWarnings([])
    setIsRoleChangeDialogOpen(true)
  }

  const handleRoleChange = async () => {
    if (!selectedUser) return

    if (!roleChangeData.newRole) {
      toast({
        title: "Error",
        description: "Please select a new role",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const newRoleValue = roleChangeData.newRole === 'null' ? null : roleChangeData.newRole

      const response = await changeUserRole(
        selectedUser.id,
        newRoleValue as any,
        roleChangeData.reason || undefined
      )

      if (response.success) {
        toast({
          title: "Success",
          description: response.message,
          variant: "default",
        })

        // Show warnings if any
        if (response.warnings && response.warnings.length > 0) {
          setRoleChangeWarnings(response.warnings)
          // Don't close dialog immediately if there are warnings
          setTimeout(() => {
            setIsRoleChangeDialogOpen(false)
            setRoleChangeWarnings([])
            loadUsers() // Reload to show updated role
          }, 3000)
        } else {
          setIsRoleChangeDialogOpen(false)
          loadUsers() // Reload to show updated role
        }
      }
    } catch (error: any) {
      console.error('Error changing user role:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to change user role",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }


  const filteredUsers = users.filter(user => {
    const searchMatch = !filters.search ||
      (user.firstName && user.firstName.toLowerCase().includes(filters.search.toLowerCase())) ||
      (user.lastName && user.lastName.toLowerCase().includes(filters.search.toLowerCase())) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase())

    const memberTypeMatch = !filters.memberType || user.memberType === filters.memberType

    const verificationStatusMatch = !(filters as any).studentVerificationStatus || user.studentVerificationStatus === (filters as any).studentVerificationStatus

    return searchMatch && memberTypeMatch && verificationStatusMatch
  })



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage all registered users, their member types, and student verification status
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setAdminFormData({ email: '', password: '' })
              setIsCreateAdminDialogOpen(true)
            }}
            className="flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Create Admin</span>
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <UserCheck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.memberTypeBreakdown?.STUDENT || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Members</CardTitle>
              <UserX className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.memberTypeBreakdown?.MEMBER || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
              <ShieldCheck className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {users.filter(u => u.studentVerificationStatus === 'PENDING' && u.studentVerificationImageUrl).length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                {loading && searchInput ? (
                  <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                )}
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Member Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="memberType">Member Type</Label>
              <Select
                value={filters.memberType || 'all'}
                onValueChange={(value) => handleFilterChange('memberType', value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Member Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Member Types</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="TUTOR">Tutor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Verification Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="verificationStatus">Verification Status</Label>
              <Select
                value={(filters as any).studentVerificationStatus || 'all'}
                onValueChange={(value) => handleFilterChange('studentVerificationStatus' as any, value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="NA">Not Applicable</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setSearchInput('')
                setDebouncedSearch('')
                setFilters({
                  search: '',
                  includeStats: true,
                  page: 1,
                  limit: 20
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

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Users ({pagination.total})
            {pagination.totalPages > 1 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading users...</p>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Member Type</TableHead>
                    <TableHead>Student Verification Status</TableHead>
                    <TableHead>Verification Date</TableHead>
                    <TableHead>Total Bookings</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.email.split('@')[0]
                            }
                          </div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {user.contactNumber && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3" />
                              {user.contactNumber}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={getMemberTypeColor(getEffectiveMemberType(user.memberType, user.studentVerificationStatus))}>
                            {getMemberTypeDisplayName(user.memberType, user.studentVerificationStatus)}
                          </Badge>
                          {user.studentVerificationImageUrl && user.memberType === 'STUDENT' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => user.studentVerificationImageUrl && window.open(user.studentVerificationImageUrl, '_blank')}
                              className="h-6 w-6 p-0 hover:bg-blue-50"
                              title="View verification document"
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge className={getVerificationStatusColor(user.studentVerificationStatus)}>
                            {getVerificationStatusText(user.studentVerificationStatus)}
                          </Badge>
                          {(user.disabled || user.isDisabled) && (
                            <Badge className="bg-red-100 text-red-800">
                              Disabled
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {user.studentVerificationStatus === 'VERIFIED' && user.studentVerificationDate
                            ? formatVerificationDate(user.studentVerificationDate)
                            : 'No Date Found'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {user.stats?.totalBookings || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          ${user.stats?.totalSpent.toFixed(2) || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatUserDate(user.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">


                          {user.memberType === 'STUDENT' && user.studentVerificationStatus === 'PENDING' && user.studentVerificationImageUrl && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUserForReview(user)}
                                disabled={isSubmitting}
                                className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Review
                              </Button>

                            </>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRoleChangeClick(user)}
                            disabled={isSubmitting}
                            className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                          >
                            <UserCog className="h-4 w-4 mr-1" />
                            Change Role
                          </Button>

                          {(user.disabled || user.isDisabled) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEnable(user)}
                              disabled={isSubmitting}
                              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Enable
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user)
                                setIsDisableDialogOpen(true)
                              }}
                              disabled={isSubmitting}
                              className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Disable
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} users
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

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={editFormData.firstName}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={editFormData.lastName}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="memberType">Member Type</Label>
              <Select value={editFormData.memberType} onValueChange={(value) => setEditFormData(prev => ({ ...prev, memberType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber">Phone Number</Label>
              <Input
                id="contactNumber"
                value={editFormData.contactNumber}
                onChange={(e) => setEditFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                placeholder="+1234567890"
              />
            </div>

            {selectedUser?.memberType === 'STUDENT' && (
              <div className="space-y-2">
                <Label htmlFor="studentVerificationStatus">Student Verification Status</Label>
                <Select
                  value={editFormData.studentVerificationStatus || 'NA'}
                  onValueChange={(value: 'NA' | 'PENDING' | 'VERIFIED' | 'REJECTED') =>
                    setEditFormData(prev => ({ ...prev, studentVerificationStatus: value }))
                  }
                >
                  <SelectTrigger>
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update User'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Removed Suspend User Dialog */}

      {/* Delete User Dialog - Keeping for backward compatibility but hidden */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Permanently Delete User
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-semibold text-red-600">
                ⚠️ WARNING: This action cannot be undone!
              </p>
              <p>
                Deleting this user will <strong>permanently remove</strong> the following data:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>User account and profile information</li>
                <li>All purchased packages and passes</li>
                <li>All credits (used and unused)</li>
                <li>All payment records</li>
                <li>All refund transactions</li>
                <li>All promo code usage history</li>
              </ul>
              <p className="text-sm text-green-600 font-medium">
                ✓ Note: Booking history will be preserved for records.
              </p>
              <p className="text-sm text-amber-600 font-medium">
                ⚠️ Users with active or future bookings cannot be deleted. Cancel those bookings first.
              </p>
              <p className="font-semibold">
                Are you absolutely sure you want to delete <span className="text-red-600">{selectedUser?.email}</span>?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Yes, Permanently Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disable User Dialog */}
      <AlertDialog open={isDisableDialogOpen} onOpenChange={setIsDisableDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-orange-600 flex items-center gap-2">
              <UserX className="w-5 h-5" />
              Disable User
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-semibold text-orange-600">
                ⚠️ This will disable the user account
              </p>
              <p>
                Disabling this user will:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Prevent the user from logging in</li>
                <li>Block all user activities (bookings, payments, etc.)</li>
                <li>Preserve all user data (no data will be deleted)</li>
                <li>Allow you to re-enable the user later if needed</li>
              </ul>
              <p className="text-sm text-green-600 font-medium">
                ✓ Note: All user data will be preserved. You can enable this user again anytime.
              </p>
              <p className="font-semibold">
                Are you sure you want to disable <span className="text-orange-600">{selectedUser?.email}</span>?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDisable} 
              disabled={isSubmitting}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Disabling...
                </>
              ) : (
                'Yes, Disable User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change User Role Dialog */}
      <Dialog open={isRoleChangeDialogOpen} onOpenChange={setIsRoleChangeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-600">
              <UserCog className="w-5 h-5" />
              Change User Role
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">User</Label>
                <div className="text-sm text-gray-700 mt-1">
                  {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Current Role</Label>
                <div className="mt-1">
                  <Badge className={getMemberTypeColor(selectedUser.memberType)}>
                    {selectedUser.memberType || 'Regular User'}
                  </Badge>
                </div>
              </div>

              <div>
                <Label htmlFor="newRole" className="text-sm font-medium">New Role</Label>
                <Select
                  value={roleChangeData.newRole}
                  onValueChange={(value) => setRoleChangeData(prev => ({ ...prev, newRole: value as any }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select new role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="TUTOR">Tutor</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reason" className="text-sm font-medium">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  value={roleChangeData.reason}
                  onChange={(e) => setRoleChangeData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Why are you changing this user's role?"
                  className="mt-1"
                  rows={3}
                />
              </div>

              {roleChangeWarnings.length > 0 && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <ul className="list-disc list-inside space-y-1">
                      {roleChangeWarnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsRoleChangeDialogOpen(false)
                    setRoleChangeWarnings([])
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRoleChange}
                  disabled={isSubmitting || !roleChangeData.newRole}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    'Change Role'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Confirmation Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Confirm Rejection
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  You are about to reject the student verification for <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>.
                  This action will notify the user and they will need to resubmit their documents.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="rejectionReason" className="text-sm font-medium">
                  Rejection Reason <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Please provide a clear reason for rejection (e.g., Document is not clear, Invalid student ID, etc.)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[100px] resize-none"
                  disabled={isSubmitting}
                />

              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsRejectDialogOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmRejection}
                  disabled={isSubmitting || !rejectionReason.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User Verification Review Modal */}
      <UserVerificationModal
        selectedUser={selectedUserForReview}
        setSelectedUser={setSelectedUserForReview}
        handleUserVerification={handleUserVerification}
        isLoading={isSubmitting}
        onRefresh={loadUsers}
      />

      {/* Create Admin Dialog */}
      <Dialog open={isCreateAdminDialogOpen} onOpenChange={setIsCreateAdminDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Admin User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Email Address</Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="admin@example.com"
                value={adminFormData.email}
                onChange={(e) => setAdminFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminPassword">Password</Label>
              <Input
                id="adminPassword"
                type="password"
                placeholder="Minimum 8 characters"
                value={adminFormData.password}
                onChange={(e) => setAdminFormData(prev => ({ ...prev, password: e.target.value }))}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateAdminDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleCreateAdmin} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Admin'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

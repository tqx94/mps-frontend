'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  FileText,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  TrendingUp,
  Wallet,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
  Check
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { 
  getAllRefundRequests, 
  getAllUserCredits, 
  approveRefund, 
  rejectRefund, 
  getRefundStats,
  updateUserCredits,
  RefundTransaction,
  UserCredit,
  UserCreditsResponse
} from '@/lib/refundService'
import { 
  formatSingaporeDate, 
  formatSingaporeDateOnly,
  formatSingaporeTimeOnly
} from '@/lib/timezoneUtils'

export function RefundManagement() {
  const [refunds, setRefunds] = useState<RefundTransaction[]>([])
  const [credits, setCredits] = useState<UserCredit[]>([])
  const [creditsPagination, setCreditsPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [stats, setStats] = useState({ totalRefunded: 0, totalTransactions: 0, averageRefund: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isCreditsLoading, setIsCreditsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'refunds' | 'credits' | 'stats'>('credits')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRefund, setSelectedRefund] = useState<RefundTransaction | null>(null)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingUserEmail, setEditingUserEmail] = useState<string>('')
  const [editingAmount, setEditingAmount] = useState<string>('')
  const [isUpdatingCredits, setIsUpdatingCredits] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { toast } = useToast()

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCreditsPagination(prev => ({ ...prev, page: 1 })) // Reset to page 1 on search
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const [refundsData, statsData] = await Promise.all([
        getAllRefundRequests(),
        getRefundStats()
      ])
      
      setRefunds(refundsData)
      setStats(statsData)
    } catch (err) {
      setError('Failed to load refund data')
      console.error('Error fetching data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCredits = async () => {
    try {
      setIsCreditsLoading(true)
      const creditsResp = await getAllUserCredits({ 
        page: creditsPagination.page, 
        limit: creditsPagination.limit, 
        search: debouncedSearchTerm 
      })
      setCredits(creditsResp.items)
      setCreditsPagination(creditsResp.pagination)
    } catch (err) {
      setError('Failed to load credits data')
      console.error('Error fetching credits:', err)
    } finally {
      setIsCreditsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (activeTab === 'credits') {
      fetchCredits()
    }
  }, [creditsPagination.page, creditsPagination.limit, debouncedSearchTerm, activeTab])

  const handlePageChange = (newPage: number) => {
    setCreditsPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleLimitChange = (newLimit: number) => {
    setCreditsPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))
  }

  const handleApproveRefund = async (refundId: string) => {
    try {
      setIsApproving(true)
      const result = await approveRefund(refundId)
      
      toast({
        title: "Refund Approved",
        description: `Refund approved. Credit of ${formatCurrency(result.creditamount)} added to user account.`,
      })
      
      setSelectedRefund(null)
      fetchData()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to approve refund. Please try again.",
        variant: "destructive"
      })
      console.error('Error approving refund:', err)
    } finally {
      setIsApproving(false)
    }
  }

  const handleRejectRefund = async (refundId: string) => {
    try {
      setIsRejecting(true)
      await rejectRefund(refundId)
      
      toast({
        title: "Refund Rejected",
        description: "Refund request has been rejected.",
      })
      
      setSelectedRefund(null)
      fetchData()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to reject refund. Please try again.",
        variant: "destructive"
      })
      console.error('Error rejecting refund:', err)
    } finally {
      setIsRejecting(false)
    }
  }

  const handleEditCredits = (userId: string, userEmail: string, currentRemaining: number) => {
    setEditingUserId(userId)
    setEditingUserEmail(userEmail)
    setEditingAmount(currentRemaining.toFixed(2))
    setIsEditDialogOpen(true)
  }

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false)
    setEditingUserId(null)
    setEditingUserEmail('')
    setEditingAmount('')
  }

  const handleSaveCredits = async () => {
    if (!editingUserId) return
    
    try {
      setIsUpdatingCredits(true)
      const newAmount = parseFloat(editingAmount)
      
      if (isNaN(newAmount) || newAmount < 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid positive number.",
          variant: "destructive"
        })
        return
      }

      const result = await updateUserCredits(editingUserId, newAmount)
      
      toast({
        title: "Credits Updated",
        description: `Credits updated from ${formatCurrency(result.oldAmount)} to ${formatCurrency(result.newAmount)}`,
      })
      
      setIsEditDialogOpen(false)
      setEditingUserId(null)
      setEditingUserEmail('')
      setEditingAmount('')
      fetchCredits()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update credits. Please try again.",
        variant: "destructive"
      })
      console.error('Error updating credits:', err)
    } finally {
      setIsUpdatingCredits(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    // Handle dates that might have +00:00 timezone or Z suffix
    const date = new Date(dateString)
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date'
    }
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Singapore'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Approved
        </Badge>
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{status}</Badge>
    }
  }

  const filteredRefunds = refunds.filter(refund => {
    const matchesSearch = searchTerm === '' || 
      refund.Booking?.bookingRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.User?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || refund.refundstatus === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const filteredCredits = credits

  if (isLoading && activeTab !== 'credits') {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  if (error && activeTab !== 'credits') {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={fetchData} variant="outline" className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Credits</h2>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Refunded</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRefunded)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold">{stats.totalTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Refund</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.averageRefund)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Tabs */}
      {/* <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('refunds')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'refunds'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
          }`}
        >
          Refund Requests
        </button>
        <button
          onClick={() => setActiveTab('credits')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'credits'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
          }`}
        >
          User Credits
        </button>
       
      </div> */}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {activeTab === 'credits' && (
          <div className="relative flex-1">
            {isCreditsLoading ? (
              <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            )}
            <Input
              placeholder="Search by user email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
        {activeTab === 'refunds' && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="REQUESTED">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Refund Requests Tab */}
      {activeTab === 'refunds' && (
        <Card>
          <CardHeader>
            <CardTitle>Refund Requests ({filteredRefunds.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRefunds.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No refund requests found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRefunds.map((refund) => (
                  <div
                    key={refund.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {refund.Booking?.bookingRef || 'N/A'}
                        </span>
                        {getStatusBadge(refund.refundstatus)}
                      </div>
                      {refund.refundstatus === 'REQUESTED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRefund(refund)}
                        >
                          Review
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">User:</span>
                          <span>{refund.User?.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Amount:</span>
                          <span>{formatCurrency(refund.refundamount)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Requested:</span>
                          <span>{formatDate(refund.requestedat)}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {refund.Booking && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">Location:</span>
                            <span>{refund.Booking.location}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Reason:</span>
                          <p className="text-gray-600 mt-1">{refund.refundreason}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* User Credits Tab */}
      {activeTab === 'credits' && (
        <Card>
          <CardHeader>
            <CardTitle>User Credits ({creditsPagination.total})</CardTitle>
          </CardHeader>
          <CardContent>
            {isCreditsLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
                <p className="text-gray-500">Loading credits...</p>
              </div>
            ) : filteredCredits.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No user credits found</p>
              </div>
            ) : (
              <Accordion type="multiple" className="w-full">
                {(() => {
                  // Group credits by user
                  const grouped: Record<string, any> = {};
                  filteredCredits.forEach((c: any) => {
                    if (!grouped[c.userid]) {
                      grouped[c.userid] = {
                        userEmail: c.User?.email || 'N/A',
                        items: [],
                        totalCredit: c.totalCredit ?? 0,
                        usedCredit: c.usedCredit ?? 0,
                        remainingCredit: c.remainingCredit ?? 0,
                      };
                    }
                    grouped[c.userid].items.push(c);
                  });
                  const groups = Object.values(grouped);
                  return groups.map((group: any, idx: number) => {
                    const userId = group.items[0]?.userid;
                    return (
                    <AccordionItem key={idx} value={`user-${idx}`} className="border rounded-lg mb-3 px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{group.userEmail}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600">Total:</span>
                              <span className="font-medium">{formatCurrency(group.totalCredit)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-orange-500" />
                              <span className="text-gray-600">Used:</span>
                              <span className="text-orange-600 font-medium">{formatCurrency(group.usedCredit)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Wallet className="h-4 w-4 text-green-500" />
                                <span className="text-gray-600">Remaining:</span>
                                <span className="text-green-600 font-medium">{formatCurrency(group.remainingCredit)}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditCredits(userId, group.userEmail, group.remainingCredit);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      
                      <AccordionContent>
                        {/* User's individual credits */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                          {group.items.map((credit: any) => (
                            <div key={credit.id} className="p-3 border rounded-md bg-gray-50">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    className={
                                      credit.status === 'ACTIVE'
                                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                                        : 'bg-gray-200 text-gray-800'
                                    }
                                  >
                                    {credit.status}
                                  </Badge>
                                  <span className="font-medium">{formatCurrency(credit.amount)}</span>
                                </div>
                                {credit.Booking && (
                                  <div className="text-xs text-gray-500">{credit.Booking.bookingRef}</div>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="text-gray-500">Created</div>
                                <div>{formatDate(credit.createdat)}</div>
                                <div className="text-gray-500">Expires</div>
                                <div>{formatDate(credit.expiresat)}</div>
                                {typeof credit.creditUsed === 'number' && (
                                  <>
                                    <div className="text-gray-500">Used (this credit)</div>
                                    <div className="text-orange-600">{formatCurrency(credit.creditUsed)}</div>
                                  </>
                                )}
                                {typeof credit.creditRemaining === 'number' && (
                                  <>
                                    <div className="text-gray-500">Remaining (this credit)</div>
                                    <div className="text-green-600">{formatCurrency(credit.creditRemaining)}</div>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )});
                })()}
              </Accordion>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {activeTab === 'credits' && creditsPagination.totalPages > 1 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>
                  Showing {((creditsPagination.page - 1) * creditsPagination.limit) + 1} to{' '}
                  {Math.min(creditsPagination.page * creditsPagination.limit, creditsPagination.total)} of{' '}
                  {creditsPagination.total} credits
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select value={creditsPagination.limit.toString()} onValueChange={(value) => handleLimitChange(parseInt(value))}>
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
                    disabled={creditsPagination.page === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(creditsPagination.page - 1)}
                    disabled={creditsPagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, creditsPagination.totalPages) }, (_, i) => {
                      let pageNum: number
                      if (creditsPagination.totalPages <= 5) {
                        pageNum = i + 1
                      } else if (creditsPagination.page <= 3) {
                        pageNum = i + 1
                      } else if (creditsPagination.page >= creditsPagination.totalPages - 2) {
                        pageNum = creditsPagination.totalPages - 4 + i
                      } else {
                        pageNum = creditsPagination.page - 2 + i
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={creditsPagination.page === pageNum ? "default" : "outline"}
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
                    onClick={() => handlePageChange(creditsPagination.page + 1)}
                    disabled={creditsPagination.page === creditsPagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(creditsPagination.totalPages)}
                    disabled={creditsPagination.page === creditsPagination.totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refund Review Dialog */}
      <Dialog open={!!selectedRefund} onOpenChange={() => setSelectedRefund(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Refund Request</DialogTitle>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Booking Reference</Label>
                  <p className="font-medium">{selectedRefund.Booking?.bookingRef || 'N/A'}</p>
                </div>
                <div>
                  <Label>Amount</Label>
                  <p className="font-medium">{formatCurrency(selectedRefund.refundamount)}</p>
                </div>
                <div>
                  <Label>User Email</Label>
                  <p className="font-medium">{selectedRefund.User?.email || 'N/A'}</p>
                </div>
                <div>
                  <Label>Requested Date</Label>
                  <p className="font-medium">{formatDate(selectedRefund.requestedat)}</p>
                </div>
              </div>
              
              <div>
                <Label>Reason</Label>
                <p className="text-gray-600 mt-1">{selectedRefund.refundreason}</p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  onClick={() => setSelectedRefund(null)}
                  disabled={isApproving || isRejecting}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-red-500 hover:bg-red-500/90 text-white border-red-500 hover:border-red-500"
                  onClick={() => handleRejectRefund(selectedRefund.id)}
                  disabled={isApproving || isRejecting}
                >
                  {isRejecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    'Reject'
                  )}
                </Button>
                <Button
                  className="bg-orange-500 hover:bg-orange-500/90 text-white border-orange-500 hover:border-orange-500"
                  onClick={() => handleApproveRefund(selectedRefund.id)}
                  disabled={isApproving || isRejecting}
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    'Approve'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Credits Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User Credits</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">User Email</Label>
              <p className="text-sm text-gray-600 mt-1">{editingUserEmail}</p>
            </div>
            
            <div>
              <Label htmlFor="credit-amount" className="text-sm font-medium text-gray-700">
                Remaining Credits (SGD)
              </Label>
              <Input
                id="credit-amount"
                type="number"
                step="0.01"
                min="0"
                value={editingAmount}
                onChange={(e) => setEditingAmount(e.target.value)}
                className="mt-1"
                placeholder="Enter amount"
                disabled={isUpdatingCredits}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the new remaining credit amount for this user
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isUpdatingCredits}
                className="border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCredits}
                disabled={isUpdatingCredits}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isUpdatingCredits ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Update Credits
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

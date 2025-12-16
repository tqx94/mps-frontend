'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
  DollarSign
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getUserRefundRequests, requestRefund, RefundTransaction } from '@/lib/refundService'

interface RefundRequestsProps {
  userId: string
  onRefundRequested?: () => void
}

export function RefundRequests({ userId, onRefundRequested }: RefundRequestsProps) {
  const [refunds, setRefunds] = useState<RefundTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [selectedBookingId, setSelectedBookingId] = useState('')
  const { toast } = useToast()

  const fetchRefunds = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getUserRefundRequests(userId)
      setRefunds(data)
    } catch (err) {
      setError('Failed to load refund requests')
      console.error('Error fetching refunds:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchRefunds()
    }
  }, [userId])

  const handleRefundRequest = async () => {
    if (!selectedBookingId || !refundReason.trim()) {
      toast({
        title: "Error",
        description: "Please select a booking and provide a reason for the refund.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      await requestRefund(selectedBookingId, refundReason, userId)
      
      toast({
        title: "Refund Approved",
        description: "Your refund has been approved and added to your store credits.",
      })
      
      setIsRequestDialogOpen(false)
      setRefundReason('')
      setSelectedBookingId('')
      fetchRefunds()
      
      if (onRefundRequested) {
        onRefundRequested()
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to submit refund request. Please try again.",
        variant: "destructive"
      })
      console.error('Error requesting refund:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Refund Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading refund requests...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Refund Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchRefunds} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Refund Requests
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchRefunds} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
         
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Refund</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bookingId">Booking ID</Label>
                    <input
                      id="bookingId"
                      type="text"
                      value={selectedBookingId}
                      onChange={(e) => setSelectedBookingId(e.target.value)}
                      placeholder="Enter booking ID"
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason for Refund</Label>
                    <Textarea
                      id="reason"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Please explain why you need a refund..."
                      className="w-full"
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsRequestDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleRefundRequest}
                      disabled={isSubmitting || !selectedBookingId || !refundReason.trim()}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Request'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {refunds.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No refund requests found</p>
            <p className="text-sm text-gray-400">
              Your refund requests will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {refunds.map((refund) => (
              <div
                key={refund.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(refund.refundstatus)}
                    <span className="font-medium">
                      {refund.Booking?.bookingRef || 'N/A'}
                    </span>
                  </div>
                  {getStatusBadge(refund.refundstatus)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
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
                    {refund.processedat && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Processed:</span>
                        <span>{formatDate(refund.processedat)}</span>
                      </div>
                    )}
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

        {/* Info Alert */}
        <Alert className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> Approved refunds will be added to your store credits, which expire in 30 days. Store credits used cannot be refunded for any cancellation
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { requestRefund, getUserRefundRequests, RefundTransaction } from '@/lib/refundService'

export function RefundSystemTest() {
  const { userId } = useAuth() // Get dynamic user ID from auth context
  const [bookingId, setBookingId] = useState('')
  const [reason, setReason] = useState('')
  const [testUserId, setTestUserId] = useState('') // For testing with different user IDs
  const [isLoading, setIsLoading] = useState(false)
  const [refunds, setRefunds] = useState<RefundTransaction[]>([])
  const { toast } = useToast()

  // Use dynamic user ID from auth, or test user ID if provided
  const currentUserId = testUserId || userId

  const handleRequestRefund = async () => {
    if (!bookingId || !reason) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      })
      return
    }

    if (!currentUserId) {
      toast({
        title: "Error",
        description: "User ID not available. Please log in.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsLoading(true)
      const result = await requestRefund(bookingId, reason, currentUserId)
      toast({
        title: "Success",
        description: "Refund request submitted successfully"
      })
      setBookingId('')
      setReason('')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit refund request",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGetRefunds = async () => {
    if (!currentUserId) {
      toast({
        title: "Error",
        description: "User ID not available. Please log in.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsLoading(true)
      const result = await getUserRefundRequests(currentUserId)
      setRefunds(result)
      toast({
        title: "Success",
        description: `Found ${result.length} refund requests`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch refund requests",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Refund System Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="currentUserId">Current User ID (from auth)</Label>
            <Input
              id="currentUserId"
              value={userId || 'Not logged in'}
              disabled
              className="bg-gray-50"
            />
          </div>
          
          <div>
            <Label htmlFor="testUserId">Test User ID (optional - leave empty to use current user)</Label>
            <Input
              id="testUserId"
              value={testUserId}
              onChange={(e) => setTestUserId(e.target.value)}
              placeholder="Enter test user ID (optional)"
            />
            <p className="text-sm text-gray-500 mt-1">
              Using: {currentUserId || 'No user ID available'}
            </p>
          </div>
          
          <div>
            <Label htmlFor="bookingId">Booking ID</Label>
            <Input
              id="bookingId"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              placeholder="Enter booking ID"
            />
          </div>
          
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter refund reason"
              rows={3}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleRequestRefund}
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'Request Refund'}
            </Button>
            
            <Button 
              onClick={handleGetRefunds}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? 'Loading...' : 'Get Refund Requests'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {refunds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Refund Requests ({refunds.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {refunds.map((refund) => (
                <div key={refund.id} className="p-3 border rounded">
                  <div><strong>ID:</strong> {refund.id}</div>
                  <div><strong>Status:</strong> {refund.refundstatus}</div>
                  <div><strong>Amount:</strong> ${refund.refundamount}</div>
                  <div><strong>Reason:</strong> {refund.refundreason}</div>
                  <div><strong>Requested:</strong> {new Date(refund.requestedat).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
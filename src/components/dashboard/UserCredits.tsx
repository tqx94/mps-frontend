'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Wallet, 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getUserCredits, UserCredit } from '@/lib/refundService'

interface UserCreditsProps {
  userId: string
}

export function UserCredits({ userId }: UserCreditsProps) {
  const [credits, setCredits] = useState<UserCredit[]>([])
  const [totalCredit, setTotalCredit] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchCredits = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getUserCredits(userId)
      setCredits(data.credits)
      setTotalCredit(data.totalCredit)
    } catch (err) {
      setError('Failed to load credits')
      console.error('Error fetching credits:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchCredits()
    }
  }, [userId])

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

  const getExpiryStatus = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 0) return { status: 'expired', color: 'bg-red-100 text-red-800 border-red-200', text: 'Expired' }
    if (daysUntilExpiry <= 3) return { status: 'expiring', color: 'bg-red-100 text-red-800 border-red-200', text: `${daysUntilExpiry} days left` }
    if (daysUntilExpiry <= 7) return { status: 'warning', color: 'bg-orange-100 text-orange-800 border-orange-200', text: `${daysUntilExpiry} days left` }
    return { status: 'active', color: 'bg-green-100 text-green-800 border-green-200', text: `${daysUntilExpiry} days left` }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'USED':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'EXPIRED':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Store Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading credits...</span>
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
            <Wallet className="h-5 w-5" />
            Store Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchCredits} variant="outline" className="mt-4">
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
            <Wallet className="h-5 w-5" />
            Store Credits
          </div>
          <Button onClick={fetchCredits} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Total Credit Summary */}
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Available Credit</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalCredit)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {credits.length} credit{credits.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {/* Credits List */}
        {credits.length === 0 ? (
          <div className="text-center py-8">
            <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No store credits available</p>
            <p className="text-sm text-gray-400">
              Credits will appear here when you receive refunds
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {credits.map((credit) => {
              const expiryStatus = getExpiryStatus(credit.expiresat)
              return (
                <div
                  key={credit.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(credit.status)}
                      <span className="font-medium">
                        {formatCurrency(credit.amount)}
                      </span>
                    </div>
                    <Badge className={expiryStatus.color}>
                      {expiryStatus.text}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <strong>Refunded from:</strong> {credit.Booking?.bookingRef || 'Adjusted by Admin'}
                    </p>
                    <p>
                      <strong>Refunded on:</strong> {formatDate(credit.refundedat)}
                    </p>
                    <p>
                      <strong>Expires on:</strong> {formatDate(credit.expiresat)}
                    </p>
                    {credit.Booking && (
                      <p>
                        <strong>Original booking:</strong> {credit.Booking.location} - {formatDate(credit.Booking.startAt)}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Disclaimer */}
        <Alert className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> Store credits expire 30 days after being issued. 
            Use them before the expiry date to avoid losing them.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

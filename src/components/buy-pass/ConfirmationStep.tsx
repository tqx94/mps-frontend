// src/components/buy-pass/ConfirmationStep.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw, Package, Clock, Calendar } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { formatCurrency } from '@/lib/paymentUtils'

type ConfirmationStatus = 'idle' | 'loading' | 'success' | 'error'

type ConfirmationData = {
  userPackageId: string
  orderId: string
  paymentStatus: string
  hitpayReference: string
  packageName: string
  packageType: string
  targetRole: string
  baseAmount?: number
  cardFee?: number
  payNowFee?: number
  totalAmount: number
  paymentMethod?: string // Add payment method (optional for backward compatibility)
  activatedAt: string
  expiresAt: string
  userInfo: {
    email: string
    name: string
    memberType: string
  }
  packageContents?: {
    totalHours: number
    halfDayHours: number
    halfDayPasses: number
    complimentaryHours: number
  }
}

type Props = {
  userPackageId: string
  orderId: string
  onBack: () => void
  onSuccess: (data: ConfirmationData) => void
}

export default function ConfirmationStep({
  userPackageId,
  orderId,
  onBack,
  onSuccess
}: Props) {
  const [status, setStatus] = useState<ConfirmationStatus>('idle')
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null)
  const [error, setError] = useState<string>('')
  const searchParams = useSearchParams()

  // Dynamic payment fee settings state
  const [feeSettings, setFeeSettings] = useState({
    paynowFee: 0.20,
    creditCardFeePercentage: 5.0
  })

  // Load payment fee settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { getPaymentSettings } = await import('@/lib/paymentSettingsService')
        const settings = await getPaymentSettings()
        setFeeSettings({
          paynowFee: settings.PAYNOW_TRANSACTION_FEE,
          creditCardFeePercentage: settings.CREDIT_CARD_TRANSACTION_FEE_PERCENTAGE
        })
      } catch (error) {
        console.error('Error loading payment fee settings:', error)
      }
    }
    loadSettings()
  }, [])

  // Auto-trigger confirmation when component mounts
  useEffect(() => {
    if (userPackageId && orderId && status === 'idle') {
      // Check payment status first
      const paymentStatus = searchParams.get('status')
      if (paymentStatus === 'canceled' || paymentStatus === 'cancelled') {
        setStatus('error')
        setError('Payment was canceled. Your package purchase was not completed.')
        return
      }
      
      if (paymentStatus === 'declined' || paymentStatus === 'rejected' || paymentStatus === 'expired') {
        setStatus('error')
        setError('Payment was declined. Your package purchase was not completed.')
        return
      }
      
      handleConfirm()
    }
  }, [userPackageId, orderId])

  const handleConfirm = async () => {
    try {
      setStatus('loading')
      setError('')
      
      // Get reference from URL params (HitPay webhook response)
      const hitpayReference = searchParams.get('reference') || searchParams.get('reference_number') || orderId
      
      console.log('Confirming package purchase:', {
        userPackageId,
        orderId,
        hitpayReference
      })

      if (!userPackageId || !hitpayReference) {
        throw new Error('Missing purchase information')
      }

      // Import the service dynamically
      const { default: packageService } = await import('@/lib/services/packageService')
      const result = await packageService.confirmPackagePurchase({
        userPackageId,
        orderId,
        hitpayReference
      })
      
      if (result.success) {
        console.log('Package confirmation response:', result.data)
        console.log('Payment method from response:', result.data.paymentMethod)
        setConfirmationData(result.data)
        setStatus('success')
        onSuccess(result.data)
        console.log('Package purchase confirmed successfully:', result.data)
      } else {
        throw new Error(result.message || 'Failed to confirm purchase')
      }
    } catch (error) {
      console.error('Package confirmation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to confirm purchase')
      setStatus('error')
    }
  }

  const handleRetry = () => {
    setStatus('idle')
    setError('')
    setConfirmationData(null)
    handleConfirm()
  }

  // Calculate amount breakdown based on payment method
  const calculateAmountBreakdown = (confirmationData: ConfirmationData) => {
    if (!confirmationData) return { subtotal: 0, cardFee: 0, payNowFee: 0, total: 0 }
    
    // Prefer data from API response if available
    if (confirmationData.baseAmount !== undefined) {
      const subtotal = confirmationData.baseAmount
      const cardFee = confirmationData.cardFee || 0
      const payNowFee = confirmationData.payNowFee || 0
      const total = confirmationData.totalAmount
      const showBreakdown = cardFee > 0 || payNowFee > 0
      
      return { subtotal, cardFee, payNowFee, total, showBreakdown, isPayNow: payNowFee > 0 }
    }
    
    // Fallback to client-side calculation for old data
    const total = confirmationData.totalAmount
    const paymentMethod = confirmationData.paymentMethod
    
    // Handle old payments where paymentMethod might be null
    if (!paymentMethod) {
      // For old payments, show total amount as is (no breakdown)
      return { subtotal: total, cardFee: 0, payNowFee: 0, total, showBreakdown: false }
    }
    
    const isCardPayment = paymentMethod.toLowerCase().includes('card')
    const isPayNow = paymentMethod.toLowerCase().includes('paynow')
    
    if (isCardPayment) {
      // If card payment, totalAmount is the base amount, add dynamic % card fee
      const subtotal = total // Base amount (stored in database)
      const cardFee = total * (feeSettings.creditCardFeePercentage / 100) // Dynamic % card fee
      const finalTotal = subtotal + cardFee // Total with card fee
      return { subtotal, cardFee, payNowFee: 0, total: finalTotal, showBreakdown: true }
    } else if (isPayNow) {
      // If PayNow payment, add dynamic PayNow fee
      const subtotal = total // Base amount (stored in database)
      const payNowFee = feeSettings.paynowFee // Dynamic PayNow flat fee
      const finalTotal = subtotal + payNowFee // Total with PayNow fee
      return { subtotal, cardFee: 0, payNowFee, total: finalTotal, showBreakdown: true, isPayNow: true }
    } else {
      // If not card payment or PayNow, show total amount as is (no breakdown)
      return { subtotal: total, cardFee: 0, payNowFee: 0, total, showBreakdown: false }
    }
  }

  return (
    <div className="space-y-6">
      {status === 'idle' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h3 className="text-xl font-medium mb-2">Preparing Confirmation</h3>
          <p className="text-gray-600">Getting ready to confirm your package purchase...</p>
        </div>
      )}

      {status === 'loading' && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <h3 className="text-xl font-medium mb-2">Confirming Purchase</h3>
          <p className="text-gray-600">Please wait while we activate your package...</p>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h4 className="font-medium text-blue-800 mb-2">Processing Details:</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Order ID:</strong> {orderId}</p>
              <p><strong>Package ID:</strong> {userPackageId}</p>
              <p><strong>Reference:</strong> {searchParams.get('reference') || 'Processing...'}</p>
            </div>
          </div>
        </div>
      )}

      {status === 'success' && confirmationData && (
        <div className="space-y-6">
            {/* Success Header */}
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-green-600 mb-2">Package Activated Successfully!</h3>
              <p className="text-gray-600">Your package has been confirmed and activated.</p>
            </div>

            {/* Package Details Card */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-medium mb-4">Package Details</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Package Name</span>
                    <span className="text-gray-900">{confirmationData.packageName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Package Type</span>
                    <span className="text-gray-900">{confirmationData.packageType}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Target Role</span>
                    <span className="text-gray-900">{confirmationData.targetRole}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Payment Method</span>
                    <span className="text-gray-900 capitalize">
                      {confirmationData.paymentMethod || 'PayNow'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details Card */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-medium mb-4">Payment Details</h4>
                <div className="space-y-3">
                  {(() => {
                    const { subtotal, cardFee, payNowFee, total, showBreakdown, isPayNow } = calculateAmountBreakdown(confirmationData)
                    
                    if (showBreakdown) {
                      // Show breakdown for card or PayNow payments
                      return (
                        <>
                          <div className="flex justify-between items-center">
                            <span>Package Amount</span>
                            <span>SGD ${subtotal.toFixed(2)}</span>
                          </div>
                          {cardFee > 0 && (
                            <div className="flex justify-between items-center text-orange-600">
                              <span>Credit Card Fee ({feeSettings.creditCardFeePercentage}%)</span>
                              <span>SGD ${formatCurrency(cardFee)}</span>
                            </div>
                          )}
                          {payNowFee > 0 && (
                            <div className="flex justify-between items-center text-blue-600">
                              <span>PayNow Fee</span>
                              <span>SGD ${formatCurrency(payNowFee)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center font-bold border-t pt-3">
                            <span>Total Paid</span>
                            <span>SGD ${formatCurrency(total)}</span>
                          </div>
                        </>
                      )
                    } else {
                      // Show simple total for other payments
                      return (
                        <div className="flex justify-between items-center font-bold">
                          <span>Total Paid</span>
                          <span>SGD ${total.toFixed(2)}</span>
                        </div>
                      )
                    }
                  })()}
                </div>
              </CardContent>
            </Card>


            {/* Customer Information Card */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-medium mb-4">Customer Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Name</span>
                    <span className="font-medium">{confirmationData.userInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email</span>
                    <span className="font-medium">{confirmationData.userInfo.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Member Type</span>
                    <span className="font-medium">{confirmationData.userInfo.memberType}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-red-600 mb-4">
            {error.includes('canceled') || error.includes('cancelled') ? 'Payment Canceled' : 'Confirmation Failed'}
          </h3>
          <p className="text-gray-600 mb-4">
            {error.includes('canceled') || error.includes('cancelled') 
              ? 'Your payment was canceled and no charges were made to your account.'
              : 'We encountered an issue while confirming your package purchase.'
            }
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-800 mb-1">Error Details</h4>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-left">
            <h4 className="font-medium text-gray-800 mb-2">Purchase Information</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Order ID:</strong> {orderId}</p>
              <p><strong>Package ID:</strong> {userPackageId}</p>
              <p><strong>Reference:</strong> {searchParams.get('reference') || 'Not found'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={onBack} 
          disabled={status === 'loading'}
          className="flex-1"
        >
          Back
        </Button>
        
        {status === 'error' && !error.includes('canceled') && !error.includes('cancelled') && (
          <Button
            onClick={handleRetry}
            disabled={status === 'loading'}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
        
        {status === 'error' && (error.includes('canceled') || error.includes('cancelled')) && (
          <Button
            onClick={() => window.location.href = '/buy-pass'}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </Button>
        )}
        
        {status === 'success' && (
          <Button
            onClick={() => window.location.href = '/dashboard#overview'}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
          >
            Go to Dashboard
          </Button>
        )}
      </div>
    </div>
  )
}

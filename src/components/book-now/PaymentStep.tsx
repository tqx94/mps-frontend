// src/components/book-now/PaymentStep.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { CreditCard, QrCode, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/paymentUtils'
import { authenticatedFetch } from '@/lib/apiClient'

type PaymentMethod = 'payNow' | 'creditCard'

type Props = {
  subtotal: number
  total: number
  discountAmount: number
  appliedVoucher?: { code: string } | null
  selectedPackage?: string
  customer: { name: string; email: string; phone: string }
  bookingId?: string // Add booking ID for confirmation
  onBack: () => void
  onComplete: () => void
  onPaymentMethodChange: (method: PaymentMethod, newTotal: number) => void
  paymentFeeSettings?: {
    paynowFee: number
    creditCardFeePercentage: number
  }
  // New props for booking creation
  onCreateBooking?: () => Promise<string | null> // Function to create booking and return booking ID
  onBookingCreated?: (bookingId: string) => void // Callback when booking is created
  // Extension specific props
  isExtension?: boolean
  extensionData?: {
    newEndAt: string
    seatNumbers: string[]
    extensionHours: number
    extensionCost: number
    originalEndAt?: string
    creditAmount?: number
  }
  // Reschedule specific props
  isReschedule?: boolean
  rescheduleData?: {
    originalStartAt: string
    originalEndAt: string
    newStartAt: string
    newEndAt: string
    seatNumbers: string[]
    additionalHours: number
    additionalCost: number
    creditAmount?: number
  }
  // Loading state
  isLoading?: boolean
}

export default function PaymentStep({
  subtotal,
  total,
  discountAmount,
  appliedVoucher,
  selectedPackage,
  customer,
  bookingId,
  onBack,
  onComplete,
  onPaymentMethodChange,
  onCreateBooking,
  onBookingCreated,
  isExtension = false,
  extensionData,
  isReschedule = false,
  rescheduleData,
  isLoading = false,
  paymentFeeSettings
}: Props) {
  const [loading, setLoading] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('payNow')
  
  // Use provided settings or fetch defaults
  const [feeSettings, setFeeSettings] = useState(paymentFeeSettings || {
    paynowFee: 0.20,
    creditCardFeePercentage: 5.0
  })

  // Load payment fee settings if not provided
  useEffect(() => {
    if (!paymentFeeSettings) {
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
    } else {
      setFeeSettings(paymentFeeSettings)
    }
  }, [paymentFeeSettings])
  
  // Calculate totals based on payment method using dynamic fees
  const transactionFee = selectedPaymentMethod === 'creditCard' 
    ? total * (feeSettings.creditCardFeePercentage / 100)
    : (total < 10 ? feeSettings.paynowFee : 0)  // PayNow fee only for < $10
  const finalTotal = total + transactionFee

  // Notify parent component of initial payment method on mount
  useEffect(() => {
    const initialFee = total < 10 ? feeSettings.paynowFee : 0  // Only for < $10
    const initialTotal = total + initialFee
    console.log('PaymentStep mounted - Initial method: payNow, Total:', initialTotal)
    onPaymentMethodChange('payNow', initialTotal)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - only run on mount

  // Map payment methods to API values
  const getPaymentMethodForAPI = (method: PaymentMethod): string => {
    return method === 'creditCard' ? 'card' : 'paynow_online'
  }

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method)
    const transactionFee = method === 'creditCard'
      ? total * (feeSettings.creditCardFeePercentage / 100)
      : total < 10
        ? feeSettings.paynowFee
        : 0
    const newTotal = total + transactionFee
    console.log(`Payment method changed to: ${method} (API value: ${getPaymentMethodForAPI(method)})`)
    onPaymentMethodChange(method, newTotal)
  }

  const handlePay = async () => {
    setLoading(true)
    try {
      let currentBookingId = bookingId

      // Create booking if it doesn't exist yet
      if (!currentBookingId && onCreateBooking) {
        console.log('Creating booking before payment...')
        const newBookingId = await onCreateBooking()
        
        if (!newBookingId) {
          throw new Error('Failed to create booking')
        }

        currentBookingId = newBookingId

        // Notify parent component about the created booking
        if (onBookingCreated) {
          onBookingCreated(newBookingId)
        }
      }

      if (!currentBookingId) {
        throw new Error('No booking ID available for payment')
      }

      // Include booking ID in the redirect URL for confirmation
      const apiPaymentMethod = getPaymentMethodForAPI(selectedPaymentMethod);
      const redirectUrl = isExtension 
        ? `${window.location.origin}${window.location.pathname}?step=3&bookingId=${currentBookingId}&extension=true&extensionHours=${extensionData?.extensionHours || 0}&extensionCost=${extensionData?.extensionCost || 0}&creditAmount=${extensionData?.creditAmount || 0}&newEndAt=${encodeURIComponent(extensionData?.newEndAt || '')}&seatNumbers=${encodeURIComponent(JSON.stringify(extensionData?.seatNumbers || []))}&originalEndAt=${encodeURIComponent(extensionData?.originalEndAt || '')}&paymentMethod=${apiPaymentMethod}`
        : isReschedule
        ? `${window.location.origin}${window.location.pathname}?step=3&bookingId=${currentBookingId}&reschedule=true&additionalHours=${rescheduleData?.additionalHours || 0}&additionalCost=${rescheduleData?.additionalCost || 0}&creditAmount=${rescheduleData?.creditAmount || 0}&newStartAt=${encodeURIComponent(rescheduleData?.newStartAt || '')}&newEndAt=${encodeURIComponent(rescheduleData?.newEndAt || '')}&seatNumbers=${encodeURIComponent(JSON.stringify(rescheduleData?.seatNumbers || []))}&originalStartAt=${encodeURIComponent(rescheduleData?.originalStartAt || '')}&originalEndAt=${encodeURIComponent(rescheduleData?.originalEndAt || '')}&paymentMethod=${apiPaymentMethod}`
        : `${window.location.origin}${window.location.pathname}?step=3&bookingId=${currentBookingId}&paymentMethod=${apiPaymentMethod}`

      const body = {
        amount: finalTotal.toFixed(2),
        currency: 'SGD',
        email: customer.email,
        name: customer.name,
        purpose: isExtension ? 'Booking Extension Payment for My Productive Space' : isReschedule ? 'Booking Reschedule Payment for My Productive Space' : 'Test Order Payment for My Productive Space',
        reference_number: isReschedule ? `RESCHEDULE_${currentBookingId}` : isExtension ? `EXTEND_${currentBookingId}` : `${currentBookingId}`,
        redirect_url: redirectUrl,
        // webhook: `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/hitpay/webhook`,
        webhook: `https://productive-space-backend.vercel.app/hitpay/webhook`,

        payment_methods: [getPaymentMethodForAPI(selectedPaymentMethod)], // Array of strings
        bookingId: currentBookingId, // Use the created booking ID
        isExtension: isExtension, // Flag to identify extension payments
        extensionData: extensionData, // Extension details for backend processing (includes creditAmount)
        isReschedule: isReschedule, // Flag to identify reschedule payments
        rescheduleData: rescheduleData, // Reschedule details for backend processing
      }

      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/hitpay/create-payment`, {
        method: 'POST',
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setLoading(false)
      }
    } catch (err) {
      console.error('Payment error:', err)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="font-medium mb-4">Select Payment Method</h4>
          <RadioGroup
            value={selectedPaymentMethod}
            onValueChange={(value) => handlePaymentMethodChange(value as PaymentMethod)}
            className="space-y-4"
          >
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="payNow" id="payNow" />
              <Label htmlFor="payNow" className="flex items-center space-x-3 cursor-pointer flex-1">
                <QrCode className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="font-medium">Pay Now (Scan & Pay)</div>
                  <div className="text-sm text-gray-600">Pay using QR code or bank transfer</div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="creditCard" id="creditCard" />
              <Label htmlFor="creditCard" className="flex items-center space-x-3 cursor-pointer flex-1">
                <CreditCard className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-medium">Credit Card Payment</div>
                  <div className="text-sm text-gray-600">Pay using credit or debit card</div>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {/* Transaction Fee Disclaimer */}
          {transactionFee > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">
                    {selectedPaymentMethod === 'creditCard' ? 'Credit Card Processing Fee' : 'PayNow Transaction Fee'}
                  </p>
                  <p>
                    {selectedPaymentMethod === 'creditCard' 
                      ? `A ${feeSettings.creditCardFeePercentage}% processing fee will be added to your total amount when paying with credit card.`
                      : `A $${feeSettings.paynowFee.toFixed(2)} transaction fee will be added for PayNow payments under $10.`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Hold Notice */}
    

      {/* Price Breakdown */}
      <Card>
        <CardContent className="space-y-2 pt-4">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>
                {isExtension || isReschedule ? 'Credits Applied' : 'Discount'} 
                {appliedVoucher ? ` (${appliedVoucher.code})` : ''}
              </span>
              <span>- ${discountAmount.toFixed(2)}</span>
            </div>
          )}
          {selectedPackage && (
            <div className="flex justify-between text-blue-600">
              <span>Package</span>
              <span>Applied</span>
            </div>
          )}

          {transactionFee > 0 && (
            <div className="flex justify-between text-amber-600">
              <span>
                {selectedPaymentMethod === 'creditCard' ? `Credit Card Fee (${feeSettings.creditCardFeePercentage}%)` : 'PayNow Transaction Fee'}
              </span>
              <span>${formatCurrency(transactionFee)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total to Pay</span>
            <span>${formatCurrency(finalTotal)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-gray-600">
        <div><b>Payer:</b> {customer.name}</div>
        <div><b>Email:</b> {customer.email}</div>
        <div><b>Phone:</b> {customer.phone}</div>
      </div>
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-orange-800">
          
            <p>The booking will be held for 5 mins upon clicking of pay, please pay when you are ready</p>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={loading || isLoading} className="flex-1">
          Back
        </Button>
        <Button
          onClick={handlePay}
          disabled={loading || isLoading}
          className="flex-1 bg-orange-500 hover:bg-orange-600"
        >
          {(loading || isLoading) ? 'Processing…' : 
           finalTotal === 0 ? 'Confirm Extension (Fully Covered)' :
           isExtension ? `Pay $${finalTotal.toFixed(2)} to Extend` : 
           `Complete your booking`}
        </Button>
      </div>
    </div>
  )
}

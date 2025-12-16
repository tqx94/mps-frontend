// src/components/buy-pass/PaymentStep.tsx
'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Shield, QrCode, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/paymentUtils'
import { authenticatedFetch } from '@/lib/apiClient'

type PaymentMethod = 'payNow' | 'creditCard'

type Props = {
  subtotal: number
  total: number
  paymentMethod: 'card' | 'paynow'
  onPaymentMethodChange: (v: 'card' | 'paynow') => void
  customer: { name: string; email: string; phone: string }
  order: {
    packageName: string
    quantity: number
    notes?: string
  }
  onBack: () => void
  user?: any
  userPackageId?: string // ID from the user_packages table
  orderId?: string // Order ID for the package purchase
}

export default function PaymentStep({
  subtotal,
  total,
  paymentMethod,
  onPaymentMethodChange,
  customer,
  order,
  onBack,
  user,
  userPackageId,
  orderId
}: Props) {
  const [loading, setLoading] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('payNow')

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

  // Calculate totals based on payment method using dynamic fees
  const transactionFee = selectedPaymentMethod === 'creditCard' 
    ? total * (feeSettings.creditCardFeePercentage / 100)
    : (total < 10 ? feeSettings.paynowFee : 0)  // PayNow fee only for < $10
  const finalTotal = total + transactionFee



  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method)
    const newFee = method === 'creditCard' 
      ? total * (feeSettings.creditCardFeePercentage / 100)
      : (total < 10 ? feeSettings.paynowFee : 0)  // PayNow fee only for < $10
    const newTotal = total + newFee
    console.log(`Payment method changed to: ${method}`)
    // Update the parent component's payment method
    onPaymentMethodChange(method === 'creditCard' ? 'card' : 'paynow')
  }

    const handlePay = async () => {
    setLoading(true)
    try {
      // Debug logging for payment step
      console.log('💳 PaymentStep Debug Info:')
      console.log('  - userPackageId:', userPackageId)
      console.log('  - orderId:', orderId)
      console.log('  - userPackageId type:', typeof userPackageId)
      console.log('  - orderId type:', typeof orderId)
      
      // Validate required IDs before proceeding
      if (!userPackageId || userPackageId === 'undefined') {
        throw new Error('User Package ID is missing or invalid')
      }
      
      if (!orderId || orderId === 'undefined') {
        throw new Error('Order ID is missing or invalid')
      }
      
      // Construct redirect URL to step 3 for package confirmation
      const redirectUrl = `${window.location.origin}${window.location.pathname}?step=3&orderId=${orderId}&userPackageId=${userPackageId}`
      console.log('🔗 Redirect URL:', redirectUrl)
      
      const paymentData = {
        userPackageId: userPackageId, // ID from the user_packages table
        orderId: orderId, // Order ID for the package purchase
        amount: finalTotal.toFixed(2), // Format as string with 2 decimal places
        paymentMethod: selectedPaymentMethod === 'creditCard' ? 'card' : 'paynow_online', // Updated to match backend
        customerInfo: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone
        },
        redirectUrl: redirectUrl, // Add redirect URL for backend to use
        webhookUrl: `https://productive-space-backend.vercel.app/api/packages/webhook` // Add webhook URL
      }

      console.log('Creating package payment:', paymentData)
      console.log('Redirect URL after payment:', redirectUrl)
      console.log('Backend URL:', process.env.NEXT_PUBLIC_BACKEND_BASE_URL)
      console.log('Full API URL:', `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/packages/payment`)

      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/packages/payment`, {
        method: 'POST',
        body: JSON.stringify(paymentData),
      })

      const data = await res.json()
      
      if (data.url) {
        // Redirect to HitPay hosted payment page
        console.log('Redirecting to HitPay payment page:', data.url)
        window.location.href = data.url
      } else {
        setLoading(false)
        console.error('Package payment creation failed:', data.message || 'No payment URL received')
        alert('Failed to create payment. Please try again.')
      }
    } catch (err) {
      console.error('Package payment error:', err)
      setLoading(false)
      alert('Payment creation failed. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Payment Method</h3>
        <RadioGroup value={selectedPaymentMethod} onValueChange={handlePaymentMethodChange}>
          <div className="flex items-center space-x-2 p-4 border rounded-lg">
            <RadioGroupItem value="payNow" id="payNow" />
            <label htmlFor="payNow" className="flex-1 cursor-pointer">
              <div className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                <span>PayNow</span>
              </div>
            </label>
          </div>
          <div className="flex items-center space-x-2 p-4 border rounded-lg">
            <RadioGroupItem value="creditCard" id="creditCard" />
            <label htmlFor="creditCard" className="flex-1 cursor-pointer">
              <div className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                <span>Credit/Debit Card</span>
                {selectedPaymentMethod === 'creditCard' && (
                  <span className="ml-2 text-sm text-gray-500">(+{feeSettings.creditCardFeePercentage}% fee)</span>
                )}
               
              </div>
            </label>
          </div>
        </RadioGroup>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-3">Order Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Package:</span>
            <span>{order.packageName}</span>
          </div>
          <div className="flex justify-between">
            <span>Quantity:</span>
            <span>{order.quantity}</span>
          </div>
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          {transactionFee > 0 && (
            <div className="flex justify-between text-orange-600">
              <span>
                {selectedPaymentMethod === 'creditCard' ? `Credit Card Fee (${feeSettings.creditCardFeePercentage}%)` : 'PayNow Transaction Fee'}
              </span>
              <span>${formatCurrency(transactionFee)}</span>
            </div>
          )}
          <div className="flex justify-between font-medium border-t pt-2">
            <span>Total:</span>
            <span>${formatCurrency(finalTotal)}</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <QrCode className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Payment Process</p>
            <p>You will be redirected to a secure payment page to complete your purchase.</p>
            <p className="mt-1">After payment, you'll be redirected back to confirm your package activation.</p>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
          disabled={loading}
        >
          Back to Details
        </Button>
        <Button
          onClick={handlePay}
          className="flex-1 bg-orange-500 hover:bg-orange-600"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ${selectedPaymentMethod === 'creditCard' ? 'with Card' : 'with PayNow'}`
          )}
        </Button>
      </div>

   
    </div>
  )
}

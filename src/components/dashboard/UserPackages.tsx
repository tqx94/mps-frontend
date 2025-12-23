// src/components/dashboard/UserPackages.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Package, Clock, Calendar, CheckCircle, XCircle, Loader2, AlertTriangle, RefreshCw, CreditCard, Shield } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getUserPackages, UserPackage, completePackagePayment, CustomerInfo } from '@/lib/services/packageService'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/lib/paymentUtils'
import { getEffectiveMemberType } from '@/lib/userProfileService'

interface UserPackagesProps {
  userId: string
}

export function UserPackages({ userId }: UserPackagesProps) {
  const [packages, setPackages] = useState<UserPackage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingPayment, setProcessingPayment] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'paynow_online' | 'card'>('paynow_online')
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<UserPackage | null>(null)
  const { toast } = useToast()
  const { user, databaseUser } = useAuth()

  // Dynamic payment fee settings state
  const [feeSettings, setFeeSettings] = useState({
    paynowFee: 0.20,
    creditCardFeePercentage: 5.0
  })

  // Map targetRole to type parameter
  const getTypeFromRole = (targetRole: string): string => {
    const roleMapping: { [key: string]: string } = {
      'MEMBER': 'cowork',
      'STUDENT': 'costudy',
      'TUTOR': 'colearn'
    }
    return roleMapping[targetRole] || 'cowork'
  }

  // Build URL for buy-pass page with package info
  const getBuyPassUrl = (pkg: UserPackage): string => {
    // Check if user is a verified student
    const userMemberType = databaseUser?.memberType || 'MEMBER'
    const effectiveMemberType = getEffectiveMemberType(
      userMemberType,
      databaseUser?.studentVerificationStatus
    )
    const isStudent = effectiveMemberType === 'STUDENT'
    
    // If user is student, don't pass type parameter (so dashboard flow shows all packages)
    // Otherwise, pass type parameter (old flow with specific role packages)
    const params = new URLSearchParams({
      package: pkg.packageName,
      packageId: pkg.packageId
    })
    
    if (!isStudent) {
      const type = getTypeFromRole(pkg.targetRole)
      params.set('type', type)
    }
    
    return `/buy-pass?${params.toString()}`
  }

  const loadUserPackages = async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Loading user packages for userId:', userId)
      
      // Load traditional packages
      const userPackages = await getUserPackages(userId)
      console.log('User packages loaded:', userPackages)
      setPackages(userPackages)
      
    } catch (err) {
      console.error('Error loading user packages:', err)
      setError(err instanceof Error ? err.message : 'Failed to load packages')
      toast({
        title: "Error loading packages",
        description: "Failed to load your packages. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompletePayment = async (pkg: UserPackage) => {
    if (!user || !databaseUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to complete payment.",
        variant: "destructive",
      })
      return
    }

    setSelectedPackage(pkg)
    setPaymentModalOpen(true)
  }

  const handlePaymentSubmit = async () => {
    if (!selectedPackage || !user || !databaseUser) return

    setProcessingPayment(selectedPackage.id)
    
    try {
      const customerInfo: CustomerInfo = {
        name: databaseUser.name || user.email || 'User',
        email: user.email || '',
        phone: databaseUser.contactNumber || '',
        company: '',
        billingAddress: '',
        postalCode: ''
      }

      // Calculate total with credit card fee if applicable (synchronous using state)
      const creditCardFee = selectedPaymentMethod === 'card' 
        ? selectedPackage.totalAmount * (feeSettings.creditCardFeePercentage / 100)
        : (selectedPackage.totalAmount < 10 ? feeSettings.paynowFee : 0)  // PayNow fee only for < $10
      const finalAmount = selectedPackage.totalAmount + creditCardFee

      console.log('Completing payment for package:', selectedPackage.id)
      const result = await completePackagePayment(selectedPackage.id, selectedPackage.orderId, customerInfo, finalAmount, selectedPaymentMethod)
      
      if (result.success && result.url) {
        // Redirect to HitPay payment page
        window.location.href = result.url
      } else {
        throw new Error(result.error || 'Failed to initiate payment')
      }
    } catch (err) {
      console.error('Error completing payment:', err)
      toast({
        title: "Payment failed",
        description: err instanceof Error ? err.message : 'Failed to complete payment. Please try again.',
        variant: "destructive",
      })
    } finally {
      setProcessingPayment(null)
      setPaymentModalOpen(false)
    }
  }

  useEffect(() => {
    loadUserPackages()
    loadPaymentFeeSettings()
  }, [userId])

  // Load payment fee settings from database
  const loadPaymentFeeSettings = async () => {
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

  const getStatusBadge = (status: string) => {
    const variants = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'EXPIRED': 'bg-red-100 text-red-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CANCELLED': 'bg-gray-100 text-gray-800'
    }

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRemainingDays = (expiresAt: string | null) => {
    if (!expiresAt) return 0
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            My Packages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <span className="ml-2 text-gray-600">Loading your packages...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            My Packages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <Button onClick={loadUserPackages} variant="outline" className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (packages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            My Packages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No packages found</h3>
            <p className="text-gray-600 mb-4">You don't have any packages yet.</p>
            <Button onClick={() => window.location.href = '/buy-pass'} className="bg-orange-600 hover:bg-orange-700">
              Buy Packages
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Sort packages: Active packages first, then expiring soon, then pending, then expired
  const sortedPackages = [...packages].sort((a, b) => {
    const getRemainingDaysForPkg = (expiresAt: string | null) => {
      if (!expiresAt) return 0
      const now = new Date()
      const expiry = new Date(expiresAt)
      const diffTime = expiry.getTime() - now.getTime()
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    const getPackagePriority = (pkg: UserPackage) => {
      const remainingDays = getRemainingDaysForPkg(pkg.expiresAt)
      const isExpired = remainingDays <= 0 || pkg.isExpired
      const allPassesUsed = (pkg.remainingPasses || 0) === 0 && (pkg.totalPasses || 0) > 0
      const isPackageExpired = isExpired || allPassesUsed
      const isPending = pkg.paymentStatus === 'PENDING'
      const isCompleted = pkg.paymentStatus === 'COMPLETED'
      const isExpiringSoon = remainingDays <= 7 && remainingDays > 0

      // Priority: Lower number = higher priority (shown first)
      if (isCompleted && !isPackageExpired && !isExpiringSoon) return 1 // Active packages
      if (isExpiringSoon && !isPackageExpired && isCompleted) return 2 // Expiring soon
      if (isPending) return 3 // Pending payment
      if (isPackageExpired && isCompleted) return 4 // Expired/Completed
      return 5 // Any other status
    }

    const priorityA = getPackagePriority(a)
    const priorityB = getPackagePriority(b)

    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }

    // If same priority, sort by expiration date (soonest first) or creation date
    if (a.expiresAt && b.expiresAt) {
      return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              My Packages
            </div>
            <Button onClick={loadUserPackages} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Your Packages</h3>
            {sortedPackages.map((pkg) => {
              const remainingDays = getRemainingDays(pkg.expiresAt)
              const isExpiringSoon = remainingDays <= 7 && remainingDays > 0
              const isExpired = remainingDays <= 0 || pkg.isExpired
              const isPending = pkg.paymentStatus === 'PENDING'
              const isCompleted = pkg.paymentStatus === 'COMPLETED'
              
              // Check if all passes are used (remaining passes = 0)
              const allPassesUsed = (pkg.remainingPasses || 0) === 0 && (pkg.totalPasses || 0) > 0
              
              // Package is considered expired if time expired OR all passes used
              const isPackageExpired = isExpired || allPassesUsed

              return (
                <Card key={pkg.id} className={`${isExpiringSoon && !isPackageExpired ? 'border-orange-200 bg-orange-50' : isPackageExpired ? 'border-red-200 bg-red-50' : isPending ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-lg text-gray-900">{pkg.packageName}</h4>
                        {/* <p className="text-sm text-gray-600">Order ID: {pkg.orderId}</p>
                        <p className="text-xs text-gray-500">Package ID: {pkg.packageId}</p> */}
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* {getStatusBadge(pkg.paymentStatus)} */}
                        {isCompleted && !isPackageExpired && !isExpiringSoon && (
                          <Badge variant="outline" className="border-green-300 text-green-700">
                            Active
                          </Badge>
                        )}
                        {isExpiringSoon && !isPackageExpired && isCompleted && (
                          <Badge variant="outline" className="border-orange-300 text-orange-700">
                            Expires Soon
                          </Badge>
                        )}
                        {isPackageExpired && isCompleted && (
                          <Badge variant="outline" className="border-red-300 text-red-700">
                            {allPassesUsed ? 'Completed' : 'Expired'}
                          </Badge>
                        )}
                        {isPending && (
                          <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                            Payment Pending
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <div>
                          <div className="font-medium">Purchased</div>
                          <div>{formatDate(pkg.createdAt)}</div>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <div>
                          <div className="font-medium">Expires</div>
                          <div className={isExpired ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : ''}>
                            {pkg.expiresAt ? formatDate(pkg.expiresAt) : 'Not activated'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Package className="w-4 h-4 mr-2" />
                        <div>
                          <div className="font-medium">Quantity</div>
                          <div>{pkg.quantity}</div>
                        </div>
                      </div>
                    </div>
                    {/* Package Contents */}
                    {pkg.packageContents && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Package Contents</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {pkg.packageContents?.totalHours && pkg.packageContents.totalHours > 0 && (
                            <div>
                              <div className="text-gray-600">Total Hours</div>
                              <div className="font-medium">{pkg.packageContents.totalHours} hrs</div>
                            </div>
                          )}
                          <div>
                            <div className="text-gray-600">Passes Included</div>
                            <div className="font-medium">{pkg.passCount}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Package Type</div>
                            <div className="font-medium">{pkg.packageType.replace('_', ' ')}</div>
                          </div>
                         
                        </div>
                      </div>
                    )}

                    {/* Usage Statistics - Show remaining passes */}
                    {isCompleted && !isExpired && (
                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <h5 className="font-medium text-blue-900 mb-3">Usage Statistics</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-blue-600 font-medium text-lg">{pkg.remainingPasses || 0}</div>
                            <div className="text-blue-600 text-xs">Remaining</div>
                          </div>
                          <div className="text-center">
                            <div className="text-green-600 font-medium text-lg">{pkg.usedPasses || 0}</div>
                            <div className="text-green-600 text-xs">Used</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-600 font-medium text-lg">{pkg.totalPasses || 0}</div>
                            <div className="text-gray-600 text-xs">Total</div>
                          </div>
                          <div className="text-center">
                            <div className="text-purple-600 font-medium text-lg">
                              {pkg.totalPasses > 0 ? Math.round(((pkg.usedPasses || 0) / pkg.totalPasses) * 100) : 0}%
                            </div>
                            <div className="text-purple-600 text-xs">Used</div>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ 
                                width: `${pkg.totalPasses > 0 ? ((pkg.usedPasses || 0) / pkg.totalPasses) * 100 : 0}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Information */}
                    <div className="">
                      {/* <h5 className="font-medium text-orange-900 mb-2">Payment Information</h5> */}
                      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-orange-600">Total Amount</div>
                          <div className="font-medium">SGD ${pkg.totalAmount}</div>
                        </div>
                        {/* <div>
                          <div className="text-orange-600">Status</div>
                          <div className="font-medium">{pkg.paymentStatus}</div>
                        </div> */}
                      </div>
                    </div>

                    <div className="flex flex-col md:justify-between md:flex-row gap-2">
                      <div className="text-sm text-gray-600">
                        {isPending ? (
                          <span className="text-yellow-600 font-medium">Payment pending - package not activated</span>
                        ) : isPackageExpired ? (
                          <span className="text-red-600 font-medium">
                            {allPassesUsed ? 'All passes used - package fully consumed' : 'Package has expired'}
                          </span>
                        ) : isExpiringSoon ? (
                          <span className="text-orange-600 font-medium">
                            Expires in {remainingDays} day{remainingDays !== 1 ? 's' : ''}
                          </span>
                        ) : isCompleted && pkg.expiresAt ? (
                          <span className="text-green-600 font-medium">
                            {remainingDays} days remaining
                          </span>
                        ) : (
                          <span className="text-gray-600 font-medium">Package details available</span>
                        )}
                      </div>
                      <div className="flex space-x-2 flex-col md:flex-row gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.location.href = getBuyPassUrl(pkg)} 
                          className="border-orange-500 text-orange-600 hover:bg-orange-50"
                        >
                          <Package className="w-4 h-4 mr-2" />
                          Buy Package
                        </Button>
                        
                        {isCompleted && !isPackageExpired && pkg.expiresAt && (
                          <Button size="sm" onClick={() => window.location.href = '/book-now'} className="bg-orange-500 hover:bg-orange-600 text-white">
                            Book Now
                          </Button>
                        )}
                        
                        {/* {isPending && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleCompletePayment(pkg)}
                            disabled={processingPayment === pkg.id}
                          >
                            {processingPayment === pkg.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              'Complete Payment'
                            )}
                          </Button>
                        )} */}
                      
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Payment Method</DialogTitle>
          </DialogHeader>
          
          {selectedPackage && (
            <div className="space-y-6">
              {/* Package Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">{selectedPackage.packageName}</h4>
                <div className="text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Package Price:</span>
                    <span>SGD ${selectedPackage.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <Label className="text-base font-medium mb-3 block">Choose Payment Method</Label>
                <RadioGroup value={selectedPaymentMethod} onValueChange={(value: 'paynow_online' | 'card') => setSelectedPaymentMethod(value)}>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="paynow_online" id="paynow_online" />
                    <label htmlFor="paynow_online" className="flex-1 cursor-pointer">
                      <div className="flex items-center">
                        <Shield className="w-5 h-5 mr-2" />
                        <span>PayNow</span>
                      </div>
                    </label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="card" id="card" />
                    <label htmlFor="card" className="flex-1 cursor-pointer">
                      <div className="flex items-center">
                        <CreditCard className="w-5 h-5 mr-2" />
                        <span>Credit/Debit Card</span>
                        <span className="ml-2 text-sm text-gray-500">(+{feeSettings.creditCardFeePercentage}% fee)</span>
                      </div>
                    </label>
                  </div>
                </RadioGroup>
              </div>

              {/* Cost Breakdown */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3">Payment Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Package Price:</span>
                    <span>SGD ${selectedPackage.totalAmount}</span>
                  </div>
                  {selectedPaymentMethod === 'card' && (() => {
                    const fee = selectedPackage.totalAmount * (feeSettings.creditCardFeePercentage / 100)
                    return (
                      <div className="flex justify-between text-orange-600">
                        <span>Credit Card Fee ({feeSettings.creditCardFeePercentage}%):</span>
                        <span>SGD ${formatCurrency(fee)}</span>
                      </div>
                    )
                  })()}
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Total:</span>
                    <span>SGD ${(() => {
                      const fee = selectedPaymentMethod === 'card' 
                        ? selectedPackage.totalAmount * (feeSettings.creditCardFeePercentage / 100)
                        : (selectedPackage.totalAmount < 10 ? feeSettings.paynowFee : 0)  // PayNow fee only for < $10
                      const total = selectedPackage.totalAmount + fee
                      return formatCurrency(total)
                    })()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setPaymentModalOpen(false)}
                  className="flex-1"
                  disabled={processingPayment === selectedPackage.id}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePaymentSubmit}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  disabled={processingPayment === selectedPackage.id}
                >
                  {processingPayment === selectedPackage.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay ${selectedPaymentMethod === 'card' ? 'with Card' : 'with PayNow'}`
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Ticket, Gift, Users, Target, Globe, Calendar, Clock, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  PromoCode, 
  PromoCodeUsage,
  getUserAvailablePromoCodes, 
  getUserUsedPromoCodes,
  formatDiscountDisplay,
  getPromoCodeTypeLabel,
  getPromoCodeStatusColor
} from '@/lib/promoCodeService'

interface UserPromoCodesProps {
  userId: string;
}

export function UserPromoCodes({ userId }: UserPromoCodesProps) {
  const [availablePromos, setAvailablePromos] = useState<PromoCode[]>([])
  const [usedPromos, setUsedPromos] = useState<PromoCodeUsage[]>([])
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (userId && mounted) {
      fetchPromoCodes()
    }
  }, [userId, mounted])

  const fetchPromoCodes = async () => {
    if (!userId) {
      setError('User ID is required')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch available promo codes
      const availableResponse = await getUserAvailablePromoCodes(userId)
      if (availableResponse.availablePromos) {
        setAvailablePromos(availableResponse.availablePromos)
        setUserInfo(availableResponse.userInfo)
      }

      // Fetch used promo codes
      const usedResponse = await getUserUsedPromoCodes(userId)
      if (usedResponse.usedPromos) {
        setUsedPromos(usedResponse.usedPromos)
      }
    } catch (error) {
      console.error('Error fetching promo codes:', error)
      setError('Failed to load promo codes')
    } finally {
      setLoading(false)
    }
  }

  const getPromoTypeIcon = (type: string) => {
    switch (type) {
      case 'GENERAL': return <Globe className="w-4 h-4" />
      case 'GROUP_SPECIFIC': return <Users className="w-4 h-4" />
      case 'USER_SPECIFIC': return <Target className="w-4 h-4" />
      case 'WELCOME': return <Gift className="w-4 h-4" />
      default: return <Ticket className="w-4 h-4" />
    }
  }

  const getPromoTypeColor = (type: string) => {
    switch (type) {
      case 'GENERAL': return 'bg-blue-100 text-blue-800'
      case 'GROUP_SPECIFIC': return 'bg-green-100 text-green-800'
      case 'USER_SPECIFIC': return 'bg-purple-100 text-purple-800'
      case 'WELCOME': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEligibilityStatus = (promo: PromoCode) => {
    if (promo.eligibility) {
      return promo.eligibility.isEligible ? 'eligible' : 'not-eligible'
    }
    // Fallback: Check if user has remaining uses
    if (promo.remainingUses !== undefined && promo.remainingUses > 0) {
      return 'eligible'
    }
    return 'not-eligible'
  }

  const getEligibilityIcon = (status: string) => {
    switch (status) {
      case 'eligible': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'not-eligible': return <XCircle className="w-4 h-4 text-red-600" />
      default: return <AlertCircle className="w-4 h-4 text-yellow-600" />
    }
  }

  const getEligibilityText = (promo: PromoCode, status: string) => {
    if (promo.eligibility) {
      return promo.eligibility.reason
    }
    switch (status) {
      case 'eligible': return 'You are eligible for this promo code'
      case 'not-eligible': return 'You are not eligible for this promo code'
      default: return 'Eligibility unknown'
    }
  }

  if (!mounted) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!userId) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-orange-800 font-medium">Please log in to view promo codes</p>
            <p className="text-sm text-orange-700 mt-1">
              You need to be logged in to see available promotional codes and discounts.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Loading promo codes...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchPromoCodes} className="mt-4" size="sm">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* User Info Card */}
      {/* {userInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Your Account Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">
                  {userInfo.firstName && userInfo.lastName 
                    ? `${userInfo.firstName} ${userInfo.lastName}`
                    : 'Not provided'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Member Type</p>
                <p className="font-medium capitalize">{userInfo.memberType || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Student Status</p>
                <p className="font-medium capitalize">{userInfo.studentVerificationStatus || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* Promo Codes Tabs */}
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available" className="flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            Available ({availablePromos.length})
          </TabsTrigger>
          <TabsTrigger value="used" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Used ({usedPromos.length})
          </TabsTrigger>
        </TabsList>

        {/* Available Promo Codes */}
        <TabsContent value="available" className="space-y-4">
          {availablePromos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availablePromos.map((promo:any) => {
                const eligibilityStatus = getEligibilityStatus(promo)
                return (
                  <Card key={promo.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getPromoTypeIcon(promo.promoType)}
                          <div>
                            <CardTitle className="text-lg font-mono">{promo.code}</CardTitle>
                            <p className="text-sm font-medium text-gray-700">{promo.name}</p>
                          </div>
                        </div>
                        <Badge className={getPromoTypeColor(promo.promoType)}>
                          {getPromoCodeTypeLabel(promo)}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      {promo.description && (
                        <p className="text-sm text-gray-600">{promo.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {formatDiscountDisplay(promo)}
                          </Badge>
                          {promo.minimumAmount && (
                            <span className="text-xs text-gray-500">
                              Min: SGD {promo.minimumAmount}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Eligibility Status */}
                      <div className="flex items-center gap-2 p-2 rounded-md bg-gray-50">
                        {getEligibilityIcon(eligibilityStatus)}
                        <span className="text-sm text-gray-700">
                          {getEligibilityText(promo, eligibilityStatus)}
                        </span>
                      </div>

                      {/* Usage Info */}
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Your Usage:</span>
                          <span className="font-medium">
                            {promo.userUsageCount || 0}/{promo.maxUsagePerUser || 1}
                          </span>
                        </div>
                        {promo.remainingUses !== undefined && promo.remainingUses > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Remaining:</span>
                            <span className="font-medium text-green-600">
                              {promo.remainingUses} uses left
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Time Info */}
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {promo.activeFrom 
                              ? `Active from ${new Date(promo.activeFrom.endsWith('Z') ? promo.activeFrom : promo.activeFrom + 'Z').toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}`
                              : 'Always active'
                            }
                          </span>
                        </div>
                        {promo.activeTo && promo.activeTo !== 'null' ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              Expires {new Date(promo.activeTo.endsWith('Z') ? promo.activeTo : promo.activeTo + 'Z').toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        ):(
                          <span className='flex gap-1 items-center'>
                                <Clock className="w-3 h-3" />
                                Always active
                          </span>
                        )}
                      </div>

                      {/* Priority */}
                      {promo.priority && promo.priority > 1 && (
                        <div className="text-xs text-gray-500">
                          Priority: {promo.priority}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Available Promo Codes</h3>
                  <p className="text-gray-600">
                    There are currently no promotional codes available for your account.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Check back later for new offers and discounts!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Used Promo Codes */}
        <TabsContent value="used" className="space-y-4">
          {usedPromos.length > 0 ? (
            <div className="space-y-4">
              {usedPromos.map((usage) => (
                <Card key={usage.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getPromoTypeIcon(usage.PromoCode?.promoType || 'GENERAL')}
                        <div>
                          <h4 className="font-semibold font-mono">{usage.PromoCode?.code}</h4>
                          <p className="text-sm text-gray-600">{usage.PromoCode?.name}</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Used</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Original Amount:</span>
                        <span className="font-medium ml-2">
                          {usage.originalAmount ? `SGD ${usage.originalAmount.toFixed(2)}` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-medium ml-2 text-green-600">
                          {usage.discountAmount ? `-SGD ${usage.discountAmount.toFixed(2)}` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Final Amount:</span>
                        <span className="font-medium ml-2">
                          {usage.finalAmount ? `SGD ${usage.finalAmount.toFixed(2)}` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Used On:</span>
                        <span className="font-medium ml-2">
                          {new Date(usage.usedat).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZoneName: 'short'
                          })}
                        </span>
                      </div>
                    </div>

                    {usage.PromoCode?.description && (
                      <p className="text-sm text-gray-600 mt-3">
                        {usage.PromoCode.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Used Promo Codes</h3>
                  <p className="text-gray-600">
                    You haven't used any promotional codes yet.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Start saving with available promo codes!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Ticket, Calendar, DollarSign, Users, CheckCircle, XCircle, Clock } from 'lucide-react'
import { 
  PromoCode, 
  PromoCodeUsage, 
  getAvailablePromoCodes, 
  getUsedPromoCodes, 
  formatDiscountDisplay, 
  getPromoCodeStatusColor 
} from '@/lib/promoCodeService'

interface PromoCodeHistoryProps {
  userId: string
}

export function PromoCodeHistory({ userId }: PromoCodeHistoryProps) {
  const [activeTab, setActiveTab] = useState('available')
  const [availablePromos, setAvailablePromos] = useState<PromoCode[]>([])
  const [usedPromos, setUsedPromos] = useState<PromoCodeUsage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPromoCodes()
  }, [userId])

  const loadPromoCodes = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Load available promo codes
      const availableResponse = await getAvailablePromoCodes(userId)
      if (availableResponse.success) {
        setAvailablePromos(availableResponse.data)
      } else {
        console.error('Failed to load available promo codes:', availableResponse.error)
        setAvailablePromos([])
      }

      // Load used promo codes
      const usedResponse = await getUsedPromoCodes(userId)
      if (usedResponse.success) {
        setUsedPromos(usedResponse.data)
      } else {
        console.error('Failed to load used promo codes:', usedResponse.error)
        setUsedPromos([])
      }
    } catch (err) {
      console.error('Error loading promo codes:', err)
      setError('Failed to load promo codes')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Calculate summary statistics
  const totalAvailable = availablePromos.length
  const totalUsed = usedPromos.length
  const totalSavings = usedPromos.reduce((sum, usage) => sum + usage.discountAmount, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading promo codes...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Promo Codes</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadPromoCodes} variant="outline" className="border-red-300 text-red-700">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                 <Ticket className="w-5 h-5 text-blue-600" />
               </div>
               <div>
                 <p className="text-sm text-gray-600">Available</p>
                 <p className="text-2xl font-bold text-blue-600">{totalAvailable}</p>
               </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Used</p>
                <p className="text-2xl font-bold text-green-600">{totalUsed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Savings</p>
                <p className="text-2xl font-bold text-purple-600">${totalSavings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promo Codes Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available" className="flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            Available ({totalAvailable})
          </TabsTrigger>
          <TabsTrigger value="used" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Used ({totalUsed})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {availablePromos.length > 0 ? (
            <div className="grid gap-4">
              {availablePromos.map((promo) => (
                                 <Card key={promo.id} className="border-l-4 border-l-green-500">
                   <CardContent className="p-4">
                     <div className="flex items-start justify-between">
                       <div className="flex-1 space-y-3">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                             <Ticket className="w-5 h-5 text-green-600" />
                           </div>
                           <div>
                             <div className="flex items-center gap-2">
                               <span className="font-mono font-bold text-lg bg-green-50 px-3 py-1 rounded-lg border">
                                 {promo.code}
                               </span>
                              <Badge className={getPromoCodeStatusColor(promo)}>
                                {formatDiscountDisplay(promo)}
                              </Badge>
                            </div>
                            <p className="text-gray-700 font-medium mt-1">{promo.description}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">
                              {promo.usageCount}/{promo.maxusageperuser} uses
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">
                              Uses remaining: {promo.maxusageperuser - promo.usageCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-gray-300 bg-gray-50">
              <CardContent className="p-8 text-center">
                <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Available Promo Codes</h3>
                <p className="text-gray-500">You don't have any active promo codes at the moment.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="used" className="space-y-4">
          {usedPromos.length > 0 ? (
            <div className="grid gap-4">
              {usedPromos.map((usage) => (
                <Card key={usage.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-lg bg-blue-50 px-3 py-1 rounded-lg border">
                                {usage.promoCodeId}
                              </span>
                              <Badge className="bg-blue-100 text-blue-800">
                                Used
                              </Badge>
                            </div>
                            <p className="text-gray-700 font-medium mt-1">
                              Applied on {formatDateTime(usage.usedAt)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">
                              Original: ${usage.originalAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <span className="text-green-600 font-medium">
                              Saved: ${usage.discountAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-blue-500" />
                            <span className="text-blue-600 font-medium">
                              Final: ${usage.finalAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {usage.bookingId && (
                          <div className="text-xs text-gray-500">
                            Booking ID: {usage.bookingId}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-gray-300 bg-gray-50">
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Used Promo Codes</h3>
                <p className="text-gray-500">You haven't used any promo codes yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

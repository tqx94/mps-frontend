'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { authenticatedFetch } from '@/lib/apiClient'
import {
  Loader2,
  Calendar,
  Clock,
  DollarSign,
  Users,
  MapPin,
  CreditCard,
  Tag,
  Package,
  RefreshCw,
  DoorOpen,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock3,
  FileText
} from 'lucide-react'
import { format } from 'date-fns'
import { formatSingaporeDate } from '@/lib/timezoneUtils'

interface BookingDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  bookingRef: string
}

interface Activity {
  id: number
  bookingId: number
  bookingRef: string
  activityType: string
  activityTitle: string
  activityDescription: string | null
  metadata: any
  userId: string | null
  userName: string | null
  userEmail: string | null
  amount: number | null
  oldValue: string | null
  newValue: string | null
  createdAt: string
}

interface ComprehensiveData {
  booking: any
  user: any
  activities: Activity[]
  reschedules: any[]
  refunds: any[]
  doorAccess: any[]
}

export function BookingDetailsModal({ isOpen, onClose, bookingRef }: BookingDetailsModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ComprehensiveData | null>(null)

  useEffect(() => {
    if (isOpen && bookingRef) {
      fetchBookingDetails()
    }
  }, [isOpen, bookingRef])

  const fetchBookingDetails = async () => {
    try {
      setLoading(true)
      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/booking-activity/comprehensive/${bookingRef}`
      )
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.message || 'Failed to fetch booking details')
      }
    } catch (error: any) {
      console.error('Error fetching booking details:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to load booking details',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'BOOKING_CREATED':
        return <Calendar className="w-4 h-4 text-blue-500" />
      case 'PAYMENT_CONFIRMED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'PAYMENT_FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'PROMO_APPLIED':
        return <Tag className="w-4 h-4 text-purple-500" />
      case 'CREDIT_USED':
        return <DollarSign className="w-4 h-4 text-orange-500" />
      case 'PACKAGE_USED':
        return <Package className="w-4 h-4 text-indigo-500" />
      case 'RESCHEDULE_REQUESTED':
      case 'RESCHEDULE_APPROVED':
      case 'RESCHEDULE_REJECTED':
        return <RefreshCw className="w-4 h-4 text-blue-500" />
      case 'EXTEND_REQUESTED':
      case 'EXTEND_APPROVED':
      case 'EXTEND_REJECTED':
        return <Clock3 className="w-4 h-4 text-teal-500" />
      case 'DOOR_ACCESS':
        return <DoorOpen className="w-4 h-4 text-green-500" />
      case 'REFUND_REQUESTED':
      case 'REFUND_APPROVED':
      case 'REFUND_REJECTED':
        return <CreditCard className="w-4 h-4 text-yellow-500" />
      case 'BOOKING_CANCELLED':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'NOTES_ADDED':
        return <FileText className="w-4 h-4 text-gray-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; variant: any } } = {
      confirmed: { label: 'Confirmed', variant: 'default' },
      pending: { label: 'Pending', variant: 'secondary' },
      cancelled: { label: 'Cancelled', variant: 'destructive' },
      completed: { label: 'Completed', variant: 'outline' }
    }
    const config = statusMap[status?.toLowerCase()] || { label: status, variant: 'secondary' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDateTime = (dateString: string) => {
    try {
      // Use formatSingaporeDate to convert UTC to Singapore time
      return formatSingaporeDate(dateString)
    } catch {
      return dateString
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD'
    }).format(amount)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <div className="p-6 pb-4 border-b shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Booking Details - {bookingRef}
            </DialogTitle>
            <DialogDescription>
              Complete timeline and history of all activities for this booking
            </DialogDescription>
          </DialogHeader>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : data ? (
          <div className="flex-1 overflow-auto px-6 py-4">
            <div className="space-y-6">
              {/* Booking Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Booking Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Start:</span>
                        <span>{formatDateTime(data.booking.startAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">End:</span>
                        <span>{formatDateTime(data.booking.endAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Location:</span>
                        <span>{data.booking.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">People:</span>
                        <span>{data.booking.pax} ({data.booking.memberType})</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Total Cost:</span>
                        <span className="font-bold">{formatCurrency(data.booking.totalCost)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Tag className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Discount:</span>
                        <span>{formatCurrency(data.booking.discountAmount || 0)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Final Amount:</span>
                        <span className="font-bold text-green-600">{formatCurrency(data.booking.totalAmount)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Status:</span>
                        {getStatusBadge(data.booking.bookingStatus || 'confirmed')}
                      </div>
                    </div>
                  </div>
                  {data.booking.seatNumbers && data.booking.seatNumbers.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <span className="text-sm font-medium">Seats: </span>
                      <span className="text-sm">{data.booking.seatNumbers.join(', ')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* User Information */}
              {data.user && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">User Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="font-medium">Name:</span> {data.user.firstName} {data.user.lastName}</div>
                      <div><span className="font-medium">Email:</span> {data.user.email}</div>
                      <div><span className="font-medium">Member Type:</span> {data.user.memberType}</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Activity Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.activities && data.activities.length > 0 ? (
                    <div className="space-y-4">
                      {data.activities.map((activity, index) => (
                        <div key={activity.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                              {getActivityIcon(activity.activityType)}
                            </div>
                            {index < data.activities.length - 1 && (
                              <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{activity.activityTitle}</p>
                                {activity.activityDescription && (
                                  <div className="text-sm text-gray-600 mt-1">
                                    {activity.activityType === 'RESCHEDULE_APPROVED' || activity.activityType === 'EXTEND_APPROVED' ? (
                                      <div className="space-y-1.5">
                                        {/* Use metadata first if available (most reliable) */}
                                        {activity.metadata && (activity.metadata.originalStartAt || activity.metadata.originalEndAt || activity.metadata.newStartAt || activity.metadata.newEndAt) ? (
                                          <div className="flex flex-col gap-1.5">
                                            {/* Old Time */}
                                            {(activity.metadata.originalStartAt || activity.metadata.originalEndAt) && (
                                              <div className="flex items-start gap-2">
                                                <span className="text-xs font-medium text-gray-500">Old:</span>
                                                <span className="font-mono text-xs">
                                                  {activity.metadata.originalStartAt && activity.metadata.originalEndAt
                                                    ? `${formatDateTime(activity.metadata.originalStartAt)} - ${formatDateTime(activity.metadata.originalEndAt)}`
                                                    : activity.metadata.originalEndAt
                                                    ? `End: ${formatDateTime(activity.metadata.originalEndAt)}`
                                                    : formatDateTime(activity.metadata.originalStartAt)}
                                                </span>
                                              </div>
                                            )}
                                            {/* New Time */}
                                            {(activity.metadata.newStartAt || activity.metadata.newEndAt) && (
                                              <div className="flex items-start gap-2">
                                                <span className="text-xs font-medium text-blue-600">New:</span>
                                                <span className="font-mono text-xs">
                                                  {activity.metadata.newStartAt && activity.metadata.newEndAt
                                                    ? `${formatDateTime(activity.metadata.newStartAt)} - ${formatDateTime(activity.metadata.newEndAt)}`
                                                    : activity.metadata.newEndAt
                                                    ? `End: ${formatDateTime(activity.metadata.newEndAt)}`
                                                    : formatDateTime(activity.metadata.newStartAt)}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        ) : activity.oldValue && activity.newValue ? (
                                          // Fallback to oldValue/newValue if metadata not available
                                          <div className="flex flex-col gap-1.5">
                                            <div className="flex items-start gap-2">
                                              <span className="text-xs font-medium text-gray-500">Old:</span>
                                              <span className="font-mono text-xs">
                                                {activity.oldValue.includes(' - ') 
                                                  ? activity.oldValue.split(' - ').map((time: string) => formatDateTime(time.trim())).join(' - ')
                                                  : formatDateTime(activity.oldValue)}
                                              </span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                              <span className="text-xs font-medium text-blue-600">New:</span>
                                              <span className="font-mono text-xs">
                                                {activity.newValue.includes(' - ') 
                                                  ? activity.newValue.split(' - ').map((time: string) => formatDateTime(time.trim())).join(' - ')
                                                  : formatDateTime(activity.newValue)}
                                              </span>
                                            </div>
                                          </div>
                                        ) : activity.activityDescription.includes('→') ? (
                                          // Parse description with arrow format
                                          <div className="flex flex-col gap-1.5">
                                            {activity.activityDescription.split('→').map((part: string, idx: number) => (
                                              <div key={idx} className="flex items-start gap-2">
                                                <span className={`text-xs font-medium ${idx === 0 ? 'text-gray-500' : 'text-blue-600'}`}>
                                                  {idx === 0 ? 'Old:' : 'New:'}
                                                </span>
                                                <span className="font-mono text-xs">{part.trim()}</span>
                                              </div>
                                            ))}
                                          </div>
                                        ) : activity.activityDescription.includes('Old:') && activity.activityDescription.includes('New:') ? (
                                          // Handle format: "Old: ... New: ..."
                                          <div className="flex flex-col gap-1.5">
                                            {activity.activityDescription.split(/(?=New:)/).map((part: string, idx: number) => {
                                              const isOld = part.includes('Old:')
                                              const isNew = part.includes('New:')
                                              const label = isOld ? 'Old:' : isNew ? 'New:' : ''
                                              const content = part.replace(/^(Old:|New:)\s*/, '').trim()
                                              return (
                                                <div key={idx} className="flex items-start gap-2">
                                                  <span className={`text-xs font-medium ${isOld ? 'text-gray-500' : 'text-blue-600'}`}>
                                                    {label}
                                                  </span>
                                                  <span className="font-mono text-xs">{content}</span>
                                                </div>
                                              )
                                            })}
                                          </div>
                                        ) : activity.activityDescription.includes('from') && activity.activityDescription.includes('to') ? (
                                          // Handle old format: "Booking rescheduled from X to Y"
                                          <div className="flex flex-col gap-1.5">
                                            {(() => {
                                              const fromMatch = activity.activityDescription.match(/from\s+(.+?)\s+to\s+(.+?)$/i)
                                              if (fromMatch) {
                                                return (
                                                  <>
                                                    <div className="flex items-start gap-2">
                                                      <span className="text-xs font-medium text-gray-500">Old:</span>
                                                      <span className="font-mono text-xs">{fromMatch[1].trim()}</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                      <span className="text-xs font-medium text-blue-600">New:</span>
                                                      <span className="font-mono text-xs">{fromMatch[2].trim()}</span>
                                                    </div>
                                                  </>
                                                )
                                              }
                                              return <p className="text-gray-600">{activity.activityDescription}</p>
                                            })()}
                                          </div>
                                        ) : (
                                          // Fallback for any other format
                                          <p className="text-gray-600">{activity.activityDescription}</p>
                                        )}
                                      </div>
                                    ) : (
                                      <p>{activity.activityDescription}</p>
                                    )}
                                  </div>
                                )}
                                {activity.amount && activity.amount > 0 && (
                                  <p className="text-sm text-green-600 font-medium mt-1">
                                    Amount: {formatCurrency(activity.amount)}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                                {formatDateTime(activity.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No activities recorded yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Door Access History */}
              {data.doorAccess && data.doorAccess.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DoorOpen className="w-5 h-5" />
                      Door Access History ({data.doorAccess.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.doorAccess.map((access, index) => (
                        <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            {access.status === 'success' ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className={access.status === 'success' ? 'text-green-700' : 'text-red-700'}>
                              {access.status === 'success' ? 'Successfully opened' : 'Failed'}
                            </span>
                          </div>
                          <span className="text-gray-500">{formatDateTime(access.excute_at)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reschedule Requests */}
              {data.reschedules && data.reschedules.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <RefreshCw className="w-5 h-5" />
                      Reschedule Requests ({data.reschedules.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.reschedules.map((reschedule, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Request #{index + 1}</span>
                            {getStatusBadge(reschedule.status)}
                          </div>
                          <div className="text-sm text-gray-600">
                            <div>From: {formatDateTime(reschedule.oldStartTime)} - {formatDateTime(reschedule.oldEndTime)}</div>
                            <div>To: {formatDateTime(reschedule.newStartTime)} - {formatDateTime(reschedule.newEndTime)}</div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Requested: {formatDateTime(reschedule.createdAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Refund Requests */}
              {data.refunds && data.refunds.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Refund Requests ({data.refunds.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.refunds.map((refund, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Refund #{index + 1}</span>
                            {getStatusBadge(refund.status)}
                          </div>
                          <div className="text-sm">
                            <div>Amount: <span className="font-medium">{formatCurrency(refund.refundAmount)}</span></div>
                            {refund.reason && <div className="text-gray-600">Reason: {refund.reason}</div>}
                          </div>
                          <div className="text-xs text-gray-500">
                            Requested: {formatDateTime(refund.createdAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">No data available</p>
          </div>
        )}

        <div className="flex justify-end gap-2 p-6 pt-4 border-t shrink-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


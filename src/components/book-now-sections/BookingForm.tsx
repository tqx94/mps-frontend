// src/components/book-now-sections/BookingForm.tsx - Booking creation form
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Clock, MapPin, Users, DollarSign, CreditCard, CheckCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { 
  createBooking, 
  getBookedSeats,
  getAvailablePromoCodes,
  PromoCode,
  CreateBookingPayload,
  SeatAvailabilityResponse
} from '@/lib/bookingService'
import { getAllPricingForLocation } from '@/lib/pricingService'

export function BookingForm() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [availablePromoCodes, setAvailablePromoCodes] = useState<PromoCode[]>([])
  const [selectedPromoCode, setSelectedPromoCode] = useState<PromoCode | null>(null)
  const [bookedSeats, setBookedSeats] = useState<string[]>([])
  const [formData, setFormData] = useState({
    location: '',
    startAt: '',
    endAt: '',
    specialRequests: '',
    seatNumbers: [] as string[],
    pax: 1,
    students: 1,
    members: 0,
    tutors: 0,
    bookedForEmails: [] as string[]
  })

  // Dynamic pricing state
  const [pricing, setPricing] = useState({
    student: { oneHourRate: 4.00, overOneHourRate: 3.00 },
    member: { oneHourRate: 5.00, overOneHourRate: 4.00 },
    tutor: { oneHourRate: 6.00, overOneHourRate: 5.00 }
  })

  // Load pricing from database (single API call)
  const loadPricing = async () => {
    try {
      const allPricing = await getAllPricingForLocation('Kovan')
      setPricing(allPricing)
    } catch (error) {
      console.error('Error loading pricing:', error)
      // Keep default pricing if database fetch fails
    }
  }

  // Load available promo codes
  const loadPromoCodes = async () => {
    try {
      const response = await getAvailablePromoCodes()
      if (response.success && response.data) {
        setAvailablePromoCodes(response.data)
      }
    } catch (error) {
      console.error('Load Promo Codes Error:', error)
    }
  }

  useEffect(() => {
    loadPricing()
    loadPromoCodes()
  }, [])

  // Calculate duration and costs
  const calculateDuration = () => {
    if (!formData.startAt || !formData.endAt) return 0
    const start = new Date(formData.startAt)
    const end = new Date(formData.endAt)
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60))
  }

  const calculateCosts = () => {
    const duration = calculateDuration()
    if (duration === 0) return { totalCost: 0, totalAmount: 0, discountAmount: 0 }

    // Calculate cost based on people breakdown using dynamic pricing
    let totalCost = 0
    
    // Students
    const studentRate = duration === 1 ? pricing.student.oneHourRate : pricing.student.overOneHourRate
    const studentCost = studentRate * duration * formData.students
    totalCost += studentCost
    
    // Members (coWorkers)
    const memberRate = duration === 1 ? pricing.member.oneHourRate : pricing.member.overOneHourRate
    const memberCost = memberRate * duration * formData.members
    totalCost += memberCost
    
    // Tutors
    const tutorRate = duration === 1 ? pricing.tutor.oneHourRate : pricing.tutor.overOneHourRate
    const tutorCost = tutorRate * duration * formData.tutors
    totalCost += tutorCost

    let discountAmount = 0
    if (selectedPromoCode) {
      if (selectedPromoCode.discounttype === 'percentage') {
        discountAmount = (totalCost * selectedPromoCode.discountvalue) / 100
        if (selectedPromoCode.maximumdiscount && discountAmount > selectedPromoCode.maximumdiscount) {
          discountAmount = selectedPromoCode.maximumdiscount
        }
      } else {
        discountAmount = selectedPromoCode.discountvalue
      }
    }

    const totalAmount = Math.max(0, totalCost - discountAmount)
    return { totalCost, totalAmount, discountAmount }
  }

  // Check seat availability
  const checkSeatAvailability = async () => {
    if (!formData.location || !formData.startAt || !formData.endAt) return

    try {
      const response = await getBookedSeats(formData.location, formData.startAt, formData.endAt)
      setBookedSeats(response.bookedSeats || [])
      console.log('Seat availability check:', {
        location: formData.location,
        timeRange: `${formData.startAt} to ${formData.endAt}`,
        bookedSeats: response.bookedSeats,
        overlappingBookings: response.overlappingBookings,
        summary: response.summary
      })
      
      // Log pending payment information
      if (response.summary?.pending > 0) {
        console.log('⏳ Pending payment bookings detected - seats temporarily blocked')
      }
    } catch (error) {
      console.error('Check Seat Availability Error:', error)
    }
  }

  useEffect(() => {
    checkSeatAvailability()
  }, [formData.location, formData.startAt, formData.endAt])

  // Generate available seats
  const generateAvailableSeats = () => {
    const allSeats = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4']
    return allSeats.filter(seat => !bookedSeats.includes(seat))
  }

  // Handle promo code selection
  const handlePromoCodeSelect = (promoCodeId: string) => {
    const promo = availablePromoCodes.find(p => p.id === promoCodeId)
    setSelectedPromoCode(promo || null)
  }

  // Handle seat selection
  const handleSeatSelection = (seat: string) => {
    setFormData(prev => ({
      ...prev,
      seatNumbers: prev.seatNumbers.includes(seat)
        ? prev.seatNumbers.filter(s => s !== seat)
        : [...prev.seatNumbers, seat]
    }))
  }

  // Validate form
  const validateForm = () => {
    if (!formData.location) {
      toast({
        title: "Validation Error",
        description: "Please select a location",
        variant: "destructive",
      })
      return false
    }

    if (!formData.startAt || !formData.endAt) {
      toast({
        title: "Validation Error",
        description: "Please select start and end times",
        variant: "destructive",
      })
      return false
    }

    if (new Date(formData.startAt) <= new Date()) {
      toast({
        title: "Validation Error",
        description: "Start time must be in the future",
        variant: "destructive",
      })
      return false
    }

    if (new Date(formData.endAt) <= new Date(formData.startAt)) {
      toast({
        title: "Validation Error",
        description: "End time must be after start time",
        variant: "destructive",
      })
      return false
    }

    if (formData.seatNumbers.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one seat",
        variant: "destructive",
      })
      return false
    }

    if (formData.seatNumbers.length !== formData.pax) {
      toast({
        title: "Validation Error",
        description: "Number of seats must match number of people",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      const { totalCost, totalAmount, discountAmount } = calculateCosts()
      
      const payload: CreateBookingPayload = {
        userId: '123e4567-e89b-12d3-a456-426614174000', // Mock userId - in real app, get from auth
        location: formData.location,
        startAt: formData.startAt,
        endAt: formData.endAt,
        specialRequests: formData.specialRequests,
        seatNumbers: formData.seatNumbers,
        pax: formData.pax,
        students: formData.students,
        members: formData.members,
        tutors: formData.tutors,
        totalCost,
        totalAmount,
        memberType: formData.memberType,
        bookedForEmails: formData.bookedForEmails,
        promoCodeId: selectedPromoCode?.id,
        discountAmount
      }

      const response = await createBooking(payload)
      if (response.success) {
        toast({
          title: "Success",
          description: `Booking created successfully! Reference: ${response.booking?.bookingRef}`,
        })
        // Reset form
        setFormData({
          location: '',
          startAt: '',
          endAt: '',
          specialRequests: '',
          seatNumbers: [],
          pax: 1,
          students: 1,
          members: 0,
          tutors: 0,
          memberType: 'student',
          bookedForEmails: []
        })
        setSelectedPromoCode(null)
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create booking",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Create Booking Error:', error)
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const { totalCost, totalAmount, discountAmount } = calculateCosts()
  const availableSeats = generateAvailableSeats()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Create New Booking</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location and Time Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="location">Location *</Label>
                <Select value={formData.location} onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Room A">Room A - Study Room</SelectItem>
                    <SelectItem value="Room B">Room B - Group Study</SelectItem>
                    <SelectItem value="Room C">Room C - Quiet Zone</SelectItem>
                    <SelectItem value="Room D">Room D - Presentation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="startAt">Start Time *</Label>
                <Input
                  id="startAt"
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, startAt: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="endAt">End Time *</Label>
                <Input
                  id="endAt"
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, endAt: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* People and Member Type */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="pax">Total People *</Label>
                <Input
                  id="pax"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.pax}
                  onChange={(e) => setFormData(prev => ({ ...prev, pax: parseInt(e.target.value) || 1 }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="students">Students</Label>
                <Input
                  id="students"
                  type="number"
                  min="0"
                  value={formData.students}
                  onChange={(e) => setFormData(prev => ({ ...prev, students: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div>
                <Label htmlFor="members">Members</Label>
                <Input
                  id="members"
                  type="number"
                  min="0"
                  value={formData.members}
                  onChange={(e) => setFormData(prev => ({ ...prev, members: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div>
                <Label htmlFor="memberType">Member Type</Label>
                <Select value={formData.memberType} onValueChange={(value: 'student' | 'regular' | 'premium') => setFormData(prev => ({ ...prev, memberType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Seat Selection */}
            <div>
              <Label>Select Seats *</Label>
              <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                <div className="grid grid-cols-4 gap-2">
                  {availableSeats.map(seat => (
                    <button
                      key={seat}
                      type="button"
                      onClick={() => handleSeatSelection(seat)}
                      className={`p-3 border rounded-lg text-center font-mono transition-colors ${
                        formData.seatNumbers.includes(seat)
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white hover:bg-orange-50 border-gray-300'
                      }`}
                    >
                      {seat}
                    </button>
                  ))}
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  Selected: {formData.seatNumbers.join(', ') || 'None'}
                </div>
              </div>
            </div>

            {/* Promo Code Selection */}
            {availablePromoCodes.length > 0 && (
              <div>
                <Label htmlFor="promoCode">Apply Promo Code</Label>
                <Select value={selectedPromoCode?.id || ''} onValueChange={handlePromoCodeSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a promo code (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No promo code</SelectItem>
                    {availablePromoCodes.map(promo => (
                      <SelectItem key={promo.id} value={promo.id}>
                        {promo.code} - {promo.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPromoCode && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-sm text-green-800">
                      <div className="font-medium">{selectedPromoCode.code} applied!</div>
                      <div>{selectedPromoCode.description}</div>
                      <div className="text-xs">
                        {selectedPromoCode.discounttype === 'percentage' 
                          ? `${selectedPromoCode.discountvalue}% off`
                          : `$${selectedPromoCode.discountvalue} off`
                        }
                        {selectedPromoCode.minimumamount > 0 && (
                          <span> (min. ${selectedPromoCode.minimumamount})</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Special Requests */}
            <div>
              <Label htmlFor="specialRequests">Special Requests</Label>
              <Textarea
                id="specialRequests"
                value={formData.specialRequests}
                onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                placeholder="Any special requirements or requests..."
                rows={3}
              />
            </div>

            {/* Cost Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Cost Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>{calculateDuration()} hours</span>
                </div>
                {/* Role-based rates */}
                {formData.students > 0 && (
                  <div className="flex justify-between">
                    <span>Students ({formData.students}):</span>
                    <span>${calculateDuration() === 1 ? pricing.student.oneHourRate : pricing.student.overOneHourRate}/hr</span>
                  </div>
                )}
                {formData.members > 0 && (
                  <div className="flex justify-between">
                    <span>Members ({formData.members}):</span>
                    <span>${calculateDuration() === 1 ? pricing.member.oneHourRate : pricing.member.overOneHourRate}/hr</span>
                  </div>
                )}
                {formData.tutors > 0 && (
                  <div className="flex justify-between">
                    <span>Tutors ({formData.tutors}):</span>
                    <span>${calculateDuration() === 1 ? pricing.tutor.oneHourRate : pricing.tutor.overOneHourRate}/hr</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Base cost:</span>
                  <span>${totalCost.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-medium text-lg">
                  <span>Total Amount:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Booking...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Create Booking
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span>Important Notes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <div>• Bookings must be made at least 1 hour in advance</div>
            <div>• Maximum booking duration is 8 hours</div>
            <div>• Payment confirmation required within 24 hours</div>
            <div>• Cancellations allowed up to 2 hours before start time</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>What's Included</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <div>• High-speed Wi-Fi</div>
            <div>• Power outlets at each seat</div>
            <div>• Climate control</div>
            <div>• 24/7 building access</div>
            <div>• Security monitoring</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

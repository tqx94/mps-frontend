'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

// date-fns helpers to compare dates & get end of day
import { isSameDay, endOfDay, addMonths, setHours, setMinutes } from 'date-fns'

import { Loader2 } from 'lucide-react'

import { useToast } from '@/hooks/use-toast'
import { getOperatingHours, getClosureDates, OperatingHours, ClosureDate } from '@/lib/shopHoursService'

interface DateTimeRangePickerProps {
  startDate: Date | null
  endDate: Date | null
  onStartDateChange: (date: Date | null) => void
  onEndDateChange: (date: Date | null) => void
  location?: string
  className?: string
  showLoader?: boolean
  dateFormat?: string
  placeholderStart?: string
  placeholderEnd?: string
  disabled?: boolean
  inputClassName?: string
  fullWidth?: boolean
  endOnly?: boolean
  endOnlyLabel?: string
  // Optional props to pass data from parent to avoid duplicate API calls
  operatingHours?: OperatingHours[]
  closureDates?: ClosureDate[]
  isLoadingShopHours?: boolean
}

export function DateTimeRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  location = 'Kovan',
  className = '',
  showLoader = true,
  dateFormat = 'MMM d, yyyy h:mm aa',
  placeholderStart = 'Start',
  placeholderEnd = 'End',
  disabled = false,
  inputClassName = '',
  fullWidth = false,
  endOnly = false,
  endOnlyLabel = 'To',
  // Optional props from parent
  operatingHours: propOperatingHours,
  closureDates: propClosureDates,
  isLoadingShopHours: propIsLoadingShopHours
}: DateTimeRangePickerProps) {
  const { toast } = useToast()
  
  // Shop hours state - use props if provided, otherwise manage locally
  const [operatingHours, setOperatingHours] = useState<OperatingHours[]>([])
  const [closureDates, setClosureDates] = useState<ClosureDate[]>([])
  const [isLoadingShopHours, setIsLoadingShopHours] = useState(false)
  const isAutoSettingEndRef = useRef(false)

  // Use props if provided, otherwise use local state
  const finalOperatingHours = propOperatingHours ?? operatingHours
  const finalClosureDates = propClosureDates ?? closureDates
  const finalIsLoadingShopHours = propIsLoadingShopHours ?? isLoadingShopHours

  // Load shop hours on mount only if not provided via props
  useEffect(() => {
    // Skip API call if data is provided via props
    if (propOperatingHours !== undefined && propClosureDates !== undefined) {
      return
    }

    const loadShopHours = async () => {
      setIsLoadingShopHours(true)
      try {
        const [hours, closures] = await Promise.all([
          getOperatingHours(location),
          getClosureDates(location)
        ])
        setOperatingHours(hours)
        setClosureDates(closures)
 
      } catch (error) {
        console.error('Error loading shop hours:', error)
      } finally {
        setIsLoadingShopHours(false)
      }
    }

    loadShopHours()
  }, [location, propOperatingHours, propClosureDates])

  // Calculate max date (2 months from today)
  const maxBookingDate = addMonths(new Date(), 2)

  // Helper function to STRICTLY enforce 15-minute intervals
  const enforceStrict15Minutes = (date: Date | null): Date | null => {
    if (!date) return null

    const strictDate = new Date(date)
    const minutes = strictDate.getMinutes()
    const remainder = minutes % 15

    // Reject any time that's not on a 15-minute boundary
    if (remainder !== 0) {
      // Always round DOWN to the previous 15-minute mark for strict enforcement
      const validMinutes = minutes - remainder
      strictDate.setMinutes(validMinutes)
      strictDate.setSeconds(0)
      strictDate.setMilliseconds(0)
    } else {
      // Time is already on 15-minute boundary, just clear seconds/milliseconds
      strictDate.setSeconds(0)
      strictDate.setMilliseconds(0)
    }

    return strictDate
  }

  // Helper function to get dates that should be excluded (closure dates)
  // Only exclude dates where closure completely covers operating hours
  const getExcludedDates = (): Date[] => {
    const excluded: Date[] = []

    finalClosureDates.forEach(closure => {
      // Convert UTC dates to local timezone
      const closureStart = new Date(closure.startDate)
      const closureEnd = new Date(closure.endDate)

      // Get local date components (date only, without time)
      const closureStartDate = new Date(closureStart.getFullYear(), closureStart.getMonth(), closureStart.getDate())
      const closureEndDate = new Date(closureEnd.getFullYear(), closureEnd.getMonth(), closureEnd.getDate())

      // Get time components in local timezone
      const closureStartTime = closureStart.getHours() * 60 + closureStart.getMinutes() // Minutes since midnight
      const closureEndTime = closureEnd.getHours() * 60 + closureEnd.getMinutes()

      // Check each date in the closure range
      let currentDate = new Date(closureStartDate)
      while (currentDate <= closureEndDate) {
        const dayOfWeek = currentDate.getDay()
        const dayHours = finalOperatingHours.find(h => h.dayOfWeek === dayOfWeek && h.isActive)

        if (dayHours) {
          // Parse operating hours
          const [openHours, openMinutes] = dayHours.openTime.split(':').map(Number)
          const [closeHours, closeMinutes] = dayHours.closeTime.split(':').map(Number)
          const operatingStartTime = openHours * 60 + openMinutes
          const operatingEndTime = closeHours * 60 + closeMinutes

          // Check if closure completely covers operating hours for this date
          // Closure must start before/at operating start AND end after/at operating end
          const isFullDayClosure = closureStartTime <= operatingStartTime && closureEndTime >= operatingEndTime

          if (isFullDayClosure) {
            excluded.push(new Date(currentDate))
          }
        } else {
          // If no operating hours for this day, exclude it if closure covers full day (00:00 to 23:59)
          if (closureStartTime === 0 && closureEndTime >= 1439) {
            excluded.push(new Date(currentDate))
          }
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }
    })

    return excluded
  }

  // Helper to generate available times for a given date based on operating hours
  const getAvailableTimes = (date: Date | null): Date[] => {
    if (!date) return []

    const dayOfWeek = date.getDay()
    const now = new Date()
    const isToday = isSameDay(date, now)

   

    const dayHours = finalOperatingHours.find(h => h.dayOfWeek === dayOfWeek && h.isActive)

    // CRITICAL: Always show times even if hours aren't loaded yet (fallback)
    if (finalOperatingHours.length === 0 || !dayHours) {
      const times: Date[] = []
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      for (let i = 0; i < 24 * 4; i++) {
        const time = new Date(start.getTime() + i * 15 * 60 * 1000)
        // For same-day bookings, only include future times
        if (!isToday || time > now) {
          times.push(time)
        }
      }
      return times
    }

    const times: Date[] = []
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)

    // Generate 15-min intervals within shop hours
    for (let i = 0; i < 24 * 4; i++) {
      const time = new Date(start.getTime() + i * 15 * 60 * 1000)
      const timeString = time.toTimeString().split(' ')[0].substring(0, 5)

      const openTime = dayHours.openTime.substring(0, 5)
      const closeTime = dayHours.closeTime.substring(0, 5)

      // Check if time is within operating hours
      if (timeString >= openTime && timeString <= closeTime) {
        // Check if this time slot falls within any closure period
        const isInClosure = finalClosureDates.some(closure => {
          const closureStart = new Date(closure.startDate) // UTC -> local timezone
          const closureEnd = new Date(closure.endDate) // UTC -> local timezone
          
          // Check if currentTime falls within the closure period
          return time.getTime() >= closureStart.getTime() && 
                 time.getTime() < closureEnd.getTime()
        })
        
        // Only add time if it's NOT in a closure period
        if (!isInClosure) {
          // For same-day bookings, only include times in the future
          if (!isToday || time > now) {
            times.push(time)
          }
        }
      }
    }

    return times
  }

  const getAvailableEndTimes = (date: Date | null): Date[] => {
    // If no start date, return empty array
    if (!startDate) return []

    // End date can be same day or next day, so get available times for the selected date
    const targetDate = date || startDate
    const times = getAvailableTimes(targetDate)
    if (!times.length) return times

    // If end date is same day as start date, filter based on start time (must be >= start time + 1 hour)
    if (isSameDay(targetDate, startDate)) {
      const minEndTime = new Date(startDate.getTime() + 60 * 60 * 1000)
      return times.filter(time => {
        // Compare the time portion - time should be >= minEndTime
        return time.getTime() >= minEndTime.getTime()
      })
    }

    // If end date is different day, return all available times for that day
    return times
  }

  // Helper function to round UP to next 15-minute interval
  const roundUpToNext15Minutes = (date: Date): Date => {
    const rounded = new Date(date)
    const minutes = rounded.getMinutes()
    const remainder = minutes % 15

    if (remainder !== 0) {
      // Round UP to next 15-minute mark
      const validMinutes = minutes + (15 - remainder)
      rounded.setMinutes(validMinutes)
      rounded.setSeconds(0)
      rounded.setMilliseconds(0)
    } else {
      // Already on 15-minute boundary, just clear seconds/milliseconds
      rounded.setSeconds(0)
      rounded.setMilliseconds(0)
    }

    return rounded
  }

  // Helper function to get optimal start time based on shop hours
  const getOptimalStartTime = (selectedDate: Date): Date => {
    const now = new Date()
    const isToday = isSameDay(selectedDate, now)
    const dayOfWeek = selectedDate.getDay()
  
    const dayHours = finalOperatingHours.find(
      h => h.dayOfWeek === dayOfWeek && h.isActive
    )
  
    // ❌ No shop hours → fallback (should ideally be blocked)
    if (!dayHours) {
      const fallback = new Date(selectedDate)
      fallback.setHours(9, 0, 0, 0)
      return fallback
    }
  
    // Shop opening time
    const [openHours, openMinutes] = dayHours.openTime.split(':').map(Number)
    const openTime = new Date(selectedDate)
    openTime.setHours(openHours, openMinutes, 0, 0)
  
    // ✅ CASE 1: TODAY → current time onward
    if (isToday) {
      const roundedNow = roundUpToNext15Minutes(now)
  
      // If current time is BEFORE shop opens → use opening time
      if (roundedNow < openTime) {
        return openTime
      }
  
      // Otherwise → current time (rounded)
      return roundedNow
    }
  
    // ✅ CASE 2: FUTURE DATE → opening hours
    return openTime
  }
  

  // Helper function to check if a time is within shop hours
  const isTimeWithinShopHours = (date: Date): boolean => {
    const dayOfWeek = date.getDay()
    const dayHours = finalOperatingHours.find(h => h.dayOfWeek === dayOfWeek && h.isActive)
    
    if (!dayHours || finalOperatingHours.length === 0) {
      return false // No shop hours for this day
    }
    
    const timeString = date.toTimeString().split(' ')[0].substring(0, 5)
    const openTime = dayHours.openTime.substring(0, 5)
    const closeTime = dayHours.closeTime.substring(0, 5)
    
    return timeString >= openTime && timeString <= closeTime
  }

  // Helper function to check if a time slot overlaps with closure periods
  const isTimeSlotInClosure = (startTime: Date, endTime: Date): boolean => {
    return finalClosureDates.some(closure => {
      const closureStart = new Date(closure.startDate) // UTC -> local timezone
      const closureEnd = new Date(closure.endDate) // UTC -> local timezone
      
      // Check if booking time slot overlaps with closure period
      // Overlap occurs if: booking starts before closure ends AND booking ends after closure starts
      return startTime.getTime() < closureEnd.getTime() && endTime.getTime() > closureStart.getTime()
    })
  }
  const GRACE_MINUTES = 5
  const GRACE_MS = GRACE_MINUTES * 60 * 1000
  
  const addGrace = (time: Date) =>
    new Date(time.getTime() + GRACE_MS)
  
  // Helper to check if time is within shop hours with 5-minute grace for overnight bookings
  const isTimeWithinShopHoursWithGrace = (date: Date, isOvernight: boolean): boolean => {
    const dayOfWeek = date.getDay()
    const dayHours = finalOperatingHours.find(h => h.dayOfWeek === dayOfWeek && h.isActive)
    
    if (!dayHours || finalOperatingHours.length === 0) {
      return false
    }
    
    const timeString = date.toTimeString().split(' ')[0].substring(0, 5)
    const openTime = dayHours.openTime.substring(0, 5)
    const closeTime = dayHours.closeTime.substring(0, 5)
    
    // Check if within shop hours
    if (timeString >= openTime && timeString <= closeTime) {
      return true
    }
    
    // For overnight bookings only: allow 5-minute grace period
    if (isOvernight) {
      const [closeHours, closeMinutes] = closeTime.split(':').map(Number)
      const closeTimeDate = new Date(date)
      closeTimeDate.setHours(closeHours, closeMinutes, 0, 0)
      const graceAfterClose = new Date(closeTimeDate.getTime() + GRACE_MS)
      
      const [openHours, openMinutes] = openTime.split(':').map(Number)
      const openTimeDate = new Date(date)
      openTimeDate.setHours(openHours, openMinutes, 0, 0)
      const graceBeforeOpen = new Date(openTimeDate.getTime() - GRACE_MS)
      
      // Allow if within 5 minutes after closing OR within 5 minutes before opening
      return (date.getTime() > closeTimeDate.getTime() && date.getTime() <= graceAfterClose.getTime()) ||
             (date.getTime() < openTimeDate.getTime() && date.getTime() >= graceBeforeOpen.getTime())
    }
    
    return false
  }

  const validateTimeSlot = (
    startTime: Date,
    endTime: Date
  ): { isValid: boolean; errorMessage?: string } => {
  
    const isOvernight = !isSameDay(startTime, endTime)
  
    // Check if start time is within shop hours (with grace for overnight)
    if (!isTimeWithinShopHoursWithGrace(startTime, isOvernight)) {
      return {
        isValid: false,
        errorMessage: 'Unable to book this slot as the shop is close in this timeslot.'
      }
    }
  
    // Check if end time is within shop hours (with grace for overnight)
    if (!isTimeWithinShopHoursWithGrace(endTime, isOvernight)) {
      return {
        isValid: false,
        errorMessage: 'Unable to book this slot as the shop is close in this timeslot.'
      }
    }
  
    // Check if the entire time slot overlaps with any closure period
    if (isTimeSlotInClosure(startTime, endTime)) {
      return {
        isValid: false,
        errorMessage: 'Unable to book this slot as the shop is close in this timeslot.'
      }
    }
  
    return { isValid: true }
  }
  

  // Handler for when user clicks on calendar date (onSelect event)
  // This fires specifically when user clicks on a date in the calendar
  const handleDateSelect = (date: Date | null) => {
    if (!date) return
    
    // When user clicks on calendar date, set optimal time based on shop hours
    const optimalTime = getOptimalStartTime(date)
    const validDate = enforceStrict15Minutes(optimalTime)
    onStartDateChange(validDate)
    onEndDateChange(null) // Clear end date to force user to select
  }

  // Handler for when date/time changes (onChange event)
  // This fires when user manually changes time or when onSelect updates the date
  const handleStartChange = (date: Date | null) => {
    if (!date) {
      onStartDateChange(null)
      onEndDateChange(null)
      return
    }

    // Check if this is a date-only selection (time is 00:00:00 or very early morning)
    // This handles cases where onSelect might not fire or when date is set programmatically
    const isDateOnlySelection = date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0
    
    let finalDate: Date
    
    if (isDateOnlySelection) {
      // Date-only selection - set optimal time based on shop hours (no validation needed)
      const optimalTime = getOptimalStartTime(date)
      finalDate = optimalTime
    } else {
      // User manually selected time - no validation, just set it
      finalDate = date
      
      // If there's an existing end date, clear it to force reselection
      // Validation will happen when end time is selected
      if (endDate) {
        onEndDateChange(null)
      }
    }
    
    const validDate = enforceStrict15Minutes(finalDate)
    onStartDateChange(validDate)
    onEndDateChange(null) // Clear end date to force user to select
  }

  // Helper function to get optimal end time based on start time
  const getOptimalEndTime = (selectedDate: Date): Date => {
    if (!startDate) {
      // If no start date, use default time (9 AM)
      const defaultTime = new Date(selectedDate)
      defaultTime.setHours(9, 0, 0, 0)
      return defaultTime
    }

    // If same day as start date, set to start time + 1 hour
    if (isSameDay(selectedDate, startDate)) {
      const minEndTime = new Date(startDate.getTime() + 60 * 60 * 1000) // Start + 1 hour
      const now = new Date()
      
      // If selecting today, ensure it's not in the past
      if (isSameDay(selectedDate, now) && minEndTime < now) {
        // Round up current time to next 15-minute interval
        const roundedNow = roundUpToNext15Minutes(now)
        return roundedNow > minEndTime ? roundedNow : minEndTime
      }
      
      return minEndTime
    }

    // If different day, use shop open time for that day
    const dayOfWeek = selectedDate.getDay()
    const dayHours = finalOperatingHours.find(h => h.dayOfWeek === dayOfWeek && h.isActive)
    
    if (dayHours && finalOperatingHours.length > 0) {
      const [openHours, openMinutes] = dayHours.openTime.split(':').map(Number)
      const openTime = new Date(selectedDate)
      openTime.setHours(openHours, openMinutes, 0, 0)
      return openTime
    }

    // Fallback to 9 AM
    const defaultTime = new Date(selectedDate)
    defaultTime.setHours(9, 0, 0, 0)
    return defaultTime
  }

  const handleEndChange = (date: Date | null) => {
    if (!date) {
      onEndDateChange(null)
      return
    }
  
    if (!startDate) {
      toast({
        title: "Select Start Date First",
        variant: "destructive",
      })
      return
    }
  
    const now = new Date()
    const isDateOnlySelection = date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0
    let validDate: Date
  
    if (isDateOnlySelection) {
      // If same day, force end = start + 1h
      if (isSameDay(date, startDate)) {
        validDate = new Date(startDate.getTime() + 60 * 60 * 1000)
      } else {
        // Overnight booking: Only allow if shop closes at 11:55 PM or later
        const startDayOfWeek = startDate.getDay()
        const startDayHours = finalOperatingHours.find(h => h.dayOfWeek === startDayOfWeek && h.isActive)
        
        if (startDayHours) {
          const [closeHours, closeMinutes] = startDayHours.closeTime.split(':').map(Number)
          
          // Check if shop closes before 11:55 PM (23:55)
          // If shop closes before 11:55 PM, block overnight booking
          if (closeHours < 23 || (closeHours === 23 && closeMinutes < 55)) {
            toast({
              title: "Invalid Time Slot",
              description: "Unable to book this slot as the shop is close in this timeslot.",
              variant: "destructive",
            })
            return
          }
        }
        
        validDate = getOptimalEndTime(date) // shop opening time
      }
      validDate = enforceStrict15Minutes(validDate)!
      
      // Validate the time slot for overnight bookings
      // Check minimum 1 hour duration
      const durationMs = validDate.getTime() - startDate.getTime()
      const durationHours = durationMs / (1000 * 60 * 60)
      if (durationHours < 1) {
        toast({
          title: "Invalid Time Slot",
          description: "Minimum booking duration is 1 hour",
          variant: "destructive",
        })
        return
      }
      
      // Validate the entire time slot (handles overnight bookings correctly)
      const validation = validateTimeSlot(startDate, validDate)
      if (!validation.isValid) {
        toast({
          title: "Invalid Time Slot",
          description: validation.errorMessage,
          variant: "destructive",
        })
        return
      }
      
      onEndDateChange(validDate)
      return
    }
  
    // Normal time selection
    validDate = enforceStrict15Minutes(date)!

    // If same day, ignore if user clicked the same time
    if (isSameDay(validDate, startDate) && endDate && validDate.getTime() === endDate.getTime()) {
      return
    }

    // Check overnight booking restriction: Only allow if shop closes at 11:55 PM or later
    if (!isSameDay(validDate, startDate)) {
      const startDayOfWeek = startDate.getDay()
      const startDayHours = finalOperatingHours.find(h => h.dayOfWeek === startDayOfWeek && h.isActive)
      
      if (startDayHours) {
        const [closeHours, closeMinutes] = startDayHours.closeTime.split(':').map(Number)
        
        // Check if shop closes before 11:55 PM (23:55)
        // If shop closes before 11:55 PM, block overnight booking
        if (closeHours < 23 || (closeHours === 23 && closeMinutes < 55)) {
          toast({
            title: "Invalid Time Slot",
            description: "Unable to book this slot as the shop is close in this timeslot.",
            variant: "destructive",
          })
          return
        }
      }
    }

    const minEndTime = new Date(startDate.getTime() + 60 * 60 * 1000)

    if (isSameDay(validDate, startDate) && validDate < minEndTime) {
      // Force set to minEndTime instead of showing toast
      validDate = minEndTime
    }

    // Final validations
    // if (!isTimeWithinShopHours(validDate)) {
    //   toast({
    //     title: "Invalid Time Slot",
    //     description: "Shop is closed in this timeslot",
    //     variant: "destructive",
    //   })
    //   return
    // }
  
    const validation = validateTimeSlot(startDate, validDate)
    if (!validation.isValid) {
      toast({
        title: "Invalid Time Slot",
        description: validation.errorMessage,
        variant: "destructive",
      })
      return
    }
  
    onEndDateChange(validDate)
  }
  

  const getEndDateConstraints = () => {
    if (!startDate) return { minDate: new Date(), maxDate: maxBookingDate }

    // End date can be same day or any day after start date (next day allowed)
    const minEndDate = startDate
    const maxEndDate = maxBookingDate

    return {
      minDate: minEndDate,
      maxDate: maxEndDate
    }
  }

  const getEndTimeConstraints = () => {
    if (!startDate || !endDate) {
      return {
        minTime: setHours(setMinutes(new Date(), 0), 0),
        maxTime: setHours(setMinutes(new Date(), 59), 23)
      }
    }

    // If end date is same day as start date, minimum end time is start time + 1 hour
    if (isSameDay(startDate, endDate)) {
      const minEndTime = new Date(startDate.getTime() + 60 * 60 * 1000)
      return {
        minTime: minEndTime, // Must be at least 1 hour after start time
        maxTime: setHours(setMinutes(endDate, 59), 23) // Until 11:59 PM same day
      }
    }

    // If end date is different day (overnight booking), calculate max time based on 24-hour limit from start date
    const maxDurationMs = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    const maxEndTime = new Date(startDate.getTime() + maxDurationMs)
    
    // For overnight bookings, we need to check if maxEndTime falls on the same day as endDate
    // If maxEndTime is on a different day than endDate, allow full day for endDate
    // Otherwise, limit to the maxEndTime
    if (isSameDay(maxEndTime, endDate)) {
      // Max time is within the end date, so use maxEndTime
      return {
        minTime: setHours(setMinutes(new Date(endDate), 0), 0), // From 12:00 AM of end date
        maxTime: maxEndTime // Maximum time based on 24-hour limit
      }
    } else {
      // Max time exceeds end date, so allow full day for end date
      return {
        minTime: setHours(setMinutes(new Date(endDate), 0), 0), // From 12:00 AM of end date
        maxTime: setHours(setMinutes(endDate, 59), 23) // Until 11:59 PM of end date
      }
    }
  }

  const getStartTimeConstraints = () => {
    const selectedDate = startDate || new Date()
    const today = new Date()

    // If booking for today, minimum time is current time
    if (isSameDay(selectedDate, today)) {
      return {
        minTime: new Date(),
        maxTime: setHours(setMinutes(new Date(), 59), 23) // Until 11:59 PM
      }
    }

    // For future dates, allow full day
    return {
      minTime: setHours(setMinutes(new Date(), 0), 0), // From 12:00 AM
      maxTime: setHours(setMinutes(new Date(), 59), 23) // Until 11:59 PM
    }
  }

  const getInitialEndTimeConstraints = () => {
    if (!startDate) {
      return {
        minTime: setHours(setMinutes(new Date(), 0), 0),
        maxTime: setHours(setMinutes(new Date(), 59), 23)
      }
    }

    // If selecting same day, minimum end time is start time + 1 hour
    // If selecting different day, allow full day
    const today = new Date()
    const minEndTime = new Date(startDate.getTime() + 60 * 60 * 1000)

    // For same day selection
    if (isSameDay(startDate, today)) {
      return {
        minTime: minEndTime,
        maxTime: setHours(setMinutes(today, 59), 23)
      }
    }

    // For future dates, if same day then 1 hour minimum, otherwise full day
    return {
      minTime: setHours(setMinutes(new Date(), 0), 0), // Allow full day for different days
      maxTime: setHours(setMinutes(new Date(), 59), 23)
    }
  }

  const { minDate: endMinDate, maxDate: endMaxDate } = getEndDateConstraints()
  const endTimeConstraints = endDate ? getEndTimeConstraints() : getInitialEndTimeConstraints()
  
  // Memoize available end times to avoid recalculation on every render
  const availableEndTimes = useMemo(() => {
    return getAvailableEndTimes(endDate)
  }, [endDate, startDate, finalOperatingHours, finalClosureDates])

  // Determine if layout should be vertical based on className
  const isVertical = className.includes('flex-col')
  const hasFlex1 = className.includes('flex-1')
  const isGrid = className.includes('grid')
  
  // Container class logic
  let containerClass = ''
  if (isGrid) {
    // For grid layout, don't add flex classes - let parent grid handle it
    containerClass = className
  } else if (isVertical) {
    containerClass = `flex flex-col space-y-3 ${className.replace('flex-col', '').trim()}`
  } else {
    containerClass = `flex space-x-4 ${className}`
  }
  
  // For tablet layout with flex-1, apply it to individual picker containers
  const pickerContainerClass = hasFlex1 && !isVertical && !isGrid ? 'flex flex-col flex-1' : 'flex flex-col w-full'
  
  // Determine picker width class
  const pickerWidthClass = fullWidth || isVertical || hasFlex1 || isGrid ? 'w-full' : 'w-full'
  
  // Default input styling (for landing page)
  const defaultInputClass = 'pl-0 border-b border-gray-300 pb-1 focus:outline-none text-black'
  
  // Full width input styling (for BookingClient)
  const fullWidthInputClass = inputClassName || `w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors ${disabled ? "bg-gray-50" : ""}`
  
  // Use custom className if provided, otherwise use default
  const inputClass = fullWidth ? fullWidthInputClass : defaultInputClass

  // If endOnly mode, only show end picker
  if (endOnly) {
    return (
      <div className={pickerContainerClass}>
        <label className="text-xs text-gray-500 uppercase mb-1 text-left flex items-center gap-2">
          {endOnlyLabel}
          {showLoader && finalIsLoadingShopHours && <Loader2 className="h-3 w-3 animate-spin text-orange-500" />}
        </label>
        <DatePicker
          selected={endDate}
          onChange={handleEndChange}
          onChangeRaw={(e) => e?.preventDefault()}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={endMinDate}
          maxDate={endMaxDate}
          showTimeSelect
          timeIntervals={15}
          includeTimes={availableEndTimes}
          dateFormat={dateFormat}
          placeholderText={placeholderEnd}
          className={inputClass}
          wrapperClassName={fullWidth ? "w-full" : undefined}
          disabled={disabled}
          excludeDates={getExcludedDates()}
          {...endTimeConstraints}
        />
      </div>
    )
  }

  return (
    <div className={containerClass}>
      {/* From */}
      <div className={pickerContainerClass}>
        <label className="text-xs text-gray-500 uppercase mb-1 text-left flex items-center gap-2">
          From
          {showLoader && finalIsLoadingShopHours && <Loader2 className="h-3 w-3 animate-spin text-orange-500" />}
        </label>
        <DatePicker
          selected={startDate}
          onChange={handleStartChange}
          onSelect={handleDateSelect}
          onChangeRaw={(e) => e?.preventDefault()}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          showTimeSelect
          timeIntervals={15}
          includeTimes={getAvailableTimes(startDate)}
          dateFormat={dateFormat}
          placeholderText={placeholderStart}
          className={inputClass}
          wrapperClassName={fullWidth ? "w-full" : undefined}
          minDate={new Date()}
          maxDate={maxBookingDate}
          excludeDates={getExcludedDates()}
          disabled={disabled}
          {...getStartTimeConstraints()}
        />
      </div>

      {/* To */}
      <div className={pickerContainerClass}>
        <label className="text-xs text-gray-500 uppercase mb-1 text-left">To</label>
        <DatePicker
          selected={endDate}
          onChange={handleEndChange}
          onChangeRaw={(e) => e?.preventDefault()}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={endMinDate}
          maxDate={endMaxDate}
          showTimeSelect
          timeIntervals={15}
          includeTimes={availableEndTimes}
          dateFormat={dateFormat}
          placeholderText={placeholderEnd}
          className={inputClass}
          wrapperClassName={fullWidth ? "w-full" : undefined}
          disabled={!startDate || disabled}
          excludeDates={getExcludedDates()}
          {...endTimeConstraints}
        />
      </div>
    </div>
  )
}


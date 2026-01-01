'use client'

import { useEffect, useState, useMemo } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

import { isSameDay, addMonths, setHours, setMinutes } from 'date-fns'

import { Loader2 } from 'lucide-react'

import { useToast } from '@/hooks/use-toast'
import { getOperatingHours, getClosureDates, OperatingHours, ClosureDate } from '@/lib/shopHoursService'

interface ExtendDateTimeRangePickerProps {
  startDate: Date | null // Original booking end date (fixed)
  endDate: Date | null // New extended end date
  onEndDateChange: (date: Date | null) => void
  location?: string
  className?: string
  showLoader?: boolean
  dateFormat?: string
  placeholderEnd?: string
  disabled?: boolean
  inputClassName?: string
  fullWidth?: boolean
  endOnlyLabel?: string
}

export function ExtendDateTimeRangePicker({
  startDate,
  endDate,
  onEndDateChange,
  location = 'Kovan',
  className = '',
  showLoader = true,
  dateFormat = 'MMM d, yyyy h:mm aa',
  placeholderEnd = 'End',
  disabled = false,
  inputClassName = '',
  fullWidth = false,
  endOnlyLabel = 'To'
}: ExtendDateTimeRangePickerProps) {
  const { toast } = useToast()
  
  const [operatingHours, setOperatingHours] = useState<OperatingHours[]>([])
  const [closureDates, setClosureDates] = useState<ClosureDate[]>([])
  const [isLoadingShopHours, setIsLoadingShopHours] = useState(false)
  const [viewedDateInCalendar, setViewedDateInCalendar] = useState<Date | null>(null)

  // Load shop hours and closures
  useEffect(() => {
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
  }, [location])

  // Set initial viewed date to startDate when shop hours are loaded
  useEffect(() => {
    if (!isLoadingShopHours && operatingHours.length > 0 && startDate && !viewedDateInCalendar) {
      setViewedDateInCalendar(startDate)
    }
  }, [isLoadingShopHours, operatingHours.length, startDate, viewedDateInCalendar])

  const maxBookingDate = addMonths(new Date(), 2)

  // Enforce 15-minute intervals
  const enforceStrict15Minutes = (date: Date | null): Date | null => {
    if (!date) return null

    const strictDate = new Date(date)
    const minutes = strictDate.getMinutes()
    const remainder = minutes % 15

    if (remainder !== 0) {
      const validMinutes = minutes - remainder
      strictDate.setMinutes(validMinutes)
      strictDate.setSeconds(0)
      strictDate.setMilliseconds(0)
    } else {
      strictDate.setSeconds(0)
      strictDate.setMilliseconds(0)
    }

    return strictDate
  }

  // Get excluded dates (full-day closures)
  const getExcludedDates = (): Date[] => {
    const excluded: Date[] = []

    closureDates.forEach(closure => {
      const closureStart = new Date(closure.startDate)
      const closureEnd = new Date(closure.endDate)

      const closureStartDate = new Date(closureStart.getFullYear(), closureStart.getMonth(), closureStart.getDate())
      const closureEndDate = new Date(closureEnd.getFullYear(), closureEnd.getMonth(), closureEnd.getDate())

      const closureStartTime = closureStart.getHours() * 60 + closureStart.getMinutes()
      const closureEndTime = closureEnd.getHours() * 60 + closureEnd.getMinutes()

      let currentDate = new Date(closureStartDate)
      while (currentDate <= closureEndDate) {
        const dayOfWeek = currentDate.getDay()
        const dayHours = operatingHours.find(h => h.dayOfWeek === dayOfWeek && h.isActive)

        if (dayHours) {
          const [openHours, openMinutes] = dayHours.openTime.split(':').map(Number)
          const [closeHours, closeMinutes] = dayHours.closeTime.split(':').map(Number)
          const operatingStartTime = openHours * 60 + openMinutes
          const operatingEndTime = closeHours * 60 + closeMinutes

          const isFullDayClosure = closureStartTime <= operatingStartTime && closureEndTime >= operatingEndTime

          if (isFullDayClosure) {
            excluded.push(new Date(currentDate))
          }
        } else {
          if (closureStartTime === 0 && closureEndTime >= 1439) {
            excluded.push(new Date(currentDate))
          }
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }
    })

    return excluded
  }

  // Get available times for a date based on operating hours
  const getAvailableTimes = (date: Date | null): Date[] => {
    if (!date) return []

    const dayOfWeek = date.getDay()
    const now = new Date()
    const isToday = isSameDay(date, now)

    const dayHours = operatingHours.find(h => h.dayOfWeek === dayOfWeek && h.isActive)

    if (!dayHours || operatingHours.length === 0) {
      return []
    }

    const times: Date[] = []
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)

    for (let i = 0; i < 24 * 4; i++) {
      const time = new Date(start.getTime() + i * 15 * 60 * 1000)
      const timeString = time.toTimeString().split(' ')[0].substring(0, 5)

      const openTime = dayHours.openTime.substring(0, 5)
      const closeTime = dayHours.closeTime.substring(0, 5)

      if (timeString >= openTime && timeString <= closeTime) {
        const isInClosure = closureDates.some(closure => {
          if (!closure.isActive) return false
          const closureStart = new Date(closure.startDate)
          const closureEnd = new Date(closure.endDate)
          return time.getTime() >= closureStart.getTime() && time.getTime() < closureEnd.getTime()
        })
        
        if (!isInClosure) {
          if (!isToday || time > now) {
            times.push(time)
          }
        }
      }
    }

    return times
  }

  // Get available end times for extend booking
  const getAvailableEndTimes = (date: Date | null): Date[] => {
    if (!startDate) return []

    if (isLoadingShopHours && operatingHours.length === 0) {
      return []
    }

    const targetDate = date || startDate
    const times = getAvailableTimes(targetDate)
    if (!times.length) return times

    // If same day, filter to ensure at least 1 hour extension
    if (isSameDay(targetDate, startDate)) {
      const minEndTime = new Date(startDate.getTime() + 60 * 60 * 1000)
      return times.filter(time => time.getTime() >= minEndTime.getTime())
    }

    return times
  }

  // Round up to next 15-minute interval
  const roundUpToNext15Minutes = (date: Date): Date => {
    const rounded = new Date(date)
    const minutes = rounded.getMinutes()
    const remainder = minutes % 15

    if (remainder !== 0) {
      const validMinutes = minutes + (15 - remainder)
      rounded.setMinutes(validMinutes)
      rounded.setSeconds(0)
      rounded.setMilliseconds(0)
    } else {
      rounded.setSeconds(0)
      rounded.setMilliseconds(0)
    }

    return rounded
  }

  // Check if time is within shop hours
  const isTimeWithinShopHours = (date: Date): boolean => {
    const dayOfWeek = date.getDay()
    const dayHours = operatingHours.find(h => h.dayOfWeek === dayOfWeek && h.isActive)
    
    if (!dayHours || operatingHours.length === 0) {
      return false
    }
    
    const timeString = date.toTimeString().split(' ')[0].substring(0, 5)
    const openTime = dayHours.openTime.substring(0, 5)
    const closeTime = dayHours.closeTime.substring(0, 5)
    
    return timeString >= openTime && timeString <= closeTime
  }

  // Check if time slot overlaps with closure periods
  const isTimeSlotInClosure = (startTime: Date, endTime: Date): boolean => {
    if (closureDates.length === 0) return false
    
    return closureDates.some(closure => {
      if (!closure.isActive) return false
      
      const closureStart = new Date(closure.startDate)
      const closureEnd = new Date(closure.endDate)
      
      return startTime.getTime() < closureEnd.getTime() && endTime.getTime() > closureStart.getTime()
    })
  }

  // Validate time slot
  const validateTimeSlot = (startTime: Date, endTime: Date): { isValid: boolean; errorMessage?: string } => {
    if (!isTimeWithinShopHours(endTime)) {
      return {
        isValid: false,
        errorMessage: 'Unable to book this slot.'
      }
    }
    
    if (isTimeSlotInClosure(startTime, endTime)) {
      return {
        isValid: false,
        errorMessage: 'Unable to book this slot.'
      }
    }
    
    return { isValid: true }
  }

  // Get optimal end time for a selected date
  const getOptimalEndTime = (selectedDate: Date): Date => {
    if (!startDate) {
      const defaultTime = new Date(selectedDate)
      defaultTime.setHours(9, 0, 0, 0)
      return defaultTime
    }

    if (isSameDay(selectedDate, startDate)) {
      const minEndTime = new Date(startDate.getTime() + 60 * 60 * 1000)
      const now = new Date()
      
      if (isSameDay(selectedDate, now) && minEndTime < now) {
        const roundedNow = roundUpToNext15Minutes(now)
        return roundedNow > minEndTime ? roundedNow : minEndTime
      }
      
      return minEndTime
    }

    const dayOfWeek = selectedDate.getDay()
    const dayHours = operatingHours.find(h => h.dayOfWeek === dayOfWeek && h.isActive)
    
    if (dayHours && operatingHours.length > 0) {
      const [openHours, openMinutes] = dayHours.openTime.split(':').map(Number)
      const openTime = new Date(selectedDate)
      openTime.setHours(openHours, openMinutes, 0, 0)
      return openTime
    }

    const defaultTime = new Date(selectedDate)
    defaultTime.setHours(9, 0, 0, 0)
    return defaultTime
  }

  // Handle end date change
  const handleEndChange = (date: Date | null) => {
    if (!date) {
      setViewedDateInCalendar(null)
      onEndDateChange(null)
      return
    }
  
    if (!startDate) {
      toast({
        title: "Invalid Selection",
        description: "Start date is required.",
        variant: "destructive",
      })
      return
    }
  
    const isDateOnlySelection = date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0
    let validDate: Date
  
    if (isDateOnlySelection) {
      // Date-only selection: calculate optimal end time
      if (isSameDay(date, startDate)) {
        validDate = new Date(startDate.getTime() + 60 * 60 * 1000)
      } else {
        validDate = getOptimalEndTime(date)
      }
      
      validDate = enforceStrict15Minutes(validDate)!
      
      // Validate time slot (shop hours + closures)
      const validation = validateTimeSlot(startDate, validDate)
      if (!validation.isValid) {
        toast({
          title: "Invalid Time Slot",
          description: validation.errorMessage || "Unable to book this slot.",
          variant: "destructive",
        })
        setViewedDateInCalendar(date)
        return
      }
      
      // Check minimum 1-hour extension
      const extensionHours = (validDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
      if (extensionHours < 1) {
        toast({
          title: "Minimum Extension Required",
          description: "Extension requires at least 1 hour.",
          variant: "destructive",
        })
        setViewedDateInCalendar(date)
        return
      }
      
      setViewedDateInCalendar(validDate)
      onEndDateChange(validDate)
      return
    }
  
    // Time selection
    validDate = enforceStrict15Minutes(date)!
  
    if (isSameDay(validDate, startDate) && endDate && validDate.getTime() === endDate.getTime()) {
      return
    }
  
    const minEndTime = new Date(startDate.getTime() + 60 * 60 * 1000)
  
    if (isSameDay(validDate, startDate) && validDate < minEndTime) {
      validDate = minEndTime
    }
  
    // Validate time slot
    const validation = validateTimeSlot(startDate, validDate)
    if (!validation.isValid) {
      toast({
        title: "Invalid Time Slot",
        description: validation.errorMessage || "Unable to book this slot.",
        variant: "destructive",
      })
      return
    }
  
    // Check minimum 1-hour extension
    const extensionHours = (validDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
    if (extensionHours < 1) {
      toast({
        title: "Minimum Extension Required",
        description: "Extension requires at least 1 hour.",
        variant: "destructive",
      })
      return
    }
  
    setViewedDateInCalendar(validDate)
    onEndDateChange(validDate)
  }

  // Date constraints
  const getEndDateConstraints = () => {
    if (!startDate) return { minDate: new Date(), maxDate: maxBookingDate }
    return {
      minDate: startDate,
      maxDate: maxBookingDate
    }
  }

  // Time constraints
  const getEndTimeConstraints = () => {
    if (!startDate || !endDate) {
      return {
        minTime: setHours(setMinutes(new Date(), 0), 0),
        maxTime: setHours(setMinutes(new Date(), 59), 23)
      }
    }

    if (isSameDay(startDate, endDate)) {
      const minEndTime = new Date(startDate.getTime() + 60 * 60 * 1000)
      return {
        minTime: minEndTime,
        maxTime: setHours(setMinutes(endDate, 59), 23)
      }
    }

    const maxDurationMs = 24 * 60 * 60 * 1000
    const maxEndTime = new Date(startDate.getTime() + maxDurationMs)
    const maxTime = maxEndTime > endDate ? endDate : maxEndTime
    
    return {
      minTime: setHours(setMinutes(new Date(), 0), 0),
      maxTime: maxTime
    }
  }

  const getInitialEndTimeConstraints = () => {
    if (!startDate) {
      return {
        minTime: setHours(setMinutes(new Date(), 0), 0),
        maxTime: setHours(setMinutes(new Date(), 59), 23)
      }
    }

    const minEndTime = new Date(startDate.getTime() + 60 * 60 * 1000)
    const today = new Date()

    if (isSameDay(startDate, today)) {
      return {
        minTime: minEndTime,
        maxTime: setHours(setMinutes(today, 59), 23)
      }
    }

    return {
      minTime: setHours(setMinutes(new Date(), 0), 0),
      maxTime: setHours(setMinutes(new Date(), 59), 23)
    }
  }

  const { minDate: endMinDate, maxDate: endMaxDate } = getEndDateConstraints()
  const endTimeConstraints = endDate ? getEndTimeConstraints() : getInitialEndTimeConstraints()
  
  const availableEndTimes = useMemo(() => {
    const dateToCalculateFor = viewedDateInCalendar || endDate || startDate
    return getAvailableEndTimes(dateToCalculateFor)
  }, [viewedDateInCalendar, endDate, startDate, operatingHours, closureDates, isLoadingShopHours])

  // Styling
  const pickerContainerClass = 'flex flex-col w-full'
  const fullWidthInputClass = inputClassName || `w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors ${disabled ? "bg-gray-50" : ""}`
  const inputClass = fullWidth ? fullWidthInputClass : 'pl-0 border-b border-gray-300 pb-1 focus:outline-none text-black'

  return (
    <div className={pickerContainerClass}>
      <label className="text-xs text-gray-500 uppercase mb-1 text-left flex items-center gap-2">
        {endOnlyLabel}
        {showLoader && isLoadingShopHours && <Loader2 className="h-3 w-3 animate-spin text-orange-500" />}
      </label>
      <DatePicker
        selected={endDate}
        onChange={handleEndChange}
        onSelect={(date) => {
          if (date) {
            setViewedDateInCalendar(date)
          }
        }}
        onChangeRaw={(e) => e?.preventDefault()}
        selectsEnd
        startDate={startDate}
        endDate={endDate}
        minDate={endMinDate}
        maxDate={endMaxDate}
        openToDate={endDate || startDate || new Date()}
        showTimeSelect
        timeIntervals={15}
        includeTimes={availableEndTimes}
        dateFormat={dateFormat}
        placeholderText={placeholderEnd}
        className={inputClass}
        wrapperClassName={fullWidth ? "w-full" : undefined}
        disabled={disabled || (isLoadingShopHours && operatingHours.length === 0)}
        excludeDates={getExcludedDates()}
        onCalendarOpen={() => {
          if (!isLoadingShopHours || operatingHours.length > 0) {
            if (!endDate && startDate) {
              setViewedDateInCalendar(startDate)
            } else if (endDate) {
              setViewedDateInCalendar(endDate)
            }
          }
        }}
        {...endTimeConstraints}
      />
    </div>
  )
}

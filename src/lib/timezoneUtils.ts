// Timezone utility functions for converting between UTC and local timezone

/**
 * Get user's local timezone offset in hours
 * @returns Timezone offset in hours (e.g., +8 for Singapore, -5 for EST)
 */
export function getLocalTimezoneOffset(): number {
  const offset = -new Date().getTimezoneOffset() / 60
  return offset
}

/**
 * Get user's timezone name (e.g., "Asia/Singapore", "America/New_York")
 * @returns Timezone name from Intl API
 */
export function getLocalTimezoneName(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Convert UTC time to user's local time
 * @param utcDate - UTC date string or Date object
 * @returns Date object in local timezone
 */
export function toLocalTime(utcDate: string | Date): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate
  return date // JavaScript Date objects are already timezone-aware
}

/**
 * Convert UTC time to Singapore time (GMT+8)
 * @param utcDate - UTC date string or Date object
 * @returns Date object adjusted to Singapore timezone
 */
export function toSingaporeTime(utcDate: string | Date): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate
  
  // Use Intl.DateTimeFormat to properly convert to Singapore timezone
  const singaporeTime = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Singapore"}))
  
  return singaporeTime
}

/**
 * Convert local time to UTC for database storage
 * @param localDate - Date object or string in local time
 * @returns Date object in UTC
 */
export function toUTC(localDate: string | Date): Date {
  const date = typeof localDate === 'string' ? new Date(localDate) : localDate
  return new Date(date.toISOString())
}

/**
 * Format date for display in user's local timezone
 * @param utcDate - UTC date from database
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in local timezone
 */
export function formatLocalDate(
  utcDate: string | Date, 
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
): string {
  // Ensure dates are treated as UTC by adding 'Z' if not present
  const dateStr = typeof utcDate === 'string' ? 
    (utcDate.endsWith('Z') ? utcDate : utcDate + 'Z') : 
    utcDate.toISOString()
  const date = new Date(dateStr)
  return date.toLocaleString('en-US', {
    ...options,
    timeZone: getLocalTimezoneName()
  })
}

/**
 * Format date only (without time) in local timezone
 * @param utcDate - UTC date from database
 * @returns Formatted date string
 */
export function formatLocalDateOnly(utcDate: string | Date): string {
  return formatLocalDate(utcDate, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format time only (without date) in local timezone
 * @param utcDate - UTC date from database
 * @returns Formatted time string
 */
export function formatLocalTimeOnly(utcDate: string | Date): string {
  return formatLocalDate(utcDate, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Check if a UTC date is in the past (local timezone)
 * @param utcDate - UTC date from database
 * @returns true if date is in the past
 */
export function isPastInLocal(utcDate: string | Date): boolean {
  const dateStr = typeof utcDate === 'string' ? 
    (utcDate.endsWith('Z') ? utcDate : utcDate + 'Z') : 
    utcDate.toISOString()
  const date = new Date(dateStr)
  return date < new Date()
}

/**
 * Check if a UTC date is in the future (local timezone)
 * @param utcDate - UTC date from database
 * @returns true if date is in the future
 */
export function isFutureInLocal(utcDate: string | Date): boolean {
  const dateStr = typeof utcDate === 'string' ? 
    (utcDate.endsWith('Z') ? utcDate : utcDate + 'Z') : 
    utcDate.toISOString()
  const date = new Date(dateStr)
  return date > new Date()
}

/**
 * Calculate duration in hours between two UTC dates
 * @param startUtc - Start UTC date
 * @param endUtc - End UTC date
 * @returns Duration in hours
 */
export function calculateDurationLocal(startUtc: string | Date, endUtc: string | Date): number {
  const start = new Date(typeof startUtc === 'string' ? 
    (startUtc.endsWith('Z') ? startUtc : startUtc + 'Z') : startUtc.toISOString())
  const end = new Date(typeof endUtc === 'string' ? 
    (endUtc.endsWith('Z') ? endUtc : endUtc + 'Z') : endUtc.toISOString())
  return Math.abs((end.getTime() - start.getTime()) / (1000 * 60 * 60))
}

/**
 * Format booking date range for display in local timezone
 * @param startUtc - Start UTC date from database
 * @param endUtc - End UTC date from database
 * @returns Formatted date range string
 */
export function formatBookingDateRange(startUtc: string | Date, endUtc: string | Date): string {
  // Ensure dates are treated as UTC by adding 'Z' if not present
  const startDateStr = typeof startUtc === 'string' ? 
    (startUtc.endsWith('Z') ? startUtc : startUtc + 'Z') : 
    startUtc.toISOString()
  const endDateStr = typeof endUtc === 'string' ? 
    (endUtc.endsWith('Z') ? endUtc : endUtc + 'Z') : 
    endUtc.toISOString()
  
  const startDate = new Date(startDateStr)
  const endDate = new Date(endDateStr)
  
  // Use user's local timezone for display
  const timezoneName = getLocalTimezoneName()
  
  const startDateFormatted = startDate.toLocaleDateString('en-US', { 
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: timezoneName
  })
  
  const startTimeFormatted = startDate.toLocaleTimeString('en-US', { 
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: timezoneName
  })
  
  const endTimeFormatted = endDate.toLocaleTimeString('en-US', { 
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: timezoneName
  })
  
  // Check if it's the same day in user's local timezone
  const startDateOnly = startDate.toLocaleDateString('en-US', { timeZone: timezoneName })
  const endDateOnly = endDate.toLocaleDateString('en-US', { timeZone: timezoneName })
  const isSameDay = startDateOnly === endDateOnly
  
  if (isSameDay) {
    return `${startDateFormatted} ${startTimeFormatted} - ${endTimeFormatted}`
  } else {
    const endDateFormatted = endDate.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: timezoneName
    })
    return `${startDateFormatted} ${startTimeFormatted} - ${endDateFormatted} ${endTimeFormatted}`
  }
}

/**
 * Create a date picker date in local timezone
 * @param utcDate - UTC date from database
 * @returns Date object suitable for date pickers
 */
export function toDatePickerDate(utcDate: string | Date): Date {
  const dateStr = typeof utcDate === 'string' ? 
    (utcDate.endsWith('Z') ? utcDate : utcDate + 'Z') : 
    utcDate.toISOString()
  return new Date(dateStr)
}

/**
 * Format UTC date for date/time input fields
 * @param utcDate - UTC date from database
 * @returns Formatted string for datetime-local input
 */
export function toDateTimeInputValue(utcDate: string | Date): string {
  const date = new Date(typeof utcDate === 'string' ? 
    (utcDate.endsWith('Z') ? utcDate : utcDate + 'Z') : utcDate.toISOString())
  
  // Format for datetime-local input (YYYY-MM-DDTHH:mm)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Convert date picker value to UTC for database storage
 * @param datePickerValue - Date from date picker (local timezone)
 * @returns UTC date string
 */
export function fromDatePickerToUTC(datePickerValue: string | Date): string {
  const date = typeof datePickerValue === 'string' ? new Date(datePickerValue) : datePickerValue
  return date.toISOString()
}

/**
 * Get current time in user's local timezone
 * @returns Current Date object
 */
export function getCurrentLocalTime(): Date {
  return new Date()
}

/**
 * Get time constraints for booking (in local timezone)
 * @returns Object with min/max times and current time
 */
export function getLocalTimeConstraints() {
  const now = new Date()
  return {
    currentTime: now,
    minTime: new Date(now.getTime() + 30 * 60 * 1000), // 30 minutes from now
    maxTime: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
  }
}

// Legacy compatibility exports (map to new local timezone functions)
export const formatSingaporeDate = formatLocalDate
export const formatSingaporeDateOnly = formatLocalDateOnly
export const formatSingaporeTimeOnly = formatLocalTimeOnly
// toSingaporeTime is now a proper function above
export const isPastInSingapore = isPastInLocal
export const isFutureInSingapore = isFutureInLocal
export const calculateDurationSingapore = calculateDurationLocal
export const getCurrentSingaporeTime = getCurrentLocalTime
export const getSingaporeTimeConstraints = getLocalTimeConstraints

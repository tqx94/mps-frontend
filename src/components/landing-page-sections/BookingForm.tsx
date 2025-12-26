// src/components/BookingForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import Image from 'next/image'

// date‐fns helpers to compare dates
import { isSameDay } from 'date-fns'

import { ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

import { PeopleSelector } from '@/components/PeopleSelector'
import { DateTimeRangePicker } from '@/components/DateTimeRangePicker'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

export default function BookingForm() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { toast } = useToast()

  const [people, setPeople] = useState<number>(1)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  // Add state for people breakdown
  const [peopleBreakdown, setPeopleBreakdown] = useState<{
    coWorkers: number
    coTutors: number
    coStudents: number
    total: number
  }>({
    coWorkers: 1,
    coTutors: 0,
    coStudents: 0,
    total: 1
  })


  const handleBookNow = () => {
    // Validate required fields
    if (!startDate || !endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }
    // Validate booking time constraints
    if (endDate <= startDate) {
      toast({
        title: "Invalid Time Range",
        description: "End time must be after start time",
        variant: "destructive",
      })
      return
    }

    // Validate minimum booking duration of 1 hour
    const timeDifferenceMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60)
    if (timeDifferenceMinutes < 60) {
      toast({
        title: "Duration Too Short",
        description: "Minimum booking duration is 1 hour",
        variant: "destructive",
      })
      return
    }

    // Check if booking is over 24 hours
    const timeDifferenceHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
    if (timeDifferenceHours > 24) {
      toast({
        title: "Booking Duration Exceeded",
        description: "Booking of more than 24 hours should not be allowed. If required, please contact admin via whatsapp.",
        variant: "destructive",
      })
      return
    }


    // Check if user is logged in, redirect to login if not logged in
    if (!user) {
      // Redirect to login page instead of showing modal
      router.push('/login')
      return
    }

    // If user is logged in, continue to booking
    handleContinueToBooking()
  }

  const handleContinueToBooking = () => {
    // Clear home page localStorage before navigating
    clearHomePageStorage()

    // Create URL with prefilled data
    const params = new URLSearchParams({
      location: 'kovan',
      people: people.toString(),
      start: startDate!.toISOString(),
      end: endDate!.toISOString(),
      coWorkers: peopleBreakdown.coWorkers.toString(),
      coTutors: peopleBreakdown.coTutors.toString(),
      coStudents: peopleBreakdown.coStudents.toString()
    })

    router.push(`/book-now?${params.toString()}`)
  }

  // Handle people count changes - this prevents circular updates
  const handlePeopleChange = (newPeople: number) => {
    if (people !== newPeople) {
      setPeople(newPeople)
      // Only update breakdown if it's different to prevent loops
      if (peopleBreakdown.total !== newPeople) {
        setPeopleBreakdown(prev => ({
          ...prev,
          total: newPeople,
          // Adjust coWorkers to match the new total if needed
          coWorkers: Math.max(1, newPeople - prev.coTutors - prev.coStudents)
        }))
      }
    }
  }

  // Handle breakdown changes - this prevents circular updates
  const handleBreakdownChange = (newBreakdown: typeof peopleBreakdown) => {
    // Only update if there's an actual change
    if (JSON.stringify(peopleBreakdown) !== JSON.stringify(newBreakdown)) {
      setPeopleBreakdown(newBreakdown)
      // Only update people count if it's different to prevent loops
      if (people !== newBreakdown.total) {
        setPeople(newBreakdown.total)
      }
    }
  }

  // Function to clear home page localStorage
  const clearHomePageStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('home-page-people-selector')
    }
  }

  return (
    <section id="BookNow" className="pt-16 overflow-x-hidden w-full">
      <div className="relative h-[600px] md:h-[700px] w-full overflow-hidden">
        <Image src="/mock_img/hero-image.jpg" alt="Hero" fill className="object-cover" />
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center text-white px-4 w-full">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif leading-tight max-w-full px-2">
            Start your unforgettable co-working journey with us.
          </h1>
          <p className="mt-4 text-sm sm:text-base md:text-lg max-w-full px-2">Where Community meets Productivity</p>

          {/*  THE WHITE BAR - RESPONSIVE  */}
          <div className="mt-6 md:mt-8 bg-white p-4 md:p-6 rounded-lg w-full max-w-5xl mx-auto overflow-x-hidden px-2 sm:px-4">
            {/* Desktop Layout */}
            <div className="hidden lg:flex space-x-4 xl:space-x-6 items-end flex-wrap gap-4">

              {/* LOCATION */}
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 uppercase mb-1 text-left">Location</label>
                <div className="flex w-36 items-center border-b border-gray-300 pb-2 text-sm text-black">
                  Kovan
                </div>
              </div>

              {/* PEOPLE */}
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 uppercase mb-1 text-left">People</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="w-28 text-black border-b border-gray-300 pb-1 text-left focus:outline-none"
                    >
                      {people} {people === 1 ? 'Person' : 'People'}
                      {peopleBreakdown.coTutors > 0 || peopleBreakdown.coStudents > 0 ? (
                        <div className="text-xs text-gray-500 mt-1">
                          {peopleBreakdown.coWorkers}💼 {peopleBreakdown.coTutors}👩‍🏫 {peopleBreakdown.coStudents}🎓
                        </div>
                      ) : null}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="bottom" className="w-auto">
                    <PeopleSelector
                      value={people}
                      min={1}
                      max={15}
                      onChange={handlePeopleChange}
                      showBreakdown={true}
                      onBreakdownChange={handleBreakdownChange}
                      storageKey="home-page-people-selector"
                      enablePersistence={false}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* DATE & TIME RANGE */}
              <DateTimeRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                location="Kovan"
                dateFormat="MMM d, yyyy h:mm aa"
                placeholderStart="Start"
                placeholderEnd="End"
              />

              {/* BOOK BUTTON */}
              <Button
                onClick={handleBookNow}
                className="bg-orange-500 text-white ml-auto px-6 py-2 transition-colors duration-200"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Book Now →'}
              </Button>
            </div>

            {/* Tablet Layout */}
            <div className="hidden md:flex lg:hidden flex-col space-y-4">
              {/* Row 1: Location and People */}
              <div className="flex space-x-6">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 uppercase text-left">Location</label>
                  <div className="flex w-32 items-center border-b border-gray-300 text-sm text-black">
                    Kovan
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 uppercase mb-1 text-left">People</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="w-28 text-black border-b border-gray-300 pb-1 text-left focus:outline-none"
                      >
                        {people} {people === 1 ? 'Person' : 'People'}
                        {peopleBreakdown.coTutors > 0 || peopleBreakdown.coStudents > 0 ? (
                          <div className="text-xs text-gray-500 mt-1">
                            {peopleBreakdown.coWorkers}💼 {peopleBreakdown.coTutors}👩‍🏫 {peopleBreakdown.coStudents}🎓
                          </div>
                        ) : null}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="bottom" className="w-auto">
                      <PeopleSelector
                        value={people}
                        min={1}
                        max={15}
                        onChange={handlePeopleChange}
                        showBreakdown={true}
                        onBreakdownChange={handleBreakdownChange}
                        storageKey="home-page-people-selector"
                        enablePersistence={false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Row 2: Date Range */}
              <DateTimeRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                location="Kovan"
                dateFormat="MMM d, yyyy h:mm aa"
                placeholderStart="Start"
                placeholderEnd="End"
                className="flex-1"
              />

              {/* Row 3: Book Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleBookNow}
                  className="bg-orange-500 text-white px-6 py-2 transition-colors duration-200"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Book Now →'}
                </Button>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="flex md:hidden flex-col space-y-4">
              {/* Location */}
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 uppercase mb-1 text-left">Location</label>
                <div className="flex h-10 w-full items-center border-b border-gray-300 px-3 py-2 text-sm text-black">
                  Kovan
                </div>
              </div>

              {/* People */}
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 uppercase mb-1 text-left">People</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="w-full text-black border-b border-gray-300 pb-1 text-left focus:outline-none"
                    >
                      {people} {people === 1 ? 'Person' : 'People'}
                      {peopleBreakdown.coTutors > 0 || peopleBreakdown.coStudents > 0 ? (
                        <div className="text-xs text-gray-500 mt-1">
                          {peopleBreakdown.coWorkers}💼 {peopleBreakdown.coTutors}👩‍🏫 {peopleBreakdown.coStudents}🎓
                        </div>
                      ) : null}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="bottom" className="w-auto">
                    <PeopleSelector
                      value={people}
                      min={1}
                      max={15}
                      onChange={handlePeopleChange}
                      showBreakdown={true}
                      onBreakdownChange={handleBreakdownChange}
                      storageKey="home-page-people-selector"
                      enablePersistence={false}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date Range */}
              <DateTimeRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                location="Kovan"
                dateFormat="MMM d, yyyy h:mm aa"
                placeholderStart="Start"
                placeholderEnd="End"
                className="flex-col space-y-3"
              />

              {/* Book Button */}
              <div className="flex justify-center pt-2">
                <Button
                  onClick={handleBookNow}
                  className="bg-orange-500 text-white w-full py-3 transition-colors duration-200"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Book Now →'}
                </Button>
              </div>
            </div>
          </div>

          {/* Helper text for bookings */}
          {startDate && (
            <div className="mt-4 text-xs sm:text-sm text-white/80 max-w-md text-center px-4">
              <p>💡 Bookings are limited to 2 months in advance</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
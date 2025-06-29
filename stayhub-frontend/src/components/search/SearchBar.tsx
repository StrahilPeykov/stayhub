'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar, MapPin, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { GuestSelector } from '@/components/search/GuestSelector'
import { LocationSearch } from '@/components/search/LocationSearch'
import { useAnalytics } from '@/lib/hooks/useAnalytics'

export function SearchBar() {
  const router = useRouter()
  const { track } = useAnalytics()
  const [location, setLocation] = useState('')
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [guests, setGuests] = useState(2)
  const [rooms, setRooms] = useState(1)

  const handleSearch = () => {
    if (!location || !dateRange.from || !dateRange.to) {
      return
    }

    // Track search event
    track('search_initiated', {
      location,
      checkIn: format(dateRange.from, 'yyyy-MM-dd'),
      checkOut: format(dateRange.to, 'yyyy-MM-dd'),
      guests,
      rooms,
    })

    // Navigate to search results
    const params = new URLSearchParams({
      location,
      checkIn: format(dateRange.from, 'yyyy-MM-dd'),
      checkOut: format(dateRange.to, 'yyyy-MM-dd'),
      guests: guests.toString(),
      rooms: rooms.toString(),
    })

    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-xl p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Location */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Where are you going?
            </label>
            <LocationSearch
              value={location}
              onChange={setLocation}
              placeholder="City, hotel, or destination"
            />
          </div>

          {/* Date Range */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Check-in - Check-out
            </label>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              minDate={new Date()}
              placeholder="Select dates"
            />
          </div>

          {/* Guests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guests & Rooms
            </label>
            <GuestSelector
              guests={guests}
              rooms={rooms}
              onGuestsChange={setGuests}
              onRoomsChange={setRooms}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Button
            size="lg"
            className="w-full md:w-auto px-8"
            onClick={handleSearch}
            disabled={!location || !dateRange.from || !dateRange.to}
          >
            Search Properties
          </Button>
        </div>
      </div>
    </div>
  )
}
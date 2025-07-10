'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar, MapPin, Users, Search, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { GuestSelector } from '@/components/search/GuestSelector'
import { LocationSearch } from '@/components/search/LocationSearch'
import { useAnalytics } from '@/lib/hooks/useAnalytics'
import { cn } from '@/lib/utils'

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter()
  const { track } = useAnalytics()
  const [isSearching, setIsSearching] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  
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

  // Handle click outside to close expanded state
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = async () => {
    if (!location || !dateRange.from || !dateRange.to) {
      return
    }

    setIsSearching(true)

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
    setIsSearching(false)
  }

  const isValid = location && dateRange.from && dateRange.to

  return (
    <div className={cn("w-full max-w-5xl mx-auto", className)}>
      <motion.div
        ref={searchRef}
        initial={false}
        animate={{
          scale: isFocused ? 1.01 : 1,
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          "bg-white rounded-2xl shadow-2xl transition-all duration-300 border border-white/20",
          isFocused && "ring-4 ring-blue-500/20 shadow-3xl"
        )}
      >
        <div className="p-3">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Location Input */}
            <div className="lg:col-span-4" onClick={() => setIsFocused(true)}>
              <div className="relative h-14 group">
                <div className={cn(
                  "absolute inset-0 rounded-xl transition-all duration-200 border",
                  "bg-gray-50 border-gray-200 group-hover:bg-gray-100 group-hover:border-gray-300",
                  isFocused && "border-blue-300 bg-blue-50"
                )} />
                <div className="relative h-full px-4 flex items-center">
                  <MapPin className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-600 mb-0.5">Where</div>
                    <LocationSearch
                      value={location}
                      onChange={setLocation}
                      placeholder="Search destinations"
                      className="bg-transparent border-0 p-0 h-auto focus:ring-0 text-sm text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Date Range Picker */}
            <div className="lg:col-span-4" onClick={() => setIsFocused(true)}>
              <div className="relative h-14 group">
                <div className={cn(
                  "absolute inset-0 rounded-xl transition-all duration-200 border",
                  "bg-gray-50 border-gray-200 group-hover:bg-gray-100 group-hover:border-gray-300",
                  isFocused && "border-blue-300 bg-blue-50"
                )} />
                <div className="relative h-full px-4 flex items-center">
                  <Calendar className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-600 mb-0.5">When</div>
                    <DateRangePicker
                      value={dateRange}
                      onChange={setDateRange}
                      minDate={new Date()}
                      placeholder="Add dates"
                      className="bg-transparent border-0 p-0 h-auto focus:ring-0 text-sm text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Guests Selector */}
            <div className="lg:col-span-3" onClick={() => setIsFocused(true)}>
              <div className="relative h-14 group">
                <div className={cn(
                  "absolute inset-0 rounded-xl transition-all duration-200 border",
                  "bg-gray-50 border-gray-200 group-hover:bg-gray-100 group-hover:border-gray-300",
                  isFocused && "border-blue-300 bg-blue-50"
                )} />
                <div className="relative h-full px-4 flex items-center">
                  <Users className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-600 mb-0.5">Who</div>
                    <div className="text-sm text-gray-900">
                      {guests} guest{guests !== 1 ? 's' : ''}, {rooms} room{rooms !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <GuestSelector
                    guests={guests}
                    rooms={rooms}
                    onGuestsChange={setGuests}
                    onRoomsChange={setRooms}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Search Button */}
            <div className="lg:col-span-1">
              <Button
                onClick={handleSearch}
                disabled={!isValid || isSearching}
                className={cn(
                  "w-full h-14 rounded-xl font-semibold text-base transition-all duration-300",
                  "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
                  "disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed",
                  "focus:ring-4 focus:ring-blue-500/20",
                  isValid && "shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                )}
              >
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
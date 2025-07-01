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

interface QuickSearch {
  label: string
  location: string
  icon: string
}

const quickSearches: QuickSearch[] = [
  { label: 'Weekend in Paris', location: 'Paris', icon: '🗼' },
  { label: 'Beach Escape', location: 'Maldives', icon: '🏖️' },
  { label: 'City Break NYC', location: 'New York', icon: '🗽' },
  { label: 'Tokyo Adventure', location: 'Tokyo', icon: '🏯' },
]

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

  const handleQuickSearch = (quickSearch: QuickSearch) => {
    setLocation(quickSearch.location)
    setIsFocused(true)
    track('quick_search_selected', { location: quickSearch.location })
  }

  const isValid = location && dateRange.from && dateRange.to

  return (
    <div className={cn("w-full max-w-5xl mx-auto", className)}>
      <motion.div
        ref={searchRef}
        initial={false}
        animate={{
          scale: isFocused ? 1.02 : 1,
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          "bg-white rounded-2xl shadow-2xl transition-all duration-300",
          isFocused && "ring-4 ring-blue-500/20"
        )}
      >
        <div className="p-2">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
            {/* Location Input */}
            <div className="lg:col-span-4" onClick={() => setIsFocused(true)}>
              <div className="relative h-14 group">
                <div className="absolute inset-0 bg-gray-50 rounded-xl group-hover:bg-gray-100 transition-colors" />
                <div className="relative h-full px-4 flex items-center">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <LocationSearch
                      value={location}
                      onChange={setLocation}
                      placeholder="Where are you going?"
                      className="bg-transparent border-0 p-0 h-auto focus:ring-0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Date Range Picker */}
            <div className="lg:col-span-4" onClick={() => setIsFocused(true)}>
              <div className="relative h-14 group">
                <div className="absolute inset-0 bg-gray-50 rounded-xl group-hover:bg-gray-100 transition-colors" />
                <div className="relative h-full px-4 flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                  <DateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    minDate={new Date()}
                    placeholder="Check-in - Check-out"
                    className="bg-transparent border-0 p-0 h-auto focus:ring-0"
                  />
                </div>
              </div>
            </div>

            {/* Guests Selector */}
            <div className="lg:col-span-3" onClick={() => setIsFocused(true)}>
              <div className="relative h-14 group">
                <div className="absolute inset-0 bg-gray-50 rounded-xl group-hover:bg-gray-100 transition-colors" />
                <div className="relative h-full px-4 flex items-center">
                  <Users className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                  <GuestSelector
                    guests={guests}
                    rooms={rooms}
                    onGuestsChange={setGuests}
                    onRoomsChange={setRooms}
                    className="bg-transparent border-0 p-0 h-auto focus:ring-0"
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
                  "disabled:from-gray-300 disabled:to-gray-400",
                  isValid && "shadow-lg hover:shadow-xl hover:-translate-y-0.5"
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

        {/* Quick Searches - Show when focused */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-gray-100"
            >
              <div className="p-4">
                <p className="text-sm text-gray-500 mb-3">Quick searches</p>
                <div className="flex flex-wrap gap-2">
                  {quickSearches.map((qs) => (
                    <button
                      key={qs.label}
                      onClick={() => handleQuickSearch(qs)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors"
                    >
                      <span>{qs.icon}</span>
                      <span>{qs.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Popular searches - Mobile friendly pills */}
      <div className="mt-6 flex flex-wrap justify-center gap-2 lg:hidden">
        <p className="w-full text-center text-white/80 text-sm mb-2">Popular destinations:</p>
        {['Amsterdam', 'Paris', 'London', 'New York'].map((city) => (
          <button
            key={city}
            onClick={() => {
              setLocation(city)
              setIsFocused(true)
            }}
            className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm hover:bg-white/30 transition-colors"
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  )
}
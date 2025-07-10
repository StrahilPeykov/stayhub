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
  const [activeField, setActiveField] = useState<string | null>(null)
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
        setActiveField(null)
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
    setActiveField('location')
    track('quick_search_selected', { location: quickSearch.location })
  }

  const isValid = location && dateRange.from && dateRange.to

  return (
    <div className={cn("w-full max-w-5xl mx-auto", className)}>
      <div
        ref={searchRef}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300"
      >
        <div className="p-2">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
            {/* Location Input */}
            <div className="lg:col-span-4">
              <div 
                className={cn(
                  "relative h-14 group cursor-pointer transition-all duration-200",
                  activeField === 'location' && "z-10"
                )}
                onClick={() => setActiveField('location')}
              >
                <div className={cn(
                  "absolute inset-0 rounded-xl transition-all duration-200",
                  activeField === 'location' 
                    ? "bg-white shadow-lg ring-2 ring-blue-500" 
                    : "bg-gray-50 group-hover:bg-gray-100"
                )} />
                <div className="relative h-full px-4 flex items-center">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-500 mb-0.5">Where</div>
                    <LocationSearch
                      value={location}
                      onChange={setLocation}
                      placeholder="Search destinations"
                      className="bg-transparent border-0 p-0 h-auto focus:ring-0 text-sm font-medium text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Date Range Picker */}
            <div className="lg:col-span-4">
              <div 
                className={cn(
                  "relative h-14 group cursor-pointer transition-all duration-200",
                  activeField === 'dates' && "z-10"
                )}
                onClick={() => setActiveField('dates')}
              >
                <div className={cn(
                  "absolute inset-0 rounded-xl transition-all duration-200",
                  activeField === 'dates' 
                    ? "bg-white shadow-lg ring-2 ring-blue-500" 
                    : "bg-gray-50 group-hover:bg-gray-100"
                )} />
                <div className="relative h-full px-4 flex items-center">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-500 mb-0.5">When</div>
                    <DateRangePicker
                      value={dateRange}
                      onChange={setDateRange}
                      minDate={new Date()}
                      placeholder="Add dates"
                      className="bg-transparent border-0 p-0 h-auto focus:ring-0 text-sm font-medium text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Guests Selector */}
            <div className="lg:col-span-3">
              <div 
                className={cn(
                  "relative h-14 group cursor-pointer transition-all duration-200",
                  activeField === 'guests' && "z-10"
                )}
                onClick={() => setActiveField('guests')}
              >
                <div className={cn(
                  "absolute inset-0 rounded-xl transition-all duration-200",
                  activeField === 'guests' 
                    ? "bg-white shadow-lg ring-2 ring-blue-500" 
                    : "bg-gray-50 group-hover:bg-gray-100"
                )} />
                <div className="relative h-full px-4 flex items-center">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-500 mb-0.5">Who</div>
                    <GuestSelector
                      guests={guests}
                      rooms={rooms}
                      onGuestsChange={setGuests}
                      onRoomsChange={setRooms}
                      className="bg-transparent border-0 p-0 h-auto focus:ring-0 text-sm font-medium text-gray-900"
                    />
                  </div>
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
                  isValid && "shadow-lg hover:shadow-xl hover:scale-105"
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

        {/* Quick Searches - Show when any field is focused */}
        <AnimatePresence>
          {activeField && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-gray-100 bg-gray-50"
            >
              <div className="p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Popular destinations</p>
                <div className="flex flex-wrap gap-2">
                  {quickSearches.map((qs) => (
                    <button
                      key={qs.label}
                      onClick={() => handleQuickSearch(qs)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-full text-sm font-medium text-gray-700 hover:text-blue-700 transition-all duration-200"
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
      </div>

      {/* Popular searches - Mobile friendly pills */}
      <div className="mt-6 flex flex-wrap justify-center gap-2 lg:hidden">
        <p className="w-full text-center text-white/80 text-sm mb-2">Popular destinations:</p>
        {['Amsterdam', 'Paris', 'London', 'New York'].map((city) => (
          <button
            key={city}
            onClick={() => {
              setLocation(city)
              setActiveField('location')
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
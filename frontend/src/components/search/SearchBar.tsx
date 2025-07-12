'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar, MapPin, Users, Search, Loader2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { GuestSelector } from '@/components/search/GuestSelector'
import { LocationSearch } from '@/components/search/LocationSearch'
import { propertyService, PropertySearchRequest } from '@/services/propertyService'
import { useAnalytics } from '@/lib/hooks/useAnalytics'
import { cn, debounce } from '@/lib/utils'

interface SearchBarProps {
  className?: string
  defaultValues?: Partial<PropertySearchRequest>
  onSearch?: (searchRequest: PropertySearchRequest) => void
  showQuickFilters?: boolean
  compact?: boolean
}

export function SearchBar({ 
  className,
  defaultValues,
  onSearch,
  showQuickFilters = false,
  compact = false
}: SearchBarProps) {
  const router = useRouter()
  const { track } = useAnalytics()
  const [isSearching, setIsSearching] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  
  // Search state with proper defaults
  const [searchRequest, setSearchRequest] = useState<PropertySearchRequest>({
    search: defaultValues?.search || '',
    city: defaultValues?.city || '',
    checkIn: defaultValues?.checkIn || '',
    checkOut: defaultValues?.checkOut || '',
    guests: defaultValues?.guests ?? 2, // Use nullish coalescing to provide default
    rooms: defaultValues?.rooms ?? 1,   // Use nullish coalescing to provide default
    ...defaultValues
  })

  // Date range state for the date picker
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: searchRequest.checkIn ? new Date(searchRequest.checkIn) : undefined,
    to: searchRequest.checkOut ? new Date(searchRequest.checkOut) : undefined,
  })

  // Debounced suggestion fetching
  const fetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSuggestions([])
        return
      }

      try {
        const results = await propertyService.getSearchSuggestions(query, 8)
        setSuggestions(results)
      } catch (error) {
        console.error('Failed to fetch suggestions:', error)
        setSuggestions([])
      }
    }, 300),
    []
  )

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false)
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update date range when search request changes
  useEffect(() => {
    setDateRange({
      from: searchRequest.checkIn ? new Date(searchRequest.checkIn) : undefined,
      to: searchRequest.checkOut ? new Date(searchRequest.checkOut) : undefined,
    })
  }, [searchRequest.checkIn, searchRequest.checkOut])

  // Handle location input change
  const handleLocationChange = (value: string) => {
    setSearchRequest(prev => ({ ...prev, search: value, city: value }))
    fetchSuggestions(value)
    setShowSuggestions(true)
  }

  // Handle location suggestion selection
  const handleSuggestionSelect = (suggestion: any) => {
    if (suggestion.type === 'city') {
      setSearchRequest(prev => ({ 
        ...prev, 
        search: suggestion.name,
        city: suggestion.name,
        country: suggestion.country 
      }))
    } else if (suggestion.type === 'property') {
      setSearchRequest(prev => ({ 
        ...prev, 
        search: suggestion.name 
      }))
    }
    setShowSuggestions(false)
    setIsFocused(false)
  }

  // Handle date range change
  const handleDateChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange(range)
    setSearchRequest(prev => ({
      ...prev,
      checkIn: range.from ? format(range.from, 'yyyy-MM-dd') : '',
      checkOut: range.to ? format(range.to, 'yyyy-MM-dd') : '',
    }))
  }

  // Handle guest count change
  const handleGuestChange = (guests: number, rooms: number) => {
    setSearchRequest(prev => ({ ...prev, guests, rooms }))
  }

  // Handle search execution
  const handleSearch = async () => {
    if (!searchRequest.search && !searchRequest.city) {
      return
    }

    setIsSearching(true)

    try {
      // Track search event
      track('search_initiated', {
        location: searchRequest.search || searchRequest.city,
        checkIn: searchRequest.checkIn,
        checkOut: searchRequest.checkOut,
        guests: searchRequest.guests,
        rooms: searchRequest.rooms,
        hasDateRange: !!(searchRequest.checkIn && searchRequest.checkOut),
      })

      if (onSearch) {
        // If callback provided, use it
        onSearch(searchRequest)
      } else {
        // Otherwise, navigate to search results
        const url = propertyService.buildSearchUrl(searchRequest)
        router.push(url)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Clear search
  const clearSearch = () => {
    setSearchRequest({
      search: '',
      city: '',
      checkIn: '',
      checkOut: '',
      guests: 2,
      rooms: 1,
    })
    setDateRange({ from: undefined, to: undefined })
    setSuggestions([])
  }

  const isValid = searchRequest.search || searchRequest.city
  const hasContent = searchRequest.search || searchRequest.checkIn || (searchRequest.guests ?? 0) > 2

  if (compact) {
    return (
      <div className={cn("w-full max-w-md mx-auto", className)}>
        <div className="relative">
          <div className="flex items-center bg-white rounded-lg shadow-md border">
            <div className="flex-1 px-4 py-3">
              <LocationSearch
                value={searchRequest.search || ''}
                onChange={handleLocationChange}
                placeholder="Where to?"
                className="border-0 p-0 h-auto focus:ring-0"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={!isValid || isSearching}
              size="sm"
              className="m-1"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

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
            <div className="lg:col-span-4 relative">
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
                      value={searchRequest.search || ''}
                      onChange={handleLocationChange}
                      onFocus={() => {
                        setIsFocused(true)
                        if (searchRequest.search) {
                          fetchSuggestions(searchRequest.search)
                          setShowSuggestions(true)
                        }
                      }}
                      placeholder="Search destinations"
                      className="bg-transparent border-0 p-0 h-auto focus:ring-0 text-sm text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  {searchRequest.search && (
                    <button
                      onClick={() => {
                        setSearchRequest(prev => ({ ...prev, search: '', city: '' }))
                        setSuggestions([])
                      }}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-60 overflow-y-auto"
                  >
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={`${suggestion.type}-${suggestion.name}-${index}`}
                        onClick={() => handleSuggestionSelect(suggestion)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">{suggestion.name}</div>
                            {suggestion.country && (
                              <div className="text-sm text-gray-500">{suggestion.country}</div>
                            )}
                          </div>
                          <span className="ml-auto text-xs text-gray-400 capitalize">
                            {suggestion.type}
                          </span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
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
                      onChange={handleDateChange}
                      minDate={new Date()}
                      placeholder="Add dates"
                      className="bg-transparent border-0 p-0 h-auto focus:ring-0 text-sm text-gray-900"
                    />
                  </div>
                  {(dateRange.from || dateRange.to) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDateChange({ from: undefined, to: undefined })
                      }}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
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
                      {searchRequest.guests ?? 2} guest{(searchRequest.guests ?? 2) !== 1 ? 's' : ''}, {searchRequest.rooms ?? 1} room{(searchRequest.rooms ?? 1) !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <GuestSelector
                    guests={searchRequest.guests ?? 2}
                    rooms={searchRequest.rooms ?? 1}
                    onGuestsChange={(guests) => handleGuestChange(guests, searchRequest.rooms ?? 1)}
                    onRoomsChange={(rooms) => handleGuestChange(searchRequest.guests ?? 2, rooms)}
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

          {/* Quick Actions */}
          {hasContent && (
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Quick clear:</span>
                <button
                  onClick={clearSearch}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all
                </button>
              </div>
              
              {showQuickFilters && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Quick filters:</span>
                  <button
                    onClick={() => setSearchRequest(prev => ({ ...prev, featured: true }))}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md font-medium"
                  >
                    Featured
                  </button>
                  <button
                    onClick={() => setSearchRequest(prev => ({ ...prev, instantBooking: true }))}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md font-medium"
                  >
                    Instant Book
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

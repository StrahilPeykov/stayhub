'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Search, TrendingUp, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, debounce } from '@/lib/utils'

interface LocationSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

interface LocationSuggestion {
  id: string
  name: string
  type: 'city' | 'property' | 'region' | 'country'
  country?: string
  state?: string
  description?: string
  popularity?: number
}

const popularDestinations: LocationSuggestion[] = [
  { id: 'pop-1', name: 'Paris', type: 'city', country: 'France', popularity: 95 },
  { id: 'pop-2', name: 'New York', type: 'city', country: 'United States', state: 'NY', popularity: 92 },
  { id: 'pop-3', name: 'Tokyo', type: 'city', country: 'Japan', popularity: 88 },
  { id: 'pop-4', name: 'London', type: 'city', country: 'United Kingdom', popularity: 90 },
  { id: 'pop-5', name: 'Barcelona', type: 'city', country: 'Spain', popularity: 85 },
]

const recentSearches: LocationSuggestion[] = [
  { id: 'recent-1', name: 'Amsterdam', type: 'city', country: 'Netherlands' },
  { id: 'recent-2', name: 'Dubai', type: 'city', country: 'UAE' },
]

export function LocationSearch({ value, onChange, placeholder = "Where to?", className }: LocationSearchProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Mock search function
  const searchLocations = async (searchTerm: string): Promise<LocationSuggestion[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const allLocations: LocationSuggestion[] = [
      { id: '1', name: 'Amsterdam', type: 'city', country: 'Netherlands' },
      { id: '2', name: 'Amsterdam Beach', type: 'region', country: 'Netherlands' },
      { id: '3', name: 'Paris', type: 'city', country: 'France' },
      { id: '4', name: 'Paris Las Vegas Hotel', type: 'property', country: 'United States', state: 'NV' },
      { id: '5', name: 'London', type: 'city', country: 'United Kingdom' },
      { id: '6', name: 'New York', type: 'city', country: 'United States', state: 'NY' },
      { id: '7', name: 'Tokyo', type: 'city', country: 'Japan' },
      { id: '8', name: 'Barcelona', type: 'city', country: 'Spain' },
      { id: '9', name: 'Dubai', type: 'city', country: 'UAE' },
      { id: '10', name: 'Singapore', type: 'city', country: 'Singapore' },
    ]
    
    return allLocations.filter(location =>
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.country?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const debouncedSearch = debounce(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const results = await searchLocations(searchTerm)
      setSuggestions(results)
    } catch (error) {
      console.error('Search error:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, 300)

  useEffect(() => {
    if (value) {
      debouncedSearch(value)
    } else {
      setSuggestions([])
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setIsOpen(true)
    setActiveIndex(-1)
  }

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    onChange(suggestion.name)
    setIsOpen(false)
    setActiveIndex(-1)
    
    // Save to recent searches (in real app, this would be persisted)
    if (typeof window !== 'undefined') {
      const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]')
      const updated = [suggestion, ...recent.filter((r: any) => r.id !== suggestion.id)].slice(0, 5)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(prev => {
          const total = suggestions.length + (value ? 0 : popularDestinations.length + recentSearches.length)
          return prev < total - 1 ? prev + 1 : prev
        })
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0) {
          const allItems = value ? suggestions : [...recentSearches, ...popularDestinations]
          if (allItems[activeIndex]) {
            handleSuggestionClick(allItems[activeIndex])
          }
        }
        break
      case 'Escape':
        setIsOpen(false)
        setActiveIndex(-1)
        break
    }
  }

  const renderSuggestion = (suggestion: LocationSuggestion, index: number) => {
    const isActive = index === activeIndex
    
    return (
      <motion.button
        key={suggestion.id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: index * 0.02 }}
        onClick={() => handleSuggestionClick(suggestion)}
        className={cn(
          "w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors",
          isActive && "bg-gray-50"
        )}
      >
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
          suggestion.type === 'city' && "bg-blue-100 text-blue-600",
          suggestion.type === 'property' && "bg-purple-100 text-purple-600",
          suggestion.type === 'region' && "bg-green-100 text-green-600",
          suggestion.type === 'country' && "bg-orange-100 text-orange-600"
        )}>
          <MapPin className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900">{suggestion.name}</div>
          <div className="text-sm text-gray-500 truncate">
            {suggestion.state && `${suggestion.state}, `}
            {suggestion.country}
            {suggestion.type === 'property' && ' • Hotel'}
          </div>
        </div>
        {suggestion.popularity && (
          <div className="flex items-center text-xs text-gray-500">
            <TrendingUp className="w-3 h-3 mr-1" />
            {suggestion.popularity}%
          </div>
        )}
      </motion.button>
    )
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full pl-10 pr-4 py-3 bg-transparent outline-none",
            "placeholder:text-gray-500 text-gray-900",
            className
          )}
        />
        <MapPin className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-96 overflow-y-auto"
          >
            {/* Show search results */}
            {value && suggestions.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Search Results
                </div>
                {suggestions.map((suggestion, index) => renderSuggestion(suggestion, index))}
              </div>
            )}

            {/* Show recent searches when input is empty */}
            {!value && recentSearches.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Recent Searches
                </div>
                {recentSearches.map((suggestion, index) => renderSuggestion(suggestion, index))}
              </div>
            )}

            {/* Show popular destinations when input is empty */}
            {!value && (
              <div>
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Popular Destinations
                </div>
                {popularDestinations.map((suggestion, index) => 
                  renderSuggestion(suggestion, recentSearches.length + index)
                )}
              </div>
            )}

            {/* No results */}
            {value && suggestions.length === 0 && !isLoading && (
              <div className="px-4 py-8 text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No destinations found</p>
                <p className="text-sm text-gray-400 mt-1">Try searching for a city or country</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
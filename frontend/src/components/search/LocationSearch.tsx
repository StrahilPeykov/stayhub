'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { propertyService } from '@/services/propertyService'

interface LocationSearchProps {
  value: string
  onChange: (value: string) => void
  onLocationSelect?: (location: any) => void
  onFocus?: () => void
  onBlur?: () => void
  placeholder?: string
  className?: string
  showSuggestions?: boolean
  disabled?: boolean
}

export function LocationSearch({
  value,
  onChange,
  onLocationSelect,
  onFocus,
  onBlur,
  placeholder = "Where to?",
  className,
  showSuggestions = true,
  disabled = false
}: LocationSearchProps) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const recent = localStorage.getItem('stayhub_recent_searches')
      if (recent) {
        try {
          setRecentSearches(JSON.parse(recent).slice(0, 5))
        } catch (error) {
          console.error('Failed to parse recent searches:', error)
        }
      }
    }
  }, [])

  // Save recent search
  const saveRecentSearch = (search: string) => {
    if (typeof window === 'undefined' || !search.trim()) return
    
    const recent = [...recentSearches.filter(s => s !== search), search].slice(0, 5)
    setRecentSearches(recent)
    localStorage.setItem('stayhub_recent_searches', JSON.stringify(recent))
  }

  // Fetch suggestions
  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const results = await propertyService.getSearchSuggestions(query, 8)
      setSuggestions(results)
    } catch (error) {
      console.error('Failed to fetch location suggestions:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    if (showSuggestions) {
      fetchSuggestions(newValue)
      setShowDropdown(true)
    }
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: any) => {
    const selectedValue = suggestion.name
    onChange(selectedValue)
    saveRecentSearch(selectedValue)
    
    if (onLocationSelect) {
      onLocationSelect(suggestion)
    }
    
    setShowDropdown(false)
    inputRef.current?.blur()
  }

  // Handle recent search selection
  const handleRecentSearchSelect = (search: string) => {
    onChange(search)
    if (onLocationSelect) {
      onLocationSelect({ name: search, type: 'recent' })
    }
    setShowDropdown(false)
    inputRef.current?.blur()
  }

  // Handle focus
  const handleFocus = () => {
    if (onFocus) onFocus()
    
    if (showSuggestions) {
      if (value.length >= 2) {
        fetchSuggestions(value)
      }
      setShowDropdown(true)
    }
  }

  // Handle blur
  const handleBlur = (e: React.FocusEvent) => {
    // Don't close dropdown if clicking on a suggestion
    if (dropdownRef.current?.contains(e.relatedTarget as Node)) {
      return
    }
    
    if (onBlur) onBlur()
    setTimeout(() => setShowDropdown(false), 150)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowDropdown(false)
      inputRef.current?.blur()
    }
  }

  // Popular destinations (fallback when no suggestions)
  const popularDestinations = [
    { name: 'Amsterdam', country: 'Netherlands', type: 'city' },
    { name: 'Paris', country: 'France', type: 'city' },
    { name: 'London', country: 'United Kingdom', type: 'city' },
    { name: 'New York', country: 'United States', type: 'city' },
    { name: 'Tokyo', country: 'Japan', type: 'city' },
    { name: 'Barcelona', country: 'Spain', type: 'city' },
  ]

  const showingPopular = !value && suggestions.length === 0 && !isLoading
  const showingRecent = !value && recentSearches.length > 0 && !isLoading
  const showingSuggestions = value.length >= 2 && suggestions.length > 0

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        autoComplete="off"
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-80 overflow-y-auto"
        >
          {/* Loading State */}
          {isLoading && (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          )}

          {/* Recent Searches */}
          {showingRecent && (
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Recent Searches
              </p>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchSelect(search)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded-md flex items-center gap-3"
                >
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{search}</span>
                </button>
              ))}
              {(showingPopular || suggestions.length > 0) && (
                <hr className="my-2 border-gray-100" />
              )}
            </div>
          )}

          {/* Search Suggestions */}
          {showingSuggestions && (
            <div className="p-2">
              {!showingRecent && (
                <p className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Suggestions
                </p>
              )}
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.name}-${index}`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {suggestion.name}
                      </div>
                      {suggestion.country && (
                        <div className="text-sm text-gray-500 truncate">
                          {suggestion.country}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 capitalize flex-shrink-0">
                      {suggestion.type}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Popular Destinations */}
          {showingPopular && (
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Popular Destinations
              </p>
              {popularDestinations.map((destination, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionSelect(destination)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {destination.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {destination.country}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {value.length >= 2 && !isLoading && suggestions.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm">No locations found for "{value}"</p>
              <p className="text-xs text-gray-400 mt-1">
                Try searching for a city, country, or landmark
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

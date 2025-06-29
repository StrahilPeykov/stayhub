'use client'

import { useState, useEffect } from 'react'
import { MapPin, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { debounce } from '@/lib/utils'

interface LocationSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

interface LocationSuggestion {
  id: string
  name: string
  type: 'city' | 'property' | 'region'
  country?: string
  state?: string
}

export function LocationSearch({ value, onChange, placeholder = "Where to?" }: LocationSearchProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Mock suggestions for demo
  const mockSuggestions: LocationSuggestion[] = [
    { id: '1', name: 'Amsterdam', type: 'city', country: 'Netherlands' },
    { id: '2', name: 'Paris', type: 'city', country: 'France' },
    { id: '3', name: 'London', type: 'city', country: 'United Kingdom' },
    { id: '4', name: 'New York', type: 'city', country: 'United States', state: 'NY' },
    { id: '5', name: 'Tokyo', type: 'city', country: 'Japan' },
    { id: '6', name: 'Barcelona', type: 'city', country: 'Spain' },
  ]

  const debouncedSearch = debounce(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const filtered = mockSuggestions.filter(suggestion =>
      suggestion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      suggestion.country?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    setSuggestions(filtered)
    setIsLoading(false)
  }, 300)

  useEffect(() => {
    debouncedSearch(value)
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setIsOpen(true)
  }

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    onChange(suggestion.name)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={placeholder}
          className="pl-10 pr-4"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && (value.length > 0 || suggestions.length > 0) && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
              >
                <MapPin className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="font-medium">{suggestion.name}</div>
                  {suggestion.country && (
                    <div className="text-sm text-gray-500">
                      {suggestion.state ? `${suggestion.state}, ` : ''}{suggestion.country}
                    </div>
                  )}
                </div>
              </button>
            ))
          ) : value.length > 0 ? (
            <div className="px-4 py-2 text-gray-500 text-sm">
              No suggestions found
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
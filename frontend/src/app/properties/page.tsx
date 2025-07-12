'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Map, List, Filter, Search, Star, Loader2, X } from 'lucide-react'
import { propertyService, PropertySearchRequest, PropertySearchResponse } from '@/services/propertyService'
import { PropertyCard } from '@/components/property/PropertyCard'
import { SearchBar } from '@/components/search/SearchBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnalytics } from '@/lib/hooks/useAnalytics'
import { cn, debounce } from '@/lib/utils'

const sortOptions = [
  { id: 'name', label: 'Name (A-Z)' },
  { id: 'price', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
  { id: 'rating', label: 'Guest Rating' },
  { id: 'distance', label: 'Distance' },
  { id: 'popularity', label: 'Popularity' },
]

function PropertiesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { track } = useAnalytics()
  
  // UI State
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  
  // Parse initial search parameters from URL
  const [searchRequest, setSearchRequest] = useState<PropertySearchRequest>(() => {
    const parsed = propertyService.parseSearchParams(searchParams)
    return {
      page: 0,
      size: 20,
      sortBy: 'name',
      sortDirection: 'asc',
      ...parsed
    }
  })

  // Facets for filter options
  const { data: facets } = useQuery({
    queryKey: ['property-facets'],
    queryFn: () => propertyService.getPropertyFacets(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Main search query
  const { 
    data: searchResponse, 
    isLoading, 
    error,
    refetch
  } = useQuery<PropertySearchResponse>({
    queryKey: ['property-search', searchRequest],
    queryFn: () => propertyService.searchProperties(searchRequest),
    placeholderData: (previousData) => previousData,
  })

  // Update URL when search request changes
  useEffect(() => {
    const url = propertyService.buildSearchUrl(searchRequest)
    router.push(url, { scroll: false })
  }, [searchRequest, router])

  // Track search events
  useEffect(() => {
    if (searchResponse) {
      track('property_search', {
        query: searchRequest.search,
        filters: searchRequest,
        results_count: searchResponse.metadata.resultsCount,
        search_time_ms: searchResponse.metadata.searchTimeMs,
      })
    }
  }, [searchResponse, searchRequest, track])

  // Debounced search update function
  const updateSearch = useCallback(
    debounce((updates: Partial<PropertySearchRequest>) => {
      setSearchRequest(prev => ({
        ...prev,
        ...updates,
        page: 0, // Reset to first page when filters change
      }))
    }, 300),
    []
  )

  // Filter handlers
  const handleSearchChange = (search: string) => {
    updateSearch({ search })
  }

  const handlePriceRangeChange = (range: number[]) => {
    updateSearch({ 
      minPrice: range[0] > 0 ? range[0] : undefined,
      maxPrice: range[1] < 1000 ? range[1] : undefined
    })
  }

  const handleAmenityToggle = (amenity: string) => {
    const currentAmenities = searchRequest.amenities || []
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity]
    
    updateSearch({ amenities: newAmenities.length > 0 ? newAmenities : undefined })
  }

  const handlePropertyTypeToggle = (type: string) => {
    const currentTypes = searchRequest.propertyTypes || []
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type]
    
    updateSearch({ propertyTypes: newTypes.length > 0 ? newTypes : undefined })
  }

  const handleRatingChange = (rating: number | null) => {
    updateSearch({ minRating: rating || undefined })
  }

  const handleSortChange = (sortBy: string) => {
    const [field, direction] = sortBy.includes('_desc') 
      ? [sortBy.replace('_desc', ''), 'desc']
      : [sortBy, 'asc']
    
    updateSearch({ sortBy: field, sortDirection: direction })
  }

  const handlePageChange = (page: number) => {
    setSearchRequest(prev => ({ ...prev, page }))
  }

  const clearAllFilters = () => {
    setSearchRequest({
      page: 0,
      size: 20,
      sortBy: 'name',
      sortDirection: 'asc',
    })
  }

  // Count active filters
  const activeFiltersCount = Object.entries(searchRequest).filter(([key, value]) => {
    if (['page', 'size', 'sortBy', 'sortDirection'].includes(key)) return false
    return value !== undefined && value !== null && value !== ''
  }).length

  const properties = searchResponse?.properties || []
  const pagination = searchResponse?.pagination
  const metadata = searchResponse?.metadata

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white py-20">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-bold mb-6"
            >
              Discover Amazing
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                Properties
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-blue-100 mb-8"
            >
              From luxury hotels to cozy apartments, find your perfect stay
            </motion.p>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <SearchBar />
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {metadata?.query ? `Search Results for "${metadata.query}"` : 'All Properties'}
            </h2>
            <div className="flex items-center gap-4 text-gray-600">
              <span>{metadata?.resultsCount || 0} properties found</span>
              {metadata?.searchTimeMs && (
                <span className="text-sm">({metadata.searchTimeMs}ms)</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-all",
                  viewMode === 'list' ? "bg-white shadow-sm text-gray-900" : "text-gray-600"
                )}
              >
                <List className="w-4 h-4" />
                List
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={cn(
                  "px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-all",
                  viewMode === 'map' ? "bg-white shadow-sm text-gray-900" : "text-gray-600"
                )}
              >
                <Map className="w-4 h-4" />
                Map
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={`${searchRequest.sortBy}${searchRequest.sortDirection === 'desc' ? '_desc' : ''}`}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Filters Button */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Active Filters</h3>
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 hover:underline"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(metadata?.appliedFilters || {}).map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {key}: {Array.isArray(value) ? value.join(', ') : value.toString()}
                  <button
                    onClick={() => updateSearch({ [key]: undefined })}
                    className="hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-80 flex-shrink-0"
            >
              <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Filters</h3>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Properties
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Property name or city..."
                        value={searchRequest.search || ''}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Price Range (per night)
                    </label>
                    <div className="px-2">
                      <Slider
                        value={[searchRequest.minPrice || 0, searchRequest.maxPrice || 1000]}
                        onValueChange={handlePriceRangeChange}
                        min={0}
                        max={1000}
                        step={10}
                        className="mb-4"
                      />
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>${searchRequest.minPrice || 0}</span>
                        <span>${searchRequest.maxPrice || 1000}+</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Minimum Rating
                    </label>
                    <div className="space-y-2">
                      {[5, 4, 3].map((rating) => (
                        <label
                          key={rating}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="rating"
                            checked={searchRequest.minRating === rating}
                            onChange={() => handleRatingChange(
                              searchRequest.minRating === rating ? null : rating
                            )}
                            className="w-4 h-4 text-blue-600"
                          />
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "w-4 h-4",
                                  i < rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-gray-200 text-gray-200"
                                )}
                              />
                            ))}
                            <span className="text-sm text-gray-600 ml-1">& up</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Property Type */}
                  {facets?.propertyTypes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Property Type
                      </label>
                      <div className="space-y-2">
                        {facets.propertyTypes.map((type) => (
                          <label
                            key={type}
                            className="flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={searchRequest.propertyTypes?.includes(type) || false}
                                onCheckedChange={() => handlePropertyTypeToggle(type)}
                              />
                              <span className="text-sm capitalize">{type}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Amenities */}
                  {facets?.amenities && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Amenities
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {facets.amenities.map((amenity) => (
                          <label
                            key={amenity}
                            className="flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={searchRequest.amenities?.includes(amenity) || false}
                                onCheckedChange={() => handleAmenityToggle(amenity)}
                              />
                              <span className="text-sm">{amenity}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.aside>
          )}

          {/* Properties Grid */}
          <div className="flex-1">
            {error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">Error loading properties. Please try again.</p>
                <Button onClick={() => refetch()}>Retry</Button>
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <PropertyCardSkeleton key={i} />
                ))}
              </div>
            ) : viewMode === 'map' ? (
              <div className="bg-white rounded-lg shadow-sm border h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <Map className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">Map view coming soon</p>
                  <p className="text-gray-400 text-sm">Switch to list view to browse properties</p>
                </div>
              </div>
            ) : properties.length > 0 ? (
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {properties.map((property, index) => (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                    >
                      <PropertyCard property={property} />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevious}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                        const pageNum = pagination.currentPage - 2 + i
                        if (pageNum < 0 || pageNum >= pagination.totalPages) return null
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === pagination.currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum + 1}
                          </Button>
                        )
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNext}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No properties found
                </h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your filters or search criteria
                </p>
                {metadata?.suggestions && metadata.suggestions.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">Suggestions:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {metadata.suggestions.map((suggestion, i) => (
                        <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                          {suggestion}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <Button onClick={clearAllFilters} variant="outline">
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <PropertiesContent />
    </Suspense>
  )
}

function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
      <Skeleton className="h-64 w-full" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-6 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  )
}

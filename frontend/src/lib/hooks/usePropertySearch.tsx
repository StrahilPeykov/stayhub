'use client'

import { useState, useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { propertyService, PropertySearchRequest, PropertySearchResponse } from '@/services/propertyService'
import { useAnalytics } from '@/lib/hooks/useAnalytics'
import { debounce } from '@/lib/utils'

interface UsePropertySearchOptions {
  initialRequest?: Partial<PropertySearchRequest>
  enableUrlSync?: boolean
  enableAnalytics?: boolean
  debounceMs?: number
  autoSearch?: boolean
}

export function usePropertySearch(options: UsePropertySearchOptions = {}) {
  const {
    initialRequest = {},
    enableUrlSync = true,
    enableAnalytics = true,
    debounceMs = 300,
    autoSearch = true
  } = options

  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { track } = useAnalytics()

  // Parse initial search request from URL or options
  const [searchRequest, setSearchRequest] = useState<PropertySearchRequest>(() => {
    const urlParams = enableUrlSync ? propertyService.parseSearchParams(searchParams) : {}
    return {
      page: 0,
      size: 20,
      sortBy: 'name',
      sortDirection: 'asc',
      ...initialRequest,
      ...urlParams
    }
  })

  // Search query with proper type assertion for response
  const {
    data: searchResponse,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['property-search', searchRequest],
    queryFn: () => propertyService.searchProperties(searchRequest),
    enabled: autoSearch && isValidSearchRequest(searchRequest),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000, // 30 seconds
  })

  // Debounced search update
  const debouncedUpdateSearch = useCallback(
    debounce((updates: Partial<PropertySearchRequest>) => {
      setSearchRequest(prev => {
        const newRequest = {
          ...prev,
          ...updates,
          page: updates.page !== undefined ? updates.page : 0, // Reset page unless explicitly set
        }

        // Update URL if enabled
        if (enableUrlSync) {
          const url = propertyService.buildSearchUrl(newRequest)
          router.push(url, { scroll: false })
        }

        // Track search if enabled
        if (enableAnalytics && updates.search !== prev.search) {
          track('property_search_updated', {
            query: updates.search,
            filters: updates,
          })
        }

        return newRequest
      })
    }, debounceMs),
    [router, track, enableUrlSync, enableAnalytics, debounceMs]
  )

  // Immediate search update (for pagination, sorting, etc.)
  const updateSearch = useCallback((updates: Partial<PropertySearchRequest>) => {
    setSearchRequest(prev => {
      const newRequest = { ...prev, ...updates }

      // Update URL if enabled
      if (enableUrlSync) {
        const url = propertyService.buildSearchUrl(newRequest)
        router.push(url, { scroll: false })
      }

      return newRequest
    })
  }, [router, enableUrlSync])

  // Search actions
  const executeSearch = useCallback(async () => {
    if (enableAnalytics) {
      track('property_search_executed', {
        query: searchRequest.search,
        filters: searchRequest,
      })
    }
    return refetch()
  }, [refetch, searchRequest, track, enableAnalytics])

  const clearSearch = useCallback(() => {
    const clearedRequest: PropertySearchRequest = {
      page: 0,
      size: 20,
      sortBy: 'name',
      sortDirection: 'asc',
    }
    setSearchRequest(clearedRequest)

    if (enableUrlSync) {
      router.push('/properties')
    }
  }, [router, enableUrlSync])

  const resetFilters = useCallback(() => {
    updateSearch({
      // Keep search text and location
      search: searchRequest.search,
      city: searchRequest.city,
      checkIn: searchRequest.checkIn,
      checkOut: searchRequest.checkOut,
      guests: searchRequest.guests,
      rooms: searchRequest.rooms,
      // Clear all other filters
      minPrice: undefined,
      maxPrice: undefined,
      minRooms: undefined,
      amenities: undefined,
      propertyTypes: undefined,
      minRating: undefined,
      featured: undefined,
      instantBooking: undefined,
      page: 0,
    })
  }, [searchRequest, updateSearch])

  // Prefetch next page
  const prefetchNextPage = useCallback(() => {
    if (searchResponse?.pagination?.hasNext) {
      const nextPageRequest = { ...searchRequest, page: (searchRequest.page ?? 0) + 1 }
      queryClient.prefetchQuery({
        queryKey: ['property-search', nextPageRequest],
        queryFn: () => propertyService.searchProperties(nextPageRequest),
        staleTime: 30 * 1000,
      })
    }
  }, [queryClient, searchRequest, searchResponse?.pagination])

  // Auto-prefetch next page when near end of current results
  useEffect(() => {
    if (searchResponse?.properties && searchResponse.pagination?.hasNext) {
      // Prefetch when user has seen 80% of current results
      const prefetchThreshold = Math.floor(searchResponse.properties.length * 0.8)
      // This would typically be triggered by scroll position or pagination interaction
      // For now, we'll prefetch immediately if there's a next page
      prefetchNextPage()
    }
  }, [searchResponse, prefetchNextPage])

  // Analytics tracking
  useEffect(() => {
    if (enableAnalytics && searchResponse) {
      track('property_search_results', {
        query: searchRequest.search,
        results_count: searchResponse.metadata.resultsCount,
        search_time_ms: searchResponse.metadata.searchTimeMs,
        filters: searchRequest,
        has_results: searchResponse.properties.length > 0,
      })
    }
  }, [searchResponse, searchRequest, track, enableAnalytics])

  return {
    // State
    searchRequest,
    searchResponse,
    isLoading,
    isFetching,
    error,

    // Computed values
    properties: searchResponse?.properties || [],
    pagination: searchResponse?.pagination,
    metadata: searchResponse?.metadata,
    facets: searchResponse?.facets,
    hasResults: (searchResponse?.properties?.length || 0) > 0,
    activeFiltersCount: countActiveFilters(searchRequest),

    // Actions
    updateSearch: debouncedUpdateSearch,
    updateSearchImmediate: updateSearch,
    executeSearch,
    clearSearch,
    resetFilters,
    refetch,
    prefetchNextPage,

    // Helper functions
    isValidSearchRequest: () => isValidSearchRequest(searchRequest),
    buildSearchUrl: () => propertyService.buildSearchUrl(searchRequest),
  }
}

// Helper functions
function isValidSearchRequest(request: PropertySearchRequest): boolean {
  return !!(
    request.search ||
    request.city ||
    request.checkIn ||
    request.featured ||
    request.minPrice ||
    request.maxPrice ||
    request.amenities?.length ||
    request.propertyTypes?.length
  )
}

function countActiveFilters(request: PropertySearchRequest): number {
  let count = 0
  
  if (request.search) count++
  if (request.city && request.city !== request.search) count++
  if (request.checkIn && request.checkOut) count++
  if (request.minPrice !== undefined) count++
  if (request.maxPrice !== undefined) count++
  if (request.minRooms !== undefined) count++
  if (request.amenities?.length) count++
  if (request.propertyTypes?.length) count++
  if (request.minRating !== undefined) count++
  if (request.featured) count++
  if (request.instantBooking) count++
  
  return count
}

// Hook for property facets
export function usePropertyFacets() {
  return useQuery({
    queryKey: ['property-facets'],
    queryFn: () => propertyService.getPropertyFacets(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook for search suggestions
export function useSearchSuggestions(query: string, enabled = true) {
  return useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: () => propertyService.getSearchSuggestions(query),
    enabled: enabled && query.length >= 2,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for popular searches
export function usePopularSearches() {
  return useQuery({
    queryKey: ['popular-searches'],
    queryFn: () => propertyService.getPopularSearches(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

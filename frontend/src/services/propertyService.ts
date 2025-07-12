import { propertyApi, searchApi, handleApiResponse } from '@/lib/api/client';
import { Property, PaginatedResponse } from '@/lib/types';

// Enhanced search request interface
export interface PropertySearchRequest {
  // Text search
  search?: string;
  
  // Location filters
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
  
  // Price filters
  minPrice?: number;
  maxPrice?: number;
  
  // Property characteristics
  minRooms?: number;
  amenities?: string[];
  propertyTypes?: string[];
  minRating?: number;
  featured?: boolean;
  instantBooking?: boolean;
  
  // Date availability
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
  
  // Pagination and sorting
  page?: number;
  size?: number;
  sortBy?: string; // name, price, rating, distance, popularity
  sortDirection?: string; // asc, desc
  
  // Filters for amenities matching
  amenityMatchType?: 'ANY' | 'ALL';
}

export interface PropertySearchResponse {
  properties: Property[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
    isFirst: boolean;
    isLast: boolean;
  };
  metadata: {
    query?: string;
    searchTimeMs: number;
    resultsCount: number;
    sortBy?: string;
    sortDirection?: string;
    appliedFilters: Record<string, any>;
    suggestions?: string[];
  };
  facets?: Record<string, any>;
}

export interface PropertyFacets {
  cities: string[];
  countries: string[];
  amenities: string[];
  propertyTypes: string[];
  priceRanges: Record<string, number>;
  [key: string]: any;
}

export interface PropertySuggestion {
  id: string;
  name: string;
  type: 'property' | 'city' | 'country';
  country?: string;
}

// Response type from search service
interface SearchSuggestionsResponse {
  suggestions: PropertySuggestion[];
}

export const propertyService = {
  /**
   * Advanced property search with comprehensive filtering
   */
  async searchProperties(request: PropertySearchRequest): Promise<PropertySearchResponse> {
    return handleApiResponse(
      propertyApi.post('/api/properties/search', request)
    );
  },

  /**
   * Simple property search using GET parameters (for URL-based searches)
   */
  async searchPropertiesSimple(params: Record<string, any>): Promise<PropertySearchResponse> {
    return handleApiResponse(
      propertyApi.get('/api/properties/search', { params })
    );
  },

  /**
   * Get properties (legacy method for backward compatibility)
   */
  async getProperties(params?: {
    city?: string;
    lat?: number;
    lon?: number;
    radius?: number;
    page?: number;
    size?: number;
  }): Promise<Property[]> {
    return handleApiResponse(
      propertyApi.get('/api/properties', { params })
    );
  },

  /**
   * Get property by ID
   */
  async getPropertyById(id: string): Promise<Property> {
    return handleApiResponse(
      propertyApi.get(`/api/properties/${id}`)
    );
  },

  /**
   * Get featured properties
   */
  async getFeaturedProperties(page: number = 0, size: number = 6): Promise<PropertySearchResponse> {
    return handleApiResponse(
      propertyApi.get('/api/properties/featured', { params: { page, size } })
    );
  },

  /**
   * Get popular properties
   */
  async getPopularProperties(page: number = 0, size: number = 10): Promise<PropertySearchResponse> {
    return handleApiResponse(
      propertyApi.get('/api/properties/popular', { params: { page, size } })
    );
  },

  /**
   * Get property suggestions for autocomplete
   */
  async getPropertySuggestions(query: string): Promise<string[]> {
    return handleApiResponse(
      propertyApi.get('/api/properties/suggestions', { params: { query } })
    );
  },

  /**
   * Get property facets for filter UI
   */
  async getPropertyFacets(): Promise<PropertyFacets> {
    return handleApiResponse(
      propertyApi.get('/api/properties/facets')
    );
  },

  /**
   * Search using the dedicated search service
   */
  async searchWithSearchService(params: PropertySearchRequest): Promise<any> {
    return handleApiResponse(
      searchApi.post('/api/search/properties', params)
    );
  },

  /**
   * Get search suggestions from search service
   */
  async getSearchSuggestions(query: string, limit: number = 10): Promise<PropertySuggestion[]> {
    const response = await handleApiResponse(
      searchApi.get('/api/search/suggestions', { params: { query, limit } })
    ) as SearchSuggestionsResponse;
    return response.suggestions || [];
  },

  /**
   * Get popular search terms
   */
  async getPopularSearches(): Promise<any> {
    return handleApiResponse(
      searchApi.get('/api/search/popular')
    );
  },

  /**
   * Get search filters and facets from search service
   */
  async getSearchFilters(): Promise<any> {
    return handleApiResponse(
      searchApi.get('/api/search/filters')
    );
  },

  /**
   * Get nearby properties using geographic search
   */
  async getNearbyProperties(
    lat: number,
    lon: number,
    radius: number = 10,
    page: number = 0,
    size: number = 20
  ): Promise<PropertySearchResponse> {
    const request: PropertySearchRequest = {
      latitude: lat,
      longitude: lon,
      radius,
      page,
      size,
      sortBy: 'distance'
    };
    return this.searchProperties(request);
  },

  /**
   * Search properties by city
   */
  async getPropertiesByCity(
    city: string,
    page: number = 0,
    size: number = 20
  ): Promise<PropertySearchResponse> {
    const request: PropertySearchRequest = {
      city,
      page,
      size,
      sortBy: 'name'
    };
    return this.searchProperties(request);
  },

  /**
   * Search properties with availability check
   */
  async searchAvailableProperties(
    checkIn: string,
    checkOut: string,
    guests: number,
    rooms: number = 1,
    additionalFilters?: Partial<PropertySearchRequest>
  ): Promise<PropertySearchResponse> {
    const request: PropertySearchRequest = {
      checkIn,
      checkOut,
      guests,
      rooms,
      ...additionalFilters
    };
    return this.searchProperties(request);
  },

  /**
   * Filter properties by amenities
   */
  async filterByAmenities(
    amenities: string[],
    matchType: 'ANY' | 'ALL' = 'ANY',
    page: number = 0,
    size: number = 20
  ): Promise<PropertySearchResponse> {
    const request: PropertySearchRequest = {
      amenities,
      amenityMatchType: matchType,
      page,
      size
    };
    return this.searchProperties(request);
  },

  /**
   * Filter properties by price range
   */
  async filterByPriceRange(
    minPrice: number,
    maxPrice: number,
    page: number = 0,
    size: number = 20
  ): Promise<PropertySearchResponse> {
    const request: PropertySearchRequest = {
      minPrice,
      maxPrice,
      page,
      size,
      sortBy: 'price'
    };
    return this.searchProperties(request);
  },

  /**
   * Filter properties by rating
   */
  async filterByRating(
    minRating: number,
    page: number = 0,
    size: number = 20
  ): Promise<PropertySearchResponse> {
    const request: PropertySearchRequest = {
      minRating,
      page,
      size,
      sortBy: 'rating',
      sortDirection: 'desc'
    };
    return this.searchProperties(request);
  },

  /**
   * Full-text search in property names and descriptions
   */
  async fullTextSearch(
    query: string,
    page: number = 0,
    size: number = 20
  ): Promise<PropertySearchResponse> {
    const request: PropertySearchRequest = {
      search: query,
      page,
      size,
      sortBy: 'relevance'
    };
    return this.searchProperties(request);
  },

  /**
   * Get property reviews (if endpoint exists)
   */
  async getPropertyReviews(propertyId: string, page: number = 1, size: number = 10) {
    return handleApiResponse(
      propertyApi.get(`/api/properties/${propertyId}/reviews`, {
        params: { page, size }
      })
    );
  },

  /**
   * Build a search URL for sharing/bookmarking
   */
  buildSearchUrl(request: PropertySearchRequest): string {
    const params = new URLSearchParams();
    
    Object.entries(request).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => params.append(key, item.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });
    
    return `/properties?${params.toString()}`;
  },

  /**
   * Parse search parameters from URL
   */
  parseSearchParams(searchParams: URLSearchParams): PropertySearchRequest {
    const request: PropertySearchRequest = {};
    
    // Simple string parameters
    const stringParams = ['search', 'city', 'country', 'checkIn', 'checkOut', 'sortBy', 'sortDirection', 'amenityMatchType'];
    stringParams.forEach(param => {
      const value = searchParams.get(param);
      if (value) {
        (request as any)[param] = value;
      }
    });
    
    // Number parameters
    const numberParams = ['latitude', 'longitude', 'radius', 'minPrice', 'maxPrice', 'minRooms', 'minRating', 'guests', 'rooms', 'page', 'size'];
    numberParams.forEach(param => {
      const value = searchParams.get(param);
      if (value) {
        (request as any)[param] = parseFloat(value);
      }
    });
    
    // Boolean parameters
    const booleanParams = ['featured', 'instantBooking'];
    booleanParams.forEach(param => {
      const value = searchParams.get(param);
      if (value) {
        (request as any)[param] = value === 'true';
      }
    });
    
    // Array parameters
    const arrayParams = ['amenities', 'propertyTypes'];
    arrayParams.forEach(param => {
      const values = searchParams.getAll(param);
      if (values.length > 0) {
        (request as any)[param] = values;
      }
    });
    
    return request;
  }
};
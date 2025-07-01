import { propertyApi, handleApiResponse } from '@/lib/api/client';
import { Property, PaginatedResponse } from '@/lib/types';

export const propertyService = {
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

  async getPropertyById(id: string): Promise<Property> {
    return handleApiResponse(
      propertyApi.get(`/api/properties/${id}`)
    );
  },

  async searchProperties(params: {
    query?: string;
    city?: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    priceMin?: number;
    priceMax?: number;
    amenities?: string[];
  }): Promise<PaginatedResponse<Property>> {
    return handleApiResponse(
      propertyApi.get('/api/properties/search', { params })
    );
  },

  async getNearbyProperties(
    lat: number,
    lon: number,
    radius: number = 10
  ): Promise<Property[]> {
    return handleApiResponse(
      propertyApi.get('/api/properties', {
        params: { lat, lon, radius }
      })
    );
  },

  async getFeaturedProperties(): Promise<Property[]> {
    return handleApiResponse(
      propertyApi.get('/api/properties/featured')
    );
  },

  async getPropertyReviews(propertyId: string, page: number = 1, size: number = 10) {
    return handleApiResponse(
      propertyApi.get(`/api/properties/${propertyId}/reviews`, {
        params: { page, size }
      })
    );
  }
};
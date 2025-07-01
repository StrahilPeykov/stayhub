import { bookingApi, handleApiResponse } from '@/lib/api/client';
import { Booking, RoomType, AvailabilityResponse, PaginatedResponse } from '@/lib/types';

export const bookingService = {
  async createBooking(bookingData: {
    propertyId: string;
    userId: string;
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    numberOfRooms: number;
    numberOfGuests: number;
    specialRequests?: string;
  }): Promise<Booking> {
    return handleApiResponse(
      bookingApi.post('/api/v1/bookings', bookingData)
    );
  },

  async getBooking(id: string): Promise<Booking> {
    return handleApiResponse(
      bookingApi.get(`/api/v1/bookings/${id}`)
    );
  },

  async getBookingByConfirmationCode(code: string): Promise<Booking> {
    return handleApiResponse(
      bookingApi.get(`/api/v1/bookings/confirmation/${code}`)
    );
  },

  async getUserBookings(userId: string, page: number = 0, size: number = 20): Promise<PaginatedResponse<Booking>> {
    return handleApiResponse(
      bookingApi.get(`/api/v1/bookings/user/${userId}`, {
        params: { page, size }
      })
    );
  },

  async cancelBooking(id: string, reason?: string): Promise<Booking> {
    return handleApiResponse(
      bookingApi.post(`/api/v1/bookings/${id}/cancel`, null, {
        params: { reason }
      })
    );
  },

  async checkAvailability(params: {
    propertyId: string;
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
  }): Promise<AvailabilityResponse> {
    return handleApiResponse(
      bookingApi.get('/api/v1/bookings/availability', { params })
    );
  },

  async getRoomTypes(propertyId: string): Promise<RoomType[]> {
    return handleApiResponse(
      bookingApi.get('/api/v1/room-types', {
        params: { propertyId }
      })
    );
  },

  async createRoomType(roomType: Omit<RoomType, 'id'>): Promise<RoomType> {
    return handleApiResponse(
      bookingApi.post('/api/v1/room-types', roomType)
    );
  },

  async updateRoomType(id: string, roomType: Partial<RoomType>): Promise<RoomType> {
    return handleApiResponse(
      bookingApi.put(`/api/v1/room-types/${id}`, roomType)
    );
  },
};
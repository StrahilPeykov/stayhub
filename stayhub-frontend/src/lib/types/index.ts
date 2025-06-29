// Core type definitions for StayHub frontend

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  currency: string;
  language: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface Property {
  id: string;
  name: string;
  description: string;
  address: Address;
  latitude: number;
  longitude: number;
  amenities: string[];
  totalRooms: number;
  basePrice: number;
  currency: string;
  images?: PropertyImage[];
  rating?: number;
  reviewCount?: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface PropertyImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface RoomType {
  id: string;
  propertyId: string;
  name: string;
  description: string;
  maxOccupancy: number;
  basePrice: number;
  totalRooms: number;
  amenities?: string[];
  images?: string[];
}

export interface Booking {
  id: string;
  propertyId: string;
  property?: Property;
  userId: string;
  roomTypeId: string;
  roomType?: RoomType;
  checkIn: string;
  checkOut: string;
  numberOfRooms: number;
  numberOfGuests: number;
  totalAmount: number;
  currency: string;
  status: BookingStatus;
  confirmationCode: string;
  createdAt: string;
  specialRequests?: string;
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface SearchFilters {
  location?: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  rooms: number;
  priceMin?: number;
  priceMax?: number;
  amenities?: string[];
  propertyTypes?: string[];
  rating?: number;
}

export interface AvailabilityResponse {
  propertyId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  availableRooms: number;
  totalRooms: number;
  pricePerNight: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// A/B Testing types
export interface Experiment {
  key: string;
  variant: 'control' | 'treatment';
  userId: string;
}

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
}
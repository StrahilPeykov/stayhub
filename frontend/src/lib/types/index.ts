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
  featured?: boolean;
  verified?: boolean;
  instantBooking?: boolean;
  cancellationPolicy?: 'flexible' | 'moderate' | 'strict';
  propertyType?: 'hotel' | 'apartment' | 'villa' | 'resort' | 'hostel' | 'guesthouse';
  tags?: string[];
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
  bedConfiguration?: string;
  size?: number; // in square meters
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
  paymentMethod?: 'card' | 'paypal' | 'bank_transfer';
  cancellationReason?: string;
  refundAmount?: number;
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED'
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
  instantBooking?: boolean;
  sortBy?: 'price' | 'rating' | 'distance' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface AvailabilityResponse {
  propertyId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  availableRooms: number;
  totalRooms: number;
  pricePerNight: number;
  totalPrice?: number;
  taxes?: number;
  fees?: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

// A/B Testing types
export interface Experiment {
  key: string;
  variant: 'control' | 'treatment';
  userId: string;
  metadata?: Record<string, any>;
}

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
}

// Review types
export interface Review {
  id: string;
  propertyId: string;
  userId: string;
  user?: {
    name: string;
    avatar?: string;
    location?: string;
  };
  rating: number;
  title?: string;
  comment: string;
  pros?: string[];
  cons?: string[];
  travelType?: 'business' | 'leisure' | 'family' | 'couple' | 'solo';
  createdAt: string;
  updatedAt?: string;
  helpful?: number;
  images?: string[];
  verified?: boolean;
}

// Destination types
export interface Destination {
  id: string;
  name: string;
  country: string;
  description?: string;
  image: string;
  propertyCount: number;
  averagePrice?: number;
  trending?: boolean;
  tags?: string[];
}

// Deal types
export interface Deal {
  id: string;
  propertyId: string;
  property?: Property;
  title: string;
  description: string;
  discountPercentage: number;
  validFrom: string;
  validUntil: string;
  termsAndConditions?: string;
  promoCode?: string;
  minNights?: number;
  maxNights?: number;
  blackoutDates?: string[];
}
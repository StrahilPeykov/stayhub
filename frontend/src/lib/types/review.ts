export interface Review {
  id: string;
  propertyId: string;
  bookingId: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
    location?: string;
    memberSince?: string;
  };
  rating: {
    overall: number;
    cleanliness: number;
    accuracy: number;
    checkIn: number;
    communication: number;
    location: number;
    value: number;
  };
  title: string;
  comment: string;
  pros?: string[];
  cons?: string[];
  travelType: 'business' | 'leisure' | 'family' | 'couple' | 'solo';
  roomType?: string;
  stayDate: string;
  createdAt: string;
  updatedAt?: string;
  helpful: number;
  images?: ReviewImage[];
  verified: boolean;
  ownerResponse?: {
    comment: string;
    createdAt: string;
  };
}

export interface ReviewImage {
  id: string;
  url: string;
  caption?: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  categoryRatings: {
    cleanliness: number;
    accuracy: number;
    checkIn: number;
    communication: number;
    location: number;
    value: number;
  };
  reviewsByTravelType: {
    business: number;
    leisure: number;
    family: number;
    couple: number;
    solo: number;
  };
}

export interface CreateReviewData {
  bookingId: string;
  propertyId: string;
  rating: {
    overall: number;
    cleanliness: number;
    accuracy: number;
    checkIn: number;
    communication: number;
    location: number;
    value: number;
  };
  title: string;
  comment: string;
  pros?: string[];
  cons?: string[];
  travelType: 'business' | 'leisure' | 'family' | 'couple' | 'solo';
  images?: File[];
  wouldRecommend: boolean;
}
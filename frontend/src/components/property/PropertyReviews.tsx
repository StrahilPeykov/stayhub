'use client'

import { useState } from 'react'
import { Star, ThumbsUp, Camera, ChevronDown, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Review, ReviewSummary } from '@/lib/types/review'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface PropertyReviewsProps {
  propertyId: string
  summary: ReviewSummary
  reviews: Review[]
  onLoadMore?: () => void
  hasMore?: boolean
  isLoading?: boolean
}

const travelTypeLabels = {
  business: 'Business',
  leisure: 'Leisure',
  family: 'Family',
  couple: 'Couple',
  solo: 'Solo Traveler',
}

const categoryLabels = {
  cleanliness: 'Cleanliness',
  accuracy: 'Accuracy',
  checkIn: 'Check-in',
  communication: 'Communication',
  location: 'Location',
  value: 'Value for Money',
}

export function PropertyReviews({
  propertyId,
  summary,
  reviews,
  onLoadMore,
  hasMore = false,
  isLoading = false,
}: PropertyReviewsProps) {
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('helpful')
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [filterTravelType, setFilterTravelType] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)

  // Filter and sort reviews
  const filteredReviews = reviews
    .filter((review) => {
      if (filterRating && review.rating.overall !== filterRating) return false
      if (filterTravelType && review.travelType !== filterTravelType) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'helpful':
          return b.helpful - a.helpful
        case 'rating':
          return b.rating.overall - a.rating.overall
        default:
          return 0
      }
    })

  const handleHelpful = (reviewId: string) => {
    // In a real app, this would call an API
    console.log('Marking review as helpful:', reviewId)
  }

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-6">Guest Reviews</h2>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Overall Rating */}
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {summary.averageRating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-5 h-5",
                    i < Math.round(summary.averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-200 text-gray-200"
                  )}
                />
              ))}
            </div>
            <p className="text-gray-600">
              Based on {summary.totalReviews} review{summary.totalReviews !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = summary.ratingDistribution[rating as keyof typeof summary.ratingDistribution]
              const percentage = (count / summary.totalReviews) * 100
              
              return (
                <button
                  key={rating}
                  onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                  className={cn(
                    "w-full flex items-center gap-3 group hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors",
                    filterRating === rating && "bg-gray-50"
                  )}
                >
                  <span className="text-sm text-gray-600 w-4">{rating}</span>
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Category Ratings */}
          <div className="space-y-3">
            {Object.entries(summary.categoryRatings).map(([category, rating]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-2 h-2 rounded-full",
                          i < Math.round(rating)
                            ? "bg-gray-800"
                            : "bg-gray-300"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium w-8 text-right">
                    {rating.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="helpful">Most Helpful</option>
              <option value="recent">Most Recent</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          {/* Travel Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Travel type:</span>
            <select
              value={filterTravelType || ''}
              onChange={(e) => setFilterTravelType(e.target.value || null)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {Object.entries(travelTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label} ({summary.reviewsByTravelType[value as keyof typeof summary.reviewsByTravelType]})
                </option>
              ))}
            </select>
          </div>

          {/* Active Filters */}
          {(filterRating || filterTravelType) && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Active filters:</span>
              {filterRating && (
                <button
                  onClick={() => setFilterRating(null)}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200"
                >
                  {filterRating} stars
                  <X className="w-3 h-3" />
                </button>
              )}
              {filterTravelType && (
                <button
                  onClick={() => setFilterTravelType(null)}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200"
                >
                  {travelTypeLabels[filterTravelType as keyof typeof travelTypeLabels]}
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {review.user?.avatar ? (
                      <img
                        src={review.user.avatar}
                        alt={review.user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      review.user?.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {review.user?.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {review.user?.location} • {review.user?.memberSince && `Member since ${review.user.memberSince}`}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i < review.rating.overall
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-200 text-gray-200"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    {format(new Date(review.stayDate), 'MMMM yyyy')}
                  </p>
                </div>
              </div>

              {/* Review Content */}
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {review.title}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {review.comment}
                </p>
                
                {/* Pros and Cons */}
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  {review.pros && review.pros.length > 0 && (
                    <div>
                      <h5 className="font-medium text-green-700 mb-2 flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        Pros
                      </h5>
                      <ul className="space-y-1">
                        {review.pros.map((pro, i) => (
                          <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-green-600 mt-0.5">•</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {review.cons && review.cons.length > 0 && (
                    <div>
                      <h5 className="font-medium text-red-700 mb-2 flex items-center gap-1">
                        <X className="w-4 h-4" />
                        Cons
                      </h5>
                      <ul className="space-y-1">
                        {review.cons.map((con, i) => (
                          <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-red-600 mt-0.5">•</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Review Images */}
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {review.images.map((image, i) => (
                    <button
                      key={image.id}
                      onClick={() => {
                        setSelectedReview(review)
                        setSelectedImageIndex(i)
                      }}
                      className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={image.url}
                        alt={image.caption || `Review image ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Review Footer */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4 text-sm">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg">
                    {travelTypeLabels[review.travelType]}
                  </span>
                  {review.roomType && (
                    <span className="text-gray-600">
                      Stayed in {review.roomType}
                    </span>
                  )}
                  {review.verified && (
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <Check className="w-4 h-4" />
                      Verified stay
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => handleHelpful(review.id)}
                  className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Helpful ({review.helpful})
                </button>
              </div>

              {/* Owner Response */}
              {review.ownerResponse && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      P
                    </div>
                    <div>
                      <p className="font-medium text-sm">Property Owner</p>
                      <p className="text-xs text-gray-600">
                        Responded {format(new Date(review.ownerResponse.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">
                    {review.ownerResponse.comment}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoading}
            className="min-w-[200px]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                Loading...
              </span>
            ) : (
              <>
                Load More Reviews
                <ChevronDown className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {filteredReviews.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {filterRating || filterTravelType
              ? 'No reviews match your filters'
              : 'No reviews yet'}
          </p>
        </div>
      )}

      {/* Image Lightbox */}
      {selectedReview && selectedImageIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => {
            setSelectedReview(null)
            setSelectedImageIndex(null)
          }}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedReview.images![selectedImageIndex].url}
              alt={selectedReview.images![selectedImageIndex].caption || 'Review image'}
              className="max-w-full max-h-full object-contain"
            />
            <button
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedReview(null)
                setSelectedImageIndex(null)
              }}
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
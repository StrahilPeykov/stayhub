'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Star, MapPin, Heart, Wifi, Car, Coffee, Dumbbell, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Property } from '@/lib/types'
import { formatCurrency } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'
import { useExperiment } from '@/lib/hooks/useExperiment'
import { useAnalytics } from '@/lib/hooks/useAnalytics'

interface PropertyCardProps {
  property: Property
  className?: string
  priority?: boolean
}

const amenityIcons: Record<string, any> = {
  WiFi: Wifi,
  Parking: Car,
  Gym: Dumbbell,
  Breakfast: Coffee,
}

export function PropertyCard({ property, className, priority = false }: PropertyCardProps) {
  const { variant } = useExperiment('property-card-design')
  const { track } = useAnalytics()
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsWishlisted(!isWishlisted)
    track('property_wishlisted', {
      property_id: property.id,
      property_name: property.name,
      action: !isWishlisted ? 'add' : 'remove',
    })
  }

  const handleImageNavigation = (e: React.MouseEvent, direction: 'prev' | 'next') => {
    e.preventDefault()
    e.stopPropagation()
    
    const images = property.images || []
    if (images.length <= 1) return
    
    if (direction === 'next') {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
    } else {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }

  const images = property.images && property.images.length > 0 
    ? property.images 
    : [{ 
        id: '1', 
        url: `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&crop=center&auto=format&q=80`,
        alt: property.name,
        isPrimary: true
      }]

  const currentImage = images[currentImageIndex]

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        href={`/properties/${property.id}`}
        className={cn(
          'group block bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300',
          className
        )}
        onClick={() => track('property_card_clicked', { property_id: property.id })}
      >
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-200">
          {/* Image Carousel */}
          <Image
            src={currentImage.url}
            alt={currentImage.alt || property.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
          />
          
          {/* Image Navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => handleImageNavigation(e, 'prev')}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => handleImageNavigation(e, 'next')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              
              {/* Image Indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      index === currentImageIndex 
                        ? "bg-white w-4" 
                        : "bg-white/60"
                    )}
                  />
                ))}
              </div>
            </>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
          >
            <Heart
              className={cn(
                "w-5 h-5 transition-colors",
                isWishlisted ? "fill-red-500 text-red-500" : "text-gray-700"
              )}
            />
          </button>
          
          {/* Rating Badge */}
          {property.rating && (
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="font-semibold text-sm">{property.rating.toFixed(1)}</span>
              {property.reviewCount && (
                <span className="text-xs text-gray-600">({property.reviewCount})</span>
              )}
            </div>
          )}
          
          {/* Featured Badge */}
          {property.featured && (
            <div className="absolute top-14 left-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
              Featured
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-5">
          {/* Location */}
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
            <span className="truncate">
              {property.address.city}, {property.address.country}
            </span>
          </div>
          
          {/* Title */}
          <h3 className="font-bold text-lg text-gray-900 mb-3 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {property.name}
          </h3>
          
          {/* Amenities */}
          <div className="flex items-center gap-3 mb-4">
            {property.amenities.slice(0, 4).map((amenity) => {
              const Icon = amenityIcons[amenity]
              return Icon ? (
                <div
                  key={amenity}
                  className="flex items-center gap-1.5 text-sm text-gray-600"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{amenity}</span>
                </div>
              ) : null
            })}
            {property.amenities.length > 4 && (
              <span className="text-sm text-gray-500">
                +{property.amenities.length - 4} more
              </span>
            )}
          </div>
          
          {/* Price and CTA */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Starting from</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(property.basePrice, property.currency)}
                </span>
                <span className="text-sm text-gray-600">/ night</span>
              </div>
            </div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-blue-600 font-semibold text-sm group-hover:underline">
                View Details →
              </span>
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
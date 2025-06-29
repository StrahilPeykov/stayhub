'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, Wifi, Car, Dumbbell, Coffee } from 'lucide-react'
import { Property } from '@/lib/types'
import { formatCurrency } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'
import { useExperiment } from '@/lib/hooks/useExperiment'

interface PropertyCardProps {
  property: Property
  className?: string
}

const amenityIcons: Record<string, any> = {
  WiFi: Wifi,
  Parking: Car,
  Gym: Dumbbell,
  Breakfast: Coffee,
}

export function PropertyCard({ property, className }: PropertyCardProps) {
  const { variant } = useExperiment('property-card-design')
  
  // A/B test different card designs
  if (variant === 'treatment') {
    return <PropertyCardModern property={property} className={className} />
  }
  
  return <PropertyCardClassic property={property} className={className} />
}

function PropertyCardClassic({ property, className }: PropertyCardProps) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className={cn(
        'block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200',
        className
      )}
    >
      <div className="relative h-48 md:h-56">
        <Image
          src={property.images?.[0]?.url || '/images/property-placeholder.jpg'}
          alt={property.name}
          fill
          className="object-cover rounded-t-lg"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {property.rating && (
          <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-md shadow-md flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm font-semibold">{property.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
          {property.name}
        </h3>
        
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="line-clamp-1">
            {property.address.city}, {property.address.country}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {property.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(property.basePrice, property.currency)}
            </span>
            <span className="text-sm text-gray-600"> / night</span>
          </div>
          
          <div className="flex space-x-1">
            {property.amenities.slice(0, 3).map((amenity) => {
              const Icon = amenityIcons[amenity]
              return Icon ? (
                <div
                  key={amenity}
                  className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center"
                  title={amenity}
                >
                  <Icon className="w-4 h-4 text-gray-600" />
                </div>
              ) : null
            })}
          </div>
        </div>
      </div>
    </Link>
  )
}

function PropertyCardModern({ property, className }: PropertyCardProps) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className={cn(
        'group block bg-white rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300',
        className
      )}
    >
      <div className="relative h-64">
        <Image
          src={property.images?.[0]?.url || '/images/property-placeholder.jpg'}
          alt={property.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white mb-1">
            {property.name}
          </h3>
          <div className="flex items-center text-white/90 text-sm">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{property.address.city}</span>
          </div>
        </div>
        
        {property.rating && (
          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-white font-semibold">{property.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-3xl font-bold text-gray-900">
              {formatCurrency(property.basePrice, property.currency)}
            </span>
            <span className="text-gray-600"> / night</span>
          </div>
          
          {property.reviewCount && (
            <span className="text-sm text-gray-600">
              {property.reviewCount} reviews
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {property.amenities.slice(0, 4).map((amenity) => (
            <span
              key={amenity}
              className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              {amenity}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}
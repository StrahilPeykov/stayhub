'use client'

import Image from 'next/image'
import { Star, MapPin, Wifi, Car, Dumbbell, Coffee } from 'lucide-react'
import { Property } from '@/lib/types'

interface PropertyDetailsProps {
  property: Property
}

const amenityIcons: Record<string, any> = {
  WiFi: Wifi,
  Parking: Car,
  Gym: Dumbbell,
  Breakfast: Coffee,
}

export function PropertyDetails({ property }: PropertyDetailsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      {/* Property Image */}
      <div className="relative h-64 md:h-80">
        <Image
          src={property.images?.[0]?.url || '/images/property-placeholder.jpg'}
          alt={property.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
          onError={(e) => {
            e.currentTarget.src = `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=400&fit=crop&crop=center&auto=format&q=60`
          }}
        />
        {property.rating && (
          <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-md shadow-md flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="font-semibold">{property.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Property Info */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{property.name}</h1>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              <span>
                {property.address.street}, {property.address.city}, {property.address.country}
              </span>
            </div>
          </div>
        </div>

        <p className="text-gray-700 mb-4">{property.description}</p>

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((amenity) => {
                const Icon = amenityIcons[amenity]
                return (
                  <div
                    key={amenity}
                    className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg"
                  >
                    {Icon && <Icon className="w-4 h-4 text-gray-600" />}
                    <span className="text-sm">{amenity}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
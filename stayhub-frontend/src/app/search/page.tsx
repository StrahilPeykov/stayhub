'use client'

import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { propertyService } from '@/services/propertyService'
import { PropertyCard } from '@/components/property/PropertyCard'
import { SearchBar } from '@/components/search/SearchBar'
import { PropertyCardSkeleton } from '@/components/ui/skeletons'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const location = searchParams.get('location') || ''
  const checkIn = searchParams.get('checkIn') || ''
  const checkOut = searchParams.get('checkOut') || ''
  const guests = parseInt(searchParams.get('guests') || '2')

  const { data: properties, isLoading, error } = useQuery({
    queryKey: ['properties', 'search', location, checkIn, checkOut, guests],
    queryFn: () => propertyService.searchProperties({
      city: location,
      checkIn,
      checkOut,
      guests,
    }),
    enabled: !!location,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <SearchBar />
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">
            {location ? `Properties in ${location}` : 'Search Results'}
          </h1>
          {checkIn && checkOut && (
            <p className="text-gray-600">
              {checkIn} - {checkOut} · {guests} guest{guests !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {error ? (
          <div className="text-center py-12">
            <p className="text-red-600">Error loading properties. Please try again.</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : properties && properties.data && properties.data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.data.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No properties found for your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}
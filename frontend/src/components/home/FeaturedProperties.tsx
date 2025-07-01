'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, Award } from 'lucide-react'
import { PropertyCard } from '@/components/property/PropertyCard'
import { propertyService } from '@/services/propertyService'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function FeaturedProperties() {
  const { data: properties, isLoading, error, refetch } = useQuery({
    queryKey: ['featured-properties'],
    queryFn: () => propertyService.getProperties({ page: 0, size: 6 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load properties</h3>
          <p className="text-gray-600 mb-6">There was an error loading featured properties. Please try again.</p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const displayProperties = properties || generateMockProperties()

  return (
    <div className="space-y-8">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-3 justify-center">
        {categories.map((category) => (
          <motion.button
            key={category.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all",
              category.active
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            <category.icon className="w-4 h-4" />
            {category.label}
          </motion.button>
        ))}
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? [...Array(6)].map((_, i) => <PropertyCardSkeleton key={i} />)
          : displayProperties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <PropertyCard property={property} priority={index < 3} />
              </motion.div>
            ))}
      </div>

      {/* View All Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="text-center"
      >
        <Link href="/properties">
          <Button
            size="lg"
            variant="outline"
            className="group hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
          >
            View All Properties
            <svg
              className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </Link>
      </motion.div>
    </div>
  )
}

function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
      <Skeleton className="h-64 w-full" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-6 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  )
}

const categories = [
  { id: 'trending', label: 'Trending', icon: TrendingUp, active: true },
  { id: 'new', label: 'New Listings', icon: Sparkles, active: false },
  { id: 'luxury', label: 'Luxury', icon: Award, active: false },
]

function generateMockProperties() {
  return [
    {
      id: '1',
      name: 'Ocean View Paradise Resort',
      description: 'Luxurious beachfront resort with stunning ocean views',
      address: {
        street: '123 Beach Road',
        city: 'Maldives',
        state: '',
        country: 'Maldives',
        zipCode: '20026',
      },
      latitude: 3.2028,
      longitude: 73.2207,
      amenities: ['WiFi', 'Pool', 'Spa', 'Beach Access', 'Restaurant'],
      totalRooms: 120,
      basePrice: 450,
      currency: 'USD',
      rating: 4.9,
      reviewCount: 328,
      featured: true,
      images: [
        {
          id: '1',
          url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
          alt: 'Ocean View Paradise Resort',
          isPrimary: true,
        },
      ],
    },
    {
      id: '2',
      name: 'Mountain Lodge Retreat',
      description: 'Cozy mountain lodge with breathtaking views',
      address: {
        street: '456 Mountain Trail',
        city: 'Aspen',
        state: 'CO',
        country: 'USA',
        zipCode: '81611',
      },
      latitude: 39.1911,
      longitude: -106.8175,
      amenities: ['WiFi', 'Fireplace', 'Ski Access', 'Hot Tub'],
      totalRooms: 50,
      basePrice: 350,
      currency: 'USD',
      rating: 4.8,
      reviewCount: 256,
      images: [
        {
          id: '1',
          url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=600&fit=crop',
          alt: 'Mountain Lodge Retreat',
          isPrimary: true,
        },
      ],
    },
    {
      id: '3',
      name: 'Urban Luxury Hotel',
      description: 'Modern hotel in the heart of the city',
      address: {
        street: '789 City Center',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10001',
      },
      latitude: 40.7484,
      longitude: -73.9857,
      amenities: ['WiFi', 'Gym', 'Restaurant', 'Business Center'],
      totalRooms: 200,
      basePrice: 299,
      currency: 'USD',
      rating: 4.7,
      reviewCount: 512,
      images: [
        {
          id: '1',
          url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop',
          alt: 'Urban Luxury Hotel',
          isPrimary: true,
        },
      ],
    },
  ]
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
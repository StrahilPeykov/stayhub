'use client'

import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Map, List, Filter, X, ChevronDown, Star, Wifi, Car, Coffee, Dumbbell } from 'lucide-react'
import { propertyService } from '@/services/propertyService'
import { PropertyCard } from '@/components/property/PropertyCard'
import { SearchBar } from '@/components/search/SearchBar'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const amenityOptions = [
  { id: 'WiFi', label: 'WiFi', icon: Wifi },
  { id: 'Parking', label: 'Free Parking', icon: Car },
  { id: 'Breakfast', label: 'Breakfast Included', icon: Coffee },
  { id: 'Gym', label: 'Fitness Center', icon: Dumbbell },
  { id: 'Pool', label: 'Swimming Pool', icon: () => <span>🏊</span> },
  { id: 'Spa', label: 'Spa & Wellness', icon: () => <span>💆</span> },
]

const propertyTypes = [
  { id: 'hotel', label: 'Hotels' },
  { id: 'apartment', label: 'Apartments' },
  { id: 'villa', label: 'Villas' },
  { id: 'resort', label: 'Resorts' },
  { id: 'hostel', label: 'Hostels' },
  { id: 'guesthouse', label: 'Guest Houses' },
]

const sortOptions = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'price-high', label: 'Price: High to Low' },
  { id: 'rating', label: 'Guest Rating' },
  { id: 'distance', label: 'Distance to Center' },
]

export default function SearchPage() {
  const searchParams = useSearchParams()
  const location = searchParams.get('location') || ''
  const checkIn = searchParams.get('checkIn') || ''
  const checkOut = searchParams.get('checkOut') || ''
  const guests = parseInt(searchParams.get('guests') || '2')
  const rooms = parseInt(searchParams.get('rooms') || '1')

  const [showFilters, setShowFilters] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [sortBy, setSortBy] = useState('recommended')
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([])
  const [selectedRating, setSelectedRating] = useState<number | null>(null)

  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['properties', 'search', location, checkIn, checkOut, guests, sortBy, priceRange, selectedAmenities, selectedPropertyTypes, selectedRating],
    queryFn: () => propertyService.searchProperties({
      city: location,
      checkIn,
      checkOut,
      guests,
      priceMin: priceRange[0],
      priceMax: priceRange[1],
      amenities: selectedAmenities,
      // Add other filters
    }),
    enabled: !!location,
  })

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenityId)
        ? prev.filter(id => id !== amenityId)
        : [...prev, amenityId]
    )
  }

  const togglePropertyType = (typeId: string) => {
    setSelectedPropertyTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    )
  }

  const clearFilters = () => {
    setPriceRange([0, 1000])
    setSelectedAmenities([])
    setSelectedPropertyTypes([])
    setSelectedRating(null)
  }

  const activeFiltersCount = selectedAmenities.length + selectedPropertyTypes.length + (selectedRating ? 1 : 0) + (priceRange[0] > 0 || priceRange[1] < 1000 ? 1 : 0)

  // Mock data for when API is not available
  const mockProperties = generateMockProperties(12)
  const properties = searchResults?.data || mockProperties

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Bar */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <SearchBar />
        </div>
      </div>

      {/* Results Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {location || 'Search Results'}
              </h1>
              {checkIn && checkOut && (
                <p className="text-gray-600 mt-1">
                  {checkIn} - {checkOut} · {guests} guest{guests !== 1 ? 's' : ''} · {rooms} room{rooms !== 1 ? 's' : ''}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                {properties.length} properties found
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setShowMap(false)}
                  className={cn(
                    "px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-all",
                    !showMap ? "bg-white shadow-sm text-gray-900" : "text-gray-600"
                  )}
                >
                  <List className="w-4 h-4" />
                  List
                </button>
                <button
                  onClick={() => setShowMap(true)}
                  className={cn(
                    "px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-all",
                    showMap ? "bg-white shadow-sm text-gray-900" : "text-gray-600"
                  )}
                >
                  <Map className="w-4 h-4" />
                  Map
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <Button variant="outline" className="flex items-center gap-2">
                  Sort: {sortOptions.find(opt => opt.id === sortBy)?.label}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>

              {/* Filters Button */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 flex gap-6">
        {/* Filters Sidebar */}
        <AnimatePresence>
          {showFilters && (
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-80 flex-shrink-0"
            >
              <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Filters</h2>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Price Range */}
                  <div>
                    <h3 className="font-medium mb-4">Price per night</h3>
                    <div className="px-2">
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        min={0}
                        max={1000}
                        step={10}
                        className="mb-4"
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">${priceRange[0]}</span>
                        <span className="text-gray-600">${priceRange[1]}+</span>
                      </div>
                    </div>
                  </div>

                  {/* Guest Rating */}
                  <div>
                    <h3 className="font-medium mb-4">Guest Rating</h3>
                    <div className="space-y-2">
                      {[5, 4, 3].map((rating) => (
                        <label
                          key={rating}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <input
                            type="radio"
                            name="rating"
                            checked={selectedRating === rating}
                            onChange={() => setSelectedRating(rating)}
                            className="sr-only"
                          />
                          <div className={cn(
                            "w-4 h-4 rounded-full border-2 transition-all",
                            selectedRating === rating
                              ? "border-blue-600 bg-blue-600"
                              : "border-gray-300 group-hover:border-gray-400"
                          )}>
                            {selectedRating === rating && (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "w-4 h-4",
                                  i < rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-gray-200 text-gray-200"
                                )}
                              />
                            ))}
                            <span className="text-sm text-gray-600 ml-1">& up</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Property Type */}
                  <div>
                    <h3 className="font-medium mb-4">Property Type</h3>
                    <div className="space-y-2">
                      {propertyTypes.map((type) => (
                        <label
                          key={type.id}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedPropertyTypes.includes(type.id)}
                            onCheckedChange={() => togglePropertyType(type.id)}
                          />
                          <span className="text-sm">{type.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Amenities */}
                  <div>
                    <h3 className="font-medium mb-4">Amenities</h3>
                    <div className="space-y-2">
                      {amenityOptions.map((amenity) => (
                        <label
                          key={amenity.id}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedAmenities.includes(amenity.id)}
                            onCheckedChange={() => toggleAmenity(amenity.id)}
                          />
                          <div className="flex items-center gap-2 text-sm">
                            <amenity.icon className="w-4 h-4 text-gray-500" />
                            <span>{amenity.label}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Results */}
        <div className="flex-1">
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
          ) : showMap ? (
            <div className="bg-white rounded-lg shadow-sm border h-[600px] flex items-center justify-center">
              <p className="text-gray-500">Map view coming soon</p>
            </div>
          ) : properties.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {properties.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <PropertyCard property={property} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No properties found for your search.</p>
            </div>
          )}

          {/* Load More */}
          {properties.length > 0 && (
            <div className="mt-8 text-center">
              <Button variant="outline" size="lg">
                Load More Properties
              </Button>
            </div>
          )}
        </div>
      </div>
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

function generateMockProperties(count: number) {
  const mockData = [
    {
      name: 'Luxury Beach Resort & Spa',
      city: 'Miami Beach',
      country: 'USA',
      price: 350,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
    },
    {
      name: 'Downtown Business Hotel',
      city: 'New York',
      country: 'USA',
      price: 225,
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop',
    },
    {
      name: 'Cozy Mountain Chalet',
      city: 'Aspen',
      country: 'USA',
      price: 450,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=600&fit=crop',
    },
  ]

  return Array.from({ length: count }, (_, i) => {
    const mock = mockData[i % mockData.length]
    return {
      id: `${i + 1}`,
      name: mock.name,
      description: 'Experience luxury and comfort in this beautiful property',
      address: {
        street: '123 Main St',
        city: mock.city,
        state: 'State',
        country: mock.country,
        zipCode: '12345',
      },
      latitude: 0,
      longitude: 0,
      amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Spa'],
      totalRooms: 50,
      basePrice: mock.price,
      currency: 'USD',
      rating: mock.rating,
      reviewCount: Math.floor(Math.random() * 500) + 100,
      images: [
        {
          id: '1',
          url: mock.image,
          alt: mock.name,
          isPrimary: true,
        },
      ],
    }
  })
}

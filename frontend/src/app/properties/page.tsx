'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Map, List, Filter, Search, Star } from 'lucide-react'
import { propertyService } from '@/services/propertyService'
import { PropertyCard } from '@/components/property/PropertyCard'
import { SearchBar } from '@/components/search/SearchBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const propertyTypes = [
  { id: 'hotel', label: 'Hotels', count: 245 },
  { id: 'apartment', label: 'Apartments', count: 189 },
  { id: 'villa', label: 'Villas', count: 76 },
  { id: 'resort', label: 'Resorts', count: 134 },
  { id: 'hostel', label: 'Hostels', count: 45 },
  { id: 'guesthouse', label: 'Guest Houses', count: 67 },
]

const amenityOptions = [
  { id: 'WiFi', label: 'Free WiFi', count: 512 },
  { id: 'Parking', label: 'Free Parking', count: 387 },
  { id: 'Pool', label: 'Swimming Pool', count: 298 },
  { id: 'Gym', label: 'Fitness Center', count: 234 },
  { id: 'Spa', label: 'Spa & Wellness', count: 167 },
  { id: 'Restaurant', label: 'Restaurant', count: 456 },
  { id: 'Airport Shuttle', label: 'Airport Shuttle', count: 189 },
  { id: 'Pet Friendly', label: 'Pet Friendly', count: 123 },
]

const sortOptions = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'price-high', label: 'Price: High to Low' },
  { id: 'rating', label: 'Guest Rating' },
  { id: 'newest', label: 'Newest First' },
]

export default function PropertiesPage() {
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [sortBy, setSortBy] = useState('recommended')
  const [searchTerm, setSearchTerm] = useState('')
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [selectedRating, setSelectedRating] = useState<number | null>(null)

  const { data: properties, isLoading, error } = useQuery({
    queryKey: ['properties', 'all'],
    queryFn: () => propertyService.getProperties(),
  })

  // Filter properties based on selected criteria
  const filteredProperties = (properties || []).filter(property => {
    if (searchTerm && !property.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !property.address.city.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    
    if (property.basePrice < priceRange[0] || property.basePrice > priceRange[1]) {
      return false
    }
    
    if (selectedRating && property.rating && property.rating < selectedRating) {
      return false
    }
    
    return true
  })

  const togglePropertyType = (typeId: string) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    )
  }

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenityId)
        ? prev.filter(id => id !== amenityId)
        : [...prev, amenityId]
    )
  }

  const clearFilters = () => {
    setPriceRange([0, 1000])
    setSelectedTypes([])
    setSelectedAmenities([])
    setSelectedRating(null)
    setSearchTerm('')
  }

  const activeFiltersCount = selectedTypes.length + selectedAmenities.length + 
    (selectedRating ? 1 : 0) + (priceRange[0] > 0 || priceRange[1] < 1000 ? 1 : 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white py-20">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-bold mb-6"
            >
              Discover Amazing
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                Properties
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-blue-100 mb-8"
            >
              From luxury hotels to cozy apartments, find your perfect stay
            </motion.p>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <SearchBar />
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              All Properties
            </h2>
            <p className="text-gray-600">
              {filteredProperties.length} properties found
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-all",
                  viewMode === 'list' ? "bg-white shadow-sm text-gray-900" : "text-gray-600"
                )}
              >
                <List className="w-4 h-4" />
                List
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={cn(
                  "px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-all",
                  viewMode === 'map' ? "bg-white shadow-sm text-gray-900" : "text-gray-600"
                )}
              >
                <Map className="w-4 h-4" />
                Map
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>

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

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-80 flex-shrink-0"
            >
              <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Filters</h3>
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
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Properties
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Property name or city..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Price Range (per night)
                    </label>
                    <div className="px-2">
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        min={0}
                        max={1000}
                        step={10}
                        className="mb-4"
                      />
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>${priceRange[0]}</span>
                        <span>${priceRange[1]}+</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Minimum Rating
                    </label>
                    <div className="space-y-2">
                      {[5, 4, 3].map((rating) => (
                        <label
                          key={rating}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="rating"
                            checked={selectedRating === rating}
                            onChange={() => setSelectedRating(
                              selectedRating === rating ? null : rating
                            )}
                            className="w-4 h-4 text-blue-600"
                          />
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
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Property Type
                    </label>
                    <div className="space-y-2">
                      {propertyTypes.map((type) => (
                        <label
                          key={type.id}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedTypes.includes(type.id)}
                              onCheckedChange={() => togglePropertyType(type.id)}
                            />
                            <span className="text-sm">{type.label}</span>
                          </div>
                          <span className="text-xs text-gray-500">({type.count})</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Amenities */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Amenities
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {amenityOptions.map((amenity) => (
                        <label
                          key={amenity.id}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedAmenities.includes(amenity.id)}
                              onCheckedChange={() => toggleAmenity(amenity.id)}
                            />
                            <span className="text-sm">{amenity.label}</span>
                          </div>
                          <span className="text-xs text-gray-500">({amenity.count})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}

          {/* Properties Grid */}
          <div className="flex-1">
            {error ? (
              <div className="text-center py-12">
                <p className="text-red-600">Error loading properties. Please try again.</p>
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <PropertyCardSkeleton key={i} />
                ))}
              </div>
            ) : viewMode === 'map' ? (
              <div className="bg-white rounded-lg shadow-sm border h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <Map className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">Map view coming soon</p>
                  <p className="text-gray-400 text-sm">Switch to list view to browse properties</p>
                </div>
              </div>
            ) : filteredProperties.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredProperties.map((property, index) => (
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
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No properties found
                </h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your filters or search criteria
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear All Filters
                </Button>
              </div>
            )}

            {/* Load More */}
            {filteredProperties.length > 0 && (
              <div className="mt-12 text-center">
                <Button variant="outline" size="lg">
                  Load More Properties
                </Button>
              </div>
            )}
          </div>
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
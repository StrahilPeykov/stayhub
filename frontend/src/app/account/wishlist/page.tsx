'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, MapPin, Star, Search, Filter, Share2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PropertyCard } from '@/components/property/PropertyCard'
import { formatCurrency } from '@/lib/utils'
import { Property } from '@/lib/types'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

// Mock data - in a real app, this would come from an API
const mockWishlistProperties: Property[] = [
  {
    id: '1',
    name: 'Oceanfront Paradise Resort',
    description: 'Luxury beachfront resort with stunning ocean views',
    address: {
      street: '123 Beach Road',
      city: 'Miami Beach',
      state: 'FL',
      country: 'USA',
      zipCode: '33139',
    },
    latitude: 25.7617,
    longitude: -80.1918,
    amenities: ['WiFi', 'Pool', 'Spa', 'Beach Access', 'Restaurant'],
    totalRooms: 120,
    basePrice: 450,
    currency: 'USD',
    rating: 4.8,
    reviewCount: 328,
    images: [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
        alt: 'Ocean View Resort',
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
    rating: 4.9,
    reviewCount: 256,
    images: [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=600&fit=crop',
        alt: 'Mountain Lodge',
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
    rating: 4.6,
    reviewCount: 512,
    images: [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop',
        alt: 'Urban Hotel',
        isPrimary: true,
      },
    ],
  },
]

// Wishlist collections
const collections = [
  { id: 'all', name: 'All Saved', count: 3 },
  { id: 'summer', name: 'Summer Vacation', count: 2 },
  { id: 'business', name: 'Business Trips', count: 1 },
  { id: 'romantic', name: 'Romantic Getaways', count: 0 },
]

export default function WishlistPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCollection, setSelectedCollection] = useState('all')
  const [properties, setProperties] = useState(mockWishlistProperties)
  const [showCreateCollection, setShowCreateCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')

  const filteredProperties = properties.filter((property) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      property.name.toLowerCase().includes(search) ||
      property.address.city.toLowerCase().includes(search) ||
      property.address.country.toLowerCase().includes(search)
    )
  })

  const handleRemoveFromWishlist = (propertyId: string) => {
    setProperties(prev => prev.filter(p => p.id !== propertyId))
    toast({
      title: 'Removed from wishlist',
      description: 'Property has been removed from your saved items.',
    })
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My StayHub Wishlist',
        text: 'Check out my saved properties on StayHub!',
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: 'Link Copied',
        description: 'Wishlist link copied to clipboard',
      })
    }
  }

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return
    
    // In a real app, this would create a new collection via API
    toast({
      title: 'Collection Created',
      description: `"${newCollectionName}" collection has been created.`,
    })
    setNewCollectionName('')
    setShowCreateCollection(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
          <p className="text-gray-600">
            {properties.length} propert{properties.length !== 1 ? 'ies' : 'y'} saved
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button onClick={() => setShowCreateCollection(true)}>
            Create Collection
          </Button>
        </div>
      </div>

      {/* Collections */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold mb-4">Collections</h2>
        <div className="flex flex-wrap gap-2">
          {collections.map((collection) => (
            <button
              key={collection.id}
              onClick={() => setSelectedCollection(collection.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                selectedCollection === collection.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              {collection.name}
              <span className="ml-2 opacity-70">({collection.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search saved properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Properties Grid */}
      <AnimatePresence mode="wait">
        {filteredProperties.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredProperties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="relative group"
              >
                <PropertyCard property={property} />
                
                {/* Remove button overlay */}
                <button
                  onClick={() => handleRemoveFromWishlist(property.id)}
                  className="absolute top-3 right-3 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                  title="Remove from wishlist"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-xl p-12 text-center"
          >
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No properties found' : 'No saved properties yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm
                ? 'Try adjusting your search'
                : 'Start exploring and save your favorite properties!'}
            </p>
            {!searchTerm && (
              <Button asChild>
                <Link href="/search">
                  Browse Properties
                </Link>
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Collection Modal */}
      {showCreateCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-semibold mb-4">Create New Collection</h3>
            
            <div className="mb-4">
              <Label htmlFor="collectionName">Collection Name</Label>
              <Input
                id="collectionName"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="e.g., Dream Destinations"
                className="mt-1"
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowCreateCollection(false)
                  setNewCollectionName('')
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim()}
              >
                Create
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

import { Label } from '@/components/ui/label'
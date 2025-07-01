'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

const destinations = [
  {
    name: 'Amsterdam',
    country: 'Netherlands',
    properties: 1240,
    image: '/images/amsterdam.jpg',
    href: '/search?location=Amsterdam',
  },
  {
    name: 'Paris',
    country: 'France', 
    properties: 2150,
    image: '/images/paris.jpg',
    href: '/search?location=Paris',
  },
  {
    name: 'London',
    country: 'United Kingdom',
    properties: 1890,
    image: '/images/london.jpg',
    href: '/search?location=London',
  },
  {
    name: 'New York',
    country: 'United States',
    properties: 3200,
    image: '/images/newyork.jpg',
    href: '/search?location=New%20York',
  },
  {
    name: 'Tokyo',
    country: 'Japan',
    properties: 980,
    image: '/images/tokyo.jpg',
    href: '/search?location=Tokyo',
  },
  {
    name: 'Barcelona',
    country: 'Spain',
    properties: 1650,
    image: '/images/barcelona.jpg',
    href: '/search?location=Barcelona',
  },
]

export function PopularDestinations() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {destinations.map((destination, index) => (
        <motion.div
          key={destination.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Link 
            href={destination.href}
            className="group block relative overflow-hidden rounded-lg hover:shadow-lg transition-all duration-300"
          >
            <div className="relative h-40 bg-gray-200">
              <Image
                src={destination.image}
                alt={destination.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                onError={(e) => {
                  // Fallback to a placeholder if image fails to load
                  e.currentTarget.src = `https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop&crop=center&auto=format&q=60`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 text-white">
                <h3 className="font-semibold text-lg">{destination.name}</h3>
                <p className="text-sm text-white/80">{destination.country}</p>
                <p className="text-xs text-white/70">{destination.properties} properties</p>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
'use client'

import { SearchBar } from '@/components/search/SearchBar'
import { motion } from 'framer-motion'

export function HeroSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <SearchBar />
      
      {/* Popular searches */}
      <div className="mt-8 text-center">
        <p className="text-blue-100 mb-2">Popular searches:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {['Amsterdam', 'Paris', 'London', 'New York', 'Tokyo'].map((city) => (
            <button
              key={city}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
              onClick={() => {
                // Handle popular search click
                console.log(`Search for ${city}`)
              }}
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
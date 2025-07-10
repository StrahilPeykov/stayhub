'use client'

import { Suspense } from 'react'
import { motion } from 'framer-motion'
import { HeroSection } from '@/components/home/HeroSection'
import { FeaturedProperties } from '@/components/home/FeaturedProperties'
import { PopularDestinations } from '@/components/home/PopularDestinations'
import { TrustIndicators } from '@/components/home/TrustIndicators'
import { SearchBarSkeleton } from '@/components/ui/skeletons'
import { Testimonials } from '@/components/home/Testimonials'
import { Newsletter } from '@/components/home/Newsletter'
import { Shield, Star, Clock, ThumbsUp } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section with Search */}
      <section className="relative min-h-[600px] flex items-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1920&h=1080&fit=crop&crop=center')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white drop-shadow-lg">
              Find Your Perfect
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 drop-shadow-none">
                Stay
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/95 max-w-2xl mx-auto mb-6 drop-shadow-md">
              Discover amazing hotels, apartments, and unique accommodations around the world
            </p>
            
            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-6 text-white/90 text-sm mb-8">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Verified Properties</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-current" />
                <span>Best Price Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Free Cancellation</span>
              </div>
            </div>
          </motion.div>
          
          <Suspense fallback={<SearchBarSkeleton />}>
            <HeroSection />
          </Suspense>
        </div>
      </section>

      {/* Trust Indicators */}
      <TrustIndicators />

      {/* Popular Destinations */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Popular Destinations</h2>
            <p className="text-gray-600 text-lg">Explore trending cities around the world</p>
          </motion.div>
          <PopularDestinations />
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Featured Properties</h2>
            <p className="text-gray-600 text-lg">Hand-picked selections for your next adventure</p>
          </motion.div>
          <FeaturedProperties />
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* Why Choose Us */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Why Choose StayHub</h2>
            <p className="text-gray-600 text-lg">We make booking your perfect stay simple and secure</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <Newsletter />
    </div>
  )
}

const features = [
  {
    icon: Clock,
    title: '24/7 Support',
    description: 'Round-the-clock customer service in multiple languages to assist you anytime, anywhere',
  },
  {
    icon: Shield,
    title: 'Secure Booking',
    description: 'Your payments and personal data are always protected with bank-level encryption',
  },
  {
    icon: ThumbsUp,
    title: 'Best Price Guarantee',
    description: 'Find a lower price? We\'ll match it and give you an extra 10% off your booking',
  },
]
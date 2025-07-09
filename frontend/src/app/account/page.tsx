'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { 
  Calendar, 
  MapPin, 
  TrendingUp, 
  Clock,
  ChevronRight,
  Star,
  CreditCard,
  Award
} from 'lucide-react'
import { motion } from 'framer-motion'
import { bookingService } from '@/services/bookingService'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export default function AccountDashboard() {
  const { data: session } = useSession()

  // Fetch user's recent bookings
  const { data: bookingsData } = useQuery({
    queryKey: ['user-bookings', session?.user?.id],
    queryFn: () => bookingService.getUserBookings(session?.user?.id || '', 0, 5),
    enabled: !!session?.user?.id,
  })

  const recentBookings = bookingsData?.data || []

  // Mock stats - in a real app, these would come from an analytics endpoint
  const stats = {
    totalBookings: 24,
    upcomingTrips: 2,
    totalSpent: 4567,
    savedProperties: 15,
    memberSince: '2023',
    loyaltyPoints: 2340,
  }

  const quickActions = [
    {
      title: 'Find your next stay',
      description: 'Browse thousands of properties',
      icon: MapPin,
      href: '/search',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'View all bookings',
      description: 'Manage your trips',
      icon: Calendar,
      href: '/account/bookings',
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Saved properties',
      description: `${stats.savedProperties} properties saved`,
      icon: Star,
      href: '/account/wishlist',
      color: 'from-orange-500 to-orange-600',
    },
    {
      title: 'Loyalty rewards',
      description: `${stats.loyaltyPoints} points available`,
      icon: Award,
      href: '/account/rewards',
      color: 'from-green-500 to-green-600',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'Traveler'}!
        </h1>
        <p className="text-gray-600">
          Here's an overview of your StayHub account
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Total Bookings',
            value: stats.totalBookings,
            icon: Calendar,
            trend: '+12% from last year',
            trendUp: true,
          },
          {
            label: 'Upcoming Trips',
            value: stats.upcomingTrips,
            icon: Clock,
            subtext: 'Next: Paris in 2 weeks',
          },
          {
            label: 'Total Spent',
            value: formatCurrency(stats.totalSpent),
            icon: CreditCard,
            trend: 'This year',
          },
          {
            label: 'Member Since',
            value: stats.memberSince,
            icon: Award,
            subtext: 'Gold member',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center",
                "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
              )}>
                <stat.icon className="w-6 h-6" />
              </div>
              {stat.trendUp !== undefined && (
                <div className={cn(
                  "flex items-center gap-1 text-sm",
                  stat.trendUp ? "text-green-600" : "text-red-600"
                )}>
                  <TrendingUp className="w-4 h-4" />
                </div>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </h3>
            <p className="text-sm text-gray-500">{stat.label}</p>
            {stat.trend && (
              <p className="text-xs text-gray-400 mt-1">{stat.trend}</p>
            )}
            {stat.subtext && (
              <p className="text-xs text-gray-600 mt-1">{stat.subtext}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Link
                href={action.href}
                className="group block bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center text-white",
                    `bg-gradient-to-br ${action.color}`
                  )}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {action.description}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Bookings */}
      {recentBookings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Bookings
            </h2>
            <Link
              href="/account/bookings"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-4">
            {recentBookings.slice(0, 3).map((booking) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {booking.property?.name || 'Property Name'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Confirmation: {booking.confirmationCode}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
                      booking.status === 'CONFIRMED' && "bg-green-100 text-green-700",
                      booking.status === 'PENDING' && "bg-yellow-100 text-yellow-700",
                      booking.status === 'CANCELLED' && "bg-red-100 text-red-700",
                      booking.status === 'COMPLETED' && "bg-gray-100 text-gray-700"
                    )}>
                      {booking.status}
                    </div>
                    <Link
                      href={`/account/bookings/${booking.id}`}
                      className="block mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View details →
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recentBookings.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No bookings yet
          </h3>
          <p className="text-gray-500 mb-6">
            Start exploring and book your next adventure!
          </p>
          <Button asChild>
            <Link href="/search">
              Browse Properties
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
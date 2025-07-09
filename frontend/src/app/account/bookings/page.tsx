'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { format } from 'date-fns'
import { 
  Calendar,
  MapPin,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { bookingService } from '@/services/bookingService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { BookingStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const statusConfig = {
  [BookingStatus.CONFIRMED]: {
    label: 'Confirmed',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-700 border-green-200',
  },
  [BookingStatus.PENDING]: {
    label: 'Pending',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  [BookingStatus.CANCELLED]: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-red-100 text-red-700 border-red-200',
  },
  [BookingStatus.COMPLETED]: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  [BookingStatus.FAILED]: {
    label: 'Failed',
    icon: AlertCircle,
    color: 'bg-red-100 text-red-700 border-red-200',
  },
  [BookingStatus.EXPIRED]: {
    label: 'Expired',
    icon: Clock,
    color: 'bg-gray-100 text-gray-700 border-gray-200',
  },
}

export default function BookingsPage() {
  const { data: session } = useSession()
  const [currentPage, setCurrentPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all')
  const [dateFilter, setDateFilter] = useState<'upcoming' | 'past' | 'all'>('all')

  // Fetch bookings
  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['user-bookings', session?.user?.id, currentPage],
    queryFn: () => bookingService.getUserBookings(session?.user?.id || '', currentPage, 10),
    enabled: !!session?.user?.id,
  })

  const bookings = bookingsData?.data || []
  const totalPages = bookingsData?.totalPages || 1

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const matchesProperty = booking.property?.name.toLowerCase().includes(search)
      const matchesConfirmation = booking.confirmationCode.toLowerCase().includes(search)
      const matchesCity = booking.property?.address.city.toLowerCase().includes(search)
      
      if (!matchesProperty && !matchesConfirmation && !matchesCity) {
        return false
      }
    }

    // Status filter
    if (statusFilter !== 'all' && booking.status !== statusFilter) {
      return false
    }

    // Date filter
    const checkInDate = new Date(booking.checkIn)
    const now = new Date()
    
    if (dateFilter === 'upcoming' && checkInDate < now) {
      return false
    }
    if (dateFilter === 'past' && checkInDate >= now) {
      return false
    }

    return true
  })

  const handleExportBookings = () => {
    // In a real app, this would generate a PDF or CSV
    console.log('Exporting bookings...')
  }

  if (isLoading) {
    return <BookingsPageSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-600">
          View and manage all your bookings in one place
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by property name, city, or confirmation code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            {Object.values(BookingStatus).map((status) => (
              <option key={status} value={status}>
                {statusConfig[status].label}
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as 'upcoming' | 'past' | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Dates</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>

          {/* Export Button */}
          <Button
            variant="outline"
            onClick={handleExportBookings}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        {/* Active Filters */}
        {(statusFilter !== 'all' || dateFilter !== 'all' || searchTerm) && (
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-gray-500">Active filters:</span>
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  Search: {searchTerm}
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  Status: {statusConfig[statusFilter].label}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="ml-1 hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {dateFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {dateFilter === 'upcoming' ? 'Upcoming' : 'Past'} trips
                  <button
                    onClick={() => setDateFilter('all')}
                    className="ml-1 hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bookings List */}
      <AnimatePresence mode="wait">
        {filteredBookings.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {filteredBookings.map((booking, index) => {
              const StatusIcon = statusConfig[booking.status].icon
              const checkInDate = new Date(booking.checkIn)
              const checkOutDate = new Date(booking.checkOut)
              const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
              const isPast = checkInDate < new Date()

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={cn(
                    "bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow",
                    isPast && booking.status !== BookingStatus.CANCELLED && "opacity-75"
                  )}
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      {/* Property Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          {/* Property Image */}
                          <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={booking.property?.images?.[0]?.url || `https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=200&h=200&fit=crop`}
                              alt={booking.property?.name || 'Property'}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Details */}
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {booking.property?.name || 'Property Name'}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <MapPin className="w-4 h-4" />
                              <span>
                                {booking.property?.address.city}, {booking.property?.address.country}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">
                                  {format(checkInDate, 'MMM d')} - {format(checkOutDate, 'MMM d, yyyy')}
                                </span>
                              </div>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-600">
                                {nights} night{nights !== 1 ? 's' : ''}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-600">
                                {booking.numberOfRooms} room{booking.numberOfRooms !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Confirmation Code */}
                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg text-sm">
                          <span className="text-gray-600">Confirmation:</span>
                          <span className="font-mono font-semibold text-gray-900">
                            {booking.confirmationCode}
                          </span>
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex flex-col items-end gap-3">
                        {/* Status Badge */}
                        <div className={cn(
                          "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border",
                          statusConfig[booking.status].color
                        )}>
                          <StatusIcon className="w-4 h-4" />
                          {statusConfig[booking.status].label}
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {formatCurrency(booking.totalAmount, booking.currency)}
                          </div>
                          <div className="text-sm text-gray-500">Total paid</div>
                        </div>

                        {/* Action Button */}
                        <Link href={`/account/bookings/${booking.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-xl p-12 text-center"
          >
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No bookings found
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start exploring and book your next adventure!'}
            </p>
            {(!searchTerm && statusFilter === 'all' && dateFilter === 'all') && (
              <Button asChild>
                <Link href="/search">
                  Browse Properties
                </Link>
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={cn(
                  "w-8 h-8 rounded-md text-sm font-medium transition-colors",
                  currentPage === i
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

function BookingsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-9 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
        <div className="h-5 w-64 bg-gray-100 rounded animate-pulse" />
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex gap-4">
          <div className="flex-1 h-10 bg-gray-100 rounded-lg animate-pulse" />
          <div className="w-32 h-10 bg-gray-100 rounded-lg animate-pulse" />
          <div className="w-32 h-10 bg-gray-100 rounded-lg animate-pulse" />
          <div className="w-24 h-10 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>

      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
            <div className="flex gap-6">
              <div className="w-24 h-24 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-3">
                <div className="h-6 w-64 bg-gray-200 rounded" />
                <div className="h-4 w-48 bg-gray-100 rounded" />
                <div className="h-4 w-96 bg-gray-100 rounded" />
              </div>
              <div className="space-y-3">
                <div className="h-8 w-24 bg-gray-200 rounded-lg" />
                <div className="h-8 w-32 bg-gray-100 rounded" />
                <div className="h-9 w-28 bg-gray-200 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
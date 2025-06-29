'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useSession } from 'next-auth/react'
import { propertyService } from '@/services/propertyService'
import { bookingService } from '@/services/bookingService'
import { BookingForm } from '@/components/booking/BookingForm'
import { BookingSummary } from '@/components/booking/BookingSummary'
import { PropertyDetails } from '@/components/booking/PropertyDetails'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAnalytics } from '@/lib/hooks/useAnalytics'
import { useExperiment } from '@/lib/hooks/useExperiment'

export default function BookingPage({ params }: { params: { propertyId: string } }) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const { track } = useAnalytics()
  const { variant, trackConversion } = useExperiment('booking-flow')
  
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    roomTypeId: '',
    numberOfRooms: 1,
    numberOfGuests: 2,
    specialRequests: '',
  })
  
  // Fetch property details
  const { data: property, isLoading: propertyLoading } = useQuery({
    queryKey: ['property', params.propertyId],
    queryFn: () => propertyService.getPropertyById(params.propertyId),
  })
  
  // Fetch room types
  const { data: roomTypes, isLoading: roomTypesLoading } = useQuery({
    queryKey: ['roomTypes', params.propertyId],
    queryFn: () => bookingService.getRoomTypes(params.propertyId),
    enabled: !!params.propertyId,
  })
  
  // Check availability
  const { data: availability } = useQuery({
    queryKey: ['availability', params.propertyId, bookingData.roomTypeId, bookingData.checkIn, bookingData.checkOut],
    queryFn: () => bookingService.checkAvailability({
      propertyId: params.propertyId,
      roomTypeId: bookingData.roomTypeId,
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
    }),
    enabled: !!(bookingData.roomTypeId && bookingData.checkIn && bookingData.checkOut),
  })
  
  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: () => {
      if (!session?.user?.id) {
        throw new Error('Please sign in to complete your booking')
      }
      
      return bookingService.createBooking({
        propertyId: params.propertyId,
        userId: session.user.id,
        roomTypeId: bookingData.roomTypeId,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        numberOfRooms: bookingData.numberOfRooms,
        numberOfGuests: bookingData.numberOfGuests,
        specialRequests: bookingData.specialRequests,
      })
    },
    onSuccess: (booking) => {
      track('booking_completed', {
        booking_id: booking.id,
        property_id: params.propertyId,
        total_amount: booking.totalAmount,
        check_in: booking.checkIn,
        check_out: booking.checkOut,
      })
      
      trackConversion('completed', {
        booking_id: booking.id,
        amount: booking.totalAmount,
      })
      
      toast({
        title: 'Booking Confirmed!',
        description: `Your confirmation code is ${booking.confirmationCode}`,
      })
      
      router.push(`/booking/confirmation/${booking.id}`)
    },
    onError: (error: any) => {
      track('booking_failed', {
        property_id: params.propertyId,
        error: error.message,
      })
      
      toast({
        title: 'Booking Failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    },
  })
  
  const handleBookingSubmit = () => {
    if (!session) {
      router.push('/auth/login?redirect=/booking/' + params.propertyId)
      return
    }
    
    createBookingMutation.mutate()
  }
  
  if (propertyLoading || roomTypesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Property not found</h1>
          <Button onClick={() => router.push('/properties')}>
            Browse Properties
          </Button>
        </div>
      </div>
    )
  }
  
  // A/B test different booking flows
  if (variant === 'treatment') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Streamlined one-page checkout */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <PropertyDetails property={property} />
              <BookingForm
                roomTypes={roomTypes || []}
                bookingData={bookingData}
                onChange={setBookingData}
                availability={availability}
              />
            </div>
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <BookingSummary
                  property={property}
                  bookingData={bookingData}
                  roomTypes={roomTypes || []}
                  availability={availability}
                />
                <Button
                  className="w-full mt-4"
                  size="lg"
                  onClick={handleBookingSubmit}
                  disabled={
                    !bookingData.roomTypeId ||
                    !bookingData.checkIn ||
                    !bookingData.checkOut ||
                    createBookingMutation.isPending
                  }
                >
                  {createBookingMutation.isPending ? 'Processing...' : 'Complete Booking'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Control: Multi-step booking flow
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Complete Your Booking</h1>
        {/* Multi-step form implementation */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <PropertyDetails property={property} />
          <div className="mt-8">
            <BookingForm
              roomTypes={roomTypes || []}
              bookingData={bookingData}
              onChange={setBookingData}
              availability={availability}
            />
          </div>
          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
            <Button
              onClick={handleBookingSubmit}
              disabled={
                !bookingData.roomTypeId ||
                !bookingData.checkIn ||
                !bookingData.checkOut ||
                createBookingMutation.isPending
              }
            >
              {createBookingMutation.isPending ? 'Processing...' : 'Continue to Payment'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
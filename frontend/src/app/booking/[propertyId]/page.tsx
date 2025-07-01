'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Clock, CreditCard, CheckCircle } from 'lucide-react'
import { propertyService } from '@/services/propertyService'
import { bookingService } from '@/services/bookingService'
import { BookingForm } from '@/components/booking/BookingForm'
import { BookingSummary } from '@/components/booking/BookingSummary'
import { PropertyDetails } from '@/components/booking/PropertyDetails'
import { PaymentForm } from '@/components/booking/PaymentForm'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAnalytics } from '@/lib/hooks/useAnalytics'
import { useExperiment } from '@/lib/hooks/useExperiment'
import { generateIdempotencyKey } from '@/lib/utils'

const steps = [
  { id: 'details', label: 'Booking Details', icon: Clock },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'confirmation', label: 'Confirmation', icon: CheckCircle },
]

export default function BookingPage({ params }: { params: { propertyId: string } }) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const { track } = useAnalytics()
  const { variant, trackConversion } = useExperiment('booking-flow')
  
  const [currentStep, setCurrentStep] = useState(0)
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    roomTypeId: '',
    numberOfRooms: 1,
    numberOfGuests: 2,
    specialRequests: '',
  })
  
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
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
    mutationFn: async () => {
      if (!session?.user?.id) {
        throw new Error('Please sign in to complete your booking')
      }
      
      const idempotencyKey = generateIdempotencyKey('booking')
      
      // In a real app, you'd process payment first
      const booking = await bookingService.createBooking({
        propertyId: params.propertyId,
        userId: session.user.id,
        roomTypeId: bookingData.roomTypeId,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        numberOfRooms: bookingData.numberOfRooms,
        numberOfGuests: bookingData.numberOfGuests,
        specialRequests: bookingData.specialRequests,
        idempotencyKey,
      })
      
      return booking
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
      
      setCurrentStep(2) // Go to confirmation
    },
    onError: (error: any) => {
      track('booking_failed', {
        property_id: params.propertyId,
        error: error.message,
        step: currentStep,
      })
      
      toast({
        title: 'Booking Failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    },
  })
  
  const handleNextStep = () => {
    if (currentStep === 0) {
      // Validate booking details
      if (!bookingData.roomTypeId || !bookingData.checkIn || !bookingData.checkOut) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        })
        return
      }
      
      if (!session) {
        router.push(`/auth/login?redirect=/booking/${params.propertyId}`)
        return
      }
      
      track('booking_step_completed', {
        step: 'details',
        property_id: params.propertyId,
      })
      
      setCurrentStep(1)
    } else if (currentStep === 1) {
      // Process payment and create booking
      track('payment_initiated', {
        property_id: params.propertyId,
        amount: availability?.totalPrice,
      })
      
      createBookingMutation.mutate()
    }
  }
  
  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  if (propertyLoading || roomTypesLoading) {
    return <BookingPageSkeleton />
  }
  
  if (!property) {
    return <PropertyNotFound />
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'flex items-center',
                  index < steps.length - 1 && 'flex-1'
                )}
              >
                <div className="flex items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                      index <= currentStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    )}
                  >
                    {index < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'ml-3 font-medium hidden sm:block',
                      index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-4 transition-all',
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="grid lg:grid-cols-3 gap-8"
              >
                <div className="lg:col-span-2 space-y-6">
                  <PropertyDetails property={property} />
                  <BookingForm
                    roomTypes={roomTypes || []}
                    bookingData={bookingData}
                    onChange={setBookingData}
                    availability={availability}
                  />
                  
                  {/* Trust Indicators */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Shield className="w-6 h-6 text-blue-600" />
                      <h3 className="font-semibold text-blue-900">Booking Protection</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Free cancellation up to 24 hours before check-in</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Secure payment processing with SSL encryption</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>24/7 customer support in your language</span>
                      </li>
                    </ul>
                  </div>
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
                      onClick={handleNextStep}
                      disabled={
                        !bookingData.roomTypeId ||
                        !bookingData.checkIn ||
                        !bookingData.checkOut
                      }
                    >
                      Continue to Payment
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="grid lg:grid-cols-3 gap-8"
              >
                <div className="lg:col-span-2">
                  <PaymentForm
                    paymentData={paymentData}
                    onChange={setPaymentData}
                    totalAmount={availability?.totalPrice || 0}
                    currency={property.currency}
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
                    <div className="mt-4 space-y-3">
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handleNextStep}
                        disabled={createBookingMutation.isPending}
                      >
                        {createBookingMutation.isPending ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                          </span>
                        ) : (
                          'Complete Booking'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handlePreviousStep}
                        disabled={createBookingMutation.isPending}
                      >
                        Back
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && createBookingMutation.data && (
              <motion.div
                key="confirmation"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="max-w-2xl mx-auto text-center"
              >
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Booking Confirmed!
                  </h1>
                  <p className="text-lg text-gray-600 mb-6">
                    Thank you for your booking. We've sent a confirmation email to {session?.user?.email}
                  </p>
                  
                  <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <p className="text-sm text-gray-600 mb-2">Confirmation Code</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {createBookingMutation.data.confirmationCode}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => router.push('/account/bookings')}
                    >
                      View My Bookings
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push('/')}
                    >
                      Back to Home
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function BookingPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-10 w-full max-w-3xl mx-auto" />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-80 w-full rounded-xl" />
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

function PropertyNotFound() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4">Property not found</h1>
        <p className="text-gray-600 mb-6">The property you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => router.push('/properties')}>
          Browse Properties
        </Button>
      </div>
    </div>
  )
}

import { Skeleton } from '@/components/ui/skeleton'

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
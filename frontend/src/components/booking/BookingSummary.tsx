'use client'

import { Property, RoomType, AvailabilityResponse } from '@/lib/types'
import { formatCurrency, calculateNights } from '@/lib/utils'
import { format } from 'date-fns'

interface BookingSummaryProps {
  property: Property
  bookingData: {
    checkIn: string
    checkOut: string
    roomTypeId: string
    numberOfRooms: number
    numberOfGuests: number
  }
  roomTypes: RoomType[]
  availability?: AvailabilityResponse
}

export function BookingSummary({ property, bookingData, roomTypes, availability }: BookingSummaryProps) {
  const selectedRoomType = roomTypes.find(rt => rt.id === bookingData.roomTypeId)
  
  const checkInDate = bookingData.checkIn ? new Date(bookingData.checkIn) : null
  const checkOutDate = bookingData.checkOut ? new Date(bookingData.checkOut) : null
  const nights = checkInDate && checkOutDate ? calculateNights(checkInDate, checkOutDate) : 0
  
  const roomTotal = selectedRoomType ? selectedRoomType.basePrice * bookingData.numberOfRooms * nights : 0
  const taxes = roomTotal * 0.15 // 15% taxes
  const total = roomTotal + taxes

  if (!selectedRoomType) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
        <p className="text-gray-500">Select a room type to see pricing</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
      <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
      
      {/* Property Info */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <h3 className="font-medium">{property.name}</h3>
        <p className="text-sm text-gray-600">
          {property.address.city}, {property.address.country}
        </p>
      </div>

      {/* Room & Dates Info */}
      <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
        <div>
          <div className="font-medium">{selectedRoomType.name}</div>
          <div className="text-sm text-gray-600">
            {bookingData.numberOfRooms} room{bookingData.numberOfRooms !== 1 ? 's' : ''} × {nights} night{nights !== 1 ? 's' : ''}
          </div>
        </div>
        
        {checkInDate && checkOutDate && (
          <div className="text-sm">
            <div>Check-in: {format(checkInDate, 'MMM dd, yyyy')}</div>
            <div>Check-out: {format(checkOutDate, 'MMM dd, yyyy')}</div>
          </div>
        )}
        
        <div className="text-sm">
          {bookingData.numberOfGuests} guest{bookingData.numberOfGuests !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
        <div className="flex justify-between">
          <span>{formatCurrency(selectedRoomType.basePrice)} × {bookingData.numberOfRooms} room × {nights} nights</span>
          <span>{formatCurrency(roomTotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Taxes & fees</span>
          <span>{formatCurrency(taxes)}</span>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between text-lg font-semibold">
        <span>Total</span>
        <span>{formatCurrency(total)}</span>
      </div>

      {/* Cancellation Policy */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          <div className="font-medium mb-1">Cancellation Policy</div>
          <div>Free cancellation until 24 hours before check-in</div>
        </div>
      </div>
    </div>
  )
}
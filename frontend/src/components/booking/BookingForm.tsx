'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { GuestSelector } from '@/components/search/GuestSelector'
import { RoomType, AvailabilityResponse } from '@/lib/types'
import { format } from 'date-fns'

interface BookingFormProps {
  roomTypes: RoomType[]
  bookingData: {
    checkIn: string
    checkOut: string
    roomTypeId: string
    numberOfRooms: number
    numberOfGuests: number
    specialRequests: string
  }
  onChange: (data: any) => void
  availability?: AvailabilityResponse
}

export function BookingForm({ roomTypes, bookingData, onChange, availability }: BookingFormProps) {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: bookingData.checkIn ? new Date(bookingData.checkIn) : undefined,
    to: bookingData.checkOut ? new Date(bookingData.checkOut) : undefined,
  })

  const handleDateChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange(range)
    onChange({
      ...bookingData,
      checkIn: range.from ? format(range.from, 'yyyy-MM-dd') : '',
      checkOut: range.to ? format(range.to, 'yyyy-MM-dd') : '',
    })
  }

  const selectedRoomType = roomTypes.find(rt => rt.id === bookingData.roomTypeId)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Booking Details</h2>
      </div>

      {/* Room Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Room Type
        </label>
        <div className="grid gap-3">
          {roomTypes.map((roomType) => (
            <div
              key={roomType.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                bookingData.roomTypeId === roomType.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onChange({ ...bookingData, roomTypeId: roomType.id })}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{roomType.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{roomType.description}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Max occupancy: {roomType.maxOccupancy} guests
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">€{roomType.basePrice}</div>
                  <div className="text-sm text-gray-500">per night</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dates */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Check-in & Check-out
        </label>
        <DateRangePicker
          value={dateRange}
          onChange={handleDateChange}
          minDate={new Date()}
          placeholder="Select your dates"
        />
      </div>

      {/* Guests and Rooms */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Guests & Rooms
          </label>
          <GuestSelector
            guests={bookingData.numberOfGuests}
            rooms={bookingData.numberOfRooms}
            onGuestsChange={(guests) => onChange({ ...bookingData, numberOfGuests: guests })}
            onRoomsChange={(rooms) => onChange({ ...bookingData, numberOfRooms: rooms })}
          />
        </div>
      </div>

      {/* Special Requests */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Special Requests (Optional)
        </label>
        <textarea
          value={bookingData.specialRequests}
          onChange={(e) => onChange({ ...bookingData, specialRequests: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Any special requests or preferences..."
        />
      </div>

      {/* Availability Info */}
      {availability && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-800 mb-2">✓ Available</h3>
          <p className="text-sm text-green-700">
            {availability.availableRooms} of {availability.totalRooms} rooms available for your dates
          </p>
          {availability.availableRooms < bookingData.numberOfRooms && (
            <p className="text-sm text-orange-600 mt-1">
              ⚠️ Only {availability.availableRooms} rooms available, but you requested {bookingData.numberOfRooms}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
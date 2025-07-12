'use client'

import { useState, useRef, useEffect } from 'react'
import { Minus, Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface GuestSelectorProps {
  guests: number
  rooms: number
  onGuestsChange: (guests: number) => void
  onRoomsChange: (rooms: number) => void
  className?: string
  maxGuests?: number
  maxRooms?: number
  disabled?: boolean
  showInfants?: boolean
  showPets?: boolean
}

export function GuestSelector({
  guests,
  rooms,
  onGuestsChange,
  onRoomsChange,
  className,
  maxGuests = 16,
  maxRooms = 8,
  disabled = false,
  showInfants = false,
  showPets = false
}: GuestSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [adults, setAdults] = useState(Math.max(1, guests - 0)) // Assuming all guests are adults initially
  const [children, setChildren] = useState(0)
  const [infants, setInfants] = useState(0)
  const [pets, setPets] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  // Update total guests when individual counts change
  useEffect(() => {
    const totalGuests = adults + children + (showInfants ? 0 : infants) // Infants typically don't count toward guest limit
    onGuestsChange(totalGuests)
  }, [adults, children, infants, onGuestsChange, showInfants])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Initialize counts from props
  useEffect(() => {
    if (guests >= 1) {
      setAdults(Math.max(1, guests))
      setChildren(0)
    }
  }, [guests])

  const handleAdultsChange = (newAdults: number) => {
    const minAdults = 1
    const maxAdultsAllowed = Math.max(minAdults, maxGuests - children)
    const validAdults = Math.max(minAdults, Math.min(newAdults, maxAdultsAllowed))
    setAdults(validAdults)
  }

  const handleChildrenChange = (newChildren: number) => {
    const maxChildrenAllowed = Math.max(0, maxGuests - adults)
    const validChildren = Math.max(0, Math.min(newChildren, maxChildrenAllowed))
    setChildren(validChildren)
  }

  const handleInfantsChange = (newInfants: number) => {
    const validInfants = Math.max(0, Math.min(newInfants, adults)) // Max 1 infant per adult
    setInfants(validInfants)
  }

  const handlePetsChange = (newPets: number) => {
    const validPets = Math.max(0, Math.min(newPets, 5)) // Reasonable pet limit
    setPets(validPets)
  }

  const handleRoomsChange = (newRooms: number) => {
    const validRooms = Math.max(1, Math.min(newRooms, maxRooms))
    onRoomsChange(validRooms)
  }

  const totalGuests = adults + children
  const guestText = totalGuests === 1 ? '1 guest' : `${totalGuests} guests`
  const roomText = rooms === 1 ? '1 room' : `${rooms} rooms`

  if (disabled) {
    return (
      <div className={cn("text-gray-500", className)}>
        {guestText}, {roomText}
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Trigger */}
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "cursor-pointer",
          className
        )}
      >
        <span className="text-sm text-gray-900">
          {guestText}, {roomText}
        </span>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 min-w-[320px] p-4"
        >
          <div className="space-y-6">
            {/* Adults */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Adults</div>
                <div className="text-sm text-gray-500">Ages 13 or above</div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAdultsChange(adults - 1)}
                  disabled={adults <= 1}
                  className="w-8 h-8 p-0 rounded-full"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center font-medium">{adults}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAdultsChange(adults + 1)}
                  disabled={adults >= maxGuests - children}
                  className="w-8 h-8 p-0 rounded-full"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Children */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Children</div>
                <div className="text-sm text-gray-500">Ages 2-12</div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleChildrenChange(children - 1)}
                  disabled={children <= 0}
                  className="w-8 h-8 p-0 rounded-full"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center font-medium">{children}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleChildrenChange(children + 1)}
                  disabled={children >= maxGuests - adults}
                  className="w-8 h-8 p-0 rounded-full"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Infants */}
            {showInfants && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Infants</div>
                  <div className="text-sm text-gray-500">Under 2</div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleInfantsChange(infants - 1)}
                    disabled={infants <= 0}
                    className="w-8 h-8 p-0 rounded-full"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{infants}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleInfantsChange(infants + 1)}
                    disabled={infants >= adults}
                    className="w-8 h-8 p-0 rounded-full"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Pets */}
            {showPets && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Pets</div>
                  <div className="text-sm text-gray-500">Service animals welcome</div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePetsChange(pets - 1)}
                    disabled={pets <= 0}
                    className="w-8 h-8 p-0 rounded-full"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{pets}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePetsChange(pets + 1)}
                    disabled={pets >= 5}
                    className="w-8 h-8 p-0 rounded-full"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Rooms */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div>
                <div className="font-medium text-gray-900">Rooms</div>
                <div className="text-sm text-gray-500">How many rooms do you need?</div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRoomsChange(rooms - 1)}
                  disabled={rooms <= 1}
                  className="w-8 h-8 p-0 rounded-full"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center font-medium">{rooms}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRoomsChange(rooms + 1)}
                  disabled={rooms >= maxRooms}
                  className="w-8 h-8 p-0 rounded-full"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Info text */}
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">Guest limits may vary by property</p>
                  <p>Some properties have specific limits on the number of guests per room or total occupancy.</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

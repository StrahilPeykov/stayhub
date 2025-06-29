'use client'

import { useState } from 'react'
import { Minus, Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface GuestSelectorProps {
  guests: number
  rooms: number
  onGuestsChange: (guests: number) => void
  onRoomsChange: (rooms: number) => void
}

export function GuestSelector({ guests, rooms, onGuestsChange, onRoomsChange }: GuestSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <Users className="w-4 h-4 mr-2" />
          <span>
            {guests} guest{guests !== 1 ? 's' : ''}, {rooms} room{rooms !== 1 ? 's' : ''}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="start">
        <div className="p-4 space-y-4">
          {/* Guests */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Guests</div>
              <div className="text-sm text-gray-500">Adults and children</div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => onGuestsChange(Math.max(1, guests - 1))}
                disabled={guests <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center">{guests}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => onGuestsChange(Math.min(16, guests + 1))}
                disabled={guests >= 16}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Rooms */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Rooms</div>
              <div className="text-sm text-gray-500">Number of rooms needed</div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => onRoomsChange(Math.max(1, rooms - 1))}
                disabled={rooms <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center">{rooms}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => onRoomsChange(Math.min(8, rooms + 1))}
                disabled={rooms >= 8}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
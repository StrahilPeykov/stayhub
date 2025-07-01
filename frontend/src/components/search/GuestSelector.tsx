'use client'

import { useState, useRef, useEffect } from 'react'
import { Minus, Plus, Users, Home, Baby, Dog } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface GuestSelectorProps {
  guests: number
  rooms: number
  onGuestsChange: (guests: number) => void
  onRoomsChange: (rooms: number) => void
  className?: string
  allowChildren?: boolean
  allowPets?: boolean
}

interface GuestType {
  id: string
  label: string
  sublabel?: string
  icon: any
  count: number
  min: number
  max: number
}

export function GuestSelector({ 
  guests, 
  rooms, 
  onGuestsChange, 
  onRoomsChange,
  className,
  allowChildren = true,
  allowPets = true
}: GuestSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [guestTypes, setGuestTypes] = useState<GuestType[]>([
    {
      id: 'adults',
      label: 'Adults',
      sublabel: 'Ages 13 or above',
      icon: Users,
      count: guests,
      min: 1,
      max: 16,
    },
    {
      id: 'children',
      label: 'Children',
      sublabel: 'Ages 2-12',
      icon: Baby,
      count: 0,
      min: 0,
      max: 8,
    },
    {
      id: 'pets',
      label: 'Pets',
      sublabel: 'Bringing a service animal?',
      icon: Dog,
      count: 0,
      min: 0,
      max: 2,
    },
  ])
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const updateGuestType = (id: string, delta: number) => {
    setGuestTypes(prev => {
      const updated = prev.map(type => {
        if (type.id === id) {
          const newCount = Math.max(type.min, Math.min(type.max, type.count + delta))
          return { ...type, count: newCount }
        }
        return type
      })
      
      // Update total guests
      const totalGuests = updated
        .filter(t => t.id === 'adults' || t.id === 'children')
        .reduce((sum, t) => sum + t.count, 0)
      onGuestsChange(totalGuests)
      
      return updated
    })
  }

  const getTotalGuests = () => {
    return guestTypes
      .filter(t => t.id === 'adults' || t.id === 'children')
      .reduce((sum, t) => sum + t.count, 0)
  }

  const getPetCount = () => {
    return guestTypes.find(t => t.id === 'pets')?.count || 0
  }

  const getSummaryText = () => {
    const totalGuests = getTotalGuests()
    const petCount = getPetCount()
    
    let text = `${totalGuests} guest${totalGuests !== 1 ? 's' : ''}, ${rooms} room${rooms !== 1 ? 's' : ''}`
    
    if (petCount > 0) {
      text += `, ${petCount} pet${petCount !== 1 ? 's' : ''}`
    }
    
    return text
  }

  return (
    <div className={cn("relative", className)}>
      <div
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 cursor-pointer w-full"
      >
        <Users className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <span className="text-gray-900 flex-1 text-left">
          {getSummaryText()}
        </span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl min-w-[320px] overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Room Selector */}
              <div className="pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Home className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Rooms</div>
                      <div className="text-sm text-gray-500">How many rooms do you need?</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => onRoomsChange(Math.max(1, rooms - 1))}
                      disabled={rooms <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{rooms}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => onRoomsChange(Math.min(10, rooms + 1))}
                      disabled={rooms >= 10}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Guest Types */}
              {guestTypes
                .filter(type => {
                  if (type.id === 'children' && !allowChildren) return false
                  if (type.id === 'pets' && !allowPets) return false
                  return true
                })
                .map((type, index) => (
                  <motion.div
                    key={type.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        type.id === 'adults' && "bg-blue-100 text-blue-600",
                        type.id === 'children' && "bg-green-100 text-green-600",
                        type.id === 'pets' && "bg-orange-100 text-orange-600"
                      )}>
                        <type.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{type.label}</div>
                        {type.sublabel && (
                          <div className="text-sm text-gray-500">{type.sublabel}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => updateGuestType(type.id, -1)}
                        disabled={type.count <= type.min}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-medium">{type.count}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => updateGuestType(type.id, 1)}
                        disabled={type.count >= type.max}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}

              {/* Info Message */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Maximum occupancy varies by property. Age requirements may apply for certain room types.
                </p>
              </div>

              {/* Apply Button */}
              <Button
                onClick={() => setIsOpen(false)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                Apply
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
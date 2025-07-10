'use client'

import { useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isAfter, isBefore, isToday } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface DateRangePickerProps {
  value: {
    from: Date | undefined
    to: Date | undefined
  }
  onChange: (value: { from: Date | undefined; to: Date | undefined }) => void
  minDate?: Date
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DateRangePicker({ value, onChange, minDate, placeholder = "Select dates", className, disabled }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selecting, setSelecting] = useState<'from' | 'to' | null>(null)

  const formatDateRange = () => {
    if (!value.from && !value.to) return placeholder
    if (value.from && !value.to) return format(value.from, 'MMM dd')
    if (value.from && value.to) {
      if (isSameMonth(value.from, value.to) && value.from.getFullYear() === value.to.getFullYear()) {
        return `${format(value.from, 'MMM dd')} - ${format(value.to, 'dd')}`
      }
      return `${format(value.from, 'MMM dd')} - ${format(value.to, 'MMM dd')}`
    }
    return placeholder
  }

  const handleDateClick = (date: Date) => {
    if (minDate && isBefore(date, minDate)) return

    if (!value.from || (value.from && value.to)) {
      // Start new selection
      onChange({ from: date, to: undefined })
      setSelecting('to')
    } else if (value.from && !value.to) {
      // Complete selection
      if (isBefore(date, value.from)) {
        onChange({ from: date, to: value.from })
      } else {
        onChange({ from: value.from, to: date })
      }
      setSelecting(null)
      setIsOpen(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const start = startOfWeek(startOfMonth(date))
    const end = endOfWeek(endOfMonth(date))
    const days = []
    let day = start

    while (day <= end) {
      days.push(day)
      day = addDays(day, 1)
    }

    return days
  }

  const isInRange = (date: Date) => {
    if (!value.from || !value.to) return false
    return isAfter(date, value.from) && isBefore(date, value.to)
  }

  const isRangeStart = (date: Date) => {
    return value.from && isSameDay(date, value.from)
  }

  const isRangeEnd = (date: Date) => {
    return value.to && isSameDay(date, value.to)
  }

  const isDisabled = (date: Date) => {
    return minDate ? isBefore(date, minDate) : false
  }

  const renderCalendar = (monthOffset: number = 0) => {
    const displayMonth = addMonths(currentMonth, monthOffset)
    const days = getDaysInMonth(displayMonth)
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

    return (
      <div className="p-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          {monthOffset === 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="h-8 w-8 hover:bg-gray-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <h3 className="font-semibold text-base text-gray-900">
            {format(displayMonth, 'MMMM yyyy')}
          </h3>
          {monthOffset === 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="h-8 w-8 hover:bg-gray-100"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {monthOffset === 0 && (
            <div className="w-8" /> // Spacer for alignment
          )}
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="h-8 w-8 flex items-center justify-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, displayMonth)
            const isSelected = isRangeStart(day) || isRangeEnd(day)
            const isInDateRange = isInRange(day)
            const isDisabledDate = isDisabled(day)
            const isTodayDate = isToday(day)

            return (
              <button
                key={index}
                onClick={() => handleDateClick(day)}
                disabled={isDisabledDate}
                className={cn(
                  "h-8 w-8 rounded-md text-sm font-medium transition-all duration-200",
                  "hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  isCurrentMonth ? "text-gray-900" : "text-gray-400",
                  isSelected && "bg-blue-600 text-white hover:bg-blue-700 shadow-md",
                  isInDateRange && !isSelected && "bg-blue-100 text-blue-900",
                  isTodayDate && !isSelected && !isInDateRange && "bg-gray-100 font-semibold ring-1 ring-gray-300",
                  isDisabledDate && "opacity-50 cursor-not-allowed hover:bg-transparent"
                )}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center cursor-pointer">
          <span className={cn(
            "text-sm font-medium",
            (!value.from && !value.to) ? "text-gray-400" : "text-gray-900"
          )}>
            {formatDateRange()}
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-auto p-0 bg-white border border-gray-200 shadow-xl rounded-xl" 
        align="start"
        sideOffset={8}
      >
        <div className="flex border-b border-gray-100">
          {renderCalendar(0)}
          <div className="border-l border-gray-200">
            {renderCalendar(1)}
          </div>
        </div>
        
        {/* Footer with quick actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const today = new Date()
                  const tomorrow = addDays(today, 1)
                  onChange({ from: today, to: tomorrow })
                  setIsOpen(false)
                }}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Tonight
              </button>
              <button
                onClick={() => {
                  const today = new Date()
                  const nextWeek = addDays(today, 7)
                  onChange({ from: today, to: nextWeek })
                  setIsOpen(false)
                }}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                This week
              </button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange({ from: undefined, to: undefined })
                setIsOpen(false)
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
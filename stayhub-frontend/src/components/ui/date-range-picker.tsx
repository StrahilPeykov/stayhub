// src/components/ui/date-range-picker.tsx
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
}

export function DateRangePicker({ value, onChange, minDate, placeholder = "Select dates" }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selecting, setSelecting] = useState<'from' | 'to' | null>(null)

  const formatDateRange = () => {
    if (!value.from && !value.to) return placeholder
    if (value.from && !value.to) return format(value.from, 'MMM dd')
    if (value.from && value.to) {
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
      <div className="p-3">
        <div className="flex items-center justify-between mb-4">
          {monthOffset === 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <h3 className="font-medium text-sm">
            {format(displayMonth, 'MMMM yyyy')}
          </h3>
          {monthOffset === 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
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
                  "h-8 w-8 rounded-md text-xs font-medium transition-colors",
                  "hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                  isCurrentMonth ? "text-gray-900" : "text-gray-400",
                  isSelected && "bg-blue-600 text-white hover:bg-blue-700",
                  isInDateRange && !isSelected && "bg-blue-100 text-blue-900",
                  isTodayDate && !isSelected && "bg-gray-100 font-semibold",
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
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <Calendar className="w-4 h-4 mr-2" />
          <span>{formatDateRange()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto p-0" align="start">
        <div className="flex">
          {renderCalendar(0)}
          <div className="border-l border-gray-200">
            {renderCalendar(1)}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
'use client'

import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { startOfYear, addMonths, getDaysInMonth, startOfMonth, getDay, differenceInWeeks, startOfWeek } from 'date-fns'
import { useRouter } from 'next/navigation'

export default function YearView() {
  const { events, language, setWeekOffset } = useStore()
  const t = useTranslation(language)
  const router = useRouter()
  const year = new Date().getFullYear()
  const months = Array.from({ length: 12 }, (_, i) => addMonths(startOfYear(new Date()), i))

  const getMonthGrid = (monthDate: Date) => {
    const daysInMonth = getDaysInMonth(monthDate)
    const firstDay = getDay(startOfMonth(monthDate))
    const startOffset = firstDay === 0 ? 6 : firstDay - 1 // monday = 0
    
    const days = []
    for (let i = 0; i < startOffset; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const getEventsForDate = (monthIndex: number, day: number) => {
    const date = new Date(year, monthIndex, day)
    const dayOfWeek = getDay(date)
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Monday = 0
    
    // Calculate week offset from current week
    const now = new Date()
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 })
    const targetWeekStart = startOfWeek(date, { weekStartsOn: 1 })
    const weekOffset = differenceInWeeks(targetWeekStart, currentWeekStart)
    
    return events.filter(e => 
      e.day === adjustedDay && 
      (e.week || 0) === weekOffset
    )
  }

  const handleDayClick = (monthIndex: number, day: number) => {
    const date = new Date(year, monthIndex, day)
    const now = new Date()
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 })
    const targetWeekStart = startOfWeek(date, { weekStartsOn: 1 })
    const weekOffset = differenceInWeeks(targetWeekStart, currentWeekStart)
    
    setWeekOffset(weekOffset)
    router.push('/')
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {months.map((monthDate, idx) => (
        <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
          <h3 className="font-medium text-center mb-2 md:mb-3 text-gray-900 text-sm md:text-base">
            {t.year.months[idx]}
          </h3>
          
          <div className="grid grid-cols-7 gap-0.5 md:gap-1 text-[10px] md:text-xs">
            {t.year.daysShort.map(day => (
              <div key={day} className="text-center font-medium text-gray-500 text-[9px] md:text-xs">
                {day}
              </div>
            ))}
            
            {getMonthGrid(monthDate).map((day, i) => {
              const dayEvents = day ? getEventsForDate(idx, day) : []
              
              return (
                <div
                  key={i}
                  className={`aspect-square flex flex-col items-center justify-center rounded relative ${
                    day
                      ? 'hover:bg-gray-100 active:bg-gray-200 cursor-pointer text-gray-700'
                      : ''
                  }`}
                  onClick={() => day && handleDayClick(idx, day)}
                >
                  {day && (
                    <>
                      <div className="text-[10px] md:text-sm">{day}</div>
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {dayEvents.slice(0, 3).map((event, eventIdx) => (
                            <div
                              key={eventIdx}
                              className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full"
                              style={{ backgroundColor: event.color || '#2563eb' }}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}


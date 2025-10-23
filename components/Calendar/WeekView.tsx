'use client'

import { useStore } from '@/lib/store'
import { getWeekDates, formatDayName, formatDayDate } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'
import EventBlock from './EventBlock'
import AddEventModal from './AddEventModal'
import HydrationBoundary from '@/components/HydrationBoundary'
import { useState } from 'react'

export default function WeekView() {
  const { events, currentWeekOffset, deleteEvent, setWeekOffset, language, calendarStartHour, calendarEndHour } = useStore()
  const t = useTranslation(language)
  const dates = getWeekDates(currentWeekOffset)
  const [selectedCell, setSelectedCell] = useState<{ day: number; hour: number } | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [preselectedDay, setPreselectedDay] = useState<number | undefined>(undefined)
  const [preselectedHour, setPreselectedHour] = useState<number | undefined>(undefined)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  
  const hours = Array.from({ length: calendarEndHour - calendarStartHour }, (_, i) => i + calendarStartHour)
  
  const getEventsForDay = (dayIndex: number) => {
    return events.filter(e => e.day === dayIndex && (e.week || 0) === currentWeekOffset)
  }

  // Calculate approximate characters per line based on card width
  // Card width is roughly (container width - time column - gaps) / 7 days
  // Assuming average character width of ~7px and card padding
  const getCharsPerLine = () => {
    // Rough estimate: ~20-25 chars per line for typical calendar column
    return 25
  }

  // Calculate row heights for all hours
  const getRowHeight = (hour: number) => {
    let maxHeight = 60 // base height
    
    // Check all days for this hour
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      // Find events that START in this hour
      const eventsStartingHere = getEventsForDay(dayIdx).filter(e => e.startTime === hour)
      
      eventsStartingHere.forEach(event => {
        // Calculate total content height needed
        let contentHeight = 60 // base content (title + time + padding)
        
        if (event.description) {
          const charsPerLine = getCharsPerLine()
          const descLines = Math.ceil(event.description.length / charsPerLine)
          contentHeight += descLines * 18 // 18px per line of description
        }
        
        // Event spans multiple hours
        const eventDuration = (event.endTime - event.startTime) * 60
        
        // If content needs more space than event duration, expand this row
        if (contentHeight > eventDuration) {
          const neededHeight = contentHeight
          maxHeight = Math.max(maxHeight, neededHeight)
        } else {
          // Content fits in event duration, no extra height needed in this row
          maxHeight = Math.max(maxHeight, 60)
        }
      })
    }
    
    return maxHeight
  }

  const handleCellClick = (day: number, hour: number) => {
    setPreselectedDay(day)
    setPreselectedHour(hour)
    setIsModalOpen(true)
  }

  const handleAddEventClick = () => {
    setPreselectedDay(undefined)
    setPreselectedHour(undefined)
    setEditingEvent(null)
    setIsModalOpen(true)
  }

  const handleEditEvent = (event: any) => {
    setEditingEvent(event)
    setIsModalOpen(true)
  }

  return (
    <HydrationBoundary>
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* week navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200 gap-3">
        <button
          onClick={() => setWeekOffset(currentWeekOffset - 1)}
          className="px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-100 transition w-full sm:w-auto"
        >
          {t.week.prev}
        </button>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="text-gray-900 font-medium text-sm sm:text-base text-center">
            {currentWeekOffset === 0 ? t.week.thisWeek : `${currentWeekOffset > 0 ? '+' : ''}${currentWeekOffset} ${t.week.weekOffset}`}
          </div>
          <button
            onClick={handleAddEventClick}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition w-full sm:w-auto"
          >
            + {t.eventModal.title}
          </button>
        </div>
        <button
          onClick={() => setWeekOffset(currentWeekOffset + 1)}
          className="px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-100 transition w-full sm:w-auto"
        >
          {t.week.next}
        </button>
      </div>

      <div className="flex overflow-x-auto">
        {/* time column */}
        <div className="w-12 sm:w-16 flex-shrink-0 border-r">
          <div className="h-12 sm:h-16 border-b"></div>
          {hours.map(hour => (
            <div 
              key={hour} 
              className="border-b flex items-start justify-center pt-1"
              style={{ height: `${getRowHeight(hour)}px` }}
            >
              <span className="text-[10px] sm:text-xs text-gray-500">{hour}:00</span>
            </div>
          ))}
        </div>

        {/* days grid */}
        <div className="flex-1 flex min-w-[600px] sm:min-w-0">
          {dates.map((date, dayIdx) => (
            <div key={dayIdx} className="flex-1 border-r last:border-r-0 min-w-[80px] sm:min-w-0">
              {/* day header */}
              <div className="h-12 sm:h-16 border-b flex flex-col items-center justify-center bg-gray-50 px-1">
                <div className="font-bold text-[10px] sm:text-sm truncate w-full text-center">{formatDayName(date, language)}</div>
                <div className="text-[9px] sm:text-xs text-gray-600">{formatDayDate(date, language)}</div>
              </div>
              
              {/* hours for this day */}
              <div className="relative">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="border-b hover:bg-gray-50 transition cursor-pointer"
                    style={{ height: `${getRowHeight(hour)}px` }}
                    onClick={() => handleCellClick(dayIdx, hour)}
                  />
                ))}
                
                {/* events overlay */}
                {(() => {
                  const dayEvents = getEventsForDay(dayIdx)
                  
                  // Helper: check if two events overlap
                  const eventsOverlap = (e1: any, e2: any) => {
                    const start1 = e1.startTime * 60 + (e1.startMinute || 0)
                    const end1 = e1.endTime * 60 + (e1.endMinute || 0)
                    const start2 = e2.startTime * 60 + (e2.startMinute || 0)
                    const end2 = e2.endTime * 60 + (e2.endMinute || 0)
                    return start1 < end2 && start2 < end1
                  }
                  
                  // Group overlapping events together
                  const groups: any[][] = []
                  const processed = new Set<string>()
                  
                  dayEvents.forEach(event => {
                    if (processed.has(event.id)) return
                    
                    // Find all events that overlap with this one (directly or transitively)
                    const group = [event]
                    processed.add(event.id)
                    
                    let changed = true
                    while (changed) {
                      changed = false
                      dayEvents.forEach(e => {
                        if (processed.has(e.id)) return
                        // Check if this event overlaps with any event in the current group
                        if (group.some(groupEvent => eventsOverlap(e, groupEvent))) {
                          group.push(e)
                          processed.add(e.id)
                          changed = true
                        }
                      })
                    }
                    
                    groups.push(group)
                  })
                  
                  // Assign columns within each group
                  const eventColumns: Map<string, { columnIndex: number; totalColumns: number }> = new Map()
                  
                  groups.forEach(group => {
                    if (group.length === 1) {
                      // Single event, no overlap - full width
                      eventColumns.set(group[0].id, { columnIndex: 0, totalColumns: 1 })
                    } else {
                      // Sort group by start time
                      group.sort((a, b) => {
                        const startA = a.startTime * 60 + (a.startMinute || 0)
                        const startB = b.startTime * 60 + (b.startMinute || 0)
                        return startA - startB
                      })
                      
                      // Assign columns using greedy algorithm
                      const columns: any[][] = []
                      
                      group.forEach(event => {
                        const eventStart = event.startTime * 60 + (event.startMinute || 0)
                        
                        // Find first column where this event fits (no overlap)
                        let columnIndex = -1
                        for (let i = 0; i < columns.length; i++) {
                          const lastEventInColumn = columns[i][columns[i].length - 1]
                          const lastEnd = lastEventInColumn.endTime * 60 + (lastEventInColumn.endMinute || 0)
                          
                          if (eventStart >= lastEnd) {
                            // Fits in this column
                            columnIndex = i
                            columns[i].push(event)
                            break
                          }
                        }
                        
                        if (columnIndex === -1) {
                          // Need new column
                          columnIndex = columns.length
                          columns.push([event])
                        }
                        
                        eventColumns.set(event.id, { columnIndex, totalColumns: 0 }) // Will update totalColumns later
                      })
                      
                      // Update totalColumns for all events in this group
                      const totalColumns = columns.length
                      group.forEach(event => {
                        const col = eventColumns.get(event.id)!
                        eventColumns.set(event.id, { ...col, totalColumns })
                      })
                    }
                  })
                  
                  return dayEvents.map(event => {
                    // Calculate top position with minute precision
                    const startHourIndex = hours.findIndex(h => h === event.startTime)
                    const startMinuteFraction = (event.startMinute || 0) / 60
                    
                    // Sum heights of all previous full hours
                    let topPosition = hours.slice(0, startHourIndex).reduce((sum, h) => sum + getRowHeight(h), 0)
                    
                    // Add partial height for minutes within the start hour
                    topPosition += getRowHeight(event.startTime) * startMinuteFraction
                    
                    // Calculate event duration in minutes
                    const startTotalMinutes = event.startTime * 60 + (event.startMinute || 0)
                    const endTotalMinutes = event.endTime * 60 + (event.endMinute || 0)
                    
                    // Calculate height proportionally
                    let eventHeight = 0
                    let currentMinute = startTotalMinutes
                    
                    while (currentMinute < endTotalMinutes) {
                      const currentHour = Math.floor(currentMinute / 60)
                      const minutesInThisHour = Math.min(60 - (currentMinute % 60), endTotalMinutes - currentMinute)
                      const rowHeight = getRowHeight(currentHour)
                      eventHeight += (minutesInThisHour / 60) * rowHeight
                      currentMinute += minutesInThisHour
                    }
                    
                    const columns = eventColumns.get(event.id) || { columnIndex: 0, totalColumns: 1 }
                    
                    return (
                      <EventBlock
                        key={event.id}
                        event={event}
                        topPosition={topPosition}
                        eventHeight={eventHeight}
                        calendarStartHour={calendarStartHour}
                        columnIndex={columns.columnIndex}
                        totalColumns={columns.totalColumns}
                        onEdit={() => handleEditEvent(event)}
                        onDelete={() => deleteEvent(event.id)}
                      />
                    )
                  })
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    
    <AddEventModal
      isOpen={isModalOpen}
      onClose={() => {
        setIsModalOpen(false)
        setEditingEvent(null)
      }}
      preselectedDay={preselectedDay}
      preselectedHour={preselectedHour}
      editingEvent={editingEvent}
    />
    </HydrationBoundary>
  )
}


'use client'

import { CalendarEvent } from '@/lib/store'
import { motion } from 'framer-motion'

type Props = {
  event: CalendarEvent
  onEdit?: () => void
  onDelete?: () => void
  topPosition: number
  eventHeight: number
  calendarStartHour: number
  columnIndex?: number // Which column this event is in (0, 1, 2...)
  totalColumns?: number // Total number of parallel events
}

export default function EventBlock({ event, onEdit, onDelete, topPosition, eventHeight, calendarStartHour, columnIndex = 0, totalColumns = 1 }: Props) {
  
  // Calculate column positioning
  const columnWidth = 100 / totalColumns
  const leftPercent = columnWidth * columnIndex
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="absolute rounded p-2 text-white text-sm border border-white/20 group"
      style={{
        top: `${topPosition}px`,
        height: `${eventHeight}px`,
        left: `calc(${leftPercent}% + 2px)`,
        width: `calc(${columnWidth}% - 4px)`,
        backgroundColor: event.color || '#2563eb',
      }}
    >
      <div className="flex justify-between items-start gap-1">
            <div className="flex-1 min-w-0">
              <div className="font-medium break-words text-xs sm:text-sm">{event.title}</div>
              <div className="text-[10px] sm:text-xs opacity-90 mb-1">
                {event.startTime}:{(event.startMinute || 0).toString().padStart(2, '0')} - {event.endTime}:{(event.endMinute || 0).toString().padStart(2, '0')}
              </div>
              {event.description && (
                <div className="text-[10px] sm:text-xs opacity-90 break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                  {event.description}
                </div>
              )}
            </div>
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (onEdit) onEdit()
            }}
            className="text-white/60 hover:text-white text-base leading-none opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            title="Редактировать"
          >
            ✎
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (onDelete && confirm('Delete event?')) {
                onDelete()
              }
            }}
            className="text-white/60 hover:text-white text-lg leading-none opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            title="Удалить"
          >
            ×
          </button>
        </div>
      </div>
    </motion.div>
  )
}


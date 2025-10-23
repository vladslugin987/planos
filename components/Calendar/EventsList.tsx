'use client'

import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { motion } from 'framer-motion'

type Props = {
  onEdit: (event: any) => void
}

export default function EventsList({ onEdit }: Props) {
  const { events, currentWeekOffset, deleteEvent, language } = useStore()
  const t = useTranslation(language)
  
  const currentEvents = events.filter(e => (e.week || 0) === currentWeekOffset)
  const sortedEvents = currentEvents.sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day
    return a.startTime - b.startTime
  })

  const dayNames = Object.values(t.week.days)

  if (sortedEvents.length === 0) {
    return null
  }

  return (
    <div className="mt-4 md:mt-6 bg-white border border-gray-200 rounded-lg p-3 md:p-4">
      <h3 className="text-xs md:text-sm font-medium text-gray-700 mb-2 md:mb-3">
        {language === 'ru' ? 'События недели' : 'Week Events'}
      </h3>
      <div className="space-y-2">
        {sortedEvents.map(event => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="w-1 h-8 rounded"
                style={{ backgroundColor: event.color || '#2563eb' }}
              />
              <div className="flex-1 min-w-0">
                <div 
                  className="font-medium text-sm truncate"
                  style={{ color: event.color || '#2563eb' }}
                >
                  {event.title}
                </div>
                <div className="text-xs text-gray-500">
                  {dayNames[event.day]} • {event.startTime}:{(event.startMinute || 0).toString().padStart(2, '0')} - {event.endTime}:{(event.endMinute || 0).toString().padStart(2, '0')}
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => onEdit(event)}
                className="text-gray-400 hover:text-blue-600 transition"
                title={language === 'ru' ? 'Редактировать' : 'Edit'}
              >
                ✎
              </button>
              <button
                onClick={() => {
                  if (confirm(language === 'ru' ? 'Удалить событие?' : 'Delete event?')) {
                    deleteEvent(event.id)
                  }
                }}
                className="text-gray-400 hover:text-red-600 transition"
                title={language === 'ru' ? 'Удалить' : 'Delete'}
              >
                ×
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}


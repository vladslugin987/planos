'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { colors } from '@/lib/utils'

type Props = {
  isOpen: boolean
  onClose: () => void
  preselectedDay?: number
  preselectedHour?: number
  editingEvent?: {
    id: string
    title: string
    description?: string
    day: number
    startTime: number
    startMinute?: number
    endTime: number
    endMinute?: number
    color?: string
  }
}

export default function AddEventModal({ isOpen, onClose, preselectedDay, preselectedHour, editingEvent }: Props) {
  const { addEvent, updateEvent, currentWeekOffset, language, calendarStartHour, calendarEndHour } = useStore()
  const t = useTranslation(language)
  
  const [title, setTitle] = useState(editingEvent?.title || '')
  const [description, setDescription] = useState(editingEvent?.description || '')
  const [day, setDay] = useState(editingEvent?.day ?? preselectedDay ?? 0)
  const [startTime, setStartTime] = useState(editingEvent?.startTime ?? preselectedHour ?? 9)
  const [startMinute, setStartMinute] = useState(editingEvent?.startMinute ?? 0)
  const [endTime, setEndTime] = useState(editingEvent?.endTime ?? (preselectedHour ?? 9) + 1)
  const [endMinute, setEndMinute] = useState(editingEvent?.endMinute ?? 0)
  const [selectedColor, setSelectedColor] = useState(editingEvent?.color || colors[0])

  // Update form when editing event changes
  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title)
      setDescription(editingEvent.description || '')
      setDay(editingEvent.day)
      setStartTime(editingEvent.startTime)
      setStartMinute(editingEvent.startMinute ?? 0)
      setEndTime(editingEvent.endTime)
      setEndMinute(editingEvent.endMinute ?? 0)
      setSelectedColor(editingEvent.color || colors[0])
    } else if (preselectedDay !== undefined || preselectedHour !== undefined) {
      setTitle('')
      setDescription('')
      setDay(preselectedDay ?? 0)
      setStartTime(preselectedHour ?? 9)
      setStartMinute(0)
      setEndTime((preselectedHour ?? 9) + 1)
      setEndMinute(0)
      setSelectedColor(colors[0])
    }
  }, [editingEvent, preselectedDay, preselectedHour])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    // Validate time
    const startTotal = startTime * 60 + startMinute
    const endTotal = endTime * 60 + endMinute
    
    if (startTotal >= endTotal) {
      alert(language === 'ru' ? 'Время начала должно быть раньше времени окончания!' : 'Start time must be before end time!')
      return
    }

    if (editingEvent) {
      // Update existing event
      updateEvent(editingEvent.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        day,
        startTime,
        startMinute,
        endTime,
        endMinute,
        color: selectedColor,
      })
    } else {
      // Create new event
      addEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        day,
        startTime,
        startMinute,
        endTime,
        endMinute,
        color: selectedColor,
        week: currentWeekOffset
      })
    }

    // reset form
    setTitle('')
    setDescription('')
    setDay(0)
    setStartTime(9)
    setStartMinute(0)
    setEndTime(10)
    setEndMinute(0)
    setSelectedColor(colors[0])
    onClose()
  }

  const dayNames = Object.values(t.week.days)
  const hours = Array.from({ length: calendarEndHour - calendarStartHour + 1 }, (_, i) => i + calendarStartHour)
  const minutes = [0, 15, 30, 45]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          
          {/* modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-t-2xl md:rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 md:p-6">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                  {editingEvent ? (language === 'ru' ? 'Редактировать событие' : 'Edit Event') : t.eventModal.title}
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none flex-shrink-0 ml-2"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                {/* Event Title */}
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                    {t.eventModal.eventName}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t.eventModal.eventNamePlaceholder}
                    className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                    {t.eventModal.description}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t.eventModal.descriptionPlaceholder}
                    rows={3}
                    maxLength={200}
                    className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="text-[10px] md:text-xs text-gray-500 text-right mt-1">
                    {description.length}/200
                  </div>
                </div>

                {/* Day Selection */}
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                    {t.eventModal.day}
                  </label>
                  <select
                    value={day}
                    onChange={(e) => setDay(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {dayNames.map((dayName, idx) => (
                      <option key={idx} value={idx}>{dayName}</option>
                    ))}
                  </select>
                </div>

                {/* Time Selection */}
                <div className="space-y-2 md:space-y-3">
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                        {t.eventModal.startTime}
                      </label>
                      <div className="flex gap-1 md:gap-2">
                        <select
                          value={startTime}
                          onChange={(e) => {
                            const newStart = Number(e.target.value)
                            setStartTime(newStart)
                            if (newStart >= endTime) {
                              setEndTime(Math.min(newStart + 1, 23))
                            }
                          }}
                          className="flex-1 px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {hours.map(hour => (
                            <option key={hour} value={hour}>{hour.toString().padStart(2, '0')}</option>
                          ))}
                        </select>
                        <select
                          value={startMinute}
                          onChange={(e) => setStartMinute(Number(e.target.value))}
                          className="w-16 md:w-20 px-1 md:px-2 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {minutes.map(min => (
                            <option key={min} value={min}>:{min.toString().padStart(2, '0')}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                        {t.eventModal.endTime}
                      </label>
                      <div className="flex gap-1 md:gap-2">
                        <select
                          value={endTime}
                          onChange={(e) => setEndTime(Number(e.target.value))}
                          className="flex-1 px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {hours.map(hour => (
                            <option key={hour} value={hour}>{hour.toString().padStart(2, '0')}</option>
                          ))}
                        </select>
                        <select
                          value={endMinute}
                          onChange={(e) => setEndMinute(Number(e.target.value))}
                          className="w-16 md:w-20 px-1 md:px-2 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {minutes.map(min => (
                            <option key={min} value={min}>:{min.toString().padStart(2, '0')}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] md:text-xs text-gray-500 text-center">
                    {language === 'ru' ? 'Продолжительность' : 'Duration'}: {
                      Math.floor(((endTime * 60 + endMinute) - (startTime * 60 + startMinute)) / 60)
                    }ч {
                      ((endTime * 60 + endMinute) - (startTime * 60 + startMinute)) % 60
                    }м
                  </div>
                </div>

                {/* Color Selection */}
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    {t.eventModal.color}
                  </label>
                  <div className="flex gap-1.5 md:gap-2 flex-wrap">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-lg transition ${
                          selectedColor === color 
                            ? 'ring-2 ring-offset-2 ring-blue-600 scale-110' 
                            : 'hover:scale-105 active:scale-95'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 md:gap-3 pt-3 md:pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition"
                  >
                    {t.eventModal.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={!title.trim()}
                    className="flex-1 px-3 md:px-4 py-2 text-sm md:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingEvent ? (language === 'ru' ? 'Сохранить' : 'Save') : t.eventModal.add}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}


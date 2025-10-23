import { startOfWeek, addWeeks, format, addDays } from 'date-fns'
import type { Language } from './i18n'
import { translations } from './i18n'

export const getWeekDates = (weekOffset: number = 0) => {
  const now = new Date()
  const week = addWeeks(now, weekOffset)
  const start = startOfWeek(week, { weekStartsOn: 1 })
  
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export const formatDayName = (date: Date, lang: Language = 'ru') => {
  const dayIndex = date.getDay()
  return translations[lang].year.daysShort[dayIndex === 0 ? 6 : dayIndex - 1]
}

export const formatDayDate = (date: Date, lang: Language = 'ru') => {
  const monthNames = translations[lang].year.monthsShort
  return `${date.getDate()} ${monthNames[date.getMonth()]}`
}

export const colors = [
  '#2563eb', // blue
  '#059669', // green
  '#dc2626', // red
  '#ea580c', // orange
  '#7c3aed', // purple
  '#0891b2', // cyan
  '#ca8a04', // yellow
  '#be123c', // rose
]

export const randomColor = () => colors[Math.floor(Math.random() * colors.length)]


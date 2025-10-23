'use client'

import YearView from '@/components/Calendar/YearView'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'

export default function YearPage() {
  const { language } = useStore()
  const t = useTranslation(language)

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-gray-900">
        {t.year.title} {new Date().getFullYear()}
      </h1>
      <YearView />
    </div>
  )
}


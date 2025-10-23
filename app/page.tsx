'use client'

import WeekView from '@/components/Calendar/WeekView'
import EventsList from '@/components/Calendar/EventsList'
import AIChat from '@/components/Chat/AIChat'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { useState } from 'react'
import AddEventModal from '@/components/Calendar/AddEventModal'

export default function Home() {
  const { language } = useStore()
  const t = useTranslation(language)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)

  const handleEditFromList = (event: any) => {
    setEditingEvent(event)
    setIsModalOpen(true)
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-gray-900">
        {t.week.title}
      </h1>
      
      {/* Desktop Layout */}
      <div className="hidden lg:flex gap-6">
        <div className="flex-1">
          <WeekView />
          <EventsList onEdit={handleEditFromList} />
        </div>
        <div className="w-96 flex-shrink-0">
          <AIChat />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <WeekView />
        <EventsList onEdit={handleEditFromList} />
        
        {/* Floating AI Chat Button */}
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition flex items-center justify-center text-2xl z-40"
          aria-label="Open AI Chat"
        >
          💬
        </button>

        {/* Mobile AI Chat Modal */}
        {isChatOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="bg-white w-full h-[85vh] md:h-auto md:max-w-lg md:max-h-[80vh] md:rounded-lg flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">{t.ai.title}</h2>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <AIChat />
              </div>
            </div>
          </div>
        )}
      </div>

      <AddEventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingEvent(null)
        }}
        editingEvent={editingEvent}
      />
    </div>
  )
}


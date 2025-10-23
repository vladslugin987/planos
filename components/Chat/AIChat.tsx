'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { motion, AnimatePresence } from 'framer-motion'
import { randomColor } from '@/lib/utils'

export default function AIChat() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: string; text: string }>>([])
  const { addEvent, events, currentWeekOffset, language, openaiApiKey } = useStore()
  const t = useTranslation(language)

  const handleSend = async () => {
    if (!input.trim()) return
    
    const userMsg = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg, 
          weekOffset: currentWeekOffset,
          apiKey: openaiApiKey,
          existingEvents: events.filter(e => (e.week || 0) === currentWeekOffset)
        })
      })
      
      const data = await res.json()
      
      if (data.error) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          text: language === 'ru' 
            ? 'Ошибка: ' + (data.error.includes('API key') ? 'OpenAI API ключ не настроен. Добавьте его в Настройках ⚙️' : data.error)
            : 'Error: ' + (data.error.includes('API key') ? 'OpenAI API key not configured. Add it in Settings ⚙️' : data.error)
        }])
      } else if (data.events && data.events.length > 0) {
        // Add all events
        const dayNames = Object.values(t.week.days)
        let responseText = ''
        
        // Show AI's explanation if provided
        if (data.message) {
          responseText = data.message + '\n\n'
        }
        
        // Add each event
        data.events.forEach((event: any) => {
          addEvent({
            ...event,
            color: randomColor(),
            week: currentWeekOffset
          })
          
          const startMin = (event.startMinute || 0).toString().padStart(2, '0')
          const endMin = (event.endMinute || 0).toString().padStart(2, '0')
          responseText += `✓ "${event.title}" - ${dayNames[event.day]} ${event.startTime}:${startMin}-${event.endTime}:${endMin}`
          if (event.description) {
            responseText += ` (${event.description})`
          }
          responseText += '\n'
        })
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          text: responseText.trim()
        }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: t.ai.parseError }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: t.ai.error }])
    }
    
    setLoading(false)
  }

  return (
    <div className="bg-white border-0 lg:border lg:border-gray-200 rounded-none lg:rounded-lg p-4 lg:p-6 lg:sticky lg:top-6 h-full lg:h-[calc(100vh-120px)] flex flex-col">
      <h2 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4 text-gray-900 hidden lg:block">{t.ai.title}</h2>
      
      <div className="flex-1 overflow-y-auto mb-3 lg:mb-4 space-y-2">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-2 lg:p-3 rounded text-xs lg:text-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white ml-4 lg:ml-8' 
                  : 'bg-gray-100 text-gray-900 mr-4 lg:mr-8'
              }`}
            >
              {msg.text}
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="text-gray-400 text-xs lg:text-sm">{t.ai.thinking}</div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder={t.ai.placeholder}
          className="flex-1 px-3 lg:px-4 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="px-4 lg:px-6 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          {t.ai.send}
        </button>
      </div>
    </div>
  )
}


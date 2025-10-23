'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'

type Props = {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: Props) {
  const { 
    calendarStartHour, 
    calendarEndHour, 
    setCalendarHours, 
    openaiApiKey, 
    setOpenaiApiKey,
    githubClientId,
    githubClientSecret,
    setGithubClientId,
    setGithubClientSecret,
    language 
  } = useStore()
  
  const [startHour, setStartHour] = useState(calendarStartHour)
  const [endHour, setEndHour] = useState(calendarEndHour)
  const [apiKey, setApiKey] = useState(openaiApiKey || '')
  const [ghClientId, setGhClientId] = useState(githubClientId || '')
  const [ghClientSecret, setGhClientSecret] = useState(githubClientSecret || '')
  const [showGithubGuide, setShowGithubGuide] = useState(false)

  useEffect(() => {
    setStartHour(calendarStartHour)
    setEndHour(calendarEndHour)
    setApiKey(openaiApiKey || '')
    setGhClientId(githubClientId || '')
    setGhClientSecret(githubClientSecret || '')
  }, [calendarStartHour, calendarEndHour, openaiApiKey, githubClientId, githubClientSecret, isOpen])

  const handleSave = () => {
    if (startHour >= endHour) {
      alert(language === 'ru' ? 'Начало должно быть раньше конца!' : 'Start must be before end!')
      return
    }
    if (endHour - startHour < 4) {
      alert(language === 'ru' ? 'Минимум 4 часа!' : 'Minimum 4 hours!')
      return
    }
    setCalendarHours(startHour, endHour)
    setOpenaiApiKey(apiKey.trim() || null)
    setGithubClientId(ghClientId.trim() || null)
    setGithubClientSecret(ghClientSecret.trim() || null)
    onClose()
  }

  const hours = Array.from({ length: 24 }, (_, i) => i)

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
            <div className="bg-white rounded-t-2xl md:rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                    {language === 'ru' ? 'Настройки' : 'Settings'}
                  </h2>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-4 md:p-6 space-y-5 md:space-y-6">
                {/* GitHub Integration */}
                <div>
                  <div className="flex items-center justify-between mb-2 md:mb-3">
                    <h3 className="text-base md:text-lg font-medium text-gray-900">
                      {language === 'ru' ? 'GitHub Интеграция' : 'GitHub Integration'}
                    </h3>
                    <button
                      onClick={() => setShowGithubGuide(!showGithubGuide)}
                      className="text-xs md:text-sm text-blue-600 hover:text-blue-700 underline whitespace-nowrap ml-2"
                    >
                      {showGithubGuide 
                        ? (language === 'ru' ? 'Скрыть' : 'Hide')
                        : (language === 'ru' ? 'Инструкция' : 'Guide')
                      }
                    </button>
                  </div>

                  {/* GitHub Setup Guide */}
                  <AnimatePresence>
                    {showGithubGuide && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-3 md:mb-4"
                      >
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 text-xs md:text-sm space-y-2 md:space-y-3">
                          <div className="font-semibold text-blue-900">
                            {language === 'ru' 
                              ? 'Пошаговая инструкция:' 
                              : 'Step-by-step guide:'}
                          </div>
                          
                          {language === 'ru' ? (
                            <>
                              <div>
                                <span className="font-semibold">1.</span> Открой{' '}
                                <a 
                                  href="https://github.com/settings/developers" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline font-mono"
                                >
                                  github.com/settings/developers
                                </a>
                              </div>
                              
                              <div>
                                <span className="font-semibold">2.</span> Нажми <strong>"New OAuth App"</strong>
                              </div>
                              
                              <div>
                                <span className="font-semibold">3.</span> Заполни форму:
                                <div className="ml-6 mt-2 space-y-1 bg-white p-3 rounded border border-blue-200 font-mono text-xs">
                                  <div><strong>Application name:</strong> Planos</div>
                                  <div><strong>Homepage URL:</strong> http://localhost:3000</div>
                                  <div><strong>Authorization callback URL:</strong> http://localhost:3000/api/github/auth</div>
                                </div>
                              </div>
                              
                              <div>
                                <span className="font-semibold">4.</span> Нажми <strong>"Register application"</strong>
                              </div>
                              
                              <div>
                                <span className="font-semibold">5.</span> Скопируй <strong>Client ID</strong> и вставь ниже
                              </div>
                              
                              <div>
                                <span className="font-semibold">6.</span> Нажми <strong>"Generate a new client secret"</strong>, скопируй его и вставь ниже
                              </div>

                              <div className="bg-yellow-50 border border-yellow-300 rounded p-2 mt-3">
                                <strong>Важно:</strong> Client Secret показывается только один раз! Сохрани его сразу.
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <span className="font-semibold">1.</span> Open{' '}
                                <a 
                                  href="https://github.com/settings/developers" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline font-mono"
                                >
                                  github.com/settings/developers
                                </a>
                              </div>
                              
                              <div>
                                <span className="font-semibold">2.</span> Click <strong>"New OAuth App"</strong>
                              </div>
                              
                              <div>
                                <span className="font-semibold">3.</span> Fill the form:
                                <div className="ml-6 mt-2 space-y-1 bg-white p-3 rounded border border-blue-200 font-mono text-xs">
                                  <div><strong>Application name:</strong> Planos</div>
                                  <div><strong>Homepage URL:</strong> http://localhost:3000</div>
                                  <div><strong>Authorization callback URL:</strong> http://localhost:3000/api/github/auth</div>
                                </div>
                              </div>
                              
                              <div>
                                <span className="font-semibold">4.</span> Click <strong>"Register application"</strong>
                              </div>
                              
                              <div>
                                <span className="font-semibold">5.</span> Copy <strong>Client ID</strong> and paste below
                              </div>
                              
                              <div>
                                <span className="font-semibold">6.</span> Click <strong>"Generate a new client secret"</strong>, copy it and paste below
                              </div>

                              <div className="bg-yellow-50 border border-yellow-300 rounded p-2 mt-3">
                                <strong>Important:</strong> Client Secret is shown only once! Save it immediately.
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="space-y-2 md:space-y-3">
                    <div>
                      <label className="block text-xs md:text-sm text-gray-600 mb-1">
                        GitHub Client ID
                      </label>
                      <input
                        type="text"
                        value={ghClientId}
                        onChange={(e) => setGhClientId(e.target.value)}
                        placeholder="Iv1.a1b2c3d4e5f6g7h8"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs md:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm text-gray-600 mb-1">
                        GitHub Client Secret
                      </label>
                      <input
                        type="password"
                        value={ghClientSecret}
                        onChange={(e) => setGhClientSecret(e.target.value)}
                        placeholder="1234567890abcdef..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs md:text-sm"
                      />
                    </div>

                    <div className="text-[10px] md:text-xs text-gray-500">
                      {language === 'ru' 
                        ? 'Эти данные для доступа к GitHub репозиториям. Хранятся локально в браузере.' 
                        : 'These credentials are for accessing GitHub repositories. Stored locally in browser.'}
                    </div>
                  </div>
                </div>

                {/* OpenAI API Key */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm md:text-base font-medium text-gray-700 mb-2 md:mb-3">
                    {language === 'ru' ? 'OpenAI API' : 'OpenAI API'}
                  </h3>
                  
                  <div>
                    <label className="block text-xs md:text-sm text-gray-600 mb-1">
                      OpenAI API Key
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs md:text-sm"
                    />
                    <div className="mt-1 text-[10px] md:text-xs text-gray-500">
                      {language === 'ru' 
                        ? 'Используется для AI чата. Хранится локально в браузере.' 
                        : 'Used for AI chat. Stored locally in browser.'}
                    </div>
                  </div>
                </div>

                {/* Calendar Time Range */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm md:text-base font-medium text-gray-700 mb-2 md:mb-3">
                    {language === 'ru' ? 'Диапазон времени календаря' : 'Calendar time range'}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block text-xs md:text-sm text-gray-600 mb-1">
                        {language === 'ru' ? 'Начало' : 'Start'}
                      </label>
                      <select
                        value={startHour}
                        onChange={(e) => setStartHour(Number(e.target.value))}
                        className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {hours.slice(0, 20).map(h => (
                          <option key={h} value={h}>
                            {h.toString().padStart(2, '0')}:00
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm text-gray-600 mb-1">
                        {language === 'ru' ? 'Конец' : 'End'}
                      </label>
                      <select
                        value={endHour}
                        onChange={(e) => setEndHour(Number(e.target.value))}
                        className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {hours.slice(4, 24).map(h => (
                          <option key={h} value={h}>
                            {h.toString().padStart(2, '0')}:00
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-2 md:mt-3 text-[10px] md:text-xs text-gray-500">
                    {language === 'ru' 
                      ? `Будет показано ${endHour - startHour} часов` 
                      : `Will show ${endHour - startHour} hours`}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 md:p-6">
                <div className="flex gap-2 md:gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition"
                  >
                    {language === 'ru' ? 'Отмена' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 px-3 md:px-4 py-2 text-sm md:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition"
                  >
                    {language === 'ru' ? 'Сохранить' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

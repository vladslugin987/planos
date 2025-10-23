'use client'

import { useState, useEffect } from 'react'
import RepoList from '@/components/GitHub/RepoList'
import FileEditor from '@/components/GitHub/FileEditor'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'

type Repo = {
  id: number
  name: string
  full_name: string
  description: string
  updated_at: string
  html_url: string
}

export default function HomeworkPage() {
  const { language, githubClientId, githubClientSecret } = useStore()
  const t = useTranslation(language)
  const [authenticated, setAuthenticated] = useState(false)
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/github/repos', {
        headers: {
          'x-github-client-id': githubClientId || '',
          'x-github-client-secret': githubClientSecret || '',
        }
      })
      if (res.ok) {
        setAuthenticated(true)
      }
    } catch (err) {
      setAuthenticated(false)
    }
    setLoading(false)
  }

  const handleLogin = () => {
    // Pass credentials via URL params for the auth redirect
    const params = new URLSearchParams()
    if (githubClientId) params.set('client_id', githubClientId)
    if (githubClientSecret) params.set('client_secret', githubClientSecret)
    window.location.href = `/api/github/auth?${params.toString()}`
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="text-center py-12 text-sm md:text-base">{t.homework.checkingAuth}</div>
      </div>
    )
  }

  if (!authenticated) {
    const hasCredentials = githubClientId && githubClientSecret

    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="text-center py-8 md:py-12">
          <h1 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-gray-900">{t.homework.githubIntegration}</h1>
          
          {!hasCredentials ? (
            <div className="max-w-2xl mx-auto px-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 md:p-6 mb-4 md:mb-6">
                <div className="text-yellow-800 mb-3 md:mb-4 text-sm md:text-base">
                  {language === 'ru' 
                    ? 'GitHub не настроен. Нужно добавить Client ID и Secret.' 
                    : 'GitHub not configured. You need to add Client ID and Secret.'}
                </div>
                <div className="text-xs md:text-sm text-yellow-700 text-left space-y-2">
                  {language === 'ru' ? (
                    <>
                      <p><strong>Шаг 1:</strong> Нажми на иконку настроек в правом верхнем углу</p>
                      <p><strong>Шаг 2:</strong> В разделе "GitHub Интеграция" нажми "Как настроить?"</p>
                      <p><strong>Шаг 3:</strong> Следуй инструкции и заполни поля</p>
                      <p><strong>Шаг 4:</strong> Сохрани и вернись сюда</p>
                    </>
                  ) : (
                    <>
                      <p><strong>Step 1:</strong> Click the settings icon in the top right corner</p>
                      <p><strong>Step 2:</strong> In "GitHub Integration" section click "How to setup?"</p>
                      <p><strong>Step 3:</strong> Follow the guide and fill the fields</p>
                      <p><strong>Step 4:</strong> Save and come back here</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="mb-4 md:mb-6 text-gray-600 text-sm md:text-base px-4">
                {t.homework.connectDescription}
              </p>
              <button
                onClick={handleLogin}
                className="px-6 md:px-8 py-2 md:py-3 text-sm md:text-base bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {t.homework.loginButton}
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-gray-900">
        {t.homework.title}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-lg p-4 md:p-6">
          <RepoList 
            onSelectRepo={setSelectedRepo}
            selectedRepo={selectedRepo}
          />
        </div>

        <div className="lg:col-span-2">
          {selectedRepo ? (
            <FileEditor
              owner={selectedRepo.full_name.split('/')[0]}
              repo={selectedRepo.name}
            />
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8 md:p-12 text-center text-gray-400 text-sm md:text-base">
              {t.homework.selectRepo}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


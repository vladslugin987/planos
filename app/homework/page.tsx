'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
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
  const { data: session, status } = useSession()
  const { language } = useStore()
  const t = useTranslation(language)
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null)
  const [hasGithubAccess, setHasGithubAccess] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      checkGithubAccess()
    }
  }, [status, session])

  const checkGithubAccess = async () => {
    try {
      const res = await fetch('/api/github/repos')
      setHasGithubAccess(res.ok)
    } catch (err) {
      setHasGithubAccess(false)
    }
  }

  const handleLogin = () => {
    signIn('github', { callbackUrl: '/homework' })
  }

  if (status === 'loading') {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="text-center py-12 text-sm md:text-base">{t.homework.checkingAuth}</div>
      </div>
    )
  }

  if (status === 'unauthenticated' || !session?.accessToken || !hasGithubAccess) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="text-center py-8 md:py-12">
          <h1 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-gray-900">{t.homework.githubIntegration}</h1>
          
          <p className="mb-4 md:mb-6 text-gray-600 text-sm md:text-base px-4">
            {t.homework.connectDescription}
          </p>
          <button
            onClick={handleLogin}
            className="px-6 md:px-8 py-2 md:py-3 text-sm md:text-base bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {t.homework.loginButton}
          </button>
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


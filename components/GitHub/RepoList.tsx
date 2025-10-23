'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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

type Props = {
  onSelectRepo: (repo: Repo) => void
  selectedRepo: Repo | null
}

export default function RepoList({ onSelectRepo, selectedRepo }: Props) {
  const { language } = useStore()
  const t = useTranslation(language)
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRepos()
  }, [])

  const fetchRepos = async () => {
    try {
      const res = await fetch('/api/github/repos')
      const data = await res.json()
      if (data.repos) {
        setRepos(data.repos)
      }
    } catch (err) {
      console.error('failed to load repos', err)
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="text-center py-6 md:py-8 text-sm md:text-base">{t.homework.loadingRepos}</div>
  }

  const locale = language === 'ru' ? 'ru' : 'en-US'

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-900 mb-3 md:mb-4 text-sm md:text-base">{t.homework.yourRepos}</h3>
      {repos.map(repo => (
        <motion.div
          key={repo.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectRepo(repo)}
          className={`p-3 md:p-4 rounded cursor-pointer transition ${
            selectedRepo?.id === repo.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-50 hover:bg-gray-100 active:bg-gray-200'
          }`}
        >
          <div className="font-medium text-sm md:text-base">{repo.name}</div>
          {repo.description && (
            <div className="text-xs md:text-sm opacity-80 mt-1 line-clamp-2">{repo.description}</div>
          )}
          <div className="text-[10px] md:text-xs opacity-60 mt-1 md:mt-2">
            {t.homework.updated} {new Date(repo.updated_at).toLocaleDateString(locale)}
          </div>
        </motion.div>
      ))}
    </div>
  )
}


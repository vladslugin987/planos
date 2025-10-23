'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function SignIn() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleSignIn = async (provider: 'github' | 'google') => {
    setIsLoading(provider)
    try {
      await signIn(provider, { callbackUrl })
    } catch (error) {
      console.error('Sign in error:', error)
      setIsLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
      <div className="max-w-md w-full">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Planos</h1>
          <p className="text-gray-600">
            Умный планировщик с AI-помощником
          </p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Войти в аккаунт
          </h2>

          <div className="space-y-4">
            {/* GitHub Sign In */}
            <button
              onClick={() => handleSignIn('github')}
              disabled={isLoading !== null}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading === 'github' ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              )}
              <span className="font-medium">
                {isLoading === 'github' ? 'Загрузка...' : 'Продолжить через GitHub'}
              </span>
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">или</span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              onClick={() => handleSignIn('google')}
              disabled={isLoading !== null}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading === 'google' ? (
                <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              <span className="font-medium">
                {isLoading === 'google' ? 'Загрузка...' : 'Продолжить через Google'}
              </span>
            </button>
          </div>

          {/* Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              При входе вы соглашаетесь с использованием сервиса
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p className="mb-4">После входа вам будет доступно:</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3">
              <div className="text-2xl mb-1">📅</div>
              <div className="font-medium text-gray-900">Календарь</div>
              <div className="text-xs text-gray-500">с AI-помощником</div>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3">
              <div className="text-2xl mb-1">📝</div>
              <div className="font-medium text-gray-900">Заметки</div>
              <div className="text-xs text-gray-500">со стикерами</div>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3">
              <div className="text-2xl mb-1">🐙</div>
              <div className="font-medium text-gray-900">GitHub</div>
              <div className="text-xs text-gray-500">интеграция</div>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3">
              <div className="text-2xl mb-1">☁️</div>
              <div className="font-medium text-gray-900">Синхронизация</div>
              <div className="text-xs text-gray-500">между устройствами</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


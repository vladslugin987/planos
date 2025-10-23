'use client'

import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { useState } from 'react'
import SettingsModal from '@/components/Settings/SettingsModal'
import AuthProvider from '@/components/AuthProvider'
import UserMenu from '@/components/UserMenu'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { language, setLanguage } = useStore()
  const t = useTranslation(language)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <html lang={language}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body>
        <AuthProvider>
          <nav className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <Link href="/" className="text-xl font-semibold text-gray-900">
                Planos
              </Link>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-6">
                <Link href="/" className="text-gray-700 hover:text-gray-900 transition">
                  {t.nav.week}
                </Link>
                <Link href="/year" className="text-gray-700 hover:text-gray-900 transition">
                  {t.nav.year}
                </Link>
                <Link href="/notes" className="text-gray-700 hover:text-gray-900 transition">
                  {t.nav.notes}
                </Link>
                <Link href="/tasks" className="text-gray-700 hover:text-gray-900 transition">
                  {t.nav.tasks}
                </Link>
                <Link href="/finance" className="text-gray-700 hover:text-gray-900 transition">
                  {t.nav.finance}
                </Link>
                <Link href="/investments" className="text-gray-700 hover:text-gray-900 transition">
                  {t.nav.investments}
                </Link>
                
                {/* Settings Button */}
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-gray-700 hover:text-gray-900 transition ml-2"
                  title={language === 'ru' ? 'Настройки' : 'Settings'}
                >
                  ⚙️
                </button>
                
                {/* Language Switcher */}
                <div className="flex gap-2 ml-2 border-l border-gray-200 pl-4">
                  <button
                    onClick={() => setLanguage('ru')}
                    className={`px-3 py-1 text-sm rounded transition ${
                      language === 'ru' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    RU
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-3 py-1 text-sm rounded transition ${
                      language === 'en' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    EN
                  </button>
                </div>
                
                {/* User Menu */}
                <div className="border-l border-gray-200 pl-4">
                  <UserMenu />
                </div>
              </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-700 hover:text-gray-900 transition p-2"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-2 border-t border-gray-200 pt-4">
              <Link 
                href="/" 
                className="block py-2 text-gray-700 hover:text-gray-900 transition"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t.nav.week}
              </Link>
              <Link 
                href="/year" 
                className="block py-2 text-gray-700 hover:text-gray-900 transition"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t.nav.year}
              </Link>
              <Link 
                href="/notes" 
                className="block py-2 text-gray-700 hover:text-gray-900 transition"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t.nav.notes}
              </Link>
              <Link 
                href="/tasks" 
                className="block py-2 text-gray-700 hover:text-gray-900 transition"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t.nav.tasks}
              </Link>
              <Link 
                href="/finance" 
                className="block py-2 text-gray-700 hover:text-gray-900 transition"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t.nav.finance}
              </Link>
              <Link 
                href="/investments" 
                className="block py-2 text-gray-700 hover:text-gray-900 transition"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t.nav.investments}
              </Link>
              
              <div className="pt-2 border-t border-gray-200 space-y-2">
                <button
                  onClick={() => {
                    setIsSettingsOpen(true)
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full text-left text-gray-700 hover:text-gray-900 transition py-2"
                >
                  ⚙️ {language === 'ru' ? 'Настройки' : 'Settings'}
                </button>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setLanguage('ru')}
                      className={`px-3 py-1 text-sm rounded transition ${
                        language === 'ru' 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      RU
                    </button>
                    <button
                      onClick={() => setLanguage('en')}
                      className={`px-3 py-1 text-sm rounded transition ${
                        language === 'en' 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      EN
                    </button>
                  </div>
                  
                  <UserMenu />
                </div>
              </div>
            </div>
          )}
          </nav>
          <main className="min-h-screen">
            {children}
          </main>
          
          <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
          />
        </AuthProvider>
      </body>
    </html>
  )
}


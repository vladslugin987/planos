'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { motion, AnimatePresence } from 'framer-motion'

type Asset = {
  id: string
  type: string
  symbol: string
  name: string
}

type Props = {
  isOpen: boolean
  onClose: () => void
  asset: Asset | null
  onSave: () => void
}

export default function AssetModal({ isOpen, onClose, asset, onSave }: Props) {
  const { language } = useStore()
  const t = useTranslation(language)
  const [type, setType] = useState('crypto')
  const [symbol, setSymbol] = useState('')
  const [name, setName] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])

  useEffect(() => {
    if (asset) {
      setType(asset.type)
      setSymbol(asset.symbol)
      setName(asset.name)
    } else {
      setType('crypto')
      setSymbol('')
      setName('')
    }
    setSearchResults([])
  }, [asset, isOpen])

  const searchAssets = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const endpoint = type === 'crypto' ? '/api/prices/crypto' : '/api/prices/stocks'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      if (res.ok) {
        const results = await res.json()
        setSearchResults(results)
      }
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setSearching(false)
    }
  }

  const selectAsset = (result: any) => {
    setSymbol(result.symbol)
    setName(result.name)
    setSearchResults([])
  }

  const handleSave = async () => {
    if (!symbol || !name) return

    try {
      const method = asset ? 'PUT' : 'POST'
      const body = asset 
        ? { id: asset.id, name }
        : { type, symbol, name }

      const res = await fetch('/api/user/assets', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        onSave()
        onClose()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save asset')
      }
    } catch (err) {
      console.error('Failed to save asset:', err)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="border-b border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {asset ? t.finance.investments.edit : t.finance.investments.addAsset}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.finance.investments.assetType}
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    disabled={!!asset}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="crypto">{t.finance.investments.crypto}</option>
                    <option value="stock">{t.finance.investments.stock}</option>
                    <option value="bond">{t.finance.investments.bond}</option>
                    <option value="real_estate">{t.finance.investments.realEstate}</option>
                    <option value="commodity">{t.finance.investments.commodity}</option>
                    <option value="other">{t.finance.investments.other}</option>
                  </select>
                </div>

                {!asset && (type === 'crypto' || type === 'stock') && (
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.finance.investments.search}
                    </label>
                    <input
                      type="text"
                      placeholder={t.finance.investments.searchPlaceholder}
                      onChange={(e) => searchAssets(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    {searching && (
                      <div className="absolute right-3 top-10 text-sm text-gray-400">
                        {t.finance.investments.searching}
                      </div>
                    )}

                    {searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
                        {searchResults.map((result, index) => (
                          <button
                            key={index}
                            onClick={() => selectAsset(result)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 transition"
                          >
                            <div className="font-medium">{result.symbol}</div>
                            <div className="text-sm text-gray-600">{result.name}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.finance.investments.symbol}
                  </label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    disabled={!!asset}
                    placeholder={t.finance.investments.symbolPlaceholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.finance.investments.name}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.finance.investments.namePlaceholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                >
                  {t.finance.investments.cancel}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!symbol || !name}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.finance.investments.save}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}


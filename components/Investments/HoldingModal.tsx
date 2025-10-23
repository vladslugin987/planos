'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { motion, AnimatePresence } from 'framer-motion'

type Asset = {
  id: string
  symbol: string
  name: string
}

type Holding = {
  id: string
  quantity: number
  purchasePrice: number
  purchaseDate: string
  notes: string | null
}

type Props = {
  isOpen: boolean
  onClose: () => void
  asset: Asset | null
  holding: Holding | null
  onSave: () => void
}

export default function HoldingModal({ isOpen, onClose, asset, holding, onSave }: Props) {
  const { language } = useStore()
  const t = useTranslation(language)
  const [quantity, setQuantity] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (holding) {
      setQuantity(holding.quantity.toString())
      setPurchasePrice(holding.purchasePrice.toString())
      setPurchaseDate(holding.purchaseDate.split('T')[0])
      setNotes(holding.notes || '')
    } else {
      setQuantity('')
      setPurchasePrice('')
      setPurchaseDate(new Date().toISOString().split('T')[0])
      setNotes('')
    }
  }, [holding, isOpen])

  const handleSave = async () => {
    if (!asset || !quantity || !purchasePrice) return

    try {
      const method = holding ? 'PUT' : 'POST'
      const body = {
        ...(holding ? { id: holding.id } : { assetId: asset.id }),
        quantity: parseFloat(quantity),
        purchasePrice: parseFloat(purchasePrice),
        purchaseDate,
        notes: notes || null,
      }

      const res = await fetch('/api/user/holdings', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        onSave()
        onClose()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save holding')
      }
    } catch (err) {
      console.error('Failed to save holding:', err)
    }
  }

  if (!asset) return null

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
                  {holding ? t.finance.investments.edit : t.finance.investments.addHolding}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {asset.symbol} - {asset.name}
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.finance.investments.quantity}
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder={t.finance.investments.quantityPlaceholder}
                    step="0.0001"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.finance.investments.purchasePrice}
                  </label>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.finance.investments.purchaseDate}
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.finance.investments.notes}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t.finance.investments.notesPlaceholder}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {quantity && purchasePrice && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <div className="text-sm text-gray-700">
                      Total Cost: <span className="font-semibold">${(parseFloat(quantity) * parseFloat(purchasePrice)).toFixed(2)}</span>
                    </div>
                  </div>
                )}
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
                  disabled={!quantity || !purchasePrice}
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


'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { motion, AnimatePresence } from 'framer-motion'

type RecurringTransaction = {
  id: string
  type: 'income' | 'expense'
  amount: number
  description?: string
  categoryId?: string
  category?: {
    id: string
    name: string
    color: string
  }
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  dayOfMonth?: number
  dayOfWeek?: number
  startDate: string
  endDate?: string
  nextDate: string
  active: boolean
}

type Props = {
  categories: any[]
  onUpdate: () => void
}

export default function RecurringManager({ categories, onUpdate }: Props) {
  const { language } = useStore()
  const t = useTranslation(language)
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null)

  useEffect(() => {
    loadRecurring()
  }, [])

  const loadRecurring = async () => {
    try {
      const res = await fetch('/api/user/recurring')
      if (res.ok) {
        const data = await res.json()
        setRecurring(data)
      }
    } catch (err) {
      console.error('Failed to load recurring transactions:', err)
    }
  }

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const item = recurring.find(r => r.id === id)
      if (!item) return

      const res = await fetch('/api/user/recurring', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, id, active: !active }),
      })

      if (res.ok) {
        loadRecurring()
        onUpdate()
      }
    } catch (err) {
      console.error('Failed to toggle recurring:', err)
    }
  }

  const deleteRecurring = async (id: string) => {
    if (!confirm(t.finance.recurring.confirmDelete)) return
    
    try {
      const res = await fetch(`/api/user/recurring?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadRecurring()
        onUpdate()
      }
    } catch (err) {
      console.error('Failed to delete recurring:', err)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{t.finance.recurring.title}</h3>
        <button
          onClick={() => {
            setEditingRecurring(null)
            setIsModalOpen(true)
          }}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          {t.finance.recurring.newRecurring}
        </button>
      </div>

      {recurring.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          {t.finance.recurring.noRecurring}
        </div>
      ) : (
        <div className="space-y-2">
          {recurring.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border rounded-lg p-3 ${
                item.active ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                      item.type === 'income' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.type === 'income' ? t.finance.income : t.finance.expense}
                    </span>
                    <span className="font-medium">
                      ${item.amount.toFixed(2)}
                    </span>
                    {item.category && (
                      <span 
                        className="inline-flex px-2 py-0.5 text-xs rounded"
                        style={{ 
                          backgroundColor: item.category.color + '20',
                          color: item.category.color
                        }}
                      >
                        {(t.finance.categories as any)[item.category.name] || item.category.name}
                      </span>
                    )}
                  </div>
                  
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                  )}
                  
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>
                      {(t.finance.recurring as any)[item.frequency]}
                    </span>
                    <span>•</span>
                    <span>
                      {t.finance.recurring.nextDate}: {new Date(item.nextDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 ml-3">
                  <button
                    onClick={() => toggleActive(item.id, item.active)}
                    className={`px-2 py-1 text-xs rounded transition ${
                      item.active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {item.active ? t.finance.recurring.active : t.finance.recurring.inactive}
                  </button>
                  <button
                    onClick={() => {
                      setEditingRecurring(item)
                      setIsModalOpen(true)
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteRecurring(item.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <RecurringModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingRecurring(null)
        }}
        recurring={editingRecurring}
        categories={categories}
        onSave={() => {
          loadRecurring()
          onUpdate()
        }}
      />
    </div>
  )
}

function RecurringModal({ isOpen, onClose, recurring, categories, onSave }: {
  isOpen: boolean
  onClose: () => void
  recurring: RecurringTransaction | null
  categories: any[]
  onSave: () => void
}) {
  const { language } = useStore()
  const t = useTranslation(language)
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
  const [dayOfMonth, setDayOfMonth] = useState('1')
  const [startDate, setStartDate] = useState('')

  useEffect(() => {
    if (recurring) {
      setType(recurring.type)
      setAmount(recurring.amount.toString())
      setDescription(recurring.description || '')
      setCategoryId(recurring.categoryId || '')
      setFrequency(recurring.frequency)
      setDayOfMonth(recurring.dayOfMonth?.toString() || '1')
      setStartDate(recurring.startDate.split('T')[0])
    } else {
      setType('expense')
      setAmount('')
      setDescription('')
      setCategoryId('')
      setFrequency('monthly')
      setDayOfMonth('1')
      setStartDate(new Date().toISOString().split('T')[0])
    }
  }, [recurring, isOpen])

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) return

    try {
      const method = recurring ? 'PUT' : 'POST'
      const body = {
        ...(recurring ? { id: recurring.id } : {}),
        type,
        amount: parseFloat(amount),
        description,
        categoryId: categoryId || null,
        frequency,
        dayOfMonth: frequency === 'monthly' ? parseInt(dayOfMonth) : null,
        startDate,
      }

      const res = await fetch('/api/user/recurring', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        onSave()
        onClose()
      }
    } catch (err) {
      console.error('Failed to save recurring:', err)
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
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="border-b border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {recurring ? t.finance.recurring.editRecurring : t.finance.recurring.newRecurring}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.finance.type}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setType('income')}
                      className={`px-4 py-2 rounded transition ${
                        type === 'income'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t.finance.income}
                    </button>
                    <button
                      onClick={() => setType('expense')}
                      className={`px-4 py-2 rounded transition ${
                        type === 'expense'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t.finance.expense}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.finance.category}
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t.finance.noCategory}</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {(t.finance.categories as any)[cat.name] || cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.finance.amount}
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.finance.description}
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t.finance.descriptionPlaceholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.finance.recurring.frequency}
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">{t.finance.recurring.daily}</option>
                    <option value="weekly">{t.finance.recurring.weekly}</option>
                    <option value="monthly">{t.finance.recurring.monthly}</option>
                    <option value="yearly">{t.finance.recurring.yearly}</option>
                  </select>
                </div>

                {frequency === 'monthly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.finance.recurring.dayOfMonth}
                    </label>
                    <input
                      type="number"
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(e.target.value)}
                      min="1"
                      max="31"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.finance.recurring.startDate}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                >
                  {t.finance.cancel}
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  {t.finance.save}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}


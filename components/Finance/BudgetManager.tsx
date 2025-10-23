'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { motion, AnimatePresence } from 'framer-motion'

type Budget = {
  id: string
  categoryId: string
  category: {
    id: string
    name: string
    color: string
  }
  amount: number
  period: 'monthly' | 'yearly'
  startDate: string
  endDate?: string
}

type Props = {
  transactions: any[]
  categories: any[]
  onUpdate: () => void
}

export default function BudgetManager({ transactions, categories, onUpdate }: Props) {
  const { language } = useStore()
  const t = useTranslation(language)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)

  useEffect(() => {
    loadBudgets()
  }, [])

  const loadBudgets = async () => {
    try {
      const res = await fetch('/api/user/budgets')
      if (res.ok) {
        const data = await res.json()
        setBudgets(data)
      }
    } catch (err) {
      console.error('Failed to load budgets:', err)
    }
  }

  const deleteBudget = async (id: string) => {
    if (!confirm(t.finance.budgets.confirmDelete)) return
    
    try {
      const res = await fetch(`/api/user/budgets?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadBudgets()
        onUpdate()
      }
    } catch (err) {
      console.error('Failed to delete budget:', err)
    }
  }

  const calculateSpent = (budget: Budget) => {
    const now = new Date()
    const startDate = new Date(budget.startDate)
    
    let filterStart = startDate
    let filterEnd = new Date()

    if (budget.period === 'monthly') {
      filterStart = new Date(now.getFullYear(), now.getMonth(), 1)
      filterEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    } else if (budget.period === 'yearly') {
      filterStart = new Date(now.getFullYear(), 0, 1)
      filterEnd = new Date(now.getFullYear(), 11, 31)
    }

    const spent = transactions
      .filter(tx => 
        tx.type === 'expense' &&
        tx.categoryId === budget.categoryId &&
        new Date(tx.date) >= filterStart &&
        new Date(tx.date) <= filterEnd
      )
      .reduce((sum, tx) => sum + tx.amount, 0)

    return spent
  }

  const getBudgetProgress = (budget: Budget) => {
    const spent = calculateSpent(budget)
    const percentage = (spent / budget.amount) * 100
    const remaining = budget.amount - spent
    const isExceeded = spent > budget.amount

    return { spent, percentage: Math.min(percentage, 100), remaining, isExceeded }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-orange-500'
    if (percentage >= 60) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{t.finance.budgets.title}</h3>
        <button
          onClick={() => {
            setEditingBudget(null)
            setIsModalOpen(true)
          }}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          {t.finance.budgets.newBudget}
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          {t.finance.budgets.noBudgets}
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const { spent, percentage, remaining, isExceeded } = getBudgetProgress(budget)
            
            return (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-lg p-3"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: budget.category.color }}
                    />
                    <span className="font-medium">
                      {(t.finance.categories as any)[budget.category.name] || budget.category.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({budget.period === 'monthly' ? t.finance.budgets.monthly : t.finance.budgets.yearly})
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingBudget(budget)
                        setIsModalOpen(true)
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteBudget(budget.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">
                      {t.finance.budgets.spent}: ${spent.toFixed(2)}
                    </span>
                    <span className={isExceeded ? 'text-red-600 font-medium' : 'text-gray-600'}>
                      {isExceeded 
                        ? `${t.finance.budgets.exceeded}: $${Math.abs(remaining).toFixed(2)}`
                        : `${t.finance.budgets.remaining}: $${remaining.toFixed(2)}`
                      }
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getProgressColor(percentage)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{percentage.toFixed(0)}%</span>
                    <span>${budget.amount.toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingBudget(null)
        }}
        budget={editingBudget}
        categories={categories}
        onSave={() => {
          loadBudgets()
          onUpdate()
        }}
      />
    </div>
  )
}

function BudgetModal({ isOpen, onClose, budget, categories, onSave }: {
  isOpen: boolean
  onClose: () => void
  budget: Budget | null
  categories: any[]
  onSave: () => void
}) {
  const { language } = useStore()
  const t = useTranslation(language)
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')

  useEffect(() => {
    if (budget) {
      setCategoryId(budget.categoryId)
      setAmount(budget.amount.toString())
      setPeriod(budget.period)
    } else {
      setCategoryId('')
      setAmount('')
      setPeriod('monthly')
    }
  }, [budget, isOpen])

  const handleSave = async () => {
    if (!categoryId || !amount || parseFloat(amount) <= 0) return

    try {
      const method = budget ? 'PUT' : 'POST'
      const body = budget 
        ? { id: budget.id, amount: parseFloat(amount), period }
        : { categoryId, amount: parseFloat(amount), period }

      const res = await fetch('/api/user/budgets', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        onSave()
        onClose()
      }
    } catch (err) {
      console.error('Failed to save budget:', err)
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
                  {budget ? t.finance.budgets.editBudget : t.finance.budgets.newBudget}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.finance.category}
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    disabled={!!budget}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">{t.finance.category}</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {(t.finance.categories as any)[cat.name] || cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.finance.budgets.amount}
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
                    {t.finance.budgets.period}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPeriod('monthly')}
                      className={`px-4 py-2 rounded transition ${
                        period === 'monthly'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t.finance.budgets.monthly}
                    </button>
                    <button
                      onClick={() => setPeriod('yearly')}
                      className={`px-4 py-2 rounded transition ${
                        period === 'yearly'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t.finance.budgets.yearly}
                    </button>
                  </div>
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


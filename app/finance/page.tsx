'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { motion, AnimatePresence } from 'framer-motion'
import ExpensePieChart from '@/components/Finance/ExpensePieChart'
import TrendLineChart from '@/components/Finance/TrendLineChart'
import BalanceBarChart from '@/components/Finance/BalanceBarChart'

type Transaction = {
  id: string
  type: 'income' | 'expense'
  amount: number
  currency: string
  description?: string
  categoryId?: string
  category?: Category
  date: string
  createdAt: string
}

type Category = {
  id: string
  name: string
  color: string
  icon?: string
  type: string
  isDefault: boolean
}

type Stats = {
  totalIncome: number
  totalExpense: number
  balance: number
}

export default function FinancePage() {
  const { data: session } = useSession()
  const { language } = useStore()
  const t = useTranslation(language)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filter, setFilter] = useState<'all' | 'thisMonth' | 'thisYear'>('thisMonth')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  useEffect(() => {
    if (session) {
      loadTransactions()
      loadCategories()
    }
  }, [session])

  const loadTransactions = async () => {
    try {
      const res = await fetch('/api/user/transactions')
      if (res.ok) {
        const data = await res.json()
        setTransactions(data)
      }
    } catch (err) {
      console.error('Failed to load transactions:', err)
    }
  }

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/user/categories?type=transaction')
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  const deleteTransaction = async (id: string) => {
    if (!confirm(t.finance.confirmDelete)) return
    
    try {
      const res = await fetch(`/api/user/transactions?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadTransactions()
      }
    } catch (err) {
      console.error('Failed to delete transaction:', err)
    }
  }

  const getFilteredTransactions = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    let filtered = transactions.filter(tx => {
      const date = new Date(tx.date)
      if (filter === 'thisMonth') {
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      }
      if (filter === 'thisYear') {
        return date.getFullYear() === currentYear
      }
      return true
    })

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tx => tx.categoryId === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(tx => 
        tx.description?.toLowerCase().includes(query) ||
        tx.category?.name.toLowerCase().includes(query) ||
        tx.amount.toString().includes(query)
      )
    }

    return filtered
  }

  const calculateStats = (): Stats => {
    const filtered = getFilteredTransactions()
    const income = filtered.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0)
    const expense = filtered.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0)
    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense
    }
  }

  // Chart data preparation
  const expenseChartData = useMemo(() => {
    const filtered = getFilteredTransactions().filter(tx => tx.type === 'expense')
    const categoryMap = new Map<string, { name: string; value: number; color: string }>()

    filtered.forEach(tx => {
      const categoryName = tx.category?.name || 'Uncategorized'
      const color = tx.category?.color || '#6b7280'
      
      if (categoryMap.has(categoryName)) {
        categoryMap.get(categoryName)!.value += tx.amount
      } else {
        categoryMap.set(categoryName, {
          name: (t.finance.categories as any)[categoryName] || categoryName,
          value: tx.amount,
          color
        })
      }
    })

    return Array.from(categoryMap.values())
  }, [transactions, filter, selectedCategory, searchQuery, language])

  const trendChartData = useMemo(() => {
    const now = new Date()
    const months: { month: string; income: number; expense: number }[] = []
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { month: 'short' })
      
      const monthTransactions = transactions.filter(tx => {
        const tDate = new Date(tx.date)
        return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear()
      })

      months.push({
        month: monthName,
        income: monthTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0),
        expense: monthTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0)
      })
    }

    return months
  }, [transactions, language])

  const balanceChartData = useMemo(() => {
    return trendChartData.map(d => ({
      month: d.month,
      balance: d.income - d.expense
    }))
  }, [trendChartData])

  const stats = calculateStats()
  const filteredTransactions = getFilteredTransactions()

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">{t.finance.title}</h1>
        
        <button
          onClick={() => {
            setEditingTransaction(null)
            setIsModalOpen(true)
          }}
          className="w-full sm:w-auto px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          {t.finance.newTransaction}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">{t.finance.stats.totalIncome}</div>
          <div className="text-2xl font-semibold text-green-600">
            ${stats.totalIncome.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">{t.finance.stats.totalExpense}</div>
          <div className="text-2xl font-semibold text-red-600">
            ${stats.totalExpense.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">{t.finance.stats.balance}</div>
          <div className={`text-2xl font-semibold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${stats.balance.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">{t.finance.charts.expensesByCategory}</h3>
          <ExpensePieChart data={expenseChartData} />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">{t.finance.charts.incomeTrend}</h3>
          <TrendLineChart data={trendChartData} language={language} />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">{t.finance.charts.monthlyBalance}</h3>
          <BalanceBarChart data={balanceChartData} language={language} />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('thisMonth')}
            className={`px-4 py-2 text-sm rounded transition ${
              filter === 'thisMonth'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t.finance.thisMonth}
          </button>
          <button
            onClick={() => setFilter('thisYear')}
            className={`px-4 py-2 text-sm rounded transition ${
              filter === 'thisYear'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t.finance.thisYear}
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm rounded transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t.finance.allTime}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.finance.searchPlaceholder}
            className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t.finance.all}</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {(t.finance.categories as any)[cat.name] || cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-lg border border-gray-200">
          {t.finance.noTransactions}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.finance.date}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.finance.category}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.finance.description}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t.finance.amount}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {transaction.category ? (
                        <span 
                          className="inline-flex px-2 py-1 text-xs font-medium rounded"
                          style={{ 
                            backgroundColor: transaction.category.color + '20',
                            color: transaction.category.color
                          }}
                        >
                          {(t.finance.categories as any)[transaction.category.name] || transaction.category.name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">{t.finance.noCategory}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {transaction.description || '-'}
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium text-right ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <button
                        onClick={() => {
                          setEditingTransaction(transaction)
                          setIsModalOpen(true)
                        }}
                        className="text-blue-600 hover:text-blue-700 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTransaction(transaction.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTransaction(null)
        }}
        transaction={editingTransaction}
        categories={categories}
        onSave={loadTransactions}
      />
    </div>
  )
}

function TransactionModal({ isOpen, onClose, transaction, categories, onSave }: {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
  categories: Category[]
  onSave: () => void
}) {
  const { language } = useStore()
  const t = useTranslation(language)
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    if (transaction) {
      setType(transaction.type)
      setAmount(transaction.amount.toString())
      setDescription(transaction.description || '')
      setCategoryId(transaction.categoryId || '')
      setDate(transaction.date.split('T')[0])
    } else {
      setType('expense')
      setAmount('')
      setDescription('')
      setCategoryId('')
      setDate(new Date().toISOString().split('T')[0])
    }
  }, [transaction, isOpen])

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) return

    try {
      const method = transaction ? 'PUT' : 'POST'
      const body = transaction 
        ? { id: transaction.id, type, amount: parseFloat(amount), description, categoryId: categoryId || null, date }
        : { type, amount: parseFloat(amount), description, categoryId: categoryId || null, date }

      const res = await fetch('/api/user/transactions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        onSave()
        onClose()
      }
    } catch (err) {
      console.error('Failed to save transaction:', err)
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
                  {transaction ? 'Edit Transaction' : t.finance.newTransaction}
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
                    {t.finance.date}
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
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

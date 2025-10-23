'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { motion } from 'framer-motion'
import PortfolioDistribution from '@/components/Investments/PortfolioDistribution'
import AssetManager from '@/components/Investments/AssetManager'

type Asset = {
  id: string
  type: string
  symbol: string
  name: string
  holdings: Holding[]
}

type Holding = {
  id: string
  quantity: number
  purchasePrice: number
  purchaseDate: string
  currentPrice: number
  lastUpdated: string | null
  notes: string | null
}

export default function InvestmentsPage() {
  const { data: session, status } = useSession()
  const { language } = useStore()
  const t = useTranslation(language)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingPrices, setUpdatingPrices] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      loadAssets()
    }
  }, [status])

  const loadAssets = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/user/assets')
      if (res.ok) {
        const data = await res.json()
        setAssets(data)
      }
    } catch (err) {
      console.error('Failed to load assets:', err)
    } finally {
      setLoading(false)
    }
  }

  const updatePrices = async () => {
    try {
      setUpdatingPrices(true)
      const res = await fetch('/api/user/portfolio/update-prices', {
        method: 'POST',
      })
      
      if (res.ok) {
        // Reload assets to get updated prices
        await loadAssets()
      }
    } catch (err) {
      console.error('Failed to update prices:', err)
    } finally {
      setUpdatingPrices(false)
    }
  }

  // Calculate portfolio statistics
  const stats = useMemo(() => {
    let totalInvested = 0
    let currentValue = 0

    assets.forEach(asset => {
      asset.holdings.forEach(holding => {
        const invested = holding.quantity * holding.purchasePrice
        const current = holding.quantity * (holding.currentPrice || holding.purchasePrice)
        
        totalInvested += invested
        currentValue += current
      })
    })

    const profitLoss = currentValue - totalInvested
    const roi = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0

    return {
      totalInvested,
      currentValue,
      profitLoss,
      roi,
    }
  }, [assets])

  // Get last update time
  const lastUpdated = useMemo(() => {
    let latest: Date | null = null

    assets.forEach(asset => {
      asset.holdings.forEach(holding => {
        if (holding.lastUpdated) {
          const date = new Date(holding.lastUpdated)
          if (!latest || date > latest) {
            latest = date
          }
        }
      })
    })

    return latest
  }, [assets])

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="text-center py-12 text-sm md:text-base">Loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="text-center py-12 text-sm md:text-base">Please sign in</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t.finance.investments.title}</h1>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">
              {t.finance.investments.lastUpdated}: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
        
        <button
          onClick={updatePrices}
          disabled={updatingPrices}
          className="w-full sm:w-auto px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updatingPrices ? 'Updating...' : t.finance.investments.updatePrices}
        </button>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">{t.finance.investments.stats.totalInvested}</div>
          <div className="text-2xl font-semibold text-gray-900">
            ${stats.totalInvested.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">{t.finance.investments.stats.currentValue}</div>
          <div className="text-2xl font-semibold text-gray-900">
            ${stats.currentValue.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">{t.finance.investments.stats.unrealizedPL}</div>
          <div className={`text-2xl font-semibold ${stats.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${stats.profitLoss >= 0 ? '+' : ''}{stats.profitLoss.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">{t.finance.investments.roi}</div>
          <div className={`text-2xl font-semibold ${stats.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Portfolio Distribution Chart */}
      {assets.length > 0 && (
        <div className="mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">{t.finance.investments.charts.distribution}</h3>
            <PortfolioDistribution assets={assets} />
          </div>
        </div>
      )}

      {/* Asset Manager */}
      <AssetManager 
        assets={assets} 
        onUpdate={loadAssets}
      />
    </div>
  )
}


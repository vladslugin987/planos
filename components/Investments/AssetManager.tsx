'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { motion, AnimatePresence } from 'framer-motion'
import AssetModal from './AssetModal'
import HoldingModal from './HoldingModal'

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

type Props = {
  assets: Asset[]
  onUpdate: () => void
}

export default function AssetManager({ assets, onUpdate }: Props) {
  const { language } = useStore()
  const t = useTranslation(language)
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false)
  const [isHoldingModalOpen, setIsHoldingModalOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null)
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null)

  const deleteAsset = async (id: string) => {
    if (!confirm(t.finance.investments.confirmDelete)) return
    
    try {
      const res = await fetch(`/api/user/assets?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        onUpdate()
      }
    } catch (err) {
      console.error('Failed to delete asset:', err)
    }
  }

  const deleteHolding = async (id: string) => {
    if (!confirm(t.finance.investments.confirmDeleteHolding)) return
    
    try {
      const res = await fetch(`/api/user/holdings?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        onUpdate()
      }
    } catch (err) {
      console.error('Failed to delete holding:', err)
    }
  }

  const calculateAssetStats = (asset: Asset) => {
    let totalInvested = 0
    let currentValue = 0
    let totalQuantity = 0

    asset.holdings.forEach(holding => {
      const invested = holding.quantity * holding.purchasePrice
      const current = holding.quantity * (holding.currentPrice || holding.purchasePrice)
      
      totalInvested += invested
      currentValue += current
      totalQuantity += holding.quantity
    })

    const profitLoss = currentValue - totalInvested
    const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0

    return {
      totalInvested,
      currentValue,
      profitLoss,
      profitLossPercent,
      totalQuantity,
      avgPrice: totalQuantity > 0 ? totalInvested / totalQuantity : 0,
      currentPrice: asset.holdings[0]?.currentPrice || 0,
    }
  }

  const calculateHoldingStats = (holding: Holding) => {
    const invested = holding.quantity * holding.purchasePrice
    const currentValue = holding.quantity * (holding.currentPrice || holding.purchasePrice)
    const profitLoss = currentValue - invested
    const profitLossPercent = invested > 0 ? (profitLoss / invested) * 100 : 0

    return {
      invested,
      currentValue,
      profitLoss,
      profitLossPercent,
    }
  }

  const getAssetTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      crypto: t.finance.investments.crypto,
      stock: t.finance.investments.stock,
      bond: t.finance.investments.bond,
      real_estate: t.finance.investments.realEstate,
      commodity: t.finance.investments.commodity,
      other: t.finance.investments.other,
    }
    return types[type] || type
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{t.finance.investments.portfolio}</h3>
        <button
          onClick={() => {
            setSelectedAsset(null)
            setIsAssetModalOpen(true)
          }}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          {t.finance.investments.addAsset}
        </button>
      </div>

      {assets.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {t.finance.investments.noAssets}
        </div>
      ) : (
        <div className="space-y-3">
          {assets.map((asset) => {
            const stats = calculateAssetStats(asset)
            const isExpanded = expandedAssetId === asset.id

            return (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Asset Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpandedAssetId(isExpanded ? null : asset.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-lg">{asset.symbol}</span>
                        <span className="text-sm text-gray-500">{asset.name}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                          {getAssetTypeLabel(asset.type)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                        <div>
                          <div className="text-xs text-gray-500">Quantity</div>
                          <div className="text-sm font-medium">{stats.totalQuantity.toFixed(4)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Avg Price</div>
                          <div className="text-sm font-medium">${stats.avgPrice.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Current Value</div>
                          <div className="text-sm font-medium">${stats.currentValue.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">{t.finance.investments.profitLoss}</div>
                          <div className={`text-sm font-medium ${stats.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stats.profitLoss >= 0 ? '+' : ''}${stats.profitLoss.toFixed(2)} ({stats.profitLossPercent >= 0 ? '+' : ''}{stats.profitLossPercent.toFixed(2)}%)
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedAsset(asset)
                          setSelectedHolding(null)
                          setIsHoldingModalOpen(true)
                        }}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        + Buy
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteAsset(asset.id)
                        }}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                      <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                    </div>
                  </div>
                </div>

                {/* Holdings List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-200 bg-gray-50"
                    >
                      <div className="p-4">
                        <div className="text-sm font-medium text-gray-700 mb-3">
                          {t.finance.investments.holdings} ({asset.holdings.length})
                        </div>
                        
                        {asset.holdings.length === 0 ? (
                          <div className="text-sm text-gray-400 py-2">
                            {t.finance.investments.noHoldings}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {asset.holdings.map((holding) => {
                              const holdingStats = calculateHoldingStats(holding)
                              
                              return (
                                <div
                                  key={holding.id}
                                  className="bg-white border border-gray-200 rounded p-3 text-sm"
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 flex-1">
                                      <div>
                                        <div className="text-xs text-gray-500">Date</div>
                                        <div>{new Date(holding.purchaseDate).toLocaleDateString()}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-gray-500">Quantity</div>
                                        <div>{holding.quantity.toFixed(4)}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-gray-500">Buy Price</div>
                                        <div>${holding.purchasePrice.toFixed(2)}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-gray-500">Current</div>
                                        <div>${holdingStats.currentValue.toFixed(2)}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-gray-500">P&L</div>
                                        <div className={holdingStats.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                                          {holdingStats.profitLoss >= 0 ? '+' : ''}${holdingStats.profitLoss.toFixed(2)}
                                          <span className="text-xs ml-1">
                                            ({holdingStats.profitLossPercent >= 0 ? '+' : ''}{holdingStats.profitLossPercent.toFixed(1)}%)
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex gap-2 ml-3">
                                      <button
                                        onClick={() => {
                                          setSelectedAsset(asset)
                                          setSelectedHolding(holding)
                                          setIsHoldingModalOpen(true)
                                        }}
                                        className="text-blue-600 hover:text-blue-700"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => deleteHolding(holding.id)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        Sell
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {holding.notes && (
                                    <div className="mt-2 text-xs text-gray-600 border-t border-gray-100 pt-2">
                                      {holding.notes}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      <AssetModal
        isOpen={isAssetModalOpen}
        onClose={() => {
          setIsAssetModalOpen(false)
          setSelectedAsset(null)
        }}
        asset={selectedAsset}
        onSave={onUpdate}
      />

      <HoldingModal
        isOpen={isHoldingModalOpen}
        onClose={() => {
          setIsHoldingModalOpen(false)
          setSelectedAsset(null)
          setSelectedHolding(null)
        }}
        asset={selectedAsset}
        holding={selectedHolding}
        onSave={onUpdate}
      />
    </div>
  )
}


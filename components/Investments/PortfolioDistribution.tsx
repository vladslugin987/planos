'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

type Asset = {
  id: string
  type: string
  symbol: string
  name: string
  holdings: Holding[]
}

type Holding = {
  quantity: number
  purchasePrice: number
  currentPrice: number
}

type Props = {
  assets: Asset[]
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // orange
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
]

export default function PortfolioDistribution({ assets }: Props) {
  // Calculate current value for each asset
  const data = assets.map((asset, index) => {
    const currentValue = asset.holdings.reduce((sum, holding) => {
      return sum + (holding.quantity * (holding.currentPrice || holding.purchasePrice))
    }, 0)

    return {
      name: asset.symbol,
      value: currentValue,
      color: COLORS[index % COLORS.length],
    }
  }).filter(item => item.value > 0) // Only show assets with value

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        No data
      </div>
    )
  }

  const totalValue = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }: any) => {
              const percent = ((value / totalValue) * 100).toFixed(1)
              return `${name}: ${percent}%`
            }}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `$${value.toFixed(2)}`}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}


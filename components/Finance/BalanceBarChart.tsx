'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

type Props = {
  data: Array<{ month: string; balance: number }>
  language: 'ru' | 'en'
}

export default function BalanceBarChart({ data, language }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-400">
        {language === 'ru' ? 'Нет данных' : 'No data'}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="month" 
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip 
          formatter={(value: number) => `$${value.toFixed(2)}`}
          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
        />
        <Legend />
        <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
        <Bar 
          dataKey="balance" 
          fill="#3b82f6"
          name={language === 'ru' ? 'Баланс' : 'Balance'}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}


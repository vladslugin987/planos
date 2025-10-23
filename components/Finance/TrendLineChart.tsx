'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type Props = {
  data: Array<{ month: string; income: number; expense: number }>
  language: 'ru' | 'en'
}

export default function TrendLineChart({ data, language }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-400">
        {language === 'ru' ? 'Нет данных' : 'No data'}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
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
        <Line 
          type="monotone" 
          dataKey="income" 
          stroke="#10b981" 
          strokeWidth={2}
          name={language === 'ru' ? 'Доход' : 'Income'}
          dot={{ fill: '#10b981', r: 4 }}
        />
        <Line 
          type="monotone" 
          dataKey="expense" 
          stroke="#ef4444" 
          strokeWidth={2}
          name={language === 'ru' ? 'Расход' : 'Expense'}
          dot={{ fill: '#ef4444', r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}


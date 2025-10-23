'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

type ToastProps = {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }[type]

  const icon = {
    success: '✓',
    error: '✗',
    info: 'ℹ',
  }[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: -50, x: '-50%' }}
      className={`fixed top-6 left-1/2 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3`}
    >
      <span className="text-xl font-bold">{icon}</span>
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-white/80 hover:text-white font-bold"
      >
        ×
      </button>
    </motion.div>
  )
}

type ToastContainerProps = {
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>
  removeToast: (id: string) => void
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <AnimatePresence mode="wait">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </AnimatePresence>
  )
}


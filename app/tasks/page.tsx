'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { motion, AnimatePresence } from 'framer-motion'

type Task = {
  id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in_progress' | 'completed'
  dueDate?: string
  items: TaskItem[]
  categoryId?: string
  createdAt: string
}

type TaskItem = {
  id: string
  text: string
  completed: boolean
  order: number
}

export default function TasksPage() {
  const { data: session } = useSession()
  const { language } = useStore()
  const t = useTranslation(language)
  const [tasks, setTasks] = useState<Task[]>([])
  const [showCompleted, setShowCompleted] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  useEffect(() => {
    if (session) {
      loadTasks()
    }
  }, [session])

  const loadTasks = async () => {
    try {
      const res = await fetch('/api/user/tasks')
      if (res.ok) {
        const data = await res.json()
        setTasks(data)
      }
    } catch (err) {
      console.error('Failed to load tasks:', err)
    }
  }

  const filteredTasks = showCompleted 
    ? tasks 
    : tasks.filter(t => t.status !== 'completed')

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50'
      case 'medium': return 'border-yellow-500 bg-yellow-50'
      case 'low': return 'border-green-500 bg-green-50'
      default: return 'border-gray-300 bg-white'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'in_progress': return 'text-blue-600'
      case 'todo': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const deleteTask = async (id: string) => {
    if (!confirm(t.tasks.confirmDelete)) return
    
    try {
      const res = await fetch(`/api/user/tasks?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadTasks()
      }
    } catch (err) {
      console.error('Failed to delete task:', err)
    }
  }

  const toggleItemComplete = async (taskId: string, itemId: string, completed: boolean) => {
    try {
      const res = await fetch('/api/user/tasks/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, itemId, completed }),
      })
      if (res.ok) {
        loadTasks()
      }
    } catch (err) {
      console.error('Failed to update item:', err)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">{t.tasks.title}</h1>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex-1 sm:flex-none px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition"
          >
            {showCompleted ? t.tasks.hideCompleted : t.tasks.showCompleted}
          </button>
          <button
            onClick={() => {
              setEditingTask(null)
              setIsModalOpen(true)
            }}
            className="flex-1 sm:flex-none px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {t.tasks.newTask}
          </button>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {t.tasks.noTasks}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border-l-4 rounded-lg p-4 ${getPriorityColor(task.priority)}`}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900 flex-1">{task.title}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingTask(task)
                      setIsModalOpen(true)
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {task.description && (
                <p className="text-sm text-gray-600 mb-3">{task.description}</p>
              )}

              <div className="flex items-center gap-2 mb-3 text-xs">
                <span className={`font-medium ${getStatusColor(task.status)}`}>
                  {t.tasks.statuses[task.status as keyof typeof t.tasks.statuses]}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">
                  {t.tasks.priorities[task.priority as keyof typeof t.tasks.priorities]}
                </span>
              </div>

              {task.items && task.items.length > 0 && (
                <div className="space-y-2">
                  {task.items.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-2 text-sm cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={(e) => toggleItemComplete(task.id, item.id, e.target.checked)}
                        className="mt-0.5 rounded border-gray-300"
                      />
                      <span className={item.completed ? 'line-through text-gray-400' : 'text-gray-700'}>
                        {item.text}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {task.dueDate && (
                <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                  {t.tasks.dueDate}: {new Date(task.dueDate).toLocaleDateString()}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTask(null)
        }}
        task={editingTask}
        onSave={loadTasks}
      />
    </div>
  )
}

function TaskModal({ isOpen, onClose, task, onSave }: {
  isOpen: boolean
  onClose: () => void
  task: Task | null
  onSave: () => void
}) {
  const { language } = useStore()
  const t = useTranslation(language)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'completed'>('todo')
  const [dueDate, setDueDate] = useState('')
  const [items, setItems] = useState<{ text: string; completed: boolean; order: number }[]>([])
  const [newItemText, setNewItemText] = useState('')

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setPriority(task.priority)
      setStatus(task.status)
      setDueDate(task.dueDate || '')
      setItems(task.items || [])
    } else {
      setTitle('')
      setDescription('')
      setPriority('medium')
      setStatus('todo')
      setDueDate('')
      setItems([])
    }
  }, [task, isOpen])

  const handleSave = async () => {
    if (!title.trim()) return

    try {
      const method = task ? 'PUT' : 'POST'
      const body = task 
        ? { id: task.id, title, description, priority, status, dueDate: dueDate || null, items }
        : { title, description, priority, status, dueDate: dueDate || null, items }

      const res = await fetch('/api/user/tasks', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        onSave()
        onClose()
      }
    } catch (err) {
      console.error('Failed to save task:', err)
    }
  }

  const addItem = () => {
    if (!newItemText.trim()) return
    setItems([...items, { text: newItemText, completed: false, order: items.length }])
    setNewItemText('')
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
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
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {task ? 'Edit Task' : t.tasks.newTask}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.tasks.taskName}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t.tasks.taskNamePlaceholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.tasks.description}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t.tasks.descriptionPlaceholder}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.tasks.priority}
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">{t.tasks.priorities.low}</option>
                      <option value="medium">{t.tasks.priorities.medium}</option>
                      <option value="high">{t.tasks.priorities.high}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.tasks.status}
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="todo">{t.tasks.statuses.todo}</option>
                      <option value="in_progress">{t.tasks.statuses.in_progress}</option>
                      <option value="completed">{t.tasks.statuses.completed}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.tasks.dueDate}
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Checklist
                  </label>
                  <div className="space-y-2 mb-3">
                    {items.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={(e) => {
                            const newItems = [...items]
                            newItems[index].completed = e.target.checked
                            setItems(newItems)
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className={`flex-1 ${item.completed ? 'line-through text-gray-400' : ''}`}>
                          {item.text}
                        </span>
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addItem()}
                      placeholder={t.tasks.itemPlaceholder}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={addItem}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                    >
                      {t.tasks.addItem}
                    </button>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                >
                  {t.tasks.cancel}
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  {t.tasks.save}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}


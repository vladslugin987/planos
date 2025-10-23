import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from './i18n'

export type CalendarEvent = {
  id: string
  title: string
  description?: string
  day: number // 0-6 (Mon-Sun)
  startTime: number // hours (0-24)
  startMinute?: number // minutes (0-59), default 0
  endTime: number
  endMinute?: number // minutes (0-59), default 0
  color?: string
  week?: number // which week relative to current
}

export type Note = {
  id: string
  text: string
  x: number
  y: number
  color: string
  collapsed: boolean
  width?: number
  height?: number
}

type Store = {
  events: CalendarEvent[]
  notes: Note[]
  currentWeekOffset: number
  githubToken: string | null
  githubClientId: string | null
  githubClientSecret: string | null
  openaiApiKey: string | null
  language: Language
  calendarStartHour: number
  calendarEndHour: number
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  addEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  
  addNote: (note: Omit<Note, 'id'>) => Promise<void>
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  
  setWeekOffset: (offset: number) => void
  setGithubToken: (token: string | null) => void
  setGithubClientId: (id: string | null) => void
  setGithubClientSecret: (secret: string | null) => void
  setOpenaiApiKey: (key: string | null) => void
  setLanguage: (lang: Language) => void
  setCalendarHours: (startHour: number, endHour: number) => void
  
  // Sync with server
  loadUserData: () => Promise<void>
  saveSettings: () => Promise<void>
  setAuthenticated: (auth: boolean) => void
}

// Helper functions for API calls
async function fetchAPI(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }
  return res.json()
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      events: [],
      notes: [],
      currentWeekOffset: 0,
      githubToken: null,
      githubClientId: null,
      githubClientSecret: null,
      openaiApiKey: null,
      language: 'ru',
      calendarStartHour: 6,
      calendarEndHour: 20,
      isAuthenticated: false,
      isLoading: false,
      
      // Load user data from server
      loadUserData: async () => {
        if (!get().isAuthenticated) return
        
        set({ isLoading: true })
        try {
          const [settings, events, notes] = await Promise.all([
            fetchAPI('/api/user/settings'),
            fetchAPI('/api/user/events'),
            fetchAPI('/api/user/notes'),
          ])
          
          set({
            openaiApiKey: settings.openaiApiKey,
            githubToken: settings.githubToken,
            githubClientId: settings.githubClientId,
            githubClientSecret: settings.githubClientSecret,
            language: settings.language,
            calendarStartHour: settings.calendarStartHour,
            calendarEndHour: settings.calendarEndHour,
            events,
            notes,
            isLoading: false,
          })
        } catch (error) {
          console.error('Failed to load user data:', error)
          set({ isLoading: false })
        }
      },
      
      // Save settings to server
      saveSettings: async () => {
        if (!get().isAuthenticated) return
        
        try {
          const state = get()
          await fetchAPI('/api/user/settings', {
            method: 'PUT',
            body: JSON.stringify({
              openaiApiKey: state.openaiApiKey,
              githubToken: state.githubToken,
              githubClientId: state.githubClientId,
              githubClientSecret: state.githubClientSecret,
              language: state.language,
              calendarStartHour: state.calendarStartHour,
              calendarEndHour: state.calendarEndHour,
            }),
          })
        } catch (error) {
          console.error('Failed to save settings:', error)
        }
      },
      
      addEvent: async (event) => {
        if (get().isAuthenticated) {
          try {
            const newEvent = await fetchAPI('/api/user/events', {
              method: 'POST',
              body: JSON.stringify(event),
            })
            set((state) => ({ events: [...state.events, newEvent] }))
          } catch (error) {
            console.error('Failed to add event:', error)
          }
        } else {
          // Fallback to local storage
          const newEvent = { ...event, id: Date.now().toString() }
          set((state) => ({ events: [...state.events, newEvent] }))
        }
      },
      
      updateEvent: async (id, updates) => {
        if (get().isAuthenticated) {
          try {
            const updatedEvent = await fetchAPI('/api/user/events', {
              method: 'PUT',
              body: JSON.stringify({ id, ...updates }),
            })
            set((state) => ({
              events: state.events.map((e) => (e.id === id ? updatedEvent : e)),
            }))
          } catch (error) {
            console.error('Failed to update event:', error)
          }
        } else {
          set((state) => ({
            events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
          }))
        }
      },
      
      deleteEvent: async (id) => {
        if (get().isAuthenticated) {
          try {
            await fetchAPI(`/api/user/events?id=${id}`, { method: 'DELETE' })
            set((state) => ({ events: state.events.filter((e) => e.id !== id) }))
          } catch (error) {
            console.error('Failed to delete event:', error)
          }
        } else {
          set((state) => ({ events: state.events.filter((e) => e.id !== id) }))
        }
      },
      
      addNote: async (note) => {
        if (get().isAuthenticated) {
          try {
            const newNote = await fetchAPI('/api/user/notes', {
              method: 'POST',
              body: JSON.stringify(note),
            })
            set((state) => ({ notes: [...state.notes, newNote] }))
          } catch (error) {
            console.error('Failed to add note:', error)
          }
        } else {
          const newNote = { ...note, id: Date.now().toString() }
          set((state) => ({ notes: [...state.notes, newNote] }))
        }
      },
      
      updateNote: async (id, updates) => {
        if (get().isAuthenticated) {
          try {
            const updatedNote = await fetchAPI('/api/user/notes', {
              method: 'PUT',
              body: JSON.stringify({ id, ...updates }),
            })
            set((state) => ({
              notes: state.notes.map((n) => (n.id === id ? updatedNote : n)),
            }))
          } catch (error) {
            console.error('Failed to update note:', error)
          }
        } else {
          set((state) => ({
            notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
          }))
        }
      },
      
      deleteNote: async (id) => {
        if (get().isAuthenticated) {
          try {
            await fetchAPI(`/api/user/notes?id=${id}`, { method: 'DELETE' })
            set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }))
          } catch (error) {
            console.error('Failed to delete note:', error)
          }
        } else {
          set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }))
        }
      },
      
      setWeekOffset: (offset) => set({ currentWeekOffset: offset }),
      setGithubToken: (token) => {
        set({ githubToken: token })
        get().saveSettings()
      },
      setGithubClientId: (id) => {
        set({ githubClientId: id })
        get().saveSettings()
      },
      setGithubClientSecret: (secret) => {
        set({ githubClientSecret: secret })
        get().saveSettings()
      },
      setOpenaiApiKey: (key) => {
        set({ openaiApiKey: key })
        get().saveSettings()
      },
      setLanguage: (lang) => {
        set({ language: lang })
        get().saveSettings()
      },
      setCalendarHours: (startHour, endHour) => {
        set({ calendarStartHour: startHour, calendarEndHour: endHour })
        get().saveSettings()
      },
      setAuthenticated: (auth) => set({ isAuthenticated: auth }),
    }),
    {
      name: 'planos-storage',
      partialize: (state) => ({
        // Only persist UI state locally, not user data
        currentWeekOffset: state.currentWeekOffset,
        language: state.language,
      }),
    }
  )
)


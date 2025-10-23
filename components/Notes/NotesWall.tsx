'use client'

import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import Sticker from './Sticker'
import { colors } from '@/lib/utils'

export default function NotesWall() {
  const notes = useStore((state) => state.notes)
  const addNote = useStore((state) => state.addNote)
  const updateNote = useStore((state) => state.updateNote)
  const deleteNote = useStore((state) => state.deleteNote)
  const language = useStore((state) => state.language)
  const t = useTranslation(language)

  const createNote = () => {
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    const isMobile = window.innerWidth < 768
    addNote({
      text: '',
      x: isMobile 
        ? Math.random() * (window.innerWidth - 200) + 20 
        : Math.random() * (window.innerWidth - 300) + 50,
      y: Math.random() * 400 + 100,
      color: randomColor,
      collapsed: false,
      width: isMobile ? 160 : 200,
      height: isMobile ? 120 : 150,
    })
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* notes */}
      <div className="relative min-h-screen">
        {notes.length === 0 ? (
          // Show centered button when no notes
          <div className="fixed inset-0 flex items-center justify-center px-4">
            <button
              onClick={createNote}
              className="bg-blue-600 text-white px-6 md:px-8 py-2 md:py-3 text-sm md:text-base rounded-lg hover:bg-blue-700 transition shadow-md"
              type="button"
            >
              {t.notes.newNote}
            </button>
          </div>
        ) : (
          // Show button at top when notes exist
          <>
            <div className="sticky top-4 md:top-6 z-10 flex justify-center mb-6 md:mb-8 pt-4 md:pt-6">
              <button
                onClick={createNote}
                className="bg-blue-600 text-white px-6 md:px-8 py-2 md:py-3 text-sm md:text-base rounded-lg hover:bg-blue-700 transition shadow-md"
                type="button"
              >
                {t.notes.newNote}
              </button>
            </div>
            {notes.map(note => (
              <Sticker
                key={note.id}
                note={note}
                onUpdate={(updates) => updateNote(note.id, updates)}
                onDelete={() => deleteNote(note.id)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}


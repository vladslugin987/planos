'use client'

import { Note } from '@/lib/store'
import { motion } from 'framer-motion'
import { useState, useRef, useEffect, memo } from 'react'

type Props = {
  note: Note
  onUpdate: (updates: Partial<Note>) => void
  onDelete: () => void
}

function Sticker({ note, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(note.text)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync text when note.text changes externally
  useEffect(() => {
    if (!editing) {
      setText(note.text)
    }
  }, [note.text, editing])

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [editing])

  const handleSave = () => {
    if (text !== note.text) {
      onUpdate({ text })
    }
    setEditing(false)
  }

  const handleCollapse = () => {
    onUpdate({ collapsed: !note.collapsed })
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      dragSnapToOrigin
      onDragEnd={(e, info) => {
        // Update store with new position using offset
        const newX = note.x + info.offset.x
        const newY = note.y + info.offset.y
        onUpdate({
          x: Math.max(0, newX),
          y: Math.max(0, newY),
        })
      }}
      initial={{ scale: 0, rotate: -10 }}
      animate={{ 
        scale: 1, 
        rotate: 0
      }}
      className="absolute cursor-move shadow-md border border-gray-200 touch-none"
      style={{
        left: note.x,
        top: note.y,
        width: note.width || 200,
        minHeight: note.collapsed ? 40 : note.height || 150,
      }}
    >
      <div
        className="rounded-lg p-3 md:p-4 h-full"
        style={{ backgroundColor: note.color }}
      >
        {/* header */}
        <div className="flex justify-between items-center mb-2">
          <button
            onClick={handleCollapse}
            className="text-[10px] md:text-xs bg-white/50 px-2 py-1 rounded hover:bg-white/70 transition-colors active:bg-white/80"
            type="button"
          >
            {note.collapsed ? '▼' : '▲'}
          </button>
          <button
            onClick={() => {
              if (confirm('Delete note?')) onDelete()
            }}
            className="text-[10px] md:text-xs bg-white/50 px-2 py-1 rounded hover:bg-white/70 transition-colors active:bg-white/80"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* content */}
        {!note.collapsed && (
          <div className="text-xs md:text-sm">
            {editing ? (
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setText(note.text)
                    setEditing(false)
                  }
                }}
                className="w-full h-20 md:h-24 bg-transparent border-none outline-none resize-none text-xs md:text-sm"
                style={{ color: 'inherit' }}
              />
            ) : (
              <div
                onClick={() => setEditing(true)}
                className="whitespace-pre-wrap cursor-text min-h-[60px] md:min-h-[80px]"
              >
                {note.text || '. . .'}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default memo(Sticker)


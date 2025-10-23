'use client'

import NotesWall from '@/components/Notes/NotesWall'
import dynamic from 'next/dynamic'

// Dynamically import to avoid SSR issues
const NotesWallDynamic = dynamic(() => import('@/components/Notes/NotesWall'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen">
    <div className="text-gray-500">Загрузка...</div>
  </div>
})

export default function NotesPage() {
  return <NotesWallDynamic />
}


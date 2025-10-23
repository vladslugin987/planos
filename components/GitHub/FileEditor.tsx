'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { ToastContainer } from '@/components/Toast'

type FileItem = {
  name: string
  path: string
  type: string
  sha?: string
  size?: number
}

type Props = {
  owner: string
  repo: string
}

type Toast = {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

export default function FileEditor({ owner, repo }: Props) {
  const { language } = useStore()
  const t = useTranslation(language)
  const [files, setFiles] = useState<FileItem[]>([])
  const [currentPath, setCurrentPath] = useState('')
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [editing, setEditing] = useState(false)
  const [commitMsg, setCommitMsg] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [showNewFileModal, setShowNewFileModal] = useState(false)
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadFiles(currentPath)
  }, [currentPath, owner, repo])

  const addToast = (message: string, type: Toast['type']) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const loadFiles = async (path: string) => {
    try {
      const res = await fetch('/api/github/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, path }),
      })
      const data = await res.json()
      if (data.contents) {
        setFiles(Array.isArray(data.contents) ? data.contents : [data.contents])
      }
    } catch (err) {
      console.error('failed to load files', err)
      addToast(t.homework.saveError, 'error')
    }
  }

  const openFile = async (file: FileItem) => {
    if (file.type === 'dir') {
      setCurrentPath(file.path)
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
    try {
      const res = await fetch('/api/github/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, path: file.path }),
      })
      const data = await res.json()
      if (data.contents && data.contents.content) {
        const decoded = atob(data.contents.content)
        setFileContent(decoded)
      }
    } catch (err) {
      console.error('failed to read file', err)
      addToast(t.homework.saveError, 'error')
    }
  }

  const saveFile = async () => {
    if (!selectedFile) return

    try {
      const res = await fetch('/api/github/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          repo,
          path: selectedFile.path,
          content: fileContent,
          message: commitMsg || 'Update from Planos',
          sha: selectedFile.sha,
        }),
      })

      if (res.ok) {
        addToast(t.homework.fileSaved, 'success')
        setEditing(false)
        setCommitMsg('')
        loadFiles(currentPath)
      } else {
        addToast(t.homework.saveError, 'error')
      }
    } catch (err) {
      addToast(t.homework.saveError, 'error')
    }
  }

  const deleteFile = async () => {
    if (!selectedFile || !selectedFile.sha) return
    
    if (!window.confirm(`${t.homework.confirmDelete}: ${selectedFile.name}?`)) {
      return
    }

    try {
      const res = await fetch('/api/github/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          repo,
          path: selectedFile.path,
          message: `Delete ${selectedFile.name} from Planos`,
          sha: selectedFile.sha,
        }),
      })

      if (res.ok) {
        addToast(t.homework.fileDeleted, 'success')
        setSelectedFile(null)
        setFileContent('')
        loadFiles(currentPath)
      } else {
        addToast(t.homework.deleteError, 'error')
      }
    } catch (err) {
      addToast(t.homework.deleteError, 'error')
    }
  }

  const createNewFile = async () => {
    if (!newFileName.trim()) return

    const filePath = currentPath ? `${currentPath}/${newFileName}` : newFileName

    try {
      const res = await fetch('/api/github/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          repo,
          path: filePath,
          content: btoa(''), // empty file
          message: `Create ${newFileName} from Planos`,
        }),
      })

      if (res.ok) {
        addToast(t.homework.fileSaved, 'success')
        setShowNewFileModal(false)
        setNewFileName('')
        loadFiles(currentPath)
      } else {
        addToast(t.homework.uploadError, 'error')
      }
    } catch (err) {
      addToast(t.homework.uploadError, 'error')
    }
  }

  const createNewFolder = async () => {
    if (!newFolderName.trim()) return

    // GitHub doesn't have "folders" - we create a .gitkeep file inside
    const folderPath = currentPath 
      ? `${currentPath}/${newFolderName}/.gitkeep` 
      : `${newFolderName}/.gitkeep`

    try {
      const res = await fetch('/api/github/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          repo,
          path: folderPath,
          content: btoa(''),
          message: `Create folder ${newFolderName} from Planos`,
        }),
      })

      if (res.ok) {
        addToast(t.homework.folderCreated, 'success')
        setShowNewFolderModal(false)
        setNewFolderName('')
        loadFiles(currentPath)
      } else {
        addToast(t.homework.uploadError, 'error')
      }
    } catch (err) {
      addToast(t.homework.uploadError, 'error')
    }
  }

  const handleFileUpload = async (files: FileList) => {
    setUploading(true)
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const reader = new FileReader()
        
        await new Promise((resolve, reject) => {
          reader.onload = async (e) => {
            try {
              const content = e.target?.result as string
              const base64Content = content.split(',')[1] // remove data:*/*;base64, prefix
              
              const filePath = currentPath 
                ? `${currentPath}/${file.name}` 
                : file.name

              const res = await fetch('/api/github/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  owner,
                  repo,
                  path: filePath,
                  content: base64Content,
                  message: `Upload ${file.name} from Planos`,
                }),
              })

              if (!res.ok) {
                throw new Error('Upload failed')
              }
              
              resolve(true)
            } catch (err) {
              reject(err)
            }
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      }
      
      addToast(t.homework.fileUploaded, 'success')
      loadFiles(currentPath)
    } catch (err) {
      addToast(t.homework.uploadError, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div className="flex flex-col lg:flex-row gap-3 md:gap-4 min-h-[400px] lg:h-[600px]">
        {/* file tree */}
        <div className="w-full lg:w-64 bg-gray-50 rounded-lg p-3 md:p-4 max-h-[300px] lg:max-h-none overflow-y-auto border border-gray-200">
          <div className="mb-3 md:mb-4 space-y-2">
            <button
              onClick={() => setShowNewFileModal(true)}
              className="w-full text-left text-xs md:text-sm px-2 md:px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 active:bg-blue-800"
            >
              {t.homework.newFile}
            </button>
            <button
              onClick={() => setShowNewFolderModal(true)}
              className="w-full text-left text-xs md:text-sm px-2 md:px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 active:bg-green-800"
            >
              {t.homework.newFolder}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-left text-xs md:text-sm px-2 md:px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 active:bg-purple-800"
            >
              {t.homework.uploadFiles}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            />
          </div>

          {currentPath && (
            <button
              onClick={() => {
                const parts = currentPath.split('/')
                parts.pop()
                setCurrentPath(parts.join('/'))
              }}
              className="mb-2 md:mb-3 text-xs md:text-sm text-blue-600 hover:underline"
            >
              {t.homework.back}
            </button>
          )}
          <div className="space-y-1">
            {files.map((file, i) => (
              <div
                key={i}
                onClick={() => openFile(file)}
                className="p-2 hover:bg-white active:bg-white rounded cursor-pointer text-xs md:text-sm"
              >
                <span className="mr-2">{file.type === 'dir' ? '📁' : '📄'}</span> {file.name}
              </div>
            ))}
          </div>
        </div>

        {/* editor / drop zone */}
        <div
          className={`flex-1 bg-white rounded-lg p-3 md:p-4 overflow-hidden flex flex-col border-2 transition-colors min-h-[400px] ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-lg font-semibold mb-4">{t.homework.uploading}</div>
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            </div>
          ) : selectedFile ? (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 md:mb-4 gap-2">
                <h3 className="font-semibold text-gray-900 text-sm md:text-base truncate max-w-full">{selectedFile.name}</h3>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setEditing(!editing)}
                    className="flex-1 sm:flex-none px-3 md:px-4 py-2 text-xs md:text-sm bg-blue-600 text-white rounded hover:bg-blue-700 active:bg-blue-800"
                  >
                    {editing ? t.homework.cancel : t.homework.edit}
                  </button>
                  <button
                    onClick={deleteFile}
                    className="flex-1 sm:flex-none px-3 md:px-4 py-2 text-xs md:text-sm bg-red-600 text-white rounded hover:bg-red-700 active:bg-red-800"
                  >
                    {t.homework.deleteFile}
                  </button>
                </div>
              </div>

              {editing ? (
                <>
                  <textarea
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    className="flex-1 font-mono text-xs md:text-sm border rounded p-2 md:p-3 mb-2 md:mb-3"
                    style={{ resize: 'none' }}
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={commitMsg}
                      onChange={(e) => setCommitMsg(e.target.value)}
                      placeholder={t.homework.commitMessage}
                      className="flex-1 px-2 md:px-3 py-2 text-xs md:text-sm border rounded"
                    />
                    <button
                      onClick={saveFile}
                      className="px-4 md:px-6 py-2 text-xs md:text-sm bg-green-600 text-white rounded hover:bg-green-700 active:bg-green-800"
                    >
                      {t.homework.commit}
                    </button>
                  </div>
                </>
              ) : (
                <pre className="flex-1 overflow-auto bg-gray-50 p-3 md:p-4 rounded text-xs md:text-sm font-mono">
                  {fileContent}
                </pre>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              {dragOver ? (
                <div className="text-center px-4">
                  <div className="text-xl md:text-2xl text-blue-600 font-semibold mb-2 md:mb-4">Drop files here</div>
                  <div className="text-sm md:text-base text-blue-600">{t.homework.dragAndDrop}</div>
                </div>
              ) : (
                <div className="text-center text-gray-400 px-4">
                  <div className="text-base md:text-lg font-medium mb-2 md:mb-4">{t.homework.selectFile}</div>
                  <div className="text-xs md:text-sm mt-2">{t.homework.dragAndDrop}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New File Modal */}
      <AnimatePresence>
        {showNewFileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewFileModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">{t.homework.createFile}</h3>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder={t.homework.fileName}
                className="w-full px-3 py-2 text-sm md:text-base border rounded mb-3 md:mb-4"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && createNewFile()}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowNewFileModal(false)}
                  className="px-3 md:px-4 py-2 text-sm md:text-base text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded"
                >
                  {t.homework.cancel}
                </button>
                <button
                  onClick={createNewFile}
                  className="px-3 md:px-4 py-2 text-sm md:text-base bg-blue-600 text-white rounded hover:bg-blue-700 active:bg-blue-800"
                >
                  {t.homework.createFile}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Folder Modal */}
      <AnimatePresence>
        {showNewFolderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewFolderModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">{t.homework.createFolder}</h3>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder={t.homework.folderName}
                className="w-full px-3 py-2 text-sm md:text-base border rounded mb-3 md:mb-4"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && createNewFolder()}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-3 md:px-4 py-2 text-sm md:text-base text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded"
                >
                  {t.homework.cancel}
                </button>
                <button
                  onClick={createNewFolder}
                  className="px-3 md:px-4 py-2 text-sm md:text-base bg-green-600 text-white rounded hover:bg-green-700 active:bg-green-800"
                >
                  {t.homework.createFolder}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

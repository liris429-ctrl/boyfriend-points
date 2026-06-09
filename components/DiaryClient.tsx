'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { DiaryEntry } from '@/lib/types'

interface Props {
  entries: DiaryEntry[]
  userId: string
  userRole: 'admin' | 'user'
}

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX_W = 1024
      const scale = Math.min(1, MAX_W / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('canvas error')); return }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('compress failed'))),
        'image/jpeg',
        0.72,
      )
    }
    img.onerror = reject
    img.src = url
  })
}

export default function DiaryClient({ entries: initial, userId, userRole }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [entries, setEntries] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [content, setContent] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function clearPhoto() {
    setPhotoFile(null)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function closeForm() {
    setShowForm(false)
    setContent('')
    setError(null)
    clearPhoto()
  }

  async function handleSubmit() {
    if (!content.trim()) return
    setUploading(true)
    setError(null)

    let photoUrl: string | null = null

    if (photoFile) {
      try {
        const compressed = await compressImage(photoFile)
        const fileName = `${userId}/${Date.now()}.jpg`
        const { data: up, error: upErr } = await supabase.storage
          .from('diary-photos')
          .upload(fileName, compressed, { contentType: 'image/jpeg' })
        if (!upErr && up) {
          const { data: { publicUrl } } = supabase.storage
            .from('diary-photos')
            .getPublicUrl(up.path)
          photoUrl = publicUrl
        }
      } catch {
        // continue without photo if compression/upload fails
      }
    }

    const { data, error: insertErr } = await supabase
      .from('diary_entries')
      .insert({ author_id: userId, content: content.trim(), photo_url: photoUrl })
      .select('*, profiles!diary_entries_author_id_fkey(display_name, role)')
      .single()

    setUploading(false)

    if (insertErr) {
      setError(insertErr.message)
      return
    }
    if (data) {
      setEntries([data as DiaryEntry, ...entries])
      closeForm()
      router.refresh()
    }
  }

  async function handleDelete(id: string) {
    const entry = entries.find((e) => e.id === id)
    if (entry?.photo_url) {
      const path = entry.photo_url.split('/diary-photos/')[1]
      if (path) await supabase.storage.from('diary-photos').remove([decodeURIComponent(path)])
    }
    await supabase.from('diary_entries').delete().eq('id', id)
    setEntries(entries.filter((e) => e.id !== id))
    setConfirmDeleteId(null)
  }

  return (
    <div className="space-y-4">
      {/* Fullscreen photo viewer */}
      {fullscreenPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setFullscreenPhoto(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fullscreenPhoto} alt="" className="max-w-full max-h-full object-contain rounded-xl" />
          <button className="absolute top-4 right-4 text-white text-2xl opacity-70">✕</button>
        </div>
      )}

      {/* Compose */}
      {showForm ? (
        <div className="bg-white rounded-2xl border border-pink-200 p-4 space-y-3">
          <h3 className="font-semibold text-pink-700 text-sm">✏️ 寫今天的故事</h3>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            placeholder="今天發生了什麼…"
            rows={4}
            autoFocus
            className="w-full px-3 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:border-pink-400 resize-none"
          />

          {photoPreview && (
            <div className="relative w-28 h-28">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="" className="w-28 h-28 object-cover rounded-xl" />
              <button
                onClick={clearPhoto}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center shadow"
              >
                ✕
              </button>
            </div>
          )}

          {error && <p className="text-xs text-red-500">❌ {error}</p>}

          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
            {!photoPreview && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-pink-200 text-pink-500 text-xs hover:bg-pink-50 transition"
              >
                📷 加照片
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={closeForm}
              className="px-3 py-2 rounded-xl border border-gray-200 text-gray-400 text-sm hover:bg-gray-50 transition"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || uploading}
              className="px-4 py-2 rounded-xl bg-pink-500 text-white text-sm font-semibold hover:bg-pink-600 transition disabled:opacity-50"
            >
              {uploading ? '上傳中...' : '發布'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-pink-300 text-pink-500 text-sm font-medium hover:bg-pink-50 transition"
        >
          ✏️ 寫下今天的故事
        </button>
      )}

      {/* Entry list */}
      {entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-pink-100 p-10 text-center text-pink-300">
          <div className="text-5xl mb-3">📔</div>
          <p className="text-sm">還沒有日記，開始記錄你們的故事吧</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const isOwn = entry.author_id === userId
            const isAuthorAdmin = entry.profiles?.role === 'admin'
            const canDelete = isOwn || userRole === 'admin'

            return (
              <div key={entry.id} className="bg-white rounded-2xl border border-pink-100 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span>{isAuthorAdmin ? '👑' : '💙'}</span>
                    <span className="text-xs font-semibold text-gray-600">{entry.profiles?.display_name}</span>
                    <span className="text-xs text-pink-300">
                      {new Date(entry.created_at).toLocaleDateString('zh-TW', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {canDelete && (
                    confirmDeleteId === entry.id ? (
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-xs px-2 py-1 rounded-lg bg-red-500 text-white font-medium"
                        >確定</button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-400"
                        >取消</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(entry.id)}
                        className="text-xs text-gray-300 hover:text-red-400 transition shrink-0 ml-2"
                      >✕</button>
                    )
                  )}
                </div>

                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{entry.content}</p>

                {entry.photo_url && (
                  <div className="mt-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.photo_url}
                      alt=""
                      onClick={() => setFullscreenPhoto(entry.photo_url!)}
                      className="w-36 h-36 object-cover rounded-xl cursor-pointer hover:opacity-90 active:scale-95 transition"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

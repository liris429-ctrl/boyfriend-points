'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/lib/types'

const MOOD_OPTIONS = ['😊', '🥰', '😘', '💕', '🥺', '😤', '😂', '🤗', '😴', '🌸', '💪', '🎉']

interface Props {
  messages: Message[]
  userId: string
  userRole: 'admin' | 'user'
}

export default function MessagesClient({ messages: initial, userId, userRole }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [messages, setMessages] = useState(initial)
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('😊')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)

    const { data, error } = await supabase
      .from('messages')
      .insert({ sender_id: userId, content: content.trim(), mood_emoji: mood })
      .select('*, profiles!messages_sender_id_fkey(display_name, role)')
      .single()

    setLoading(false)
    if (!error && data) {
      setMessages([data as Message, ...messages])
      setContent('')
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await supabase.from('messages').delete().eq('id', id)
    setMessages(messages.filter((m) => m.id !== id))
    setDeleting(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Compose */}
      <div className="bg-white rounded-2xl border border-pink-100 p-4">
        <form onSubmit={handleSend} className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(m)}
                className={`text-xl p-1.5 rounded-lg border-2 transition ${
                  mood === m ? 'border-pink-400 bg-pink-50' : 'border-transparent hover:border-pink-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={100}
              placeholder="說點什麼吧…"
              className="flex-1 px-3 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:border-pink-400"
            />
            <button
              type="submit"
              disabled={!content.trim() || loading}
              className="px-4 py-2 rounded-xl bg-pink-500 text-white text-sm font-semibold hover:bg-pink-600 transition disabled:opacity-50"
            >
              {loading ? '...' : '送出'}
            </button>
          </div>
        </form>
      </div>

      {/* Messages */}
      <div className="space-y-2">
        {messages.length === 0 ? (
          <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center text-pink-300">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-sm">還沒有留言，說點什麼吧</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === userId
            const isAdmin = msg.profiles?.role === 'admin'

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className="text-2xl shrink-0 mt-1">{msg.mood_emoji}</div>
                <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm ${
                      isOwn
                        ? 'bg-pink-500 text-white rounded-tr-sm'
                        : 'bg-white border border-pink-100 text-gray-700 rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <div className={`flex items-center gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs text-pink-300">
                      {isAdmin ? '👑' : '💙'} {msg.profiles?.display_name}
                    </span>
                    <span className="text-xs text-pink-200">
                      {new Date(msg.created_at).toLocaleDateString('zh-TW', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    {isOwn && (
                      <button
                        onClick={() => handleDelete(msg.id)}
                        disabled={deleting === msg.id}
                        className="text-xs text-pink-200 hover:text-red-400 transition"
                      >
                        {deleting === msg.id ? '...' : '✕'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

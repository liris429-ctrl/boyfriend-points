'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { MarqueeMessage } from '@/lib/types'

interface Props {
  messages: MarqueeMessage[]
}

export default function MarqueeAdminClient({ messages: initial }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [messages, setMessages] = useState(initial)
  const [newText, setNewText] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAdd() {
    if (!newText.trim()) return
    setLoading(true)

    const maxOrder = messages.reduce((m, msg) => Math.max(m, msg.sort_order), 0)
    const { data } = await supabase
      .from('marquee_messages')
      .insert({ content: newText.trim(), sort_order: maxOrder + 1 })
      .select()
      .single()

    setLoading(false)
    if (data) {
      setMessages([...messages, data as MarqueeMessage])
      setNewText('')
      router.refresh()
    }
  }

  async function toggleActive(msg: MarqueeMessage) {
    const { data } = await supabase
      .from('marquee_messages')
      .update({ active: !msg.active })
      .eq('id', msg.id)
      .select()
      .single()
    if (data) setMessages(messages.map((m) => (m.id === msg.id ? (data as MarqueeMessage) : m)))
  }

  async function handleDelete(id: string) {
    await supabase.from('marquee_messages').delete().eq('id', id)
    setMessages(messages.filter((m) => m.id !== id))
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-pink-100 p-4 space-y-3">
      <h3 className="font-semibold text-pink-700 text-sm flex items-center gap-1.5">
        📢 跑馬燈文字
      </h3>

      <div className="flex gap-2">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          maxLength={50}
          placeholder="💕 今天要乖喔！"
          className="flex-1 px-3 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:border-pink-400"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          disabled={!newText.trim() || loading}
          className="shrink-0 px-4 py-2 rounded-xl bg-pink-500 text-white text-sm font-semibold hover:bg-pink-600 transition disabled:opacity-50"
        >
          新增
        </button>
      </div>

      <div className="space-y-1.5">
        {messages.length === 0 && (
          <p className="text-xs text-pink-300 text-center py-2">還沒有自訂文字</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition ${
              msg.active ? 'border-pink-100 bg-pink-50' : 'border-gray-100 bg-gray-50 opacity-60'
            }`}
          >
            <span className="flex-1 text-gray-700 truncate">{msg.content}</span>
            <button
              onClick={() => toggleActive(msg)}
              className={`text-xs px-2 py-0.5 rounded-lg border transition shrink-0 ${
                msg.active
                  ? 'border-gray-200 text-gray-400 hover:bg-gray-100'
                  : 'border-pink-200 text-pink-500 hover:bg-pink-50'
              }`}
            >
              {msg.active ? '隱藏' : '顯示'}
            </button>
            <button
              onClick={() => handleDelete(msg.id)}
              className="text-xs text-red-300 hover:text-red-500 transition shrink-0"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

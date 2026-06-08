'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { DailyTask } from '@/lib/types'

const EMOJI_OPTIONS = ['📋', '🧹', '🍳', '💬', '📱', '🛒', '💆', '🚶', '🎬', '📚', '🌅', '💪', '🌹', '☕', '🤝']

interface Props {
  todayTask: DailyTask | null
  adminId: string
}

export default function AdminDailyTaskForm({ todayTask, adminId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [editing, setEditing] = useState(!todayTask)
  const [title, setTitle] = useState(todayTask?.title ?? '')
  const [emoji, setEmoji] = useState(todayTask?.emoji ?? '📋')
  const [points, setPoints] = useState(todayTask?.points ?? 10)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!title.trim()) return
    setLoading(true)

    const today = new Date().toISOString().split('T')[0]

    if (todayTask) {
      await supabase
        .from('daily_tasks')
        .update({ title: title.trim(), emoji, points })
        .eq('id', todayTask.id)
    } else {
      await supabase.from('daily_tasks').insert({
        title: title.trim(),
        emoji,
        points,
        task_date: today,
        created_by: adminId,
      })
    }

    setLoading(false)
    setEditing(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!todayTask) return
    setLoading(true)
    await supabase.from('daily_tasks').delete().eq('id', todayTask.id)
    setLoading(false)
    setTitle('')
    setEmoji('📋')
    setPoints(10)
    setEditing(true)
    router.refresh()
  }

  if (!editing && todayTask) {
    return (
      <div className="bg-white rounded-2xl border border-amber-200 p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-amber-600">今日任務</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setEditing(true)}
              className="text-xs px-2 py-1 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition"
            >
              編輯
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="text-xs px-2 py-1 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 transition"
            >
              刪除
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-2xl">{todayTask.emoji}</span>
          <div>
            <p className="font-medium text-sm text-gray-700">{todayTask.title}</p>
            <p className="text-xs text-amber-500">+{todayTask.points} 分</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-amber-200 p-4 space-y-3">
      <h3 className="font-semibold text-amber-700 text-sm">
        {todayTask ? '編輯今日任務' : '設定今日任務'}
      </h3>

      <div className="flex flex-wrap gap-1.5">
        {EMOJI_OPTIONS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setEmoji(e)}
            className={`text-xl p-1.5 rounded-lg border-2 transition ${
              emoji === e ? 'border-amber-400 bg-amber-50' : 'border-transparent hover:border-amber-200'
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_5rem] gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={40}
          placeholder="今天記得傳晚安 🌙"
          className="min-w-0 px-3 py-2 rounded-xl border border-amber-200 text-sm focus:outline-none focus:border-amber-400"
        />
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-400 text-xs font-bold">+</span>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(parseInt(e.target.value) || 5)}
            min={1}
            max={999}
            className="w-full pl-6 pr-2 py-2 rounded-xl border border-amber-200 text-sm focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!title.trim() || loading}
          className="flex-1 py-2 rounded-xl bg-amber-400 text-white text-sm font-semibold hover:bg-amber-500 transition disabled:opacity-50"
        >
          {loading ? '儲存中...' : '儲存任務'}
        </button>
        {todayTask && (
          <button
            onClick={() => { setEditing(false); setTitle(todayTask.title); setEmoji(todayTask.emoji); setPoints(todayTask.points) }}
            className="flex-1 py-2 rounded-xl border border-amber-200 text-amber-600 text-sm hover:bg-amber-50 transition"
          >
            取消
          </button>
        )}
      </div>
    </div>
  )
}
